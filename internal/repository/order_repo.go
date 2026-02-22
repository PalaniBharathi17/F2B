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

func (r *OrderRepository) GetDB() *gorm.DB {
	return r.db
}

func (r *OrderRepository) Create(order *models.Order) error {
	return r.db.Create(order).Error
}

func (r *OrderRepository) GetByID(id uint) (*models.Order, error) {
	var order models.Order
	err := r.db.Preload("Product").Preload("Product.Farmer").
		Preload("Buyer").Preload("Farmer").Preload("StatusLogs").
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

func (r *OrderRepository) CreateStatusLog(logItem *models.OrderStatusLog) error {
	return r.db.Create(logItem).Error
}

func (r *OrderRepository) GetStatusLogsByOrder(orderID uint, page, limit int) ([]models.OrderStatusLog, int64, error) {
	var logs []models.OrderStatusLog
	var total int64
	query := r.db.Model(&models.OrderStatusLog{}).Where("order_id = ?", orderID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs).Error
	return logs, total, err
}

func (r *OrderRepository) GetReviewsByFarmer(farmerID uint, page, limit int) ([]models.Review, int64, error) {
	var reviews []models.Review
	var total int64
	query := r.db.Model(&models.Review{}).
		Joins("JOIN orders ON orders.id = reviews.order_id").
		Where("orders.farmer_id = ?", farmerID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	err := query.Preload("Reviewer").Preload("Order").Preload("Order.Product").
		Order("reviews.created_at DESC").Offset(offset).Limit(limit).
		Find(&reviews).Error
	return reviews, total, err
}

func (r *OrderRepository) GetDisputesByFarmer(farmerID uint, page, limit int) ([]models.Order, int64, error) {
	var orders []models.Order
	var total int64
	query := r.db.Model(&models.Order{}).
		Where("farmer_id = ? AND dispute_status IN ?", farmerID, []string{"open", "resolved", "rejected"})
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	err := query.Preload("Product").Preload("Buyer").
		Order("updated_at DESC").Offset(offset).Limit(limit).
		Find(&orders).Error
	return orders, total, err
}

func (r *OrderRepository) GetReviewByOrderAndReviewer(orderID, reviewerID uint) (*models.Review, error) {
	var review models.Review
	err := r.db.Where("order_id = ? AND reviewer_id = ?", orderID, reviewerID).First(&review).Error
	if err != nil {
		return nil, err
	}
	return &review, nil
}

func (r *OrderRepository) CreateReview(review *models.Review) error {
	return r.db.Create(review).Error
}

func (r *OrderRepository) GetReviewsByBuyer(buyerID uint, page, limit int) ([]models.Review, int64, error) {
	var reviews []models.Review
	var total int64
	query := r.db.Model(&models.Review{}).Where("reviewer_id = ?", buyerID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	err := query.Preload("Order").Preload("Order.Product").Preload("Reviewee").
		Order("created_at DESC").Offset(offset).Limit(limit).
		Find(&reviews).Error
	return reviews, total, err
}
