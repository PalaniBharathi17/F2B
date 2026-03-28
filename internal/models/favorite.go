package models

import "time"

type Favorite struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	BuyerID    uint      `gorm:"not null;index" json:"buyer_id"`
	ProductID  uint      `gorm:"not null;index" json:"product_id"`
	Product    Product   `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}
