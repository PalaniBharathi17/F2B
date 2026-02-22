package models

import "time"

type ProductPriceHistory struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ProductID uint      `gorm:"not null;index" json:"product_id"`
	Product   Product   `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	FarmerID  uint      `gorm:"not null;index" json:"farmer_id"`
	OldPrice  float64   `gorm:"not null" json:"old_price"`
	NewPrice  float64   `gorm:"not null" json:"new_price"`
	ChangedAt time.Time `gorm:"index" json:"changed_at"`
}
