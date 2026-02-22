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
		&models.ProductPriceHistory{},
		&models.CartItem{},
		&models.Order{},
		&models.OrderStatusLog{},
		&models.Review{},
	)

	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	// Backfill product categories for older records that stored category only in description.
	backfillQueries := []string{
		`UPDATE products SET category = 'vegetables' WHERE (category IS NULL OR category = '') AND LOWER(description) LIKE '%category: vegetables%'`,
		`UPDATE products SET category = 'fruits' WHERE (category IS NULL OR category = '') AND LOWER(description) LIKE '%category: fruits%'`,
		`UPDATE products SET category = 'grains' WHERE (category IS NULL OR category = '') AND LOWER(description) LIKE '%category: grains%'`,
		`UPDATE products SET category = 'dairy' WHERE (category IS NULL OR category = '') AND LOWER(description) LIKE '%category: dairy%'`,
		`UPDATE products SET category = 'honey' WHERE (category IS NULL OR category = '') AND LOWER(description) LIKE '%category: honey%'`,
	}
	for _, q := range backfillQueries {
		if execErr := db.Exec(q).Error; execErr != nil {
			log.Printf("category backfill query failed: %v", execErr)
		}
	}

	log.Println("Database migrations completed successfully")
	return nil
}

func GetDB() *gorm.DB {
	return DB
}
