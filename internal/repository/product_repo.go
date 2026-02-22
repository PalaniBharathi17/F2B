package repository

import (
	"strings"

	"github.com/f2b-portal/backend/internal/models"
	"gorm.io/gorm"
)

type ProductRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) Create(product *models.Product) error {
	return r.db.Create(product).Error
}

func (r *ProductRepository) GetByID(id uint) (*models.Product, error) {
	var product models.Product
	err := r.db.Preload("Farmer").Preload("Farmer.FarmerProfile").Where("id = ?", id).First(&product).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *ProductRepository) GetAll(filters map[string]interface{}, page, limit int) ([]models.Product, int64, error) {
	var products []models.Product
	var total int64

	query := r.db.Model(&models.Product{}).Preload("Farmer").Preload("Farmer.FarmerProfile")

	// Apply filters
	if cropName, ok := filters["crop_name"].(string); ok && cropName != "" {
		query = query.Where("LOWER(crop_name) LIKE ?", "%"+cropName+"%")
	}
	if city, ok := filters["city"].(string); ok && city != "" {
		query = query.Where("LOWER(city) = ?", city)
	}
	if state, ok := filters["state"].(string); ok && state != "" {
		query = query.Where("LOWER(state) = ?", state)
	}
	if category, ok := filters["category"].(string); ok && strings.TrimSpace(category) != "" {
		cat := strings.ToLower(strings.TrimSpace(category))
		query = query.Where("(LOWER(category) = ? OR LOWER(description) LIKE ?)", cat, "%category: "+cat+"%")
	}
	if minPrice, ok := filters["min_price"].(float64); ok {
		query = query.Where("price_per_unit >= ?", minPrice)
	}
	if maxPrice, ok := filters["max_price"].(float64); ok {
		query = query.Where("price_per_unit <= ?", maxPrice)
	}
	if status, ok := filters["status"].(string); ok && status != "" {
		query = query.Where("status = ?", status)
	} else {
		query = query.Where("status = ?", "active")
	}
	if farmerID, ok := filters["farmer_id"].(uint); ok && farmerID > 0 {
		query = query.Where("farmer_id = ?", farmerID)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply sorting
	if sortBy, ok := filters["sort_by"].(string); ok {
		switch sortBy {
		case "price_asc":
			query = query.Order("price_per_unit ASC")
		case "price_desc":
			query = query.Order("price_per_unit DESC")
		case "date_asc":
			query = query.Order("created_at ASC")
		case "date_desc":
			query = query.Order("created_at DESC")
		default:
			query = query.Order("created_at DESC")
		}
	} else {
		query = query.Order("created_at DESC")
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Find(&products).Error
	if err != nil {
		return nil, 0, err
	}

	return products, total, nil
}

func (r *ProductRepository) GetByFarmerID(farmerID uint) ([]models.Product, error) {
	var products []models.Product
	err := r.db.Where("farmer_id = ?", farmerID).Order("created_at DESC").Find(&products).Error
	return products, err
}

func (r *ProductRepository) Update(product *models.Product) error {
	return r.db.Save(product).Error
}

func (r *ProductRepository) UpdateStatus(productID, farmerID uint, status string) error {
	return r.db.Model(&models.Product{}).
		Where("id = ? AND farmer_id = ?", productID, farmerID).
		Update("status", status).Error
}

func (r *ProductRepository) BulkUpdateStatus(productIDs []uint, farmerID uint, status string) error {
	return r.db.Model(&models.Product{}).
		Where("id IN ? AND farmer_id = ?", productIDs, farmerID).
		Update("status", status).Error
}

func (r *ProductRepository) Delete(id uint) error {
	return r.db.Delete(&models.Product{}, id).Error
}

func (r *ProductRepository) Search(query string, limit int) ([]models.Product, error) {
	var products []models.Product
	err := r.db.Preload("Farmer").Preload("Farmer.FarmerProfile").
		Where("LOWER(crop_name) LIKE ? AND status = ?", "%"+query+"%", "active").
		Order("created_at DESC").
		Limit(limit).
		Find(&products).Error
	return products, err
}

func (r *ProductRepository) ListAllForAdmin() ([]models.Product, error) {
	var products []models.Product
	err := r.db.Preload("Farmer").Preload("Farmer.FarmerProfile").
		Order("created_at DESC").
		Find(&products).Error
	return products, err
}

func (r *ProductRepository) CreatePriceHistory(item *models.ProductPriceHistory) error {
	return r.db.Create(item).Error
}

func (r *ProductRepository) GetPriceHistoryByProduct(productID uint) ([]models.ProductPriceHistory, error) {
	var history []models.ProductPriceHistory
	err := r.db.Where("product_id = ?", productID).Order("changed_at DESC").Find(&history).Error
	return history, err
}
