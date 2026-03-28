package service

import (
	"errors"

	"github.com/f2b-portal/backend/internal/models"
	"github.com/f2b-portal/backend/internal/repository"
	"github.com/f2b-portal/backend/internal/utils"
	"github.com/f2b-portal/backend/pkg/config"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func EnsureAdminUser(userRepo *repository.UserRepository, cfg *config.Config) error {
	if cfg == nil || cfg.AdminEmail == "" || cfg.AdminPassword == "" {
		return nil
	}
	if !utils.ValidateEmail(cfg.AdminEmail) {
		return errors.New("invalid ADMIN_EMAIL format")
	}
	if cfg.AdminPhone != "" && !utils.ValidatePhone(cfg.AdminPhone) {
		return errors.New("invalid ADMIN_PHONE format")
	}
	if !utils.ValidatePassword(cfg.AdminPassword) {
		return errors.New("ADMIN_PASSWORD must be at least 6 characters")
	}

	existingUser, err := userRepo.GetByEmail(cfg.AdminEmail)
	if err == nil && existingUser != nil {
		needsUpdate := false
		if existingUser.UserType != "admin" {
			existingUser.UserType = "admin"
			needsUpdate = true
		}
		if !existingUser.IsActive {
			existingUser.IsActive = true
			needsUpdate = true
		}
		if existingUser.VerificationStatus != "verified" {
			existingUser.VerificationStatus = "verified"
			needsUpdate = true
		}
		if needsUpdate {
			return userRepo.Update(existingUser)
		}
		return nil
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(cfg.AdminPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	adminName := cfg.AdminName
	if adminName == "" {
		adminName = "Platform Admin"
	}

	return userRepo.Create(&models.User{
		Name:               utils.SanitizeString(adminName),
		Email:              utils.SanitizeString(cfg.AdminEmail),
		Phone:              utils.SanitizeString(cfg.AdminPhone),
		Password:           string(hashedPassword),
		UserType:           "admin",
		IsActive:           true,
		VerificationStatus: "verified",
	})
}
