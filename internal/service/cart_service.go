package service

import (
	"errors"

	"github.com/f2b-portal/backend/internal/models"
	"github.com/f2b-portal/backend/internal/repository"
	"gorm.io/gorm"
)

type CartService struct {
	cartRepo    *repository.CartRepository
	productRepo *repository.ProductRepository
	orderRepo   *repository.OrderRepository
}

func NewCartService(cartRepo *repository.CartRepository, productRepo *repository.ProductRepository, orderRepo *repository.OrderRepository) *CartService {
	return &CartService{
		cartRepo:    cartRepo,
		productRepo: productRepo,
		orderRepo:   orderRepo,
	}
}

type AddToCartRequest struct {
	ProductID uint    `json:"product_id"`
	Quantity  float64 `json:"quantity"`
}

func (s *CartService) GetCartItems(buyerID uint) ([]models.CartItem, error) {
	return s.cartRepo.GetItemsByBuyerID(buyerID)
}

func (s *CartService) AddToCart(buyerID uint, req AddToCartRequest) error {
	if req.ProductID == 0 {
		return errors.New("product_id is required")
	}
	if req.Quantity <= 0 {
		return errors.New("quantity must be greater than 0")
	}

	product, err := s.productRepo.GetByID(req.ProductID)
	if err != nil {
		return errors.New("product not found")
	}
	if product.Status != "active" {
		return errors.New("product is not available")
	}
	if product.FarmerID == buyerID {
		return errors.New("you cannot add your own product")
	}

	existing, err := s.cartRepo.GetByBuyerAndProduct(buyerID, req.ProductID)
	if err == nil {
		existing.Quantity += req.Quantity
		return s.cartRepo.Update(existing)
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return errors.New("failed to add item to cart")
	}

	return s.cartRepo.Create(&models.CartItem{
		BuyerID:   buyerID,
		ProductID: req.ProductID,
		Quantity:  req.Quantity,
	})
}

func (s *CartService) UpdateQuantity(buyerID, cartItemID uint, quantity float64) error {
	if quantity <= 0 {
		return errors.New("quantity must be greater than 0")
	}

	items, err := s.cartRepo.GetItemsByBuyerID(buyerID)
	if err != nil {
		return errors.New("failed to load cart")
	}

	var target *models.CartItem
	for i := range items {
		if items[i].ID == cartItemID {
			target = &items[i]
			break
		}
	}
	if target == nil {
		return errors.New("cart item not found")
	}

	target.Quantity = quantity
	return s.cartRepo.Update(target)
}

func (s *CartService) RemoveItem(buyerID, cartItemID uint) error {
	items, err := s.cartRepo.GetItemsByBuyerID(buyerID)
	if err != nil {
		return errors.New("failed to load cart")
	}
	found := false
	for i := range items {
		if items[i].ID == cartItemID {
			found = true
			break
		}
	}
	if !found {
		return errors.New("cart item not found")
	}

	return s.cartRepo.DeleteByID(cartItemID)
}

func (s *CartService) Checkout(buyerID uint, deliveryAddress string) ([]models.Order, error) {
	items, err := s.cartRepo.GetItemsByBuyerID(buyerID)
	if err != nil {
		return nil, errors.New("failed to load cart")
	}
	if len(items) == 0 {
		return nil, errors.New("cart is empty")
	}

	createdOrders := make([]models.Order, 0, len(items))

	for _, item := range items {
		product, err := s.productRepo.GetByID(item.ProductID)
		if err != nil {
			return nil, errors.New("product not found during checkout")
		}
		if product.Status != "active" {
			return nil, errors.New("one or more products are no longer available")
		}
		if product.Quantity < item.Quantity {
			return nil, errors.New("insufficient quantity for one or more products")
		}

		order := &models.Order{
			ProductID:       product.ID,
			BuyerID:         buyerID,
			FarmerID:        product.FarmerID,
			Quantity:        item.Quantity,
			TotalPrice:      item.Quantity * product.PricePerUnit,
			Status:          "pending",
			DeliveryAddress: deliveryAddress,
		}
		if err := s.orderRepo.Create(order); err != nil {
			return nil, errors.New("failed to create order")
		}
		createdOrders = append(createdOrders, *order)
	}

	if err := s.cartRepo.DeleteByBuyerID(buyerID); err != nil {
		return nil, errors.New("orders created but failed to clear cart")
	}

	return createdOrders, nil
}
