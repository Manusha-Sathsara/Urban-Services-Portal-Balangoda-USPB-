package schoolrewards

import (
	"database/sql"
	"fmt"
	"math"
	"strings"

	"github.com/jmoiron/sqlx"
)

// SchoolRepository defines data access methods for School entities
type SchoolRepository interface {
	Create(school *School) error
	GetAll(filter SchoolListFilter) ([]School, int, error)
	GetByID(id int) (*School, error)
	GetByCode(code string) (*School, error)
	GetStats() (*SchoolStats, error)
	Update(school *School) error
	UpdateStatus(id int, status SchoolStatus) error
	HasAssociatedHistory(id int) (bool, error)
	Delete(id int) error
}

type schoolRepository struct {
	db *sqlx.DB
}

// NewSchoolRepository creates a new instance of SchoolRepository
func NewSchoolRepository(db *sqlx.DB) SchoolRepository {
	return &schoolRepository{db: db}
}

func (r *schoolRepository) Create(school *School) error {
	query := `
		INSERT INTO schools (school_name, school_code, address, contact_number, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(
		query,
		school.SchoolName,
		school.SchoolCode,
		school.Address,
		school.ContactNumber,
		school.Status,
	).Scan(&school.ID, &school.CreatedAt, &school.UpdatedAt)
}

func (r *schoolRepository) GetAll(filter SchoolListFilter) ([]School, int, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	if strings.TrimSpace(filter.Search) != "" {
		searchTerm := "%" + strings.ToLower(strings.TrimSpace(filter.Search)) + "%"
		conditions = append(conditions, fmt.Sprintf("(LOWER(school_name) LIKE $%d OR LOWER(school_code) LIKE $%d OR LOWER(address) LIKE $%d)", argIdx, argIdx, argIdx))
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

	// 1. Get total count for pagination
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM schools %s", whereClause)
	var totalCount int
	if err := r.db.Get(&totalCount, countQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("failed to count schools: %w", err)
	}

	// 2. Fetch paginated records
	limit := filter.Limit
	if limit <= 0 {
		limit = 10
	}
	offset := (filter.Page - 1) * limit
	if offset < 0 {
		offset = 0
	}

	dataQuery := fmt.Sprintf(`
		SELECT id, school_name, school_code, address, contact_number, status, created_at, updated_at
		FROM schools
		%s
		ORDER BY id DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)

	args = append(args, limit, offset)

	var schools []School
	if err := r.db.Select(&schools, dataQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("failed to fetch schools: %w", err)
	}

	if schools == nil {
		schools = []School{}
	}

	return schools, totalCount, nil
}

func (r *schoolRepository) GetByID(id int) (*School, error) {
	var school School
	query := `
		SELECT id, school_name, school_code, address, contact_number, status, created_at, updated_at
		FROM schools
		WHERE id = $1
	`
	err := r.db.Get(&school, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get school by id: %w", err)
	}
	return &school, nil
}

func (r *schoolRepository) GetByCode(code string) (*School, error) {
	var school School
	query := `
		SELECT id, school_name, school_code, address, contact_number, status, created_at, updated_at
		FROM schools
		WHERE LOWER(school_code) = LOWER($1)
	`
	err := r.db.Get(&school, query, code)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get school by code: %w", err)
	}
	return &school, nil
}

func (r *schoolRepository) GetStats() (*SchoolStats, error) {
	query := `
		SELECT 
			COUNT(*) AS total_registered,
			COALESCE(COUNT(CASE WHEN status = 'active' THEN 1 END), 0) AS active_schools,
			COALESCE(COUNT(CASE WHEN status = 'inactive' THEN 1 END), 0) AS inactive_schools
		FROM schools
	`
	var stats struct {
		TotalRegistered int `db:"total_registered"`
		ActiveSchools   int `db:"active_schools"`
		InactiveSchools int `db:"inactive_schools"`
	}

	if err := r.db.Get(&stats, query); err != nil {
		return nil, fmt.Errorf("failed to retrieve school statistics: %w", err)
	}

	var coverage float64
	if stats.TotalRegistered > 0 {
		coverage = math.Round((float64(stats.ActiveSchools)/float64(stats.TotalRegistered))*1000) / 10
	}

	return &SchoolStats{
		TotalRegistered: stats.TotalRegistered,
		ActiveSchools:   stats.ActiveSchools,
		InactiveSchools: stats.InactiveSchools,
		ProgramCoverage: coverage,
	}, nil
}

func (r *schoolRepository) Update(school *School) error {
	query := `
		UPDATE schools
		SET school_name = $1, school_code = $2, address = $3, contact_number = $4, status = $5, updated_at = NOW()
		WHERE id = $6
		RETURNING updated_at
	`
	err := r.db.QueryRow(
		query,
		school.SchoolName,
		school.SchoolCode,
		school.Address,
		school.ContactNumber,
		school.Status,
		school.ID,
	).Scan(&school.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to update school: %w", err)
	}
	return nil
}

func (r *schoolRepository) UpdateStatus(id int, status SchoolStatus) error {
	query := `
		UPDATE schools
		SET status = $1, updated_at = NOW()
		WHERE id = $2
	`
	res, err := r.db.Exec(query, status, id)
	if err != nil {
		return fmt.Errorf("failed to update school status: %w", err)
	}
	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *schoolRepository) HasAssociatedHistory(id int) (bool, error) {
	// Check if this school has associated teachers in users table
	var teacherCount int
	err := r.db.Get(&teacherCount, "SELECT COUNT(*) FROM users WHERE school_id = $1", id)
	if err == nil && teacherCount > 0 {
		return true, nil
	}

	// Check if this school has associated rewards records
	var rewardCount int
	err = r.db.Get(&rewardCount, `
		SELECT COUNT(*) FROM school_rewards 
		WHERE school_name IN (SELECT school_name FROM schools WHERE id = $1)
	`, id)
	if err == nil && rewardCount > 0 {
		return true, nil
	}

	return false, nil
}

func (r *schoolRepository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM schools WHERE id = $1", id)
	return err
}
