package schoolrewards

import "time"

// CategoryStatus represents the operational status of a waste category
type CategoryStatus string

const (
	CategoryStatusActive   CategoryStatus = "active"
	CategoryStatusInactive CategoryStatus = "inactive"
)

// WasteCategory maps to the database garbage_categories table
type WasteCategory struct {
	ID                   int            `db:"id" json:"id"`
	Name                 string         `db:"name" json:"name"`
	Description          string         `db:"description" json:"description"`
	MeasurementUnit      string         `db:"measurement_unit" json:"measurement_unit"`
	CurrentPointsPerUnit float64        `db:"current_points_per_unit" json:"current_points_per_unit"`
	Status               CategoryStatus `db:"status" json:"status"`
	CreatedAt            time.Time      `db:"created_at" json:"created_at"`
	UpdatedAt            time.Time      `db:"updated_at" json:"updated_at"`
	TotalCollections     int            `db:"total_collections" json:"total_collections,omitempty"`
}

// CategoryRateHistory records point rate revisions across time
type CategoryRateHistory struct {
	ID             int        `db:"id" json:"id"`
	CategoryID     int        `db:"category_id" json:"category_id"`
	PointsPerUnit  float64    `db:"points_per_unit" json:"points_per_unit"`
	EffectiveFrom  time.Time  `db:"effective_from" json:"effective_from"`
	EffectiveTo    *time.Time `db:"effective_to" json:"effective_to"`
	Reason         string     `db:"reason" json:"reason"`
	ChangedBy      string     `db:"changed_by" json:"changed_by"`
	CreatedAt      time.Time  `db:"created_at" json:"created_at"`
}

// CreateCategoryRequest contains payload fields for creating a new waste category
type CreateCategoryRequest struct {
	Name            string  `json:"name"`
	Description     string  `json:"description"`
	MeasurementUnit string  `json:"measurement_unit"`
	PointsPerUnit   float64 `json:"points_per_unit"`
	Status          string  `json:"status"` // optional, default "active"
}

// UpdateCategoryRequest contains fields for updating non-rate metadata
type UpdateCategoryRequest struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	MeasurementUnit string `json:"measurement_unit"`
	Status          string `json:"status"`
}

// UpdateRateRequest is used when an authorized supervisor revises the point rate
type UpdateRateRequest struct {
	PointsPerUnit float64 `json:"points_per_unit"`
	Reason        string  `json:"reason"`
}

// UpdateCategoryStatusRequest is used to activate or deactivate a category
type UpdateCategoryStatusRequest struct {
	Status string `json:"status"` // "active" or "inactive"
}

// CategoryListFilter supports search, status filtering, sorting, and pagination
type CategoryListFilter struct {
	Search    string
	Status    string
	Page      int
	Limit     int
	SortField string
	SortOrder string
}

// CategoryListResult returns paginated category rows with metadata
type CategoryListResult struct {
	Categories []WasteCategory `json:"categories"`
	TotalCount int             `json:"total_count"`
	Page       int             `json:"page"`
	Limit      int             `json:"limit"`
	TotalPages int             `json:"total_pages"`
}

// CategoryStats aggregates municipal category metrics
type CategoryStats struct {
	TotalCategories    int     `db:"total_categories" json:"total_categories"`
	ActiveCategories   int     `db:"active_categories" json:"active_categories"`
	InactiveCategories int     `db:"inactive_categories" json:"inactive_categories"`
	AverageRate        float64 `db:"average_rate" json:"average_rate"`
}
