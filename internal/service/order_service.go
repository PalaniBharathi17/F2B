package service

import (
	"bytes"
	"encoding/csv"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/f2b-portal/backend/internal/models"
	"github.com/f2b-portal/backend/internal/repository"
	"github.com/f2b-portal/backend/internal/utils"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
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
	CancellationType   string `json:"cancellation_type"`
	CancellationNote   string `json:"cancellation_note"`
	DeliveryDate       string `json:"delivery_date"`
	DeliverySlot       string `json:"delivery_slot"`
	DisputeStatus      string `json:"dispute_status"`
	DisputeNote        string `json:"dispute_note"`
}

type UpdateDisputeRequest struct {
	Note string `json:"note"`
}

type SubmitReviewRequest struct {
	Rating  int    `json:"rating"`
	Comment string `json:"comment"`
}

type FarmerOrderReviewItem struct {
	ReviewID    uint   `json:"review_id"`
	OrderID     uint   `json:"order_id"`
	ProductName string `json:"product_name"`
	Reviewer    string `json:"reviewer"`
	Rating      int    `json:"rating"`
	Comment     string `json:"comment"`
	CreatedAt   string `json:"created_at"`
}

type FarmerDisputeItem struct {
	OrderID       uint   `json:"order_id"`
	OrderStatus   string `json:"order_status"`
	DisputeStatus string `json:"dispute_status"`
	DisputeNote   string `json:"dispute_note"`
	BuyerName     string `json:"buyer_name"`
	ProductName   string `json:"product_name"`
	UpdatedAt     string `json:"updated_at"`
}

type BuyerReviewItem struct {
	ReviewID    uint   `json:"review_id"`
	OrderID     uint   `json:"order_id"`
	ProductName string `json:"product_name"`
	FarmerName  string `json:"farmer_name"`
	Rating      int    `json:"rating"`
	Comment     string `json:"comment"`
	CreatedAt   string `json:"created_at"`
}

