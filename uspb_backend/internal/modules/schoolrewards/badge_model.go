package schoolrewards

import "time"

// BadgeStatus represents the operational status of a badge definition
type BadgeStatus string

const (
	BadgeStatusActive   BadgeStatus = "active"
	BadgeStatusInactive BadgeStatus = "inactive"
)

// EligibilityMetric defines which points metric is evaluated for badge qualification
type EligibilityMetric string

const (
	MetricLifetimeEarned  EligibilityMetric = "lifetime_earned"
	MetricAvailablePoints EligibilityMetric = "available_points"
)

// BadgeDefinition represents a configured municipal eco-badge
type BadgeDefinition struct {
	ID                 int               `db:"id" json:"id"`
	Name               string            `db:"name" json:"name"`
	Description        string            `db:"description" json:"description"`
	IconName           string            `db:"icon_name" json:"icon_name"`
	MilestoneThreshold float64           `db:"milestone_threshold" json:"milestone_threshold"`
	EligibilityMetric  EligibilityMetric `db:"eligibility_metric" json:"eligibility_metric"`
	Status             BadgeStatus       `db:"status" json:"status"`
	CreatedAt          time.Time         `db:"created_at" json:"created_at"`
	UpdatedAt          time.Time         `db:"updated_at" json:"updated_at"`
	AwardCount         int               `db:"award_count" json:"award_count"`
}

// BadgeThresholdHistory preserves historical threshold and metric revisions for audit integrity
type BadgeThresholdHistory struct {
	ID                 int               `db:"id" json:"id"`
	BadgeID            int               `db:"badge_id" json:"badge_id"`
	MilestoneThreshold float64           `db:"milestone_threshold" json:"milestone_threshold"`
	EligibilityMetric  EligibilityMetric `db:"eligibility_metric" json:"eligibility_metric"`
	EffectiveFrom      time.Time         `db:"effective_from" json:"effective_from"`
	EffectiveTo        *time.Time        `db:"effective_to" json:"effective_to"`
	Reason             string            `db:"reason" json:"reason"`
	ChangedBy          string            `db:"changed_by" json:"changed_by"`
	CreatedAt          time.Time         `db:"created_at" json:"created_at"`
}

// Student represents an enrolled pupil participating in municipal school recycling
type Student struct {
	ID                int       `db:"id" json:"id"`
	SchoolID          int       `db:"school_id" json:"school_id"`
	SchoolName        string    `db:"school_name" json:"school_name,omitempty"`
	StudentIdentifier string    `db:"student_identifier" json:"student_identifier"`
	FirstName         string    `db:"first_name" json:"first_name"`
	LastName          string    `db:"last_name" json:"last_name"`
	Grade             string    `db:"grade" json:"grade"`
	Status            string    `db:"status" json:"status"`
	CreatedAt         time.Time `db:"created_at" json:"created_at"`
	UpdatedAt         time.Time `db:"updated_at" json:"updated_at"`
}

// FullName returns the student's combined name
func (s *Student) FullName() string {
	if s.LastName == "" {
		return s.FirstName
	}
	return s.FirstName + " " + s.LastName
}

// StudentPoints represents authoritative points balances retrieved from the points ledger
type StudentPoints struct {
	StudentID       int     `json:"student_id"`
	LifetimeEarned  float64 `json:"lifetime_earned"`
	AvailablePoints float64 `json:"available_points"`
}

// StudentEligibility represents calculated eligibility of a student against a specific badge
type StudentEligibility struct {
	StudentID          int               `json:"student_id"`
	StudentIdentifier  string            `json:"student_identifier"`
	StudentName        string            `json:"student_name"`
	SchoolID           int               `json:"school_id"`
	SchoolName         string            `json:"school_name"`
	Grade              string            `json:"grade"`
	BadgeID            int               `json:"badge_id"`
	BadgeName          string            `json:"badge_name"`
	BadgeIcon          string            `json:"badge_icon"`
	MilestoneThreshold float64           `json:"milestone_threshold"`
	EligibilityMetric  EligibilityMetric `json:"eligibility_metric"`
	QualifyingPoints   float64           `json:"qualifying_points"`
	IsEligible         bool              `json:"is_eligible"`
	IsAwarded          bool              `json:"is_awarded"`
	AwardReference     *string           `json:"award_reference,omitempty"`
	AwardDate          *string           `json:"award_date,omitempty"`
}

