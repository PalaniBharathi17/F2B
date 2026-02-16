package service

import (
	"errors"

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
	Quantity     float64 `json:"quantity"`
	Unit         string  `json:"unit"`
	PricePerUnit float64 `json:"price_per_unit"`
	Description  string  `json:"description"`
	City         string  `json:"city"`
	State        string  `json:"state"`
	ImageURL     string  `json:"image_url"`
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

	product := &models.Product{
		FarmerID:     farmerID,
		CropName:     utils.SanitizeString(req.CropName),
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

	product.CropName = utils.SanitizeString(req.CropName)
	product.Quantity = req.Quantity
	product.Unit = utils.SanitizeString(req.Unit)
	product.PricePerUnit = req.PricePerUnit
	product.Description = utils.SanitizeString(req.Description)
	product.City = utils.SanitizeString(req.City)
	product.State = utils.SanitizeString(req.State)
	if req.ImageURL != "" {
		product.ImageURL = req.ImageURL
	}

	if err := s.productRepo.Update(product); err != nil {
		return nil, errors.New("failed to update product")
	}

	return product, nil
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
