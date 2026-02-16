package repository

import (
	"github.com/f2b-portal/backend/internal/models"
	"gorm.io/gorm"
)

type OrderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) *OrderRepository {
	return &OrderRepository{db: db}
}

func (r *OrderRepository) Create(order *models.Order) error {
	return r.db.Create(order).Error
}

func (r *OrderRepository) GetByID(id uint) (*models.Order, error) {
	var order models.Order
	err := r.db.Preload("Product").Preload("Product.Farmer").
		Preload("Buyer").Preload("Farmer").
		Where("id = ?", id).First(&order).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *OrderRepository) GetByBuyerID(buyerID uint) ([]models.Order, error) {
	var orders []models.Order
	err := r.db.Preload("Product").Preload("Farmer").
		Where("buyer_id = ?", buyerID).
		Order("created_at DESC").
		Find(&orders).Error
	return orders, err
}

func (r *OrderRepository) GetByFarmerID(farmerID uint) ([]models.Order, error) {
	var orders []models.Order
	err := r.db.Preload("Product").Preload("Buyer").
		Where("farmer_id = ?", farmerID).
		Order("created_at DESC").
		Find(&orders).Error
	return orders, err
}

func (r *OrderRepository) Update(order *models.Order) error {
	return r.db.Save(order).Error
}

func (r *OrderRepository) GetCompletedOrdersByFarmer(farmerID uint) ([]models.Order, error) {
	var orders []models.Order
	err := r.db.Where("farmer_id = ? AND status = ?", farmerID, "completed").
		Find(&orders).Error
	return orders, err
}

func (r *OrderRepository) GetTotalOrdersByFarmer(farmerID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.Order{}).
		Where("farmer_id = ?", farmerID).
		Count(&count).Error
	return count, err
}

func (r *OrderRepository) ListAll() ([]models.Order, error) {
	var orders []models.Order
	err := r.db.Preload("Product").Preload("Buyer").Preload("Farmer").
		Order("created_at DESC").
		Find(&orders).Error
	return orders, err
}
