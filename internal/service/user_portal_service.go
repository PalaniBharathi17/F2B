package service

import (
	"errors"
	"strings"
	"time"

	"github.com/f2b-portal/backend/internal/models"
	"github.com/f2b-portal/backend/internal/repository"
	"github.com/f2b-portal/backend/internal/utils"
	"gorm.io/gorm"
)

type UserPortalService struct {
	userRepo    *repository.UserRepository
	productRepo *repository.ProductRepository
	orderRepo   *repository.OrderRepository
}

func NewUserPortalService(userRepo *repository.UserRepository, productRepo *repository.ProductRepository, orderRepo *repository.OrderRepository) *UserPortalService {
	return &UserPortalService{userRepo: userRepo, productRepo: productRepo, orderRepo: orderRepo}
}

type SaveAddressRequest struct {
	Label      string `json:"label"`
	Line1      string `json:"line1"`
	Line2      string `json:"line2"`
	City       string `json:"city"`
	State      string `json:"state"`
	PostalCode string `json:"postal_code"`
	IsDefault  bool   `json:"is_default"`
}

type UploadVerificationDocumentRequest struct {
	DocumentType string `json:"document_type"`
	DocumentURL  string `json:"document_url"`
}

type ReviewVerificationDocumentRequest struct {
	Status string `json:"status"`
	Note   string `json:"note"`
}

func (s *UserPortalService) GetAddresses(userID uint) ([]models.Address, error) {
	return s.userRepo.GetAddressesByUser(userID)
}

func (s *UserPortalService) SaveAddress(userID uint, req SaveAddressRequest) (*models.Address, error) {
	if strings.TrimSpace(req.Line1) == "" {
		return nil, errors.New("address line is required")
	}
	item := &models.Address{
		UserID:     userID,
		Label:      utils.SanitizeString(req.Label),
		Line1:      utils.SanitizeString(req.Line1),
		Line2:      utils.SanitizeString(req.Line2),
		City:       utils.SanitizeString(req.City),
		State:      utils.SanitizeString(req.State),
		PostalCode: utils.SanitizeString(req.PostalCode),
		IsDefault:  req.IsDefault,
	}
	if err := s.userRepo.CreateAddress(item); err != nil {
		return nil, errors.New("failed to save address")
	}
	return item, nil
}

func (s *UserPortalService) DeleteAddress(userID, addressID uint) error {
	return s.userRepo.DeleteAddress(userID, addressID)
}

func (s *UserPortalService) ListFavorites(userID uint) ([]models.Favorite, error) {
	return s.userRepo.ListFavorites(userID)
}

func (s *UserPortalService) ToggleFavorite(userID, productID uint) (bool, error) {
	if _, err := s.productRepo.GetByID(productID); err != nil {
		return false, errors.New("product not found")
	}
	existing, err := s.userRepo.GetFavorite(userID, productID)
	if err == nil && existing != nil {
		if delErr := s.userRepo.DeleteFavorite(userID, productID); delErr != nil {
			return false, errors.New("failed to update favorite")
		}
		return false, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) && err != nil {
		return false, errors.New("failed to update favorite")
	}
	if createErr := s.userRepo.CreateFavorite(&models.Favorite{
		BuyerID:   userID,
		ProductID: productID,
		CreatedAt: time.Now().UTC(),
	}); createErr != nil {
		return false, errors.New("failed to update favorite")
	}
	return true, nil
}

func (s *UserPortalService) UploadVerificationDocument(userID uint, req UploadVerificationDocumentRequest) (*models.VerificationDocument, error) {
	if strings.TrimSpace(req.DocumentType) == "" || strings.TrimSpace(req.DocumentURL) == "" {
		return nil, errors.New("document type and url are required")
	}
	item := &models.VerificationDocument{
		UserID:       userID,
		DocumentType: utils.SanitizeString(req.DocumentType),
		DocumentURL:  utils.SanitizeString(req.DocumentURL),
		Status:       "pending",
	}
	if err := s.userRepo.CreateVerificationDocument(item); err != nil {
		return nil, errors.New("failed to upload document")
	}
	return item, nil
}

func (s *UserPortalService) GetVerificationDocuments(userID uint) ([]models.VerificationDocument, error) {
	return s.userRepo.ListVerificationDocuments(userID)
}

func (s *UserPortalService) ReviewVerificationDocument(docID, adminID uint, req ReviewVerificationDocumentRequest) (*models.VerificationDocument, error) {
	if req.Status != "approved" && req.Status != "rejected" && req.Status != "pending" {
		return nil, errors.New("invalid document status")
	}
	item, err := s.userRepo.GetVerificationDocumentByID(docID)
	if err != nil {
		return nil, errors.New("document not found")
	}
	now := time.Now().UTC()
	item.Status = req.Status
	item.ReviewNote = utils.SanitizeString(req.Note)
	item.ReviewedBy = &adminID
	item.ReviewedAt = &now
	if err := s.userRepo.UpdateVerificationDocument(item); err != nil {
		return nil, errors.New("failed to review document")
	}
	return item, nil
}

func (s *UserPortalService) ListAllVerificationDocuments() ([]models.VerificationDocument, error) {
	return s.userRepo.ListAllVerificationDocuments()
}

