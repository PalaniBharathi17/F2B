package service

import (
	"errors"
	"sort"
	"strconv"
	"time"

	"github.com/f2b-portal/backend/internal/models"
	"github.com/f2b-portal/backend/internal/repository"
	"github.com/f2b-portal/backend/internal/utils"
)

type OrderService struct {
	orderRepo   *repository.OrderRepository
	productRepo *repository.ProductRepository
	userRepo    *repository.UserRepository
}

func NewOrderService(orderRepo *repository.OrderRepository, productRepo *repository.ProductRepository, userRepo *repository.UserRepository) *OrderService {
	return &OrderService{
		orderRepo:   orderRepo,
		productRepo: productRepo,
		userRepo:    userRepo,
	}
}

type CreateOrderRequest struct {
	ProductID       uint    `json:"product_id"`
	Quantity        float64 `json:"quantity"`
	DeliveryAddress string  `json:"delivery_address"`
}

type UpdateOrderStatusRequest struct {
	Status             string `json:"status"`
	CancellationReason string `json:"cancellation_reason"`
}

type FarmerPayoutSummary struct {
	CompletedOrders   int     `json:"completed_orders"`
	PendingSettlement int     `json:"pending_settlement"`
	TotalGross        float64 `json:"total_gross"`
	PlatformFee       float64 `json:"platform_fee"`
	NetPayout         float64 `json:"net_payout"`
	Currency          string  `json:"currency"`
}

type FarmerInvoice struct {
	OrderID            uint    `json:"order_id"`
	Status             string  `json:"status"`
	ProductName        string  `json:"product_name"`
	BuyerName          string  `json:"buyer_name"`
	Quantity           float64 `json:"quantity"`
	Unit               string  `json:"unit"`
	UnitPrice          float64 `json:"unit_price"`
	GrossAmount        float64 `json:"gross_amount"`
	PlatformFee        float64 `json:"platform_fee"`
	NetPayout          float64 `json:"net_payout"`
	CancellationReason string  `json:"cancellation_reason"`
	CreatedAt          string  `json:"created_at"`
	CompletedAt        *string `json:"completed_at,omitempty"`
	OutForDeliveryAt   *string `json:"out_for_delivery_at,omitempty"`
	Currency           string  `json:"currency"`
}

type FarmerTopProduct struct {
	ProductID   uint    `json:"product_id"`
	ProductName string  `json:"product_name"`
	OrdersCount int     `json:"orders_count"`
	UnitsSold   float64 `json:"units_sold"`
	Revenue     float64 `json:"revenue"`
}

type FarmerAnalyticsSummary struct {
	OrdersTotal       int                `json:"orders_total"`
	CompletedOrders   int                `json:"completed_orders"`
	PendingOrders     int                `json:"pending_orders"`
	CancelledOrders   int                `json:"cancelled_orders"`
	CompletionRate    float64            `json:"completion_rate"`
	AverageOrderValue float64            `json:"average_order_value"`
	ThisMonthRevenue  float64            `json:"this_month_revenue"`
	LastMonthRevenue  float64            `json:"last_month_revenue"`
	RevenueGrowth     float64            `json:"revenue_growth"`
	TopProducts       []FarmerTopProduct `json:"top_products"`
	Currency          string             `json:"currency"`
}

type FarmerNotificationItem struct {
	ID        string `json:"id"`
	Type      string `json:"type"`
	Title     string `json:"title"`
	Message   string `json:"message"`
	CreatedAt string `json:"created_at"`
}

func (s *OrderService) CreateOrder(buyerID uint, req CreateOrderRequest) (*models.Order, error) {
	// Get product
	product, err := s.productRepo.GetByID(req.ProductID)
	if err != nil {
		return nil, errors.New("product not found")
	}

	// Check if product is available
	if product.Status != "active" {
		return nil, errors.New("product is not available")
	}

	// Check if enough quantity available
	if product.Quantity < req.Quantity {
		return nil, errors.New("insufficient quantity available")
	}

	// Check if buyer is not the farmer
	if product.FarmerID == buyerID {
		return nil, errors.New("you cannot order your own product")
	}

	// Calculate total price
	totalPrice := req.Quantity * product.PricePerUnit

	// Create order
	order := &models.Order{
		ProductID:       req.ProductID,
		BuyerID:         buyerID,
		FarmerID:        product.FarmerID,
		Quantity:        req.Quantity,
		TotalPrice:      totalPrice,
		Status:          "pending",
		DeliveryAddress: utils.SanitizeString(req.DeliveryAddress),
	}

	if err := s.orderRepo.Create(order); err != nil {
		return nil, errors.New("failed to create order")
	}

	return s.orderRepo.GetByID(order.ID)
}

