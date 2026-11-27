package schoolrewards

import (
	"math"
	"time"
)

const (
	RedemptionPointsCost = 1000.00
	RedemptionPayoutLKR  = 1000.00
)

type ActorContext struct {
	UserID   int
	Role     string
	SchoolID *int
}

type SchoolStudent struct {
	ID                    int       `db:"id" json:"id"`
	SchoolID              int       `db:"school_id" json:"school_id"`
	MembershipNo          string    `db:"membership_no" json:"membership_no"`
	FullName              string    `db:"full_name" json:"full_name"`
	NameWithInitials      string    `db:"name_with_initials" json:"name_with_initials"`
	Grade                 string    `db:"grade" json:"grade"`
	ClassName             string    `db:"class_name" json:"class_name"`
	DateOfBirth           *string   `db:"date_of_birth" json:"date_of_birth,omitempty"`
	Address               string    `db:"address" json:"address"`
	GuardianName          string    `db:"guardian_name" json:"guardian_name"`
	GuardianPhone         string    `db:"guardian_phone" json:"guardian_phone"`
	IsActive              bool      `db:"is_active" json:"is_active"`
	CachedAvailablePoints float64   `db:"cached_available_points" json:"available_points"`
	LifetimeEarnedPoints  float64   `db:"lifetime_earned_points" json:"lifetime_earned_points"`
	CompletedCards        int       `json:"completed_cards"`
	RedeemedCards         int       `db:"redeemed_cards" json:"redeemed_cards"`
	CreatedBy             int       `db:"created_by" json:"created_by"`
	CreatedAt             time.Time `db:"created_at" json:"created_at"`
	UpdatedAt             time.Time `db:"updated_at" json:"updated_at"`
}

// ComputeCardEligibility sets CompletedCards based on 1,000-point Sampath Kendraya card threshold.
func (s *SchoolStudent) ComputeCardEligibility() {
	if s.CachedAvailablePoints >= RedemptionPointsCost {
		s.CompletedCards = int(math.Floor(s.CachedAvailablePoints / RedemptionPointsCost))
	} else {
		s.CompletedCards = 0
	}
}

type CreateStudentRequest struct {
	SchoolID         *int    `json:"school_id,omitempty"` // ignored for TEACHER; derived from session
	MembershipNo     string  `json:"membership_no"`
	FullName         string  `json:"full_name"`
	NameWithInitials string  `json:"name_with_initials"`
	Grade            string  `json:"grade"`
	ClassName        string  `json:"class_name"`
	DateOfBirth      *string `json:"date_of_birth,omitempty"`
	Address          string  `json:"address"`
	GuardianName     string  `json:"guardian_name"`
	GuardianPhone    string  `json:"guardian_phone"`
}

type UpdateStudentRequest struct {
	FullName         *string `json:"full_name"`
	NameWithInitials *string `json:"name_with_initials"`
	Grade            *string `json:"grade"`
	ClassName        *string `json:"class_name"`
	Address          *string `json:"address"`
	GuardianName     *string `json:"guardian_name"`
	GuardianPhone    *string `json:"guardian_phone"`
	IsActive         *bool   `json:"is_active"`
}

type WasteCollectionItemInput struct {
	CategoryID      int     `json:"category_id"`
	CategoryName    string  `json:"category_name"`
	MeasurementUnit string  `json:"measurement_unit"`
	Quantity        float64 `json:"quantity"`
	RateSnapshot    float64 `json:"rate_snapshot"`
}

type RecordCollectionRequest struct {
	StudentID      int                        `json:"student_id"`
	CollectionDate string                     `json:"collection_date"`
	IdempotencyKey string                     `json:"idempotency_key"`
	Notes          string                     `json:"notes"`
	Items          []WasteCollectionItemInput `json:"items"`
}

