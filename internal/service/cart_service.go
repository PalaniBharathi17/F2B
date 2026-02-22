package service

import (
	"errors"
	"strings"
	"time"

	"github.com/f2b-portal/backend/internal/models"
	"github.com/f2b-portal/backend/internal/repository"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
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
	if product.Quantity < req.Quantity {
		return errors.New("requested quantity exceeds available stock")
	}

	existing, err := s.cartRepo.GetByBuyerAndProduct(buyerID, req.ProductID)
	if err == nil {
		if product.Quantity < (existing.Quantity + req.Quantity) {
			return errors.New("requested quantity exceeds available stock")
		}
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
	if target.Product.Status != "active" {
		return errors.New("product is not available")
	}
	if quantity > target.Product.Quantity {
		return errors.New("requested quantity exceeds available stock")
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
	cleanAddress := strings.TrimSpace(deliveryAddress)
	createdOrderIDs := make([]uint, 0)

	err := s.orderRepo.GetDB().Transaction(func(tx *gorm.DB) error {
		var items []models.CartItem
		if err := tx.Preload("Product").
			Where("buyer_id = ?", buyerID).
			Order("updated_at DESC").
			Find(&items).Error; err != nil {
			return errors.New("failed to load cart")
		}
		if len(items) == 0 {
			return errors.New("cart is empty")
		}

		for _, item := range items {
			var product models.Product
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("id = ?", item.ProductID).
				First(&product).Error; err != nil {
				return errors.New("product not found during checkout")
			}
			if product.Status != "active" {
				return errors.New("one or more products are no longer available")
			}
			if product.Quantity < item.Quantity {
				return errors.New("insufficient quantity for one or more products")
			}

			order := &models.Order{
				ProductID:       product.ID,
				BuyerID:         buyerID,
				FarmerID:        product.FarmerID,
				Quantity:        item.Quantity,
				TotalPrice:      item.Quantity * product.PricePerUnit,
				Status:          "pending",
				DeliveryAddress: cleanAddress,
				CreatedAt:       time.Now().UTC(),
				UpdatedAt:       time.Now().UTC(),
			}
			if err := tx.Create(order).Error; err != nil {
				return errors.New("failed to create order")
			}
			createdOrderIDs = append(createdOrderIDs, order.ID)

			product.Quantity -= item.Quantity
			if product.Quantity <= 0 {
				product.Quantity = 0
				product.Status = "sold"
			}
			if err := tx.Save(&product).Error; err != nil {
				return errors.New("failed to update inventory")
			}
		}

		if err := tx.Where("buyer_id = ?", buyerID).Delete(&models.CartItem{}).Error; err != nil {
			return errors.New("orders created but failed to clear cart")
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	createdOrders := make([]models.Order, 0, len(createdOrderIDs))
	for _, orderID := range createdOrderIDs {
		order, getErr := s.orderRepo.GetByID(orderID)
		if getErr != nil {
			return nil, errors.New("failed to load created orders")
		}
		createdOrders = append(createdOrders, *order)
	}
	return createdOrders, nil
}
