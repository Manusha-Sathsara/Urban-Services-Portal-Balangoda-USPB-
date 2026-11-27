package schoolrewards

import (
	"database/sql"
	"fmt"
	"math"
	"strings"

	"github.com/jmoiron/sqlx"
)

// CategoryRepository defines data access methods for Waste Categories and Rate Histories
type CategoryRepository interface {
	Create(category *WasteCategory, initialRate float64, reason, changedBy string) error
	GetAll(filter CategoryListFilter) ([]WasteCategory, int, error)
	GetActive() ([]WasteCategory, error)
	GetByID(id int) (*WasteCategory, error)
	GetByName(name string) (*WasteCategory, error)
	Update(category *WasteCategory) error
	UpdateStatus(id int, status CategoryStatus) error
	UpdateRate(id int, newRate float64, reason, changedBy string) error
	GetRateHistory(categoryID int) ([]CategoryRateHistory, error)
	GetStats() (*CategoryStats, error)
	HasAssociatedCollections(categoryID int) (bool, error)
	Delete(id int) error
}

type categoryRepository struct {
	db *sqlx.DB
}

// NewCategoryRepository creates a new PostgreSQL CategoryRepository instance
func NewCategoryRepository(db *sqlx.DB) CategoryRepository {
	return &categoryRepository{db: db}
}

