package schoolrewards

import "time"

// SchoolStatus represents the operational status of a school
type SchoolStatus string

const (
	SchoolStatusActive   SchoolStatus = "active"
	SchoolStatusInactive SchoolStatus = "inactive"
)

// School maps to the database schools table
type School struct {
	ID            int          `db:"id" json:"id"`
	SchoolName    string       `db:"school_name" json:"school_name"`
	SchoolCode    string       `db:"school_code" json:"school_code"`
	Address       string       `db:"address" json:"address"`
	ContactNumber string       `db:"contact_number" json:"contact_number"`
	Status        SchoolStatus `db:"status" json:"status"`
	CreatedAt     time.Time    `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time    `db:"updated_at" json:"updated_at"`
	StudentCount  *int         `db:"student_count" json:"student_count,omitempty"` // null if student module not yet registered
}

// CreateSchoolRequest contains required and optional fields for adding a new school
type CreateSchoolRequest struct {
	SchoolName    string `json:"school_name"`
	SchoolCode    string `json:"school_code"`
	Address       string `json:"address"`
	ContactNumber string `json:"contact_number"`
	Status        string `json:"status"` // optional, defaults to "active"
}

// UpdateSchoolRequest contains fields that can be modified on an existing school
type UpdateSchoolRequest struct {
	SchoolName    string `json:"school_name"`
	SchoolCode    string `json:"school_code"`
	Address       string `json:"address"`
	ContactNumber string `json:"contact_number"`
	Status        string `json:"status"`
}

// UpdateSchoolStatusRequest contains the new status for activation/deactivation
type UpdateSchoolStatusRequest struct {
	Status string `json:"status"` // "active" or "inactive"
}

// SchoolListFilter supports query parameters for search, filtering, and pagination
type SchoolListFilter struct {
	Search string
	Status string
	Page   int
	Limit  int
}

// SchoolListResult wraps paginated school records with metadata
type SchoolListResult struct {
	Schools    []School `json:"schools"`
	TotalCount int      `json:"total_count"`
	Page       int      `json:"page"`
	Limit      int      `json:"limit"`
	TotalPages int      `json:"total_pages"`
}

// SchoolStats represents municipal program metrics across all schools
type SchoolStats struct {
	TotalRegistered int     `db:"total_registered" json:"total_registered"`
	ActiveSchools   int     `db:"active_schools" json:"active_schools"`
	InactiveSchools int     `db:"inactive_schools" json:"inactive_schools"`
	ProgramCoverage float64 `db:"program_coverage" json:"program_coverage"`
}
