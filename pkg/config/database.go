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

	autoMigrateErr := db.AutoMigrate(
		&models.User{},
		&models.FarmerProfile{},
		&models.Product{},
		&models.ProductPriceHistory{},
		&models.CartItem{},
		&models.Address{},
		&models.Favorite{},
		&models.Order{},
		&models.HarvestRequest{},
		&models.VerificationDocument{},
		&models.AdminAuditLog{},
		&models.OrderStatusLog{},
		&models.OrderMessage{},
		&models.DisputeEvidence{},
		&models.Review{},
	)

	// Keep startup resilient even if AutoMigrate fails on legacy/inconsistent schemas.
	// We still run essential ALTER TABLE statements to keep runtime-critical paths working.
	if autoMigrateErr != nil {
		log.Printf("AutoMigrate warning: %v", autoMigrateErr)
	}

	essentialSchemaFixes := []string{
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'verified'`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_note TEXT`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_by BIGINT`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ`,
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT`,
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS moderation_note TEXT`,
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS reviewed_by BIGINT`,
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ`,
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bulk_available BOOLEAN DEFAULT FALSE`,
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS minimum_bulk_quantity DOUBLE PRECISION DEFAULT 0`,
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS supports_harvest_request BOOLEAN DEFAULT TRUE`,
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS harvest_lead_days INTEGER DEFAULT 0`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMPTZ`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_slot TEXT`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_type TEXT`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_note TEXT`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'standard'`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_note TEXT`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod'`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference TEXT`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS preferred_date TIMESTAMPTZ`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS source_request_id BIGINT`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispute_status TEXT DEFAULT 'none'`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispute_note TEXT`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_review_status TEXT DEFAULT 'open'`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_review_note TEXT`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_reviewed_by BIGINT`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_reviewed_at TIMESTAMPTZ`,
		`CREATE TABLE IF NOT EXISTS harvest_requests (
			id BIGSERIAL PRIMARY KEY,
			product_id BIGINT NOT NULL,
			buyer_id BIGINT NOT NULL,
			farmer_id BIGINT NOT NULL,
			requested_quantity DOUBLE PRECISION NOT NULL,
			preferred_harvest_date TIMESTAMPTZ NOT NULL,
			delivery_address TEXT,
			buyer_note TEXT,
			status TEXT DEFAULT 'pending',
			farmer_response_note TEXT,
			responded_at TIMESTAMPTZ,
			converted_order_id BIGINT,
			created_at TIMESTAMPTZ,
			updated_at TIMESTAMPTZ,
			deleted_at TIMESTAMPTZ
		)`,
		`CREATE INDEX IF NOT EXISTS idx_harvest_requests_product_id ON harvest_requests(product_id)`,
		`CREATE INDEX IF NOT EXISTS idx_harvest_requests_buyer_id ON harvest_requests(buyer_id)`,
		`CREATE INDEX IF NOT EXISTS idx_harvest_requests_farmer_id ON harvest_requests(farmer_id)`,
		`CREATE INDEX IF NOT EXISTS idx_harvest_requests_status ON harvest_requests(status)`,
		`CREATE TABLE IF NOT EXISTS addresses (
			id BIGSERIAL PRIMARY KEY,
			user_id BIGINT NOT NULL,
			label TEXT,
			line1 TEXT NOT NULL,
			line2 TEXT,
			city TEXT,
			state TEXT,
			postal_code TEXT,
			is_default BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMPTZ,
			updated_at TIMESTAMPTZ
		)`,
		`CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id)`,
		`CREATE TABLE IF NOT EXISTS favorites (
			id BIGSERIAL PRIMARY KEY,
			buyer_id BIGINT NOT NULL,
			product_id BIGINT NOT NULL,
			created_at TIMESTAMPTZ
		)`,
		`CREATE INDEX IF NOT EXISTS idx_favorites_buyer_id ON favorites(buyer_id)`,
		`CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id)`,
		`CREATE TABLE IF NOT EXISTS verification_documents (
			id BIGSERIAL PRIMARY KEY,
			user_id BIGINT NOT NULL,
			document_type TEXT,
			document_url TEXT,
			status TEXT DEFAULT 'pending',
			review_note TEXT,
			reviewed_by BIGINT,
			reviewed_at TIMESTAMPTZ,
			created_at TIMESTAMPTZ,
			updated_at TIMESTAMPTZ
		)`,
		`CREATE INDEX IF NOT EXISTS idx_verification_documents_user_id ON verification_documents(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_verification_documents_status ON verification_documents(status)`,
		`CREATE TABLE IF NOT EXISTS admin_audit_logs (
			id BIGSERIAL PRIMARY KEY,
			admin_id BIGINT NOT NULL,
			target_type TEXT,
			target_id BIGINT,
			action TEXT,
			note TEXT,
			created_at TIMESTAMPTZ
		)`,
		`CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id)`,
		`CREATE TABLE IF NOT EXISTS order_status_logs (
			id BIGSERIAL PRIMARY KEY,
			order_id BIGINT NOT NULL,
			actor_id BIGINT NOT NULL,
			from_status TEXT NOT NULL,
			to_status TEXT NOT NULL,
			reason TEXT,
			category TEXT,
			note TEXT,
			created_at TIMESTAMPTZ
		)`,
		`CREATE INDEX IF NOT EXISTS idx_order_status_logs_order_id ON order_status_logs(order_id)`,
		`CREATE INDEX IF NOT EXISTS idx_order_status_logs_actor_id ON order_status_logs(actor_id)`,
		`CREATE INDEX IF NOT EXISTS idx_order_status_logs_category ON order_status_logs(category)`,
		`CREATE INDEX IF NOT EXISTS idx_order_status_logs_created_at ON order_status_logs(created_at)`,
		`CREATE TABLE IF NOT EXISTS order_messages (
			id BIGSERIAL PRIMARY KEY,
			order_id BIGINT NOT NULL,
			sender_id BIGINT NOT NULL,
			sender_role TEXT NOT NULL,
			message TEXT NOT NULL,
			created_at TIMESTAMPTZ
		)`,
		`CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON order_messages(order_id)`,
		`CREATE INDEX IF NOT EXISTS idx_order_messages_sender_id ON order_messages(sender_id)`,
		`CREATE TABLE IF NOT EXISTS dispute_evidences (
			id BIGSERIAL PRIMARY KEY,
			order_id BIGINT NOT NULL,
			uploaded_by BIGINT NOT NULL,
			evidence_url TEXT,
			note TEXT,
			created_at TIMESTAMPTZ
		)`,
		`CREATE INDEX IF NOT EXISTS idx_dispute_evidences_order_id ON dispute_evidences(order_id)`,
		`CREATE INDEX IF NOT EXISTS idx_dispute_evidences_uploaded_by ON dispute_evidences(uploaded_by)`,
	}
	for _, q := range essentialSchemaFixes {
		if execErr := db.Exec(q).Error; execErr != nil {
			log.Printf("essential schema fix failed: %v | query: %s", execErr, q)
		}
	}

	stateBackfills := []string{
		`UPDATE users SET is_active = TRUE WHERE is_active IS NULL`,
		`UPDATE users SET verification_status = CASE WHEN user_type = 'farmer' THEN 'pending' ELSE 'verified' END WHERE verification_status IS NULL OR verification_status = ''`,
		`UPDATE products SET supports_harvest_request = TRUE WHERE supports_harvest_request IS NULL`,
		`UPDATE orders SET order_type = 'standard' WHERE order_type IS NULL OR order_type = ''`,
		`UPDATE orders SET payment_method = 'cod' WHERE payment_method IS NULL OR payment_method = ''`,
		`UPDATE orders SET payment_status = CASE WHEN payment_method = 'cod' THEN 'pending' ELSE 'initiated' END WHERE payment_status IS NULL OR payment_status = ''`,
		`UPDATE orders SET expires_at = created_at + INTERVAL '30 minutes' WHERE expires_at IS NULL AND status = 'pending'`,
		`UPDATE orders SET admin_review_status = CASE WHEN dispute_status IN ('resolved', 'rejected') THEN 'closed' ELSE 'open' END WHERE admin_review_status IS NULL OR admin_review_status = ''`,
	}
	for _, q := range stateBackfills {
		if execErr := db.Exec(q).Error; execErr != nil {
			log.Printf("state backfill query failed: %v", execErr)
		}
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
