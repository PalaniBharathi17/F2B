package models

import (
	"time"

	"gorm.io/gorm"
)

type Order struct {
	ID                   uint            `gorm:"primaryKey" json:"id"`
	ProductID            uint            `gorm:"not null" json:"product_id"`
	Product              Product         `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	BuyerID              uint            `gorm:"not null" json:"buyer_id"`
	Buyer                User            `gorm:"foreignKey:BuyerID" json:"buyer,omitempty"`
	FarmerID             uint            `gorm:"not null" json:"farmer_id"`
	Farmer               User            `gorm:"foreignKey:FarmerID" json:"farmer,omitempty"`
	Quantity             float64         `gorm:"not null" json:"quantity"`
	TotalPrice           float64         `gorm:"not null" json:"total_price"`
	OrderType            string          `gorm:"default:'standard';index" json:"order_type"`
	BuyerNote            string          `json:"buyer_note"`
	PaymentMethod        string          `gorm:"default:'cod';index" json:"payment_method"`
	PaymentReference     string          `json:"payment_reference"`
	PaymentStatus        string          `gorm:"default:'pending';index" json:"payment_status"`
	ExpiresAt            *time.Time      `json:"expires_at"`
	PreferredDate        *time.Time      `json:"preferred_date"`
	SourceRequestID      *uint           `json:"source_request_id"`
	SourceHarvestRequest *HarvestRequest `gorm:"foreignKey:SourceRequestID" json:"source_harvest_request,omitempty"`
	Status               string          `gorm:"default:'pending'" json:"status"` // pending/confirmed/packed/out_for_delivery/completed/cancelled
	DeliveryAddress      string          `json:"delivery_address"`
	DeliveryDate         *time.Time      `json:"delivery_date"`
	DeliverySlot         string          `json:"delivery_slot"`
	CancellationReason   string          `json:"cancellation_reason"`
	CancellationType     string          `json:"cancellation_type"`
	CancellationNote     string          `json:"cancellation_note"`
	DisputeStatus        string          `gorm:"default:'none';index" json:"dispute_status"` // none/open/resolved/rejected
	DisputeNote          string          `json:"dispute_note"`
	AdminReviewStatus    string          `gorm:"default:'open';index" json:"admin_review_status"`
	AdminReviewNote      string          `json:"admin_review_note"`
	AdminReviewedBy      *uint           `json:"admin_reviewed_by"`
	AdminReviewedAt      *time.Time      `json:"admin_reviewed_at"`
	ConfirmedAt          *time.Time      `json:"confirmed_at"`
	PackedAt             *time.Time      `json:"packed_at"`
	OutForDeliveryAt     *time.Time      `json:"out_for_delivery_at"`
	CompletedAt          *time.Time      `json:"completed_at"`
	CancelledAt          *time.Time      `json:"cancelled_at"`
	CreatedAt            time.Time       `json:"created_at"`
	UpdatedAt            time.Time       `json:"updated_at"`
	DeletedAt            gorm.DeletedAt  `gorm:"index" json:"-"`

	// Relationships
	Reviews          []Review          `gorm:"foreignKey:OrderID" json:"reviews,omitempty"`
	StatusLogs       []OrderStatusLog  `gorm:"foreignKey:OrderID" json:"status_logs,omitempty"`
	Messages         []OrderMessage    `gorm:"foreignKey:OrderID" json:"messages,omitempty"`
	DisputeEvidences []DisputeEvidence `gorm:"foreignKey:OrderID" json:"dispute_evidences,omitempty"`
}
