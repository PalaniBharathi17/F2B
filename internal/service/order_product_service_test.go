package service

import (
	"testing"
	"time"

	"github.com/f2b-portal/backend/internal/models"
	"github.com/f2b-portal/backend/internal/repository"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

type testCtx struct {
	db          *gorm.DB
	orderSvc    *OrderService
	productSvc  *ProductService
	cartSvc     *CartService
	productRepo *repository.ProductRepository
	buyerID     uint
	farmerID    uint
	productID   uint
}

func setupTestCtx(t *testing.T) *testCtx {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite db: %v", err)
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.FarmerProfile{},
		&models.Product{},
		&models.CartItem{},
		&models.Order{},
		&models.HarvestRequest{},
		&models.Review{},
		&models.OrderStatusLog{},
		&models.OrderMessage{},
		&models.DisputeEvidence{},
		&models.ProductPriceHistory{},
	); err != nil {
		t.Fatalf("failed to migrate db: %v", err)
	}

	buyer := &models.User{
		Name:     "Buyer One",
		Email:    "buyer@example.com",
		Phone:    "9000000001",
		Password: "x",
		UserType: "buyer",
	}
	farmer := &models.User{
		Name:     "Farmer One",
		Email:    "farmer@example.com",
		Phone:    "9000000002",
		Password: "x",
		UserType: "farmer",
	}
	if err := db.Create(buyer).Error; err != nil {
		t.Fatalf("failed to create buyer: %v", err)
	}
	if err := db.Create(farmer).Error; err != nil {
		t.Fatalf("failed to create farmer: %v", err)
	}

	product := &models.Product{
		FarmerID:               farmer.ID,
		CropName:               "Tomato",
		Quantity:               10,
		Unit:                   "kg",
		PricePerUnit:           100,
		Description:            "fresh",
		City:                   "Nagercoil",
		State:                  "Tamil Nadu",
		Status:                 "active",
		IsBulkAvailable:        true,
		MinimumBulkQuantity:    5,
		SupportsHarvestRequest: true,
		HarvestLeadDays:        2,
	}
	if err := db.Create(product).Error; err != nil {
		t.Fatalf("failed to create product: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	productRepo := repository.NewProductRepository(db)
	orderRepo := repository.NewOrderRepository(db)
	cartRepo := repository.NewCartRepository(db)

	return &testCtx{
		db:          db,
		orderSvc:    NewOrderService(orderRepo, productRepo, userRepo),
		productSvc:  NewProductService(productRepo),
		cartSvc:     NewCartService(cartRepo, productRepo, orderRepo),
		productRepo: productRepo,
		buyerID:     buyer.ID,
		farmerID:    farmer.ID,
		productID:   product.ID,
	}
}

func createOrderForTest(t *testing.T, ctx *testCtx) *models.Order {
	t.Helper()
	order, err := ctx.orderSvc.CreateOrder(ctx.buyerID, CreateOrderRequest{
		ProductID:       ctx.productID,
		Quantity:        2,
		DeliveryAddress: "Some address",
		PaymentMethod:   "cod",
	})
	if err != nil {
		t.Fatalf("failed to create order: %v", err)
	}
	return order
}

func completeOrderForTest(t *testing.T, ctx *testCtx, orderID uint) {
	t.Helper()
	stepsByFarmer := []string{"confirmed", "packed", "out_for_delivery"}
	for _, step := range stepsByFarmer {
		if _, err := ctx.orderSvc.UpdateOrderStatusWithDetails(orderID, ctx.farmerID, UpdateOrderStatusRequest{
			Status: step,
		}); err != nil {
			t.Fatalf("failed to move order to %s: %v", step, err)
		}
	}
	if _, err := ctx.orderSvc.UpdateOrderStatusWithDetails(orderID, ctx.buyerID, UpdateOrderStatusRequest{
		Status: "completed",
	}); err != nil {
		t.Fatalf("failed to mark order completed by buyer: %v", err)
	}
}

func TestCreateOrderReservesStockAndCancelRollsBack(t *testing.T) {
	ctx := setupTestCtx(t)
	order := createOrderForTest(t, ctx)

	productAfterOrder, err := ctx.productRepo.GetByID(ctx.productID)
	if err != nil {
		t.Fatalf("failed to fetch product after order: %v", err)
	}
	if productAfterOrder.Quantity != 8 {
		t.Fatalf("expected quantity 8 after reserve, got %v", productAfterOrder.Quantity)
	}

	_, err = ctx.orderSvc.UpdateOrderStatusWithDetails(order.ID, ctx.farmerID, UpdateOrderStatusRequest{
		Status:             "cancelled",
		CancellationType:   "other",
		CancellationReason: "test rollback",
		CancellationNote:   "rollback note",
	})
	if err != nil {
		t.Fatalf("failed to cancel order: %v", err)
	}

	productAfterCancel, err := ctx.productRepo.GetByID(ctx.productID)
	if err != nil {
		t.Fatalf("failed to fetch product after cancel: %v", err)
	}
	if productAfterCancel.Quantity != 10 {
		t.Fatalf("expected quantity 10 after rollback, got %v", productAfterCancel.Quantity)
	}
}

func TestOrderStatusTransitionMatrix(t *testing.T) {
	ctx := setupTestCtx(t)
	order := createOrderForTest(t, ctx)

	if _, err := ctx.orderSvc.UpdateOrderStatusWithDetails(order.ID, ctx.farmerID, UpdateOrderStatusRequest{
		Status: "completed",
	}); err == nil {
		t.Fatalf("expected invalid transition error for pending -> completed")
	}

	completeOrderForTest(t, ctx, order.ID)
}

func TestBuyerAndFarmerStatusPermissions(t *testing.T) {
	ctx := setupTestCtx(t)
	order := createOrderForTest(t, ctx)

	if _, err := ctx.orderSvc.UpdateOrderStatusWithDetails(order.ID, ctx.buyerID, UpdateOrderStatusRequest{
		Status: "confirmed",
	}); err == nil {
		t.Fatalf("expected buyer confirmation attempt to fail")
	}

	if _, err := ctx.orderSvc.UpdateOrderStatusWithDetails(order.ID, ctx.buyerID, UpdateOrderStatusRequest{
		Status: "completed",
	}); err == nil {
		t.Fatalf("expected buyer to be blocked from completing before out_for_delivery")
	}

	if _, err := ctx.orderSvc.UpdateOrderStatusWithDetails(order.ID, ctx.farmerID, UpdateOrderStatusRequest{
		Status: "confirmed",
	}); err != nil {
		t.Fatalf("expected farmer confirmation to succeed: %v", err)
	}
	if _, err := ctx.orderSvc.UpdateOrderStatusWithDetails(order.ID, ctx.farmerID, UpdateOrderStatusRequest{
		Status: "packed",
	}); err != nil {
		t.Fatalf("expected farmer packing to succeed: %v", err)
	}
	if _, err := ctx.orderSvc.UpdateOrderStatusWithDetails(order.ID, ctx.farmerID, UpdateOrderStatusRequest{
		Status: "out_for_delivery",
	}); err != nil {
		t.Fatalf("expected farmer delivery handoff to succeed: %v", err)
	}
	if _, err := ctx.orderSvc.UpdateOrderStatusWithDetails(order.ID, ctx.farmerID, UpdateOrderStatusRequest{
		Status: "completed",
	}); err == nil {
		t.Fatalf("expected farmer to be blocked from marking order completed")
	}
}

func TestUpdateProductPriceCreatesHistory(t *testing.T) {
	ctx := setupTestCtx(t)

	if _, err := ctx.productSvc.UpdateProductPrice(ctx.productID, ctx.farmerID, 120); err != nil {
		t.Fatalf("failed to update product price: %v", err)
	}

	history, err := ctx.productSvc.GetProductPriceHistory(ctx.productID, ctx.farmerID)
	if err != nil {
		t.Fatalf("failed to load price history: %v", err)
	}
	if len(history) == 0 {
		t.Fatalf("expected at least one price history record")
	}
	if history[0].OldPrice != 100 || history[0].NewPrice != 120 {
		t.Fatalf("unexpected price history values: old=%v new=%v", history[0].OldPrice, history[0].NewPrice)
	}
}

func TestDisputeLifecycleOpenResolveReject(t *testing.T) {
	ctx := setupTestCtx(t)
	order := createOrderForTest(t, ctx)
	completeOrderForTest(t, ctx, order.ID)

	opened, err := ctx.orderSvc.OpenDispute(order.ID, ctx.farmerID, "quality mismatch")
	if err != nil {
		t.Fatalf("failed to open dispute: %v", err)
	}
	if opened.DisputeStatus != "open" {
		t.Fatalf("expected dispute status open, got %s", opened.DisputeStatus)
	}

	resolved, err := ctx.orderSvc.ResolveDispute(order.ID, ctx.farmerID, "resolved with buyer")
	if err != nil {
		t.Fatalf("failed to resolve dispute: %v", err)
	}
	if resolved.DisputeStatus != "resolved" {
		t.Fatalf("expected dispute status resolved, got %s", resolved.DisputeStatus)
	}

	if _, err := ctx.orderSvc.RejectDispute(order.ID, ctx.farmerID, "cannot reject resolved dispute"); err == nil {
		t.Fatalf("expected reject to fail for non-open dispute")
	}
}

func TestCreateBulkOrderAndHarvestRequestFlow(t *testing.T) {
	ctx := setupTestCtx(t)

	bulkOrder, err := ctx.orderSvc.CreateBulkOrder(ctx.buyerID, CreateOrderRequest{
		ProductID:        ctx.productID,
		Quantity:         5,
		DeliveryAddress:  "Bulk address",
		BuyerNote:        "Need wholesale quantity",
		PaymentMethod:    "upi",
		PaymentReference: "buyer@upi",
	})
	if err != nil {
		t.Fatalf("failed to create bulk order: %v", err)
	}
	if bulkOrder.OrderType != "bulk" {
		t.Fatalf("expected bulk order type, got %s", bulkOrder.OrderType)
	}

	requestItem, err := ctx.orderSvc.CreateHarvestRequest(ctx.buyerID, CreateHarvestRequestRequest{
		ProductID:            ctx.productID,
		RequestedQuantity:    3,
		PreferredHarvestDate: time.Now().UTC().AddDate(0, 0, 3).Format(time.RFC3339),
		DeliveryAddress:      "Harvest address",
		BuyerNote:            "Fresh harvest requested",
	})
	if err != nil {
		t.Fatalf("failed to create harvest request: %v", err)
	}
	if requestItem.Status != "pending" {
		t.Fatalf("expected pending harvest request, got %s", requestItem.Status)
	}

	if _, err := ctx.orderSvc.UpdateHarvestRequest(requestItem.ID, ctx.farmerID, UpdateHarvestRequestRequest{
		Status:             "accepted",
		FarmerResponseNote: "Can fulfill",
	}); err != nil {
		t.Fatalf("failed to accept harvest request: %v", err)
	}

	converted, err := ctx.orderSvc.ConvertHarvestRequestToOrder(requestItem.ID, ctx.buyerID, CreateOrderRequest{})
	if err != nil {
		t.Fatalf("failed to convert harvest request: %v", err)
	}
	if converted.OrderType != "harvest_request" {
		t.Fatalf("expected harvest_request order type, got %s", converted.OrderType)
	}
	if converted.SourceRequestID == nil || *converted.SourceRequestID != requestItem.ID {
		t.Fatalf("expected converted order to reference harvest request")
	}
}

func TestCartCheckoutMarksBulkEligibleItems(t *testing.T) {
	ctx := setupTestCtx(t)

	if err := ctx.cartSvc.AddToCart(ctx.buyerID, AddToCartRequest{
		ProductID: ctx.productID,
		Quantity:  5,
	}); err != nil {
		t.Fatalf("failed to add bulk-eligible item to cart: %v", err)
	}

	orders, err := ctx.cartSvc.Checkout(ctx.buyerID, "Cart address")
	if err != nil {
		t.Fatalf("failed to checkout cart: %v", err)
	}
	if len(orders) != 1 {
		t.Fatalf("expected 1 order from checkout, got %d", len(orders))
	}
	if orders[0].OrderType != "bulk" {
		t.Fatalf("expected cart checkout order type bulk, got %s", orders[0].OrderType)
	}
}
