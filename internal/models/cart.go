package models

import "time"

type CartItem struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	BuyerID   uint      `gorm:"not null;index" json:"buyer_id"`
	Buyer     User      `gorm:"foreignKey:BuyerID" json:"buyer,omitempty"`
	ProductID uint      `gorm:"not null;index" json:"product_id"`
	Product   Product   `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Quantity  float64   `gorm:"not null" json:"quantity"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