func (s *OrderService) GetOrderByID(id uint) (*models.Order, error) {
	return s.orderRepo.GetByID(id)
}

func (s *OrderService) GetOrdersByBuyer(buyerID uint) ([]models.Order, error) {
	return s.orderRepo.GetByBuyerID(buyerID)
}

func (s *OrderService) GetOrdersByFarmer(farmerID uint) ([]models.Order, error) {
	return s.orderRepo.GetByFarmerID(farmerID)
}

func (s *OrderService) UpdateOrderStatus(orderID, userID uint, newStatus string) (*models.Order, error) {
	return s.UpdateOrderStatusWithDetails(orderID, userID, UpdateOrderStatusRequest{
		Status: newStatus,
	})
}

func (s *OrderService) UpdateOrderStatusWithDetails(orderID, userID uint, req UpdateOrderStatusRequest) (*models.Order, error) {
	order, err := s.orderRepo.GetByID(orderID)
	if err != nil {
		return nil, errors.New("order not found")
	}

	// Check authorization
	if order.BuyerID != userID && order.FarmerID != userID {
		return nil, errors.New("unauthorized: you can only update your own orders")
	}

	newStatus := req.Status
	if newStatus == "" {
		return nil, errors.New("status is required")
	}

	// Validate status transition
	validStatuses := map[string][]string{
		"pending":          {"confirmed", "cancelled"},
		"confirmed":        {"packed", "cancelled"},
		"packed":           {"out_for_delivery", "cancelled"},
		"out_for_delivery": {"completed", "cancelled"},
		"completed":        {},
		"cancelled":        {},
	}

	allowedStatuses, ok := validStatuses[order.Status]
	if !ok {
		return nil, errors.New("invalid current order status")
	}

	// Check if new status is allowed
	allowed := false
	for _, status := range allowedStatuses {
		if status == newStatus {
			allowed = true
			break
		}
	}

	if !allowed {
		return nil, errors.New("invalid status transition")
	}

	oldStatus := order.Status
	order.Status = newStatus
	if newStatus == "cancelled" {
		order.CancellationReason = utils.SanitizeString(req.CancellationReason)
	}

	now := time.Now().UTC()
	switch newStatus {
	case "confirmed":
		order.ConfirmedAt = &now
	case "packed":
		order.PackedAt = &now
	case "out_for_delivery":
		order.OutForDeliveryAt = &now
	case "completed":
		order.CompletedAt = &now
	case "cancelled":
		order.CancelledAt = &now
	}

	// Stock movement when order enters or leaves fulfilment pipeline.
	if newStatus == "confirmed" {
		product, err := s.productRepo.GetByID(order.ProductID)
		if err == nil {
			product.Quantity -= order.Quantity
			if product.Quantity < 0 {
				product.Quantity = 0
			}
			if product.Quantity <= 0 {
				product.Status = "sold"
			} else {
				product.Status = "active"
			}
			s.productRepo.Update(product)
		}
	}
	if newStatus == "cancelled" && (oldStatus == "confirmed" || oldStatus == "packed" || oldStatus == "out_for_delivery") {
		product, err := s.productRepo.GetByID(order.ProductID)
		if err == nil {
			product.Quantity += order.Quantity
			if product.Quantity > 0 {
				product.Status = "active"
			}
			s.productRepo.Update(product)
		}
	}

	if err := s.orderRepo.Update(order); err != nil {
		return nil, errors.New("failed to update order")
	}

	return order, nil
}