func (r *categoryRepository) Create(category *WasteCategory, initialRate float64, reason, changedBy string) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// 1. Insert category
	catQuery := `
		INSERT INTO garbage_categories (name, description, measurement_unit, current_points_per_unit, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	err = tx.QueryRow(
		catQuery,
		category.Name,
		category.Description,
		category.MeasurementUnit,
		initialRate,
		category.Status,
	).Scan(&category.ID, &category.CreatedAt, &category.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert category: %w", err)
	}

	category.CurrentPointsPerUnit = initialRate

	if reason == "" {
		reason = "Initial baseline rate creation"
	}
	if changedBy == "" {
		changedBy = "SYSTEM"
	}

	// 2. Insert initial rate history record
	rateQuery := `
		INSERT INTO category_rate_history (category_id, points_per_unit, effective_from, effective_to, reason, changed_by, created_at)
		VALUES ($1, $2, NOW(), NULL, $3, $4, NOW())
	`
	if _, err := tx.Exec(rateQuery, category.ID, initialRate, reason, changedBy); err != nil {
		return fmt.Errorf("failed to insert initial rate history: %w", err)
	}

	return tx.Commit()
}

func (r *categoryRepository) GetAll(filter CategoryListFilter) ([]WasteCategory, int, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	if strings.TrimSpace(filter.Search) != "" {
		searchTerm := "%" + strings.ToLower(strings.TrimSpace(filter.Search)) + "%"
		conditions = append(conditions, fmt.Sprintf("(LOWER(name) LIKE $%d OR LOWER(description) LIKE $%d)", argIdx, argIdx))
		args = append(args, searchTerm)
		argIdx++
	}

	if filter.Status != "" && filter.Status != "all" {
		conditions = append(conditions, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, filter.Status)
		argIdx++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// 1. Get total count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM garbage_categories %s", whereClause)
	var totalCount int
	if err := r.db.Get(&totalCount, countQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("failed to count categories: %w", err)
	}

	// 2. Build sorting order
	orderBy := "id ASC"
	switch strings.ToLower(filter.SortField) {
	case "name":
		if strings.ToLower(filter.SortOrder) == "desc" {
			orderBy = "name DESC"
		} else {
			orderBy = "name ASC"
		}
	case "points", "rate", "current_points_per_unit":
		if strings.ToLower(filter.SortOrder) == "desc" {
			orderBy = "current_points_per_unit DESC"
		} else {
			orderBy = "current_points_per_unit ASC"
		}
	case "status":
		if strings.ToLower(filter.SortOrder) == "desc" {
			orderBy = "status DESC"
		} else {
			orderBy = "status ASC"
		}
	case "unit", "measurement_unit":
		if strings.ToLower(filter.SortOrder) == "desc" {
			orderBy = "measurement_unit DESC"
		} else {
			orderBy = "measurement_unit ASC"
		}
	}

	// 3. Pagination limits
	limit := filter.Limit
	if limit <= 0 {
		limit = 10
	}
	offset := (filter.Page - 1) * limit
	if offset < 0 {
		offset = 0
	}

	dataQuery := fmt.Sprintf(`
		SELECT id, name, description, measurement_unit, current_points_per_unit, status, created_at, updated_at
		FROM garbage_categories
		%s
		ORDER BY %s
		LIMIT $%d OFFSET $%d
	`, whereClause, orderBy, argIdx, argIdx+1)

	args = append(args, limit, offset)

	var categories []WasteCategory
	if err := r.db.Select(&categories, dataQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("failed to fetch categories: %w", err)
	}

	if categories == nil {
		categories = []WasteCategory{}
	}

	return categories, totalCount, nil
}

func (r *categoryRepository) GetActive() ([]WasteCategory, error) {
	query := `
		SELECT id, name, description, measurement_unit, current_points_per_unit, status, created_at, updated_at
		FROM garbage_categories
		WHERE status = 'active'
		ORDER BY name ASC
	`
	var categories []WasteCategory
	if err := r.db.Select(&categories, query); err != nil {
		return nil, fmt.Errorf("failed to fetch active categories: %w", err)
	}
	if categories == nil {
		categories = []WasteCategory{}
	}
	return categories, nil
}

func (r *categoryRepository) GetByID(id int) (*WasteCategory, error) {
	var cat WasteCategory
	query := `
		SELECT id, name, description, measurement_unit, current_points_per_unit, status, created_at, updated_at
		FROM garbage_categories
		WHERE id = $1
	`
	err := r.db.Get(&cat, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get category by id: %w", err)
	}
	return &cat, nil
}

func (r *categoryRepository) GetByName(name string) (*WasteCategory, error) {
	var cat WasteCategory
	query := `
		SELECT id, name, description, measurement_unit, current_points_per_unit, status, created_at, updated_at
		FROM garbage_categories
		WHERE LOWER(name) = LOWER($1)
	`
	err := r.db.Get(&cat, query, name)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get category by name: %w", err)
	}
	return &cat, nil
}

func (r *categoryRepository) Update(category *WasteCategory) error {
	query := `
		UPDATE garbage_categories
		SET name = $1, description = $2, measurement_unit = $3, status = $4, updated_at = NOW()
		WHERE id = $5
		RETURNING updated_at
	`
	return r.db.QueryRow(
		query,
		category.Name,
		category.Description,
		category.MeasurementUnit,
		category.Status,
		category.ID,
	).Scan(&category.UpdatedAt)
}

func (r *categoryRepository) UpdateStatus(id int, status CategoryStatus) error {
	query := `
		UPDATE garbage_categories
		SET status = $1, updated_at = NOW()
		WHERE id = $2
	`
	res, err := r.db.Exec(query, status, id)
	if err != nil {
		return fmt.Errorf("failed to update category status: %w", err)
	}
	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *categoryRepository) UpdateRate(id int, newRate float64, reason, changedBy string) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return fmt.Errorf("failed to begin transaction for rate update: %w", err)
	}
	defer tx.Rollback()

	// 1. Close current rate history record
	closeQuery := `
		UPDATE category_rate_history
		SET effective_to = NOW()
		WHERE category_id = $1 AND effective_to IS NULL
	`
	if _, err := tx.Exec(closeQuery, id); err != nil {
		return fmt.Errorf("failed to close previous rate history: %w", err)
	}

	// 2. Insert new rate history record
	if reason == "" {
		reason = "Point rate revised by council coordinator"
	}
	if changedBy == "" {
		changedBy = "COUNCIL_SUPERVISOR"
	}

	insertQuery := `
		INSERT INTO category_rate_history (category_id, points_per_unit, effective_from, effective_to, reason, changed_by, created_at)
		VALUES ($1, $2, NOW(), NULL, $3, $4, NOW())
	`
	if _, err := tx.Exec(insertQuery, id, newRate, reason, changedBy); err != nil {
		return fmt.Errorf("failed to insert new rate history record: %w", err)
	}

	// 3. Update category current rate
	updateCatQuery := `
		UPDATE garbage_categories
		SET current_points_per_unit = $1, updated_at = NOW()
		WHERE id = $2
	`
	res, err := tx.Exec(updateCatQuery, newRate, id)
	if err != nil {
		return fmt.Errorf("failed to update category current points rate: %w", err)
	}
	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return tx.Commit()
}

func (r *categoryRepository) GetRateHistory(categoryID int) ([]CategoryRateHistory, error) {
	query := `
		SELECT id, category_id, points_per_unit, effective_from, effective_to, reason, changed_by, created_at
		FROM category_rate_history
		WHERE category_id = $1
		ORDER BY effective_from DESC
	`
	var history []CategoryRateHistory
	if err := r.db.Select(&history, query, categoryID); err != nil {
		return nil, fmt.Errorf("failed to retrieve rate history: %w", err)
	}
	if history == nil {
		history = []CategoryRateHistory{}
	}
	return history, nil
}

func (r *categoryRepository) GetStats() (*CategoryStats, error) {
	query := `
		SELECT 
			COUNT(*) AS total_categories,
			COALESCE(COUNT(CASE WHEN status = 'active' THEN 1 END), 0) AS active_categories,
			COALESCE(COUNT(CASE WHEN status = 'inactive' THEN 1 END), 0) AS inactive_categories,
			COALESCE(AVG(current_points_per_unit), 0) AS average_rate
		FROM garbage_categories
	`
	var stats struct {
		TotalCategories    int     `db:"total_categories"`
		ActiveCategories   int     `db:"active_categories"`
		InactiveCategories int     `db:"inactive_categories"`
		AverageRate        float64 `db:"average_rate"`
	}

	if err := r.db.Get(&stats, query); err != nil {
		return nil, fmt.Errorf("failed to retrieve category statistics: %w", err)
	}

	avg := math.Round(stats.AverageRate*10) / 10

	return &CategoryStats{
		TotalCategories:    stats.TotalCategories,
		ActiveCategories:   stats.ActiveCategories,
		InactiveCategories: stats.InactiveCategories,
		AverageRate:        avg,
	}, nil
}

func (r *categoryRepository) HasAssociatedCollections(categoryID int) (bool, error) {
	// 1. Check if category is used in school_rewards or any future collections table
	var count int
	err := r.db.Get(&count, `
		SELECT COUNT(*) FROM school_rewards 
		WHERE waste_type IN (SELECT name FROM garbage_categories WHERE id = $1)
	`, categoryID)
	if err == nil && count > 0 {
		return true, nil
	}

	return false, nil
}

func (r *categoryRepository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM garbage_categories WHERE id = $1", id)
	return err
}