type WasteCollectionItem struct {
	ID              int     `db:"id" json:"id"`
	CollectionID    int     `db:"collection_id" json:"collection_id"`
	CategoryID      int     `db:"category_id" json:"category_id"`
	CategoryName    string  `db:"category_name" json:"category_name"`
	MeasurementUnit string  `db:"measurement_unit" json:"measurement_unit"`
	Quantity        float64 `db:"quantity" json:"quantity"`
	RateSnapshot    float64 `db:"rate_snapshot" json:"rate_snapshot"`
	PointsEarned    float64 `db:"points_earned" json:"points_earned"`
}

type WasteCollection struct {
	ID             int                   `db:"id" json:"id"`
	SchoolID       int                   `db:"school_id" json:"school_id"`
	StudentID      int                   `db:"student_id" json:"student_id"`
	StudentName    string                `db:"student_name" json:"student_name,omitempty"`
	RecordedBy     int                   `db:"recorded_by" json:"recorded_by"`
	CollectionDate string                `db:"collection_date" json:"collection_date"`
	TotalPoints    float64               `db:"total_points" json:"total_points"`
	IdempotencyKey string                `db:"idempotency_key" json:"idempotency_key"`
	Notes          string                `db:"notes" json:"notes"`
	IsReversed     bool                  `db:"is_reversed" json:"is_reversed"`
	ReversalReason string                `db:"reversal_reason" json:"reversal_reason,omitempty"`
	CreatedAt      time.Time             `db:"created_at" json:"created_at"`
	Items          []WasteCollectionItem `json:"items"`
}

type RecordPayoutRequest struct {
	StudentID       int    `json:"student_id"`
	PhysicalCardRef string `json:"physical_card_ref"`
	ReceiptNo       string `json:"receipt_no"`
	IdempotencyKey  string `json:"idempotency_key"`
}

type ReverseRequest struct {
	Reason string `json:"reason"`
}

type RewardPayout struct {
	ID              int        `db:"id" json:"id"`
	SchoolID        int        `db:"school_id" json:"school_id"`
	StudentID       int        `db:"student_id" json:"student_id"`
	StudentName     string     `db:"student_name" json:"student_name,omitempty"`
	RecordedBy      int        `db:"recorded_by" json:"recorded_by"`
	PointsDeducted  float64    `db:"points_deducted" json:"points_deducted"`
	AmountLKR       float64    `db:"amount_lkr" json:"amount_lkr"`
	PhysicalCardRef string     `db:"physical_card_ref" json:"physical_card_ref"`
	ReceiptNo       string     `db:"receipt_no" json:"receipt_no"`
	IdempotencyKey  string     `db:"idempotency_key" json:"idempotency_key"`
	Status          string     `db:"status" json:"status"`
	ReversedBy      *int       `db:"reversed_by" json:"reversed_by,omitempty"`
	ReversalReason  string     `db:"reversal_reason" json:"reversal_reason,omitempty"`
	ReversedAt      *time.Time `db:"reversed_at" json:"reversed_at,omitempty"`
	PaidAt          time.Time  `db:"paid_at" json:"paid_at"`
}

type PointTransaction struct {
	ID             int64     `db:"id" json:"id"`
	SchoolID       int       `db:"school_id" json:"school_id"`
	StudentID      int       `db:"student_id" json:"student_id"`
	TxType         string    `db:"tx_type" json:"tx_type"`
	PointsDelta    float64   `db:"points_delta" json:"points_delta"`
	ReferenceType  string    `db:"reference_type" json:"reference_type"`
	ReferenceID    int       `db:"reference_id" json:"reference_id"`
	IdempotencyKey string    `db:"idempotency_key" json:"idempotency_key"`
	Note           string    `db:"note" json:"note"`
	CreatedBy      int       `db:"created_by" json:"created_by"`
	CreatedAt      time.Time `db:"created_at" json:"created_at"`
}

type SchoolDashboardSummary struct {
	TotalStudents      int     `json:"total_students"`
	ActiveStudents     int     `json:"active_students"`
	EligibleStudents   int     `json:"eligible_students"`
	TotalAvailablePts  float64 `json:"total_available_points"`
	TotalPayoutsLKR    float64 `json:"total_payouts_lkr"`
	TotalCollections   int     `json:"total_collections"`
}
