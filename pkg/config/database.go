package config

import (
	"fmt"
	"log"

	"github.com/f2b-portal/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConnectDatabase() (*gorm.DB, error) {
	dsn := AppConfig.GetDSN()
	
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	DB = db
	return db, nil
}

func MigrateDB(db *gorm.DB) error {
	log.Println("Running database migrations...")
	
	err := db.AutoMigrate(
		&models.User{},
		&models.FarmerProfile{},
		&models.Product{},
		&models.CartItem{},
		&models.Order{},
		&models.Review{},
	)
	
	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}
	
	log.Println("Database migrations completed successfully")
	return nil
}

func GetDB() *gorm.DB {
	return DB
}
