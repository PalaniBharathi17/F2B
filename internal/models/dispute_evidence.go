package models

import "time"

type DisputeEvidence struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	OrderID     uint      `gorm:"not null;index" json:"order_id"`
	UploadedBy  uint      `gorm:"not null;index" json:"uploaded_by"`
	Uploader    User      `gorm:"foreignKey:UploadedBy" json:"uploader,omitempty"`
	EvidenceURL string    `json:"evidence_url"`
	Note        string    `gorm:"type:text" json:"note"`
	CreatedAt   time.Time `json:"created_at"`
}
