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

func (r *UserRepository) GetAddressesByUser(userID uint) ([]models.Address, error) {
	var items []models.Address
	err := r.db.Where("user_id = ?", userID).Order("is_default DESC, created_at DESC").Find(&items).Error
	return items, err
}

func (r *UserRepository) CreateAddress(item *models.Address) error {
	if item.IsDefault {
		_ = r.db.Model(&models.Address{}).Where("user_id = ?", item.UserID).Update("is_default", false).Error
	}
	return r.db.Create(item).Error
}

func (r *UserRepository) DeleteAddress(userID, addressID uint) error {
	return r.db.Where("user_id = ? AND id = ?", userID, addressID).Delete(&models.Address{}).Error
}

func (r *UserRepository) ListFavorites(buyerID uint) ([]models.Favorite, error) {
	var items []models.Favorite
	err := r.db.Preload("Product").Preload("Product.Farmer").Where("buyer_id = ?", buyerID).Order("created_at DESC").Find(&items).Error
	return items, err
}

func (r *UserRepository) GetFavorite(buyerID, productID uint) (*models.Favorite, error) {
	var item models.Favorite
	err := r.db.Where("buyer_id = ? AND product_id = ?", buyerID, productID).First(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *UserRepository) CreateFavorite(item *models.Favorite) error {
	return r.db.Create(item).Error
}

func (r *UserRepository) DeleteFavorite(buyerID, productID uint) error {
	return r.db.Where("buyer_id = ? AND product_id = ?", buyerID, productID).Delete(&models.Favorite{}).Error
}

func (r *UserRepository) ListVerificationDocuments(userID uint) ([]models.VerificationDocument, error) {
	var items []models.VerificationDocument
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&items).Error
	return items, err
}

func (r *UserRepository) CreateVerificationDocument(item *models.VerificationDocument) error {
	return r.db.Create(item).Error
}

func (r *UserRepository) ListAllVerificationDocuments() ([]models.VerificationDocument, error) {
	var items []models.VerificationDocument
	err := r.db.Preload("User").Order("created_at DESC").Find(&items).Error
	return items, err
}

func (r *UserRepository) UpdateVerificationDocument(item *models.VerificationDocument) error {
	return r.db.Save(item).Error
}

func (r *UserRepository) GetVerificationDocumentByID(id uint) (*models.VerificationDocument, error) {
	var item models.VerificationDocument
	err := r.db.First(&item, id).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *UserRepository) CreateAdminAuditLog(item *models.AdminAuditLog) error {
	return r.db.Create(item).Error
}

func (r *UserRepository) ListAdminAuditLogs() ([]models.AdminAuditLog, error) {
	var items []models.AdminAuditLog
	err := r.db.Order("created_at DESC").Find(&items).Error
	return items, err
}
