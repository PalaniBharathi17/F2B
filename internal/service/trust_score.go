package service

import (
	"errors"

	"github.com/f2b-portal/backend/internal/models"
	"github.com/f2b-portal/backend/internal/repository"
)

type TrustScoreService struct {
	userRepo  *repository.UserRepository
	orderRepo *repository.OrderRepository
}

func NewTrustScoreService(userRepo *repository.UserRepository, orderRepo *repository.OrderRepository) *TrustScoreService {
	return &TrustScoreService{
		userRepo:  userRepo,
		orderRepo: orderRepo,
	}
}

func (s *TrustScoreService) CalculateTrustScore(farmerID uint) (float64, string, error) {
	// Get farmer profile
	profile, err := s.userRepo.GetFarmerProfile(farmerID)
	if err != nil {
		return 0, "", errors.New("farmer profile not found")
	}

	// Get order statistics
	totalOrders, err := s.orderRepo.GetTotalOrdersByFarmer(farmerID)
	if err != nil {
		return 0, "", err
	}

	completedOrders, err := s.orderRepo.GetCompletedOrdersByFarmer(farmerID)
	if err != nil {
		return 0, "", err
	}

	// Calculate completion rate
	var completionRate float64
	if totalOrders > 0 {
		completionRate = float64(len(completedOrders)) / float64(totalOrders)
	}

	// Normalize rating (0-5 to 0-1)
	normalizedRating := profile.RatingAverage / 5.0

	// Calculate trust score: (Average Rating × 0.6) + (Completion Rate × 0.4)
	trustScore := (normalizedRating * 0.6) + (completionRate * 0.4)

	// Determine badge
	var badge string
	if trustScore >= 0.8 {
		badge = "GOLD"
	} else if trustScore >= 0.6 {
		badge = "SILVER"
	} else {
		badge = "BRONZE"
	}

	return trustScore, badge, nil
}

func (s *TrustScoreService) UpdateTrustScore(farmerID uint) error {
	trustScore, badge, err := s.CalculateTrustScore(farmerID)
	if err != nil {
		return err
	}

	profile, err := s.userRepo.GetFarmerProfile(farmerID)
	if err != nil {
		return err
	}

	profile.TrustScore = trustScore
	profile.Badge = badge
	profile.CompletedOrders = len(s.getCompletedOrdersCount(farmerID))

	return s.userRepo.UpdateFarmerProfile(profile)
}

func (s *TrustScoreService) getCompletedOrdersCount(farmerID uint) []models.Order {
	orders, _ := s.orderRepo.GetCompletedOrdersByFarmer(farmerID)
	return orders
}

func (s *TrustScoreService) GetFarmerWithTrust(farmerID uint) (*models.FarmerProfile, error) {
	// Update trust score before returning
	if err := s.UpdateTrustScore(farmerID); err != nil {
		return nil, err
	}

	// Get updated profile
	return s.userRepo.GetFarmerProfile(farmerID)
}

func (s *TrustScoreService) ListFarmers() ([]models.User, error) {
	return s.userRepo.ListFarmers()
}
