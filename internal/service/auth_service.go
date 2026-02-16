package service

import (
	"errors"

	"github.com/f2b-portal/backend/internal/models"
	"github.com/f2b-portal/backend/internal/repository"
	"github.com/f2b-portal/backend/internal/utils"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo *repository.UserRepository
}

func NewAuthService(userRepo *repository.UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Password string `json:"password"`
	UserType string `json:"user_type"`
	City     string `json:"city"`
	State    string `json:"state"`
}

func (s *AuthService) Register(req RegisterRequest) (*models.User, string, error) {
	// Validate input
	if !utils.ValidateEmail(req.Email) {
		return nil, "", errors.New("invalid email format")
	}
	if !utils.ValidatePhone(req.Phone) {
		return nil, "", errors.New("invalid phone number format")
	}
	if !utils.ValidatePassword(req.Password) {
		return nil, "", errors.New("password must be at least 6 characters")
	}
	if !utils.IsValidUserType(req.UserType) {
		return nil, "", errors.New("user_type must be 'farmer' or 'buyer'")
	}

	// Check if user already exists
	existingUser, _ := s.userRepo.GetByEmail(req.Email)
	if existingUser != nil {
		return nil, "", errors.New("email already registered")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", errors.New("failed to hash password")
	}

	// Create user
	user := &models.User{
		Name:     utils.SanitizeString(req.Name),
		Email:    utils.SanitizeString(req.Email),
		Phone:    utils.SanitizeString(req.Phone),
		Password: string(hashedPassword),
		UserType: req.UserType,
		City:     utils.SanitizeString(req.City),
		State:    utils.SanitizeString(req.State),
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, "", errors.New("failed to create user")
	}

	// Create farmer profile if user is a farmer
	if req.UserType == "farmer" {
		farmerProfile := &models.FarmerProfile{
			UserID:        user.ID,
			FarmName:      utils.SanitizeString(req.Name) + "'s Farm",
			FarmSizeAcres: 0,
			TrustScore:    0,
			Badge:         "BRONZE",
		}
		if err := s.userRepo.CreateFarmerProfile(farmerProfile); err != nil {
			// Log error but don't fail registration
		}
	}

	// Generate JWT token
	token, err := utils.GenerateToken(user.ID, user.Email, user.UserType)
	if err != nil {
		return nil, "", errors.New("failed to generate token")
	}

	return user, token, nil
}

func (s *AuthService) Login(email, password string) (*models.User, string, error) {
	// Get user by email
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	// Generate JWT token
	token, err := utils.GenerateToken(user.ID, user.Email, user.UserType)
	if err != nil {
		return nil, "", errors.New("failed to generate token")
	}

	return user, token, nil
}

func (s *AuthService) GetUserByID(userID uint) (*models.User, error) {
	return s.userRepo.GetByID(userID)
}
