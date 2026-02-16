package models

import "time"

type Review struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	OrderID    uint      `gorm:"not null" json:"order_id"`
	Order      Order     `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	ReviewerID uint      `gorm:"not null" json:"reviewer_id"`
	Reviewer   User      `gorm:"foreignKey:ReviewerID" json:"reviewer,omitempty"`
	RevieweeID uint      `gorm:"not null" json:"reviewee_id"`
	Reviewee   User      `gorm:"foreignKey:RevieweeID" json:"reviewee,omitempty"`
	Rating     int       `gorm:"not null;check:rating >= 1 AND rating <= 5" json:"rating"`
	Comment    string    `json:"comment"`
	CreatedAt  time.Time `json:"created_at"`
}
