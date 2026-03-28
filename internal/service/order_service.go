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
	ProductID        uint    `json:"product_id"`
	Quantity         float64 `json:"quantity"`
	DeliveryAddress  string  `json:"delivery_address"`
	BuyerNote        string  `json:"buyer_note"`
	PaymentMethod    string  `json:"payment_method"`
	PaymentReference string  `json:"payment_reference"`
	PreferredDate    string  `json:"preferred_date"`
}

type CreateHarvestRequestRequest struct {
	ProductID            uint    `json:"product_id"`
	RequestedQuantity    float64 `json:"requested_quantity"`
	PreferredHarvestDate string  `json:"preferred_harvest_date"`
	DeliveryAddress      string  `json:"delivery_address"`
	BuyerNote            string  `json:"buyer_note"`
}

type UpdateHarvestRequestRequest struct {
	Status             string `json:"status"`
	FarmerResponseNote string `json:"farmer_response_note"`
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

type SendOrderMessageRequest struct {
	Message string `json:"message"`
}

type AddDisputeEvidenceRequest struct {
	Note        string `json:"note"`
	EvidenceURL string `json:"evidence_url"`
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

func isAllowedHarvestRequestStatus(value string) bool {
	switch value {
	case "pending", "accepted", "rejected", "ready", "completed", "cancelled":
		return true
	default:
		return false
	}
}

func normalizePaymentMethod(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func isAllowedPaymentMethod(value string) bool {
	switch normalizePaymentMethod(value) {
	case "cod", "upi", "online_banking":
		return true
	default:
		return false
	}
}

func derivePaymentStatus(method string) string {
	if normalizePaymentMethod(method) == "cod" {
		return "pending"
	}
	return "initiated"
}

func validatePayment(method, reference string) error {
	paymentMethod := normalizePaymentMethod(method)
	if paymentMethod == "" {
		return errors.New("payment method is required")
	}
	if !isAllowedPaymentMethod(paymentMethod) {
		return errors.New("invalid payment method")
	}
	ref := strings.TrimSpace(reference)
	if paymentMethod == "upi" && ref == "" {
		return errors.New("upi id is required")
	}
	if paymentMethod == "online_banking" && ref == "" {
		return errors.New("bank reference is required")
	}
	return nil
}

func parseOptionalRFC3339(value string) (*time.Time, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil, nil
	}
	parsed, err := time.Parse(time.RFC3339, trimmed)
	if err != nil {
		return nil, errors.New("invalid preferred date format")
	}
	return &parsed, nil
}

func (s *OrderService) CreateOrder(buyerID uint, req CreateOrderRequest) (*models.Order, error) {
	return s.createInventoryOrder(buyerID, req, "standard", 0)
}

func (s *OrderService) CreateBulkOrder(buyerID uint, req CreateOrderRequest) (*models.Order, error) {
	if req.Quantity <= 0 {
		return nil, errors.New("quantity must be greater than 0")
	}
	product, err := s.productRepo.GetByID(req.ProductID)
	if err != nil {
		return nil, errors.New("product not found")
	}
	if !product.IsBulkAvailable {
		return nil, errors.New("bulk ordering is not enabled for this product")
	}
	minQty := product.MinimumBulkQuantity
	if minQty <= 0 {
		minQty = product.Quantity
	}
	if req.Quantity < minQty {
		return nil, errors.New("bulk quantity is below the farmer minimum")
	}
	return s.createInventoryOrder(buyerID, req, "bulk", 0)
}

func (s *OrderService) createInventoryOrder(buyerID uint, req CreateOrderRequest, orderType string, sourceRequestID uint) (*models.Order, error) {
	if req.Quantity <= 0 {
		return nil, errors.New("quantity must be greater than 0")
	}
	if err := validatePayment(req.PaymentMethod, req.PaymentReference); err != nil {
		return nil, err
	}

	preferredDate, err := parseOptionalRFC3339(req.PreferredDate)
	if err != nil {
		return nil, err
	}
	if preferredDate != nil && preferredDate.Before(time.Now().UTC().Add(-5*time.Minute)) {
		return nil, errors.New("preferred date cannot be in the past")
	}

	var createdOrderID uint
	err = s.orderRepo.GetDB().Transaction(func(tx *gorm.DB) error {
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
			ProductID:        req.ProductID,
			BuyerID:          buyerID,
			FarmerID:         product.FarmerID,
			Quantity:         req.Quantity,
			TotalPrice:       req.Quantity * product.PricePerUnit,
			OrderType:        orderType,
			BuyerNote:        utils.SanitizeString(req.BuyerNote),
			PaymentMethod:    normalizePaymentMethod(req.PaymentMethod),
			PaymentReference: utils.SanitizeString(req.PaymentReference),
			PaymentStatus:    derivePaymentStatus(req.PaymentMethod),
			PreferredDate:    preferredDate,
			Status:           "pending",
			DeliveryAddress:  utils.SanitizeString(req.DeliveryAddress),
		}
		if sourceRequestID > 0 {
			order.SourceRequestID = &sourceRequestID
		}
		if err := tx.Create(order).Error; err != nil {
			return errors.New("failed to create order")
		}
		createdOrderID = order.ID

		logNote := "Order placed by buyer"
		if orderType == "bulk" {
			logNote = "Bulk order placed by buyer"
		} else if sourceRequestID > 0 {
			logNote = "Order converted from harvest request"
		}
		if err := tx.Create(&models.OrderStatusLog{
			OrderID:    order.ID,
			ActorID:    buyerID,
			FromStatus: "new",
			ToStatus:   "pending",
			Reason:     "order_created",
			Category:   orderType,
			Note:       logNote,
			CreatedAt:  time.Now().UTC(),
		}).Error; err != nil {
			return errors.New("failed to initialize order timeline")
		}

		product.Quantity -= req.Quantity
		if product.Quantity <= 0 {
			product.Quantity = 0
			product.Status = "sold"
		}
		if err := tx.Save(&product).Error; err != nil {
			return errors.New("failed to reserve inventory")
		}

		if sourceRequestID > 0 {
			var request models.HarvestRequest
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("id = ?", sourceRequestID).
				First(&request).Error; err == nil {
				now := time.Now().UTC()
				request.Status = "completed"
				request.ConvertedOrderID = &order.ID
				request.RespondedAt = &now
				if strings.TrimSpace(request.FarmerResponseNote) == "" {
					request.FarmerResponseNote = "Converted into confirmed buyer order flow"
				}
				if err := tx.Save(&request).Error; err != nil {
					return errors.New("failed to update harvest request")
				}
			}
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return s.orderRepo.GetByID(createdOrderID)
}

func (s *OrderService) CreateHarvestRequest(buyerID uint, req CreateHarvestRequestRequest) (*models.HarvestRequest, error) {
	if req.ProductID == 0 {
		return nil, errors.New("product_id is required")
	}
	if req.RequestedQuantity <= 0 {
		return nil, errors.New("requested quantity must be greater than 0")
	}
	preferredDate, err := parseOptionalRFC3339(req.PreferredHarvestDate)
	if err != nil || preferredDate == nil {
		return nil, errors.New("preferred harvest date is required")
	}
	if preferredDate.Before(time.Now().UTC().Add(-5 * time.Minute)) {
		return nil, errors.New("preferred harvest date cannot be in the past")
	}

	product, err := s.productRepo.GetByID(req.ProductID)
	if err != nil {
		return nil, errors.New("product not found")
	}
	if product.FarmerID == buyerID {
		return nil, errors.New("you cannot request harvest from your own product")
	}
	if !product.SupportsHarvestRequest {
		return nil, errors.New("harvest requests are not enabled for this product")
	}
	if product.HarvestLeadDays > 0 {
		minDate := time.Now().UTC().AddDate(0, 0, product.HarvestLeadDays)
		if preferredDate.Before(minDate) {
			return nil, errors.New("preferred harvest date is earlier than the farmer lead time")
		}
	}

	item := &models.HarvestRequest{
		ProductID:            product.ID,
		BuyerID:              buyerID,
		FarmerID:             product.FarmerID,
		RequestedQuantity:    req.RequestedQuantity,
		PreferredHarvestDate: *preferredDate,
		DeliveryAddress:      utils.SanitizeString(req.DeliveryAddress),
		BuyerNote:            utils.SanitizeString(req.BuyerNote),
		Status:               "pending",
	}
	if err := s.orderRepo.CreateHarvestRequest(item); err != nil {
		return nil, errors.New("failed to create harvest request")
	}
	return s.orderRepo.GetHarvestRequestByID(item.ID)
}

func (s *OrderService) GetHarvestRequestsByBuyer(buyerID uint) ([]models.HarvestRequest, error) {
	return s.orderRepo.GetHarvestRequestsByBuyer(buyerID)
}

func (s *OrderService) GetHarvestRequestsByFarmer(farmerID uint) ([]models.HarvestRequest, error) {
	return s.orderRepo.GetHarvestRequestsByFarmer(farmerID)
}

func (s *OrderService) UpdateHarvestRequest(requestID, actorID uint, req UpdateHarvestRequestRequest) (*models.HarvestRequest, error) {
	nextStatus := strings.ToLower(strings.TrimSpace(req.Status))
	if !isAllowedHarvestRequestStatus(nextStatus) {
		return nil, errors.New("invalid harvest request status")
	}

	var updatedID uint
	err := s.orderRepo.GetDB().Transaction(func(tx *gorm.DB) error {
		var item models.HarvestRequest
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ?", requestID).
			First(&item).Error; err != nil {
			return errors.New("harvest request not found")
		}

		isBuyer := item.BuyerID == actorID
		isFarmer := item.FarmerID == actorID
		if !isBuyer && !isFarmer {
			return errors.New("unauthorized harvest request access")
		}

		validTransitions := map[string][]string{
			"pending":   {"accepted", "rejected", "cancelled"},
			"accepted":  {"ready", "rejected", "cancelled"},
			"ready":     {"completed", "cancelled"},
			"rejected":  {},
			"completed": {},
			"cancelled": {},
		}
		allowed := false
		for _, candidate := range validTransitions[item.Status] {
			if candidate == nextStatus {
				allowed = true
				break
			}
		}
		if item.Status != nextStatus && !allowed {
			return errors.New("invalid harvest request transition")
		}
		if isBuyer && nextStatus != "cancelled" && nextStatus != "completed" {
			return errors.New("buyers can only cancel or complete their harvest request flow")
		}
		if isBuyer && nextStatus == "completed" {
			if item.ConvertedOrderID == nil {
				return errors.New("harvest request can only be completed after conversion to order")
			}
		}
		if isFarmer && nextStatus == "cancelled" {
			return errors.New("farmers cannot cancel buyer harvest requests")
		}

		now := time.Now().UTC()
		item.Status = nextStatus
		item.FarmerResponseNote = utils.SanitizeString(req.FarmerResponseNote)
		item.RespondedAt = &now
		if err := tx.Save(&item).Error; err != nil {
			return errors.New("failed to update harvest request")
		}
		updatedID = item.ID
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.orderRepo.GetHarvestRequestByID(updatedID)
}

func (s *OrderService) ConvertHarvestRequestToOrder(requestID, buyerID uint, req CreateOrderRequest) (*models.Order, error) {
	requestItem, err := s.orderRepo.GetHarvestRequestByID(requestID)
	if err != nil {
		return nil, errors.New("harvest request not found")
	}
	if requestItem.BuyerID != buyerID {
		return nil, errors.New("unauthorized harvest request access")
	}
	if requestItem.Status != "accepted" && requestItem.Status != "ready" {
		return nil, errors.New("harvest request is not ready for order conversion")
	}
	if requestItem.ConvertedOrderID != nil {
		return nil, errors.New("harvest request has already been converted")
	}
	req.ProductID = requestItem.ProductID
	if req.Quantity <= 0 {
		req.Quantity = requestItem.RequestedQuantity
	}
	if strings.TrimSpace(req.DeliveryAddress) == "" {
		req.DeliveryAddress = requestItem.DeliveryAddress
	}
	if strings.TrimSpace(req.BuyerNote) == "" {
		req.BuyerNote = requestItem.BuyerNote
	}
	if strings.TrimSpace(req.PaymentMethod) == "" {
		req.PaymentMethod = "cod"
	}
	if strings.TrimSpace(req.PreferredDate) == "" {
		req.PreferredDate = requestItem.PreferredHarvestDate.Format(time.RFC3339)
	}
	return s.createInventoryOrder(buyerID, req, "harvest_request", requestItem.ID)
}

func (s *OrderService) GetOrderByID(id uint) (*models.Order, error) {
	return s.orderRepo.GetByID(id)
}

func (s *OrderService) GetOrdersByBuyer(buyerID uint) ([]models.Order, error) {
	return s.orderRepo.GetByBuyerID(buyerID)
}

func (s *OrderService) getAccessibleOrder(orderID, userID uint) (*models.Order, error) {
	order, err := s.orderRepo.GetByID(orderID)
	if err != nil {
		return nil, errors.New("order not found")
	}
	if order.BuyerID != userID && order.FarmerID != userID {
		return nil, errors.New("unauthorized access to order")
	}
	return order, nil
}

func (s *OrderService) GetOrderMessages(orderID, userID uint) ([]models.OrderMessage, error) {
	if _, err := s.getAccessibleOrder(orderID, userID); err != nil {
		return nil, err
	}
	items, err := s.orderRepo.GetOrderMessages(orderID)
	if err != nil {
		return nil, errors.New("failed to load order messages")
	}
	return items, nil
}

func (s *OrderService) SendOrderMessage(orderID, userID uint, req SendOrderMessageRequest) ([]models.OrderMessage, error) {
	order, err := s.getAccessibleOrder(orderID, userID)
	if err != nil {
		return nil, err
	}
	body := utils.SanitizeString(req.Message)
	if strings.TrimSpace(body) == "" {
		return nil, errors.New("message is required")
	}

	senderRole := "buyer"
	if order.FarmerID == userID {
		senderRole = "farmer"
	}
	if err := s.orderRepo.CreateOrderMessage(&models.OrderMessage{
		OrderID:    orderID,
		SenderID:   userID,
		SenderRole: senderRole,
		Message:    body,
		CreatedAt:  time.Now().UTC(),
	}); err != nil {
		return nil, errors.New("failed to send message")
	}
	return s.orderRepo.GetOrderMessages(orderID)
}

func (s *OrderService) GetDisputeEvidences(orderID, userID uint) ([]models.DisputeEvidence, error) {
	if _, err := s.getAccessibleOrder(orderID, userID); err != nil {
		return nil, err
	}
	items, err := s.orderRepo.GetDisputeEvidences(orderID)
	if err != nil {
		return nil, errors.New("failed to load dispute evidence")
	}
	return items, nil
}

func (s *OrderService) AddDisputeEvidence(orderID, userID uint, req AddDisputeEvidenceRequest) ([]models.DisputeEvidence, error) {
	order, err := s.getAccessibleOrder(orderID, userID)
	if err != nil {
		return nil, err
	}
	if order.DisputeStatus == "" || order.DisputeStatus == "none" {
		return nil, errors.New("open a dispute before attaching evidence")
	}

	note := utils.SanitizeString(req.Note)
	url := utils.SanitizeString(req.EvidenceURL)
	if strings.TrimSpace(note) == "" && strings.TrimSpace(url) == "" {
		return nil, errors.New("evidence note or evidence url is required")
	}

	if err := s.orderRepo.CreateDisputeEvidence(&models.DisputeEvidence{
		OrderID:     orderID,
		UploadedBy:  userID,
		EvidenceURL: url,
		Note:        note,
		CreatedAt:   time.Now().UTC(),
	}); err != nil {
		return nil, errors.New("failed to save dispute evidence")
	}

	logNote := note
	if logNote == "" {
		logNote = "Evidence attached to dispute"
	}
	_ = s.orderRepo.CreateStatusLog(&models.OrderStatusLog{
		OrderID:    orderID,
		ActorID:    userID,
		FromStatus: order.Status,
		ToStatus:   order.Status,
		Reason:     "dispute_evidence_added",
		Category:   order.DisputeStatus,
		Note:       logNote,
		CreatedAt:  time.Now().UTC(),
	})
	return s.orderRepo.GetDisputeEvidences(orderID)
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
		isBuyerActor := order.BuyerID == userID
		isFarmerActor := order.FarmerID == userID

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

		if isStatusChange {
			// Buyer-side actions: cancel order or mark as received.
			if isBuyerActor {
				if newStatus != "cancelled" && newStatus != "completed" {
					return errors.New("buyers can only cancel or mark order as received")
				}
				if newStatus == "completed" && oldStatus != "out_for_delivery" {
					return errors.New("order can be marked received only after out for delivery")
				}
			}

			// Farmer-side actions: fulfillment/shipping operations.
			if isFarmerActor {
				if newStatus == "completed" {
					return errors.New("completed status must be confirmed by buyer as received")
				}
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
		} else if isStatusChange {
			if logReason == "" {
				logReason = "status_update"
			}
			if logCategory == "" {
				logCategory = "lifecycle"
			}
			if newStatus == "completed" && isBuyerActor {
				logReason = "buyer_received"
				logNote = "Buyer confirmed delivery received"
			}
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
	harvestRequests, err := s.orderRepo.GetHarvestRequestsByFarmer(farmerID)
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

	for _, item := range harvestRequests {
		if item.Status == "pending" {
			items = append(items, FarmerNotificationItem{
				ID:        "harvest-pending-" + strconv.FormatUint(uint64(item.ID), 10),
				Type:      "harvest_request",
				Title:     "New Harvest Request",
				Message:   "Harvest request #" + strconv.FormatUint(uint64(item.ID), 10) + " asks for " + strconv.FormatFloat(item.RequestedQuantity, 'f', 1, 64) + " " + item.Product.Unit + " of " + item.Product.CropName + ".",
				CreatedAt: item.CreatedAt.Format(time.RFC3339),
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
	harvestRequests, err := s.orderRepo.GetHarvestRequestsByBuyer(buyerID)
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

	for _, item := range harvestRequests {
		if item.Status == "accepted" || item.Status == "ready" || item.Status == "rejected" {
			items = append(items, BuyerNotificationItem{
				ID:        "harvest-" + strconv.FormatUint(uint64(item.ID), 10),
				Type:      "harvest_request",
				Title:     "Harvest Request Updated",
				Message:   "Harvest request #" + strconv.FormatUint(uint64(item.ID), 10) + " is now " + item.Status + ".",
				CreatedAt: item.UpdatedAt.Format(time.RFC3339),
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