type BuyerNotificationItem struct {
	ID        string `json:"id"`
	Type      string `json:"type"`
	Title     string `json:"title"`
	Message   string `json:"message"`
	CreatedAt string `json:"created_at"`
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

type FarmerPeriodSummary struct {
	Period           string  `json:"period"`
	PeriodStart      string  `json:"period_start"`
	PeriodEnd        string  `json:"period_end"`
	OrdersCount      int     `json:"orders_count"`
	CompletedOrders  int     `json:"completed_orders"`
	CancelledOrders  int     `json:"cancelled_orders"`
	PendingOrders    int     `json:"pending_orders"`
	GrossRevenue     float64 `json:"gross_revenue"`
	PlatformFees     float64 `json:"platform_fees"`
	NetPayout        float64 `json:"net_payout"`
	AverageOrderSize float64 `json:"average_order_size"`
	Currency         string  `json:"currency"`
}

func isAllowedCancellationType(value string) bool {
	switch value {
	case "buyer_request", "stock_issue", "logistics_issue", "quality_issue", "other":
		return true
	default:
		return false
	}
}

func isAllowedDeliverySlot(value string) bool {
	switch value {
	case "06:00-09:00", "09:00-12:00", "12:00-15:00", "15:00-18:00":
		return true
	default:
		return false
	}
}

func isAllowedDisputeStatus(value string) bool {
	switch value {
	case "none", "open", "resolved", "rejected":
		return true
	default:
		return false
	}
}

func (s *OrderService) CreateOrder(buyerID uint, req CreateOrderRequest) (*models.Order, error) {
	if req.Quantity <= 0 {
		return nil, errors.New("quantity must be greater than 0")
	}

	var createdOrderID uint
	err := s.orderRepo.GetDB().Transaction(func(tx *gorm.DB) error {
		var product models.Product
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ?", req.ProductID).
			First(&product).Error; err != nil {
			return errors.New("product not found")
		}

		if product.Status != "active" {
			return errors.New("product is not available")
		}
		if product.Quantity < req.Quantity {
			return errors.New("insufficient quantity available")
		}
		if product.FarmerID == buyerID {
			return errors.New("you cannot order your own product")
		}

		order := &models.Order{
			ProductID:       req.ProductID,
			BuyerID:         buyerID,
			FarmerID:        product.FarmerID,
			Quantity:        req.Quantity,
			TotalPrice:      req.Quantity * product.PricePerUnit,
			Status:          "pending",
			DeliveryAddress: utils.SanitizeString(req.DeliveryAddress),
		}
		if err := tx.Create(order).Error; err != nil {
			return errors.New("failed to create order")
		}
		createdOrderID = order.ID

		// Reserve inventory atomically with order creation.
		product.Quantity -= req.Quantity
		if product.Quantity <= 0 {
			product.Quantity = 0
			product.Status = "sold"
		}
		if err := tx.Save(&product).Error; err != nil {
			return errors.New("failed to reserve inventory")
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return s.orderRepo.GetByID(createdOrderID)
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
	var updatedOrderID uint
	err := s.orderRepo.GetDB().Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ?", orderID).
			First(&order).Error; err != nil {
			return errors.New("order not found")
		}

		if order.BuyerID != userID && order.FarmerID != userID {
			return errors.New("unauthorized: you can only update your own orders")
		}

		newStatus := strings.TrimSpace(req.Status)
		if newStatus == "" {
			return errors.New("status is required")
		}
		if req.CancellationType != "" && !isAllowedCancellationType(req.CancellationType) {
			return errors.New("invalid cancellation type")
		}
		if req.DeliverySlot != "" && !isAllowedDeliverySlot(req.DeliverySlot) {
			return errors.New("invalid delivery slot")
		}
		if req.DisputeStatus != "" && !isAllowedDisputeStatus(req.DisputeStatus) {
			return errors.New("invalid dispute status")
		}

		validStatuses := map[string][]string{
			"pending":          {"confirmed", "cancelled"},
			"confirmed":        {"packed", "cancelled"},
			"packed":           {"out_for_delivery", "cancelled"},
			"out_for_delivery": {"completed", "cancelled"},
			"completed":        {},
			"cancelled":        {},
		}

		oldStatus := order.Status
		isStatusChange := oldStatus != newStatus
		if isStatusChange {
			allowedStatuses, ok := validStatuses[oldStatus]
			if !ok {
				return errors.New("invalid current order status")
			}
			allowed := false
			for _, status := range allowedStatuses {
				if status == newStatus {
					allowed = true
					break
				}
			}
			if !allowed {
				return errors.New("invalid status transition")
			}
		}

		order.Status = newStatus
		if newStatus == "cancelled" {
			if req.CancellationType == "" {
				return errors.New("cancellation type is required")
			}
			if strings.TrimSpace(req.CancellationReason) == "" {
				return errors.New("cancellation reason is required")
			}
			order.CancellationReason = utils.SanitizeString(req.CancellationReason)
			order.CancellationType = utils.SanitizeString(req.CancellationType)
			order.CancellationNote = utils.SanitizeString(req.CancellationNote)
		}
		if req.DeliverySlot != "" {
			order.DeliverySlot = utils.SanitizeString(req.DeliverySlot)
		}
		if req.DeliveryDate != "" {
			parsed, parseErr := time.Parse(time.RFC3339, req.DeliveryDate)
			if parseErr != nil {
				return errors.New("invalid delivery date format")
			}
			if parsed.Before(time.Now().UTC().Add(-5 * time.Minute)) {
				return errors.New("delivery date cannot be in the past")
			}
			order.DeliveryDate = &parsed
		}
		if req.DisputeStatus != "" {
			order.DisputeStatus = utils.SanitizeString(req.DisputeStatus)
		}
		if req.DisputeNote != "" {
			order.DisputeNote = utils.SanitizeString(req.DisputeNote)
		}

		now := time.Now().UTC()
		if isStatusChange {
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
		}

		if isStatusChange && newStatus == "cancelled" {
			var product models.Product
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("id = ?", order.ProductID).
				First(&product).Error; err == nil {
				product.Quantity += order.Quantity
				if product.Quantity > 0 {
					product.Status = "active"
				}
				if err := tx.Save(&product).Error; err != nil {
					return errors.New("failed to rollback inventory")
				}
			}
		}

		if err := tx.Save(&order).Error; err != nil {
			return errors.New("failed to update order")
		}

		logReason := utils.SanitizeString(req.CancellationReason)
		logCategory := utils.SanitizeString(req.CancellationType)
		logNote := utils.SanitizeString(req.CancellationNote)
		if req.DisputeStatus != "" {
			logReason = "dispute_update"
			logCategory = utils.SanitizeString(req.DisputeStatus)
			logNote = utils.SanitizeString(req.DisputeNote)
		}

		if err := tx.Create(&models.OrderStatusLog{
			OrderID:    order.ID,
			ActorID:    userID,
			FromStatus: oldStatus,
			ToStatus:   newStatus,
			Reason:     logReason,
			Category:   logCategory,
			Note:       logNote,
			CreatedAt:  time.Now().UTC(),
		}).Error; err != nil {
			return errors.New("failed to create status log")
		}

		updatedOrderID = order.ID
		return nil
	})
	if err != nil {
		return nil, err
	}

	return s.orderRepo.GetByID(updatedOrderID)
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
		CancellationType:   "other",
		CancellationNote:   "Cancelled by user",
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
			level := "high"
			if order.CreatedAt.Before(now.Add(-48 * time.Hour)) {
				level = "critical"
			}
			items = append(items, FarmerNotificationItem{
				ID:        "pending-" + strconv.FormatUint(uint64(order.ID), 10),
				Type:      "order",
				Title:     "Pending Order Alert (" + strings.ToUpper(level) + ")",
				Message:   "Order #" + strconv.FormatUint(uint64(order.ID), 10) + " is pending for more than 24 hours. Please act now.",
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

func (s *OrderService) GetOrderStatusHistory(orderID, userID uint) ([]models.OrderStatusLog, error) {
	logs, _, err := s.GetOrderStatusHistoryPaginated(orderID, userID, 1, 50)
	return logs, err
}

func (s *OrderService) GetOrderStatusHistoryPaginated(orderID, userID uint, page, limit int) ([]models.OrderStatusLog, int64, error) {
	order, err := s.orderRepo.GetByID(orderID)
	if err != nil {
		return nil, 0, errors.New("order not found")
	}
	if order.FarmerID != userID && order.BuyerID != userID {
		return nil, 0, errors.New("unauthorized: you can only access your own order history")
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	return s.orderRepo.GetStatusLogsByOrder(orderID, page, limit)
}

func (s *OrderService) GetFarmerReviews(farmerID uint) ([]FarmerOrderReviewItem, error) {
	items, _, err := s.GetFarmerReviewsPaginated(farmerID, 1, 20)
	return items, err
}

func (s *OrderService) GetFarmerReviewsPaginated(farmerID uint, page, limit int) ([]FarmerOrderReviewItem, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	reviews, total, err := s.orderRepo.GetReviewsByFarmer(farmerID, page, limit)
	if err != nil {
		return nil, 0, errors.New("failed to load farmer reviews")
	}
	items := make([]FarmerOrderReviewItem, 0, len(reviews))
	for _, r := range reviews {
		items = append(items, FarmerOrderReviewItem{
			ReviewID:    r.ID,
			OrderID:     r.OrderID,
			ProductName: r.Order.Product.CropName,
			Reviewer:    r.Reviewer.Name,
			Rating:      r.Rating,
			Comment:     r.Comment,
			CreatedAt:   r.CreatedAt.Format(time.RFC3339),
		})
	}
	return items, total, nil
}

func (s *OrderService) GetFarmerDisputes(farmerID uint) ([]models.Order, error) {
	orders, _, err := s.orderRepo.GetDisputesByFarmer(farmerID, 1, 20)
	return orders, err
}

func (s *OrderService) GetFarmerDisputesPaginated(farmerID uint, page, limit int) ([]FarmerDisputeItem, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	orders, total, err := s.orderRepo.GetDisputesByFarmer(farmerID, page, limit)
	if err != nil {
		return nil, 0, errors.New("failed to load disputes")
	}
	items := make([]FarmerDisputeItem, 0, len(orders))
	for _, o := range orders {
		items = append(items, FarmerDisputeItem{
			OrderID:       o.ID,
			OrderStatus:   o.Status,
			DisputeStatus: o.DisputeStatus,
			DisputeNote:   o.DisputeNote,
			BuyerName:     o.Buyer.Name,
			ProductName:   o.Product.CropName,
			UpdatedAt:     o.UpdatedAt.Format(time.RFC3339),
		})
	}
	return items, total, nil
}

func (s *OrderService) OpenDispute(orderID, farmerID uint, note string) (*models.Order, error) {
	var updatedOrderID uint
	err := s.orderRepo.GetDB().Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", orderID).First(&order).Error; err != nil {
			return errors.New("order not found")
		}
		if order.FarmerID != farmerID {
			return errors.New("unauthorized: you can only update your own orders")
		}
		if order.Status != "completed" {
			return errors.New("dispute can only be opened for completed orders")
		}
		if order.DisputeStatus != "none" && order.DisputeStatus != "" {
			return errors.New("dispute already exists for this order")
		}

		order.DisputeStatus = "open"
		order.DisputeNote = utils.SanitizeString(note)
		if err := tx.Save(&order).Error; err != nil {
			return errors.New("failed to open dispute")
		}

		if err := tx.Create(&models.OrderStatusLog{
			OrderID:    order.ID,
			ActorID:    farmerID,
			FromStatus: order.Status,
			ToStatus:   order.Status,
			Reason:     "dispute_update",
			Category:   "open",
			Note:       order.DisputeNote,
			CreatedAt:  time.Now().UTC(),
		}).Error; err != nil {
			return errors.New("failed to log dispute update")
		}

		updatedOrderID = order.ID
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.orderRepo.GetByID(updatedOrderID)
}

func (s *OrderService) ResolveDispute(orderID, farmerID uint, note string) (*models.Order, error) {
	return s.updateDisputeStatus(orderID, farmerID, "resolved", note)
}

func (s *OrderService) RejectDispute(orderID, farmerID uint, note string) (*models.Order, error) {
	return s.updateDisputeStatus(orderID, farmerID, "rejected", note)
}

func (s *OrderService) updateDisputeStatus(orderID, farmerID uint, nextStatus, note string) (*models.Order, error) {
	if strings.TrimSpace(note) == "" {
		return nil, errors.New("resolution reason is required")
	}

	var updatedOrderID uint
	err := s.orderRepo.GetDB().Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", orderID).First(&order).Error; err != nil {
			return errors.New("order not found")
		}
		if order.FarmerID != farmerID {
			return errors.New("unauthorized: you can only update your own orders")
		}
		if order.DisputeStatus != "open" {
			return errors.New("only open disputes can be updated")
		}

		order.DisputeStatus = nextStatus
		order.DisputeNote = utils.SanitizeString(note)
		if err := tx.Save(&order).Error; err != nil {
			return errors.New("failed to update dispute")
		}

		if err := tx.Create(&models.OrderStatusLog{
			OrderID:    order.ID,
			ActorID:    farmerID,
			FromStatus: order.Status,
			ToStatus:   order.Status,
			Reason:     "dispute_update",
			Category:   nextStatus,
			Note:       order.DisputeNote,
			CreatedAt:  time.Now().UTC(),
		}).Error; err != nil {
			return errors.New("failed to log dispute update")
		}

		updatedOrderID = order.ID
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.orderRepo.GetByID(updatedOrderID)
}

func (s *OrderService) SubmitBuyerReview(orderID, buyerID uint, req SubmitReviewRequest) (*models.Review, error) {
	if req.Rating < 1 || req.Rating > 5 {
		return nil, errors.New("rating must be between 1 and 5")
	}

	order, err := s.orderRepo.GetByID(orderID)
	if err != nil {
		return nil, errors.New("order not found")
	}
	if order.BuyerID != buyerID {
		return nil, errors.New("unauthorized: you can only review your own orders")
	}
	if order.Status != "completed" {
		return nil, errors.New("only completed orders can be reviewed")
	}

	if existing, _ := s.orderRepo.GetReviewByOrderAndReviewer(orderID, buyerID); existing != nil && existing.ID != 0 {
		return nil, errors.New("review already submitted for this order")
	}

	review := &models.Review{
		OrderID:    orderID,
		ReviewerID: buyerID,
		RevieweeID: order.FarmerID,
		Rating:     req.Rating,
		Comment:    utils.SanitizeString(req.Comment),
		CreatedAt:  time.Now().UTC(),
	}
	if err := s.orderRepo.CreateReview(review); err != nil {
		return nil, errors.New("failed to submit review")
	}
	return review, nil
}

func (s *OrderService) GetBuyerReviewsPaginated(buyerID uint, page, limit int) ([]BuyerReviewItem, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	reviews, total, err := s.orderRepo.GetReviewsByBuyer(buyerID, page, limit)
	if err != nil {
		return nil, 0, errors.New("failed to load buyer reviews")
	}
	items := make([]BuyerReviewItem, 0, len(reviews))
	for _, r := range reviews {
		items = append(items, BuyerReviewItem{
			ReviewID:    r.ID,
			OrderID:     r.OrderID,
			ProductName: r.Order.Product.CropName,
			FarmerName:  r.Reviewee.Name,
			Rating:      r.Rating,
			Comment:     r.Comment,
			CreatedAt:   r.CreatedAt.Format(time.RFC3339),
		})
	}
	return items, total, nil
}

func (s *OrderService) GetBuyerNotifications(buyerID uint) ([]BuyerNotificationItem, error) {
	orders, err := s.orderRepo.GetByBuyerID(buyerID)
	if err != nil {
		return nil, errors.New("failed to load buyer notifications")
	}

	now := time.Now().UTC()
	items := make([]BuyerNotificationItem, 0)

	for _, order := range orders {
		orderID := strconv.FormatUint(uint64(order.ID), 10)
		productName := order.Product.CropName
		if productName == "" {
			productName = "Produce"
		}

		switch order.Status {
		case "pending":
			if now.Sub(order.CreatedAt).Hours() >= 12 {
				items = append(items, BuyerNotificationItem{
					ID:        "pending-" + orderID,
					Type:      "order",
					Title:     "Order Still Pending",
					Message:   "Order #" + orderID + " for " + productName + " is still pending confirmation.",
					CreatedAt: order.CreatedAt.Format(time.RFC3339),
				})
			}
		case "confirmed":
			if order.ConfirmedAt != nil {
				items = append(items, BuyerNotificationItem{
					ID:        "confirmed-" + orderID,
					Type:      "order",
					Title:     "Order Confirmed",
					Message:   "Order #" + orderID + " has been confirmed by farmer.",
					CreatedAt: order.ConfirmedAt.Format(time.RFC3339),
				})
			}
		case "out_for_delivery":
			if order.OutForDeliveryAt != nil {
				items = append(items, BuyerNotificationItem{
					ID:        "delivery-" + orderID,
					Type:      "delivery",
					Title:     "Out for Delivery",
					Message:   "Order #" + orderID + " is out for delivery.",
					CreatedAt: order.OutForDeliveryAt.Format(time.RFC3339),
				})
			}
		case "cancelled":
			if order.CancelledAt != nil {
				items = append(items, BuyerNotificationItem{
					ID:        "cancelled-" + orderID,
					Type:      "order",
					Title:     "Order Cancelled",
					Message:   "Order #" + orderID + " was cancelled.",
					CreatedAt: order.CancelledAt.Format(time.RFC3339),
				})
			}
		}

		if order.DisputeStatus == "open" {
			items = append(items, BuyerNotificationItem{
				ID:        "dispute-open-" + orderID,
				Type:      "dispute",
				Title:     "Dispute Open",
				Message:   "Dispute for order #" + orderID + " is open.",
				CreatedAt: order.UpdatedAt.Format(time.RFC3339),
			})
		}
		if order.DisputeStatus == "resolved" || order.DisputeStatus == "rejected" {
			items = append(items, BuyerNotificationItem{
				ID:        "dispute-closed-" + orderID,
				Type:      "dispute",
				Title:     "Dispute Updated",
				Message:   "Dispute for order #" + orderID + " is " + order.DisputeStatus + ".",
				CreatedAt: order.UpdatedAt.Format(time.RFC3339),
			})
		}
	}

	sort.Slice(items, func(i, j int) bool { return items[i].CreatedAt > items[j].CreatedAt })
	if len(items) > 20 {
		items = items[:20]
	}
	return items, nil
}

func (s *OrderService) GetFarmerPeriodSummary(farmerID uint, period string) (*FarmerPeriodSummary, error) {
	orders, err := s.orderRepo.GetByFarmerID(farmerID)
	if err != nil {
		return nil, errors.New("failed to load farmer orders")
	}

	now := time.Now().UTC()
	var start, end time.Time
	switch period {
	case "weekly":
		end = now
		start = now.AddDate(0, 0, -7)
	case "monthly":
		end = now
		start = now.AddDate(0, -1, 0)
	default:
		return nil, errors.New("invalid period")
	}

	summary := &FarmerPeriodSummary{
		Period:      period,
		PeriodStart: start.Format(time.RFC3339),
		PeriodEnd:   end.Format(time.RFC3339),
		Currency:    "INR",
	}

	for _, order := range orders {
		if order.CreatedAt.Before(start) || order.CreatedAt.After(end) {
			continue
		}
		summary.OrdersCount++
		switch order.Status {
		case "completed":
			summary.CompletedOrders++
			summary.GrossRevenue += order.TotalPrice
		case "cancelled":
			summary.CancelledOrders++
		default:
			summary.PendingOrders++
		}
	}

	summary.PlatformFees = summary.GrossRevenue * 0.05
	summary.NetPayout = summary.GrossRevenue - summary.PlatformFees
	if summary.OrdersCount > 0 {
		summary.AverageOrderSize = summary.GrossRevenue / float64(summary.OrdersCount)
	}
	return summary, nil
}

func (s *OrderService) BuildFarmerCSVReport(farmerID uint, reportType string) (string, error) {
	orders, err := s.orderRepo.GetByFarmerID(farmerID)
	if err != nil {
		return "", errors.New("failed to load farmer orders")
	}

	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)

	switch reportType {
	case "orders":
		if err := writer.Write([]string{"order_id", "date", "buyer", "product", "quantity", "unit", "status", "total_inr"}); err != nil {
			return "", err
		}
		for _, o := range orders {
			row := []string{
				strconv.FormatUint(uint64(o.ID), 10),
				o.CreatedAt.Format(time.RFC3339),
				o.Buyer.Name,
				o.Product.CropName,
				strconv.FormatFloat(o.Quantity, 'f', 2, 64),
				o.Product.Unit,
				o.Status,
				strconv.FormatFloat(o.TotalPrice, 'f', 2, 64),
			}
			if err := writer.Write(row); err != nil {
				return "", err
			}
		}
	case "payouts":
		if err := writer.Write([]string{"order_id", "date", "status", "gross_inr", "fee_inr", "net_inr"}); err != nil {
			return "", err
		}
		for _, o := range orders {
			fee := o.TotalPrice * 0.05
			net := o.TotalPrice - fee
			row := []string{
				strconv.FormatUint(uint64(o.ID), 10),
				o.CreatedAt.Format(time.RFC3339),
				o.Status,
				strconv.FormatFloat(o.TotalPrice, 'f', 2, 64),
				strconv.FormatFloat(fee, 'f', 2, 64),
				strconv.FormatFloat(net, 'f', 2, 64),
			}
			if err := writer.Write(row); err != nil {
				return "", err
			}
		}
	case "disputes":
		if err := writer.Write([]string{"order_id", "date", "buyer", "product", "dispute_status", "dispute_note"}); err != nil {
			return "", err
		}
		for _, o := range orders {
			if o.DisputeStatus == "" || o.DisputeStatus == "none" {
				continue
			}
			row := []string{
				strconv.FormatUint(uint64(o.ID), 10),
				o.CreatedAt.Format(time.RFC3339),
				o.Buyer.Name,
				o.Product.CropName,
				o.DisputeStatus,
				o.DisputeNote,
			}
			if err := writer.Write(row); err != nil {
				return "", err
			}
		}
	default:
		return "", errors.New("invalid report type")
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return "", err
	}
	return buf.String(), nil
}

func BuildFarmerReportFilename(reportType string) string {
	return fmt.Sprintf("farmer_%s_report_%s.csv", reportType, time.Now().UTC().Format("20060102_150405"))
}