func (s *OrderService) CancelOrder(orderID, userID uint) error {
	order, err := s.orderRepo.GetByID(orderID)
	if err != nil {
		return errors.New("order not found")
	}

	// Check authorization
	if order.BuyerID != userID && order.FarmerID != userID {
		return errors.New("unauthorized: you can only cancel your own orders")
	}

	// Can only cancel if not completed
	if order.Status == "completed" {
		return errors.New("cannot cancel completed order")
	}
	_, err = s.UpdateOrderStatusWithDetails(orderID, userID, UpdateOrderStatusRequest{
		Status:             "cancelled",
		CancellationReason: "Cancelled by user",
	})
	return err
}

func (s *OrderService) GetFarmerPayoutSummary(farmerID uint) (*FarmerPayoutSummary, error) {
	orders, err := s.orderRepo.GetByFarmerID(farmerID)
	if err != nil {
		return nil, errors.New("failed to load farmer orders")
	}

	summary := &FarmerPayoutSummary{Currency: "INR"}
	for _, order := range orders {
		if order.Status == "completed" {
			summary.CompletedOrders++
			summary.TotalGross += order.TotalPrice
		}
		if order.Status == "confirmed" || order.Status == "packed" || order.Status == "out_for_delivery" {
			summary.PendingSettlement++
		}
	}
	summary.PlatformFee = summary.TotalGross * 0.05
	summary.NetPayout = summary.TotalGross - summary.PlatformFee
	return summary, nil
}

func (s *OrderService) GetFarmerInvoice(orderID, farmerID uint) (*FarmerInvoice, error) {
	order, err := s.orderRepo.GetByID(orderID)
	if err != nil {
		return nil, errors.New("order not found")
	}
	if order.FarmerID != farmerID {
		return nil, errors.New("unauthorized: you can only access your own invoices")
	}

	unitPrice := 0.0
	if order.Quantity > 0 {
		unitPrice = order.TotalPrice / order.Quantity
	}
	fee := order.TotalPrice * 0.05
	net := order.TotalPrice - fee

	invoice := &FarmerInvoice{
		OrderID:            order.ID,
		Status:             order.Status,
		ProductName:        order.Product.CropName,
		BuyerName:          order.Buyer.Name,
		Quantity:           order.Quantity,
		Unit:               order.Product.Unit,
		UnitPrice:          unitPrice,
		GrossAmount:        order.TotalPrice,
		PlatformFee:        fee,
		NetPayout:          net,
		CancellationReason: order.CancellationReason,
		CreatedAt:          order.CreatedAt.Format(time.RFC3339),
		Currency:           "INR",
	}
	if order.CompletedAt != nil {
		completed := order.CompletedAt.Format(time.RFC3339)
		invoice.CompletedAt = &completed
	}
	if order.OutForDeliveryAt != nil {
		out := order.OutForDeliveryAt.Format(time.RFC3339)
		invoice.OutForDeliveryAt = &out
	}

	return invoice, nil
}

