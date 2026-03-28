package models

import (
	"time"

	"gorm.io/gorm"
)

type HarvestRequest struct {
	ID                    uint           `gorm:"primaryKey" json:"id"`
	ProductID             uint           `gorm:"not null;index" json:"product_id"`
	Product               Product        `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	BuyerID               uint           `gorm:"not null;index" json:"buyer_id"`
	Buyer                 User           `gorm:"foreignKey:BuyerID" json:"buyer,omitempty"`
	FarmerID              uint           `gorm:"not null;index" json:"farmer_id"`
	Farmer                User           `gorm:"foreignKey:FarmerID" json:"farmer,omitempty"`
	RequestedQuantity     float64        `gorm:"not null" json:"requested_quantity"`
	PreferredHarvestDate  time.Time      `gorm:"not null" json:"preferred_harvest_date"`
	DeliveryAddress       string         `json:"delivery_address"`
	BuyerNote             string         `json:"buyer_note"`
	Status                string         `gorm:"default:'pending';index" json:"status"`
	FarmerResponseNote    string         `json:"farmer_response_note"`
	RespondedAt           *time.Time     `json:"responded_at"`
	ConvertedOrderID      *uint          `json:"converted_order_id"`
	ConvertedOrder        *Order         `gorm:"foreignKey:ConvertedOrderID" json:"converted_order,omitempty"`
	CreatedAt             time.Time      `json:"created_at"`
	UpdatedAt             time.Time      `json:"updated_at"`
	DeletedAt             gorm.DeletedAt `gorm:"index" json:"-"`
}
