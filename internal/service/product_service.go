package service

import (
	"errors"
	"strings"
	"time"

	"github.com/f2b-portal/backend/internal/models"
	"github.com/f2b-portal/backend/internal/repository"
	"github.com/f2b-portal/backend/internal/utils"
)

type ProductService struct {
	productRepo *repository.ProductRepository
}

func NewProductService(productRepo *repository.ProductRepository) *ProductService {
	return &ProductService{productRepo: productRepo}
}

type CreateProductRequest struct {
	CropName     string  `json:"crop_name"`
	Category     string  `json:"category"`
	Quantity     float64 `json:"quantity"`
	Unit         string  `json:"unit"`
	PricePerUnit float64 `json:"price_per_unit"`
	Description  string  `json:"description"`
	City         string  `json:"city"`
	State        string  `json:"state"`
	ImageURL     string  `json:"image_url"`
}

type UpdateProductStatusRequest struct {
	Status string `json:"status"`
}

type BulkUpdateProductStatusRequest struct {
	ProductIDs []uint `json:"product_ids"`
	Status     string `json:"status"`
}

type UpdateProductPriceRequest struct {
	PricePerUnit float64 `json:"price_per_unit"`
}

func isAllowedProductStatus(status string) bool {
	switch status {
	case "active", "sold", "expired", "draft":
		return true
	default:
		return false
	}
}

func (s *ProductService) CreateProduct(farmerID uint, req CreateProductRequest) (*models.Product, error) {
	// Validate input
	if req.CropName == "" {
		return nil, errors.New("crop name is required")
	}
	if req.Quantity <= 0 {
		return nil, errors.New("quantity must be greater than 0")
	}
	if req.PricePerUnit <= 0 {
		return nil, errors.New("price per unit must be greater than 0")
	}
	if req.Unit == "" {
		return nil, errors.New("unit is required")
	}
	if strings.TrimSpace(req.Category) == "" {
		return nil, errors.New("category is required")
	}

	product := &models.Product{
		FarmerID:     farmerID,
		CropName:     utils.SanitizeString(req.CropName),
		Category:     strings.ToLower(strings.TrimSpace(utils.SanitizeString(req.Category))),
		Quantity:     req.Quantity,
		Unit:         utils.SanitizeString(req.Unit),
		PricePerUnit: req.PricePerUnit,
		Description:  utils.SanitizeString(req.Description),
		City:         utils.SanitizeString(req.City),
		State:        utils.SanitizeString(req.State),
		ImageURL:     req.ImageURL,
		Status:       "active",
	}

	if err := s.productRepo.Create(product); err != nil {
		return nil, errors.New("failed to create product")
	}

	return s.productRepo.GetByID(product.ID)
}

func (s *ProductService) GetProductByID(id uint) (*models.Product, error) {
	return s.productRepo.GetByID(id)
}

func (s *ProductService) GetAllProducts(filters map[string]interface{}, page, limit int) ([]models.Product, int64, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	products, total, err := s.productRepo.GetAll(filters, page, limit)
	if err != nil {
		return nil, 0, 0, err
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))
	return products, total, totalPages, nil
}

func (s *ProductService) GetProductsByFarmer(farmerID uint) ([]models.Product, error) {
	return s.productRepo.GetByFarmerID(farmerID)
}

func (s *ProductService) UpdateProduct(productID, farmerID uint, req CreateProductRequest) (*models.Product, error) {
	product, err := s.productRepo.GetByID(productID)
	if err != nil {
		return nil, errors.New("product not found")
	}

	if product.FarmerID != farmerID {
		return nil, errors.New("unauthorized: you can only update your own products")
	}
	if req.Quantity < 0 {
		return nil, errors.New("quantity cannot be negative")
	}
	if req.PricePerUnit <= 0 {
		return nil, errors.New("price per unit must be greater than 0")
	}
	if req.CropName == "" {
		return nil, errors.New("crop name is required")
	}
	if req.Unit == "" {
		return nil, errors.New("unit is required")
	}
	if strings.TrimSpace(req.Category) == "" {
		return nil, errors.New("category is required")
	}

	product.CropName = utils.SanitizeString(req.CropName)
	product.Category = strings.ToLower(strings.TrimSpace(utils.SanitizeString(req.Category)))
	product.Quantity = req.Quantity
	product.Unit = utils.SanitizeString(req.Unit)
	oldPrice := product.PricePerUnit
	product.PricePerUnit = req.PricePerUnit
	product.Description = utils.SanitizeString(req.Description)
	product.City = utils.SanitizeString(req.City)
	product.State = utils.SanitizeString(req.State)
	if req.ImageURL != "" {
		product.ImageURL = req.ImageURL
	}
	if product.Quantity <= 0 {
		product.Status = "sold"
		product.Quantity = 0
	} else if product.Status == "sold" {
		product.Status = "active"
	}

	if err := s.productRepo.Update(product); err != nil {
		return nil, errors.New("failed to update product")
	}

	if oldPrice != req.PricePerUnit {
		_ = s.productRepo.CreatePriceHistory(&models.ProductPriceHistory{
			ProductID: product.ID,
			FarmerID:  farmerID,
			OldPrice:  oldPrice,
			NewPrice:  req.PricePerUnit,
			ChangedAt: time.Now().UTC(),
		})
	}

	return product, nil
}

