package models

import (
	"time"

	"gorm.io/gorm"
)

type Product struct {
	ID                     uint           `gorm:"primaryKey" json:"id"`
	FarmerID               uint           `gorm:"not null" json:"farmer_id"`
	Farmer                 User           `gorm:"foreignKey:FarmerID" json:"farmer,omitempty"`
	CropName               string         `gorm:"not null;index" json:"crop_name"`
	Category               string         `gorm:"index" json:"category"`
	Quantity               float64        `gorm:"not null" json:"quantity"`
	Unit                   string         `gorm:"not null" json:"unit"` // kg, quintal, ton
	PricePerUnit           float64        `gorm:"not null" json:"price_per_unit"`
	Description            string         `json:"description"`
	City                   string         `gorm:"index" json:"city"`
	State                  string         `gorm:"index" json:"state"`
	ImageURL               string         `json:"image_url"`
	Status                 string         `gorm:"default:'active'" json:"status"` // active/sold/expired
	IsBulkAvailable        bool           `gorm:"default:false;index" json:"is_bulk_available"`
	MinimumBulkQuantity    float64        `gorm:"default:0" json:"minimum_bulk_quantity"`
	SupportsHarvestRequest bool           `gorm:"default:true;index" json:"supports_harvest_request"`
	HarvestLeadDays        int            `gorm:"default:0" json:"harvest_lead_days"`
	ModerationNote         string         `json:"moderation_note"`
	ReviewedBy             *uint          `json:"reviewed_by"`
	ReviewedAt             *time.Time     `json:"reviewed_at"`
	CreatedAt              time.Time      `json:"created_at"`
	UpdatedAt              time.Time      `json:"updated_at"`
	DeletedAt              gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Orders []Order `gorm:"foreignKey:ProductID" json:"orders,omitempty"`
}