func (s *OrderService) GetFarmerAnalytics(farmerID uint) (*FarmerAnalyticsSummary, error) {
	orders, err := s.orderRepo.GetByFarmerID(farmerID)
	if err != nil {
		return nil, errors.New("failed to load farmer analytics")
	}

	summary := &FarmerAnalyticsSummary{Currency: "INR"}
	summary.OrdersTotal = len(orders)

	now := time.Now().UTC()
	thisMonthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	lastMonthStart := thisMonthStart.AddDate(0, -1, 0)

	type topAgg struct {
		id     uint
		name   string
		orders int
		units  float64
		rev    float64
	}
	topMap := map[uint]*topAgg{}
	completedRevenue := 0.0

	for _, order := range orders {
		switch order.Status {
		case "completed":
			summary.CompletedOrders++
			completedRevenue += order.TotalPrice
			if !order.CreatedAt.Before(thisMonthStart) {
				summary.ThisMonthRevenue += order.TotalPrice
			}
			if !order.CreatedAt.Before(lastMonthStart) && order.CreatedAt.Before(thisMonthStart) {
				summary.LastMonthRevenue += order.TotalPrice
			}
			if _, ok := topMap[order.ProductID]; !ok {
				topMap[order.ProductID] = &topAgg{id: order.ProductID, name: order.Product.CropName}
			}
			topMap[order.ProductID].orders++
			topMap[order.ProductID].units += order.Quantity
			topMap[order.ProductID].rev += order.TotalPrice
		case "cancelled":
			summary.CancelledOrders++
		default:
			summary.PendingOrders++
		}
	}

	if summary.OrdersTotal > 0 {
		summary.CompletionRate = (float64(summary.CompletedOrders) / float64(summary.OrdersTotal)) * 100
	}
	if summary.CompletedOrders > 0 {
		summary.AverageOrderValue = completedRevenue / float64(summary.CompletedOrders)
	}
	if summary.LastMonthRevenue > 0 {
		summary.RevenueGrowth = ((summary.ThisMonthRevenue - summary.LastMonthRevenue) / summary.LastMonthRevenue) * 100
	}

	tops := make([]FarmerTopProduct, 0, len(topMap))
	for _, item := range topMap {
		tops = append(tops, FarmerTopProduct{
			ProductID:   item.id,
			ProductName: item.name,
			OrdersCount: item.orders,
			UnitsSold:   item.units,
			Revenue:     item.rev,
		})
	}
	sort.Slice(tops, func(i, j int) bool { return tops[i].Revenue > tops[j].Revenue })
	if len(tops) > 3 {
		tops = tops[:3]
	}
	summary.TopProducts = tops
	return summary, nil
}

func (s *OrderService) GetFarmerNotifications(farmerID uint) ([]FarmerNotificationItem, error) {
	orders, err := s.orderRepo.GetByFarmerID(farmerID)
	if err != nil {
		return nil, errors.New("failed to load farmer notifications")
	}
	products, err := s.productRepo.GetByFarmerID(farmerID)
	if err != nil {
		return nil, errors.New("failed to load farmer notifications")
	}

	items := make([]FarmerNotificationItem, 0)
	now := time.Now().UTC()
	dayAgo := now.Add(-24 * time.Hour)

	for _, order := range orders {
		if order.Status == "pending" && order.CreatedAt.Before(dayAgo) {
			items = append(items, FarmerNotificationItem{
				ID:        "pending-" + strconv.FormatUint(uint64(order.ID), 10),
				Type:      "order",
				Title:     "Pending Order Alert",
				Message:   "Order #" + strconv.FormatUint(uint64(order.ID), 10) + " is pending for more than 24 hours.",
				CreatedAt: order.CreatedAt.Format(time.RFC3339),
			})
		}
		if order.Status == "cancelled" && order.CancelledAt != nil && order.CancelledAt.After(now.Add(-72*time.Hour)) {
			items = append(items, FarmerNotificationItem{
				ID:        "cancelled-" + strconv.FormatUint(uint64(order.ID), 10),
				Type:      "order",
				Title:     "Order Cancelled",
				Message:   "Order #" + strconv.FormatUint(uint64(order.ID), 10) + " was cancelled.",
				CreatedAt: order.CancelledAt.Format(time.RFC3339),
			})
		}
	}

	for _, product := range products {
		if product.Quantity > 0 && product.Quantity <= 5 {
			items = append(items, FarmerNotificationItem{
				ID:        "stock-" + strconv.FormatUint(uint64(product.ID), 10),
				Type:      "inventory",
				Title:     "Low Stock",
				Message:   product.CropName + " is running low (" + strconv.FormatFloat(product.Quantity, 'f', 1, 64) + " " + product.Unit + ").",
				CreatedAt: product.UpdatedAt.Format(time.RFC3339),
			})
		}
		if product.Quantity <= 0 && product.Status != "sold" {
			items = append(items, FarmerNotificationItem{
				ID:        "stockout-" + strconv.FormatUint(uint64(product.ID), 10),
				Type:      "inventory",
				Title:     "Out of Stock",
				Message:   product.CropName + " has no remaining inventory.",
				CreatedAt: product.UpdatedAt.Format(time.RFC3339),
			})
		}
	}

	sort.Slice(items, func(i, j int) bool { return items[i].CreatedAt > items[j].CreatedAt })
	if len(items) > 20 {
		items = items[:20]
	}
	return items, nil
}
