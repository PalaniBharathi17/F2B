package repository

import (
	"github.com/f2b-portal/backend/internal/models"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.Preload("FarmerProfile").Where("id = ?", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *UserRepository) GetFarmerProfile(userID uint) (*models.FarmerProfile, error) {
	var profile models.FarmerProfile
	err := r.db.Where("user_id = ?", userID).First(&profile).Error
	if err != nil {
		return nil, err
	}
	return &profile, nil
}

func (r *UserRepository) CreateFarmerProfile(profile *models.FarmerProfile) error {
	return r.db.Create(profile).Error
}

func (r *UserRepository) UpdateFarmerProfile(profile *models.FarmerProfile) error {
	return r.db.Save(profile).Error
}

func (r *UserRepository) ListFarmers() ([]models.User, error) {
	var users []models.User
	err := r.db.Preload("FarmerProfile").
		Where("user_type = ?", "farmer").
		Order("created_at DESC").
		Find(&users).Error
	return users, err
}

func (r *UserRepository) ListAllUsers() ([]models.User, error) {
	var users []models.User
	err := r.db.Preload("FarmerProfile").Order("created_at DESC").Find(&users).Error
	return users, err
}
