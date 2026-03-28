package models

import "time"

type VerificationDocument struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	UserID        uint       `gorm:"not null;index" json:"user_id"`
	User          User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	DocumentType  string     `json:"document_type"`
	DocumentURL   string     `json:"document_url"`
	Status        string     `gorm:"default:'pending';index" json:"status"`
	ReviewNote    string     `json:"review_note"`
	ReviewedBy    *uint      `json:"reviewed_by"`
	ReviewedAt    *time.Time `json:"reviewed_at"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}
