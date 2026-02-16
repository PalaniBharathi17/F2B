package repository

import (
	"github.com/f2b-portal/backend/internal/models"
	"gorm.io/gorm"
)

type CartRepository struct {
	db *gorm.DB
}

func NewCartRepository(db *gorm.DB) *CartRepository {
	return &CartRepository{db: db}
}

func (r *CartRepository) GetItemsByBuyerID(buyerID uint) ([]models.CartItem, error) {
	var items []models.CartItem
	err := r.db.Preload("Product").Preload("Product.Farmer").Preload("Product.Farmer.FarmerProfile").
		Where("buyer_id = ?", buyerID).
		Order("updated_at DESC").
		Find(&items).Error
	return items, err
}

func (r *CartRepository) GetByBuyerAndProduct(buyerID, productID uint) (*models.CartItem, error) {
	var item models.CartItem
	err := r.db.Where("buyer_id = ? AND product_id = ?", buyerID, productID).First(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *CartRepository) Create(item *models.CartItem) error {
	return r.db.Create(item).Error
}

func (r *CartRepository) Update(item *models.CartItem) error {
	return r.db.Save(item).Error
}

func (r *CartRepository) DeleteByID(id uint) error {
	return r.db.Delete(&models.CartItem{}, id).Error
}

func (r *CartRepository) DeleteByBuyerID(buyerID uint) error {
	return r.db.Where("buyer_id = ?", buyerID).Delete(&models.CartItem{}).Error
}

