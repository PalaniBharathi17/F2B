package models

import "time"

type Address struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID     uint      `gorm:"not null;index" json:"user_id"`
	Label      string    `json:"label"`
	Line1      string    `gorm:"not null" json:"line1"`
	Line2      string    `json:"line2"`
	City       string    `json:"city"`
	State      string    `json:"state"`
	PostalCode string    `json:"postal_code"`
	IsDefault  bool      `gorm:"default:false" json:"is_default"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
