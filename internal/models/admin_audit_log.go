package models

import "time"

type AdminAuditLog struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	AdminID     uint      `gorm:"not null;index" json:"admin_id"`
	TargetType  string    `gorm:"index" json:"target_type"`
	TargetID    uint      `gorm:"index" json:"target_id"`
	Action      string    `gorm:"index" json:"action"`
	Note        string    `json:"note"`
	CreatedAt   time.Time `json:"created_at"`
}