func (s *ProductService) UpdateProductPrice(productID, farmerID uint, pricePerUnit float64) (*models.Product, error) {
	if pricePerUnit <= 0 {
		return nil, errors.New("price per unit must be greater than 0")
	}
	product, err := s.productRepo.GetByID(productID)
	if err != nil {
		return nil, errors.New("product not found")
	}
	if product.FarmerID != farmerID {
		return nil, errors.New("unauthorized: you can only update your own products")
	}

	oldPrice := product.PricePerUnit
	product.PricePerUnit = pricePerUnit
	if err := s.productRepo.Update(product); err != nil {
		return nil, errors.New("failed to update product price")
	}
	_ = s.productRepo.CreatePriceHistory(&models.ProductPriceHistory{
		ProductID: product.ID,
		FarmerID:  farmerID,
		OldPrice:  oldPrice,
		NewPrice:  pricePerUnit,
		ChangedAt: time.Now().UTC(),
	})

	return s.productRepo.GetByID(productID)
}

func (s *ProductService) DuplicateProduct(productID, farmerID uint) (*models.Product, error) {
	product, err := s.productRepo.GetByID(productID)
	if err != nil {
		return nil, errors.New("product not found")
	}
	if product.FarmerID != farmerID {
		return nil, errors.New("unauthorized: you can only duplicate your own products")
	}

	clone := &models.Product{
		FarmerID:     product.FarmerID,
		CropName:     product.CropName + " (Copy)",
		Category:     product.Category,
		Quantity:     product.Quantity,
		Unit:         product.Unit,
		PricePerUnit: product.PricePerUnit,
		Description:  product.Description,
		City:         product.City,
		State:        product.State,
		ImageURL:     product.ImageURL,
		Status:       "draft",
	}
	if err := s.productRepo.Create(clone); err != nil {
		return nil, errors.New("failed to duplicate product")
	}
	return s.productRepo.GetByID(clone.ID)
}

func (s *ProductService) GetProductPriceHistory(productID, farmerID uint) ([]models.ProductPriceHistory, error) {
	product, err := s.productRepo.GetByID(productID)
	if err != nil {
		return nil, errors.New("product not found")
	}
	if product.FarmerID != farmerID {
		return nil, errors.New("unauthorized: you can only access your own products")
	}
	return s.productRepo.GetPriceHistoryByProduct(productID)
}

func (s *ProductService) UpdateProductStatus(productID, farmerID uint, status string) (*models.Product, error) {
	nextStatus := strings.ToLower(strings.TrimSpace(status))
	if !isAllowedProductStatus(nextStatus) {
		return nil, errors.New("invalid status")
	}

	product, err := s.productRepo.GetByID(productID)
	if err != nil {
		return nil, errors.New("product not found")
	}
	if product.FarmerID != farmerID {
		return nil, errors.New("unauthorized: you can only update your own products")
	}

	if product.Quantity <= 0 && nextStatus == "active" {
		return nil, errors.New("cannot mark as active when quantity is 0")
	}
	if product.Status == "sold" && nextStatus == "draft" {
		return nil, errors.New("sold products cannot be moved to draft")
	}

	if err := s.productRepo.UpdateStatus(productID, farmerID, nextStatus); err != nil {
		return nil, errors.New("failed to update product status")
	}
	return s.productRepo.GetByID(productID)
}

func (s *ProductService) BulkUpdateProductStatus(farmerID uint, productIDs []uint, status string) error {
	nextStatus := strings.ToLower(strings.TrimSpace(status))
	if !isAllowedProductStatus(nextStatus) {
		return errors.New("invalid status")
	}
	if len(productIDs) == 0 {
		return errors.New("product ids are required")
	}

	for _, id := range productIDs {
		product, err := s.productRepo.GetByID(id)
		if err != nil {
			return errors.New("one or more products not found")
		}
		if product.FarmerID != farmerID {
			return errors.New("unauthorized: you can only update your own products")
		}
		if product.Quantity <= 0 && nextStatus == "active" {
			return errors.New("cannot mark out of stock products as active")
		}
	}

	if err := s.productRepo.BulkUpdateStatus(productIDs, farmerID, nextStatus); err != nil {
		return errors.New("failed to update products")
	}
	return nil
}

func (s *ProductService) DeleteProduct(productID, farmerID uint) error {
	product, err := s.productRepo.GetByID(productID)
	if err != nil {
		return errors.New("product not found")
	}

	if product.FarmerID != farmerID {
		return errors.New("unauthorized: you can only delete your own products")
	}

	return s.productRepo.Delete(productID)
}

func (s *ProductService) SearchProducts(query string, limit int) ([]models.Product, error) {
	if query == "" {
		return []models.Product{}, nil
	}
	return s.productRepo.Search(query, limit)
}
