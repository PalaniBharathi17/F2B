package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	Email     string         `gorm:"uniqueIndex;not null" json:"email"`
	Phone     string         `gorm:"uniqueIndex" json:"phone"`
	Password  string         `gorm:"not null" json:"-"` // Hidden in JSON
	UserType  string         `gorm:"not null" json:"user_type"` // farmer/buyer
	City      string         `json:"city"`
	State     string         `json:"state"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	FarmerProfile *FarmerProfile `gorm:"foreignKey:UserID" json:"farmer_profile,omitempty"`
	Products      []Product      `gorm:"foreignKey:FarmerID" json:"products,omitempty"`
	Orders        []Order        `gorm:"foreignKey:BuyerID" json:"orders,omitempty"`
	Reviews       []Review       `gorm:"foreignKey:ReviewerID" json:"reviews,omitempty"`
}

type FarmerProfile struct {
	ID              uint    `gorm:"primaryKey" json:"id"`
	UserID          uint    `gorm:"uniqueIndex" json:"user_id"`
	User            User    `gorm:"foreignKey:UserID" json:"user,omitempty"`
	FarmName        string  `json:"farm_name"`
	FarmSizeAcres   float64 `json:"farm_size_acres"`
	RatingAverage   float64 `gorm:"default:0" json:"rating_average"`
	TotalOrders     int     `gorm:"default:0" json:"total_orders"`
	CompletedOrders int     `gorm:"default:0" json:"completed_orders"`
	TrustScore      float64 `gorm:"default:0" json:"trust_score"`
	Badge           string  `gorm:"default:'BRONZE'" json:"badge"` // GOLD, SILVER, BRONZE
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
