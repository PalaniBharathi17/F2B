package models

import "time"

type OrderStatusLog struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	OrderID    uint      `gorm:"not null;index" json:"order_id"`
	Order      Order     `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	ActorID    uint      `gorm:"not null;index" json:"actor_id"`
	FromStatus string    `gorm:"not null" json:"from_status"`
	ToStatus   string    `gorm:"not null" json:"to_status"`
	Reason     string    `json:"reason"`
	Category   string    `gorm:"index" json:"category"`
	Note       string    `json:"note"`
	CreatedAt  time.Time `gorm:"index" json:"created_at"`
}
