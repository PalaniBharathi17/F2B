package models

import "time"

type OrderMessage struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	OrderID    uint      `gorm:"not null;index" json:"order_id"`
	SenderID   uint      `gorm:"not null;index" json:"sender_id"`
	Sender     User      `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
	SenderRole string    `gorm:"not null" json:"sender_role"`
	Message    string    `gorm:"type:text;not null" json:"message"`
	CreatedAt  time.Time `json:"created_at"`
}
