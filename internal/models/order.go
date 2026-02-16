package models

import (
	"time"

	"gorm.io/gorm"
)

type Order struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	ProductID       uint           `gorm:"not null" json:"product_id"`
	Product         Product        `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	BuyerID         uint           `gorm:"not null" json:"buyer_id"`
	Buyer           User           `gorm:"foreignKey:BuyerID" json:"buyer,omitempty"`
	FarmerID        uint           `gorm:"not null" json:"farmer_id"`
	Farmer          User           `gorm:"foreignKey:FarmerID" json:"farmer,omitempty"`
	Quantity        float64        `gorm:"not null" json:"quantity"`
	TotalPrice      float64        `gorm:"not null" json:"total_price"`
	Status          string         `gorm:"default:'pending'" json:"status"` // pending/confirmed/completed/cancelled
	DeliveryAddress string         `json:"delivery_address"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Reviews []Review `gorm:"foreignKey:OrderID" json:"reviews,omitempty"`
}