// StudentBadgeAward represents a recorded, immutable badge bestowal
type StudentBadgeAward struct {
	ID                int       `db:"id" json:"id"`
	AwardReference    string    `db:"award_reference" json:"award_reference"`
	StudentID         int       `db:"student_id" json:"student_id"`
	StudentName       string    `db:"student_name" json:"student_name"`
	StudentIdentifier string    `db:"student_identifier" json:"student_identifier"`
	SchoolID          int       `db:"school_id" json:"school_id"`
	SchoolName        string    `db:"school_name" json:"school_name"`
	Grade             string    `db:"grade" json:"grade"`
	BadgeID           int       `db:"badge_id" json:"badge_id"`
	BadgeName         string    `db:"badge_name" json:"badge_name"`
	BadgeIcon         string    `db:"badge_icon" json:"badge_icon"`
	QualifyingPoints  float64   `db:"qualifying_points" json:"qualifying_points"`
	ThresholdAtAward  float64   `db:"threshold_at_award" json:"threshold_at_award"`
	AwardDate         string    `db:"award_date" json:"award_date"`
	AwardedBy         string    `db:"awarded_by" json:"awarded_by"`
	Notes             string    `db:"notes" json:"notes"`
	Status            string    `db:"status" json:"status"`
	CreatedAt         time.Time `db:"created_at" json:"created_at"`
	UpdatedAt         time.Time `db:"updated_at" json:"updated_at"`
}

// BadgeStats aggregates municipal badge programme indicators
type BadgeStats struct {
	TotalBadges    int `db:"total_badges" json:"total_badges"`
	ActiveBadges   int `db:"active_badges" json:"active_badges"`
	InactiveBadges int `db:"inactive_badges" json:"inactive_badges"`
	TotalAwards    int `db:"total_awards" json:"total_awards"`
}

// CreateBadgeRequest contains payload fields for creating a new badge
type CreateBadgeRequest struct {
	Name               string  `json:"name"`
	Description        string  `json:"description"`
	IconName           string  `json:"icon_name"`
	MilestoneThreshold float64 `json:"milestone_threshold"`
	EligibilityMetric  string  `json:"eligibility_metric"` // "lifetime_earned" or "available_points"
	Status             string  `json:"status"`             // optional, default "active"
}

// UpdateBadgeRequest contains fields for updating non-threshold metadata
type UpdateBadgeRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	IconName    string `json:"icon_name"`
	Status      string `json:"status"`
}

// UpdateThresholdRequest is used when an authorized supervisor revises a milestone threshold
type UpdateThresholdRequest struct {
	MilestoneThreshold float64 `json:"milestone_threshold"`
	EligibilityMetric  string  `json:"eligibility_metric"`
	Reason             string  `json:"reason"`
}

// UpdateBadgeStatusRequest is used to activate or deactivate a badge definition
type UpdateBadgeStatusRequest struct {
	Status string `json:"status"` // "active" or "inactive"
}

// UpdateAwardStatusRequest is used to change the status of an existing badge award (e.g. awarded <-> revoked)
type UpdateAwardStatusRequest struct {
	Status string `json:"status"` // "awarded" or "revoked"
	Reason string `json:"reason"` // Official reason / justification
	Notes  string `json:"notes,omitempty"`
}

// CreateAwardRequest represents the council supervisor's intent to record a badge award
type CreateAwardRequest struct {
	StudentID int    `json:"student_id"`
	BadgeID   int    `json:"badge_id"`
	AwardDate string `json:"award_date"` // YYYY-MM-DD, defaults to current date
	Notes     string `json:"notes"`
}

// BadgeListFilter supports searching and filtering badge definitions
type BadgeListFilter struct {
	Search    string
	Status    string
	Page      int
	Limit     int
	SortField string
	SortOrder string
}

// BadgeListResult returns paginated badge rows with metadata
type BadgeListResult struct {
	Badges     []BadgeDefinition `json:"badges"`
	TotalCount int               `json:"total_count"`
	Page       int               `json:"page"`
	Limit      int               `json:"limit"`
	TotalPages int               `json:"total_pages"`
}

// EligibilityFilter supports searching and filtering eligible student candidates
type EligibilityFilter struct {
	SchoolID      *int   // If non-nil, restricts to specified school (forced for teachers)
	BadgeID       *int   // Optional filter by badge definition
	EligibleOnly  *bool  // If true: only students with points >= threshold
	AwardedStatus string // "all", "awarded", "not_awarded"
	Search        string // Student name or identifier
	Page          int
	Limit         int
}

// EligibilityListResult returns paginated student eligibility records
type EligibilityListResult struct {
	Records    []StudentEligibility `json:"records"`
	TotalCount int                  `json:"total_count"`
	Page       int                  `json:"page"`
	Limit      int                  `json:"limit"`
	TotalPages int                  `json:"total_pages"`
}

// AwardListFilter supports searching and filtering recorded badge awards
type AwardListFilter struct {
	SchoolID  *int   // Forced for teachers
	BadgeID   *int   // Optional filter by badge
	Status    string // "all", "awarded", "revoked"
	Search    string // Student name, identifier, or award reference
	StartDate string // YYYY-MM-DD
	EndDate   string // YYYY-MM-DD
	Page      int
	Limit     int
}

// AwardListResult returns paginated awards with metadata
type AwardListResult struct {
	Awards     []StudentBadgeAward `json:"awards"`
	TotalCount int                 `json:"total_count"`
	Page       int                 `json:"page"`
	Limit      int                 `json:"limit"`
	TotalPages int                 `json:"total_pages"`
}
