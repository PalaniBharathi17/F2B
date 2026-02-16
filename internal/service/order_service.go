package service

import (
	"errors"

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
	order, err := s.orderRepo.GetByID(orderID)
	if err != nil {
		return nil, errors.New("order not found")
	}

	// Check authorization
	if order.BuyerID != userID && order.FarmerID != userID {
		return nil, errors.New("unauthorized: you can only update your own orders")
	}

	// Validate status transition
	validStatuses := map[string][]string{
		"pending":    {"confirmed", "cancelled"},
		"confirmed":  {"completed", "cancelled"},
		"completed":  {},
		"cancelled":  {},
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

	// Update order
	order.Status = newStatus

	// If confirmed, reduce product quantity
	if newStatus == "confirmed" {
		product, err := s.productRepo.GetByID(order.ProductID)
		if err == nil {
			product.Quantity -= order.Quantity
			if product.Quantity <= 0 {
				product.Status = "sold"
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

	order.Status = "cancelled"
	return s.orderRepo.Update(order)
}
