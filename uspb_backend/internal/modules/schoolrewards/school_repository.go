package schoolrewards

import (
	"context"
	"database/sql"
	"fmt"
	"math"
	"strings"

	"github.com/BalangodaUC/uspb_backend/pkg/database"
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

func (r *schoolRepository) supervisorRLS() database.RLSContext {
	return database.RLSContext{Role: "GARBAGE_SUPERVISOR"}
}

const schoolSelectCols = `
	id,
	name AS school_name,
	code AS school_code,
	address,
	contact_number,
	CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status,
	created_at,
	updated_at
`

func (r *schoolRepository) Create(school *School) error {
	isActive := school.Status != SchoolStatusInactive
	return database.WithRLS(context.Background(), r.db, r.supervisorRLS(), func(tx *sqlx.Tx) error {
		query := `
			INSERT INTO schools (name, code, address, contact_number, is_active, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
			RETURNING id, created_at, updated_at
		`
		return tx.QueryRow(
			query,
			school.SchoolName,
			school.SchoolCode,
			school.Address,
			school.ContactNumber,
			isActive,
		).Scan(&school.ID, &school.CreatedAt, &school.UpdatedAt)
	})
}

func (r *schoolRepository) GetAll(filter SchoolListFilter) ([]School, int, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	if strings.TrimSpace(filter.Search) != "" {
		searchTerm := "%" + strings.ToLower(strings.TrimSpace(filter.Search)) + "%"
		conditions = append(conditions, fmt.Sprintf("(LOWER(name) LIKE $%d OR LOWER(code) LIKE $%d OR LOWER(address) LIKE $%d)", argIdx, argIdx, argIdx))
		args = append(args, searchTerm)
		argIdx++
	}

	if filter.Status == "active" {
		conditions = append(conditions, "is_active = TRUE")
	} else if filter.Status == "inactive" {
		conditions = append(conditions, "is_active = FALSE")
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	var totalCount int
	var schools []School

	err := database.WithRLS(context.Background(), r.db, r.supervisorRLS(), func(tx *sqlx.Tx) error {
		countQuery := fmt.Sprintf("SELECT COUNT(*) FROM schools %s", whereClause)
		if err := tx.Get(&totalCount, countQuery, args...); err != nil {
			return fmt.Errorf("failed to count schools: %w", err)
		}

		limit := filter.Limit
		if limit <= 0 {
			limit = 10
		}
		offset := (filter.Page - 1) * limit
		if offset < 0 {
			offset = 0
		}

		dataQuery := fmt.Sprintf(`
			SELECT %s
			FROM schools
			%s
			ORDER BY id DESC
			LIMIT $%d OFFSET $%d
		`, schoolSelectCols, whereClause, argIdx, argIdx+1)

		queryArgs := append(append([]interface{}{}, args...), limit, offset)
		return tx.Select(&schools, dataQuery, queryArgs...)
	})
	if err != nil {
		return nil, 0, err
	}
	if schools == nil {
		schools = []School{}
	}
	return schools, totalCount, nil
}

func (r *schoolRepository) GetByID(id int) (*School, error) {
	var school School
	err := database.WithRLS(context.Background(), r.db, r.supervisorRLS(), func(tx *sqlx.Tx) error {
		query := fmt.Sprintf(`SELECT %s FROM schools WHERE id = $1`, schoolSelectCols)
		return tx.Get(&school, query, id)
	})
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
	err := database.WithRLS(context.Background(), r.db, r.supervisorRLS(), func(tx *sqlx.Tx) error {
		query := fmt.Sprintf(`SELECT %s FROM schools WHERE LOWER(code) = LOWER($1)`, schoolSelectCols)
		return tx.Get(&school, query, code)
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get school by code: %w", err)
	}
	return &school, nil
}

func (r *schoolRepository) GetStats() (*SchoolStats, error) {
	var stats struct {
		TotalRegistered int `db:"total_registered"`
		ActiveSchools   int `db:"active_schools"`
		InactiveSchools int `db:"inactive_schools"`
	}

	err := database.WithRLS(context.Background(), r.db, r.supervisorRLS(), func(tx *sqlx.Tx) error {
		return tx.Get(&stats, `
			SELECT 
				COUNT(*) AS total_registered,
				COALESCE(COUNT(CASE WHEN is_active THEN 1 END), 0) AS active_schools,
				COALESCE(COUNT(CASE WHEN NOT is_active THEN 1 END), 0) AS inactive_schools
			FROM schools
		`)
	})
	if err != nil {
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
	isActive := school.Status != SchoolStatusInactive
	return database.WithRLS(context.Background(), r.db, r.supervisorRLS(), func(tx *sqlx.Tx) error {
		query := `
			UPDATE schools
			SET name = $1, code = $2, address = $3, contact_number = $4, is_active = $5, updated_at = NOW()
			WHERE id = $6
			RETURNING updated_at
		`
		return tx.QueryRow(
			query,
			school.SchoolName,
			school.SchoolCode,
			school.Address,
			school.ContactNumber,
			isActive,
			school.ID,
		).Scan(&school.UpdatedAt)
	})
}

func (r *schoolRepository) UpdateStatus(id int, status SchoolStatus) error {
	isActive := status != SchoolStatusInactive
	return database.WithRLS(context.Background(), r.db, r.supervisorRLS(), func(tx *sqlx.Tx) error {
		res, err := tx.Exec(`UPDATE schools SET is_active = $1, updated_at = NOW() WHERE id = $2`, isActive, id)
		if err != nil {
			return fmt.Errorf("failed to update school status: %w", err)
		}
		if rows, _ := res.RowsAffected(); rows == 0 {
			return sql.ErrNoRows
		}
		return nil
	})
}

func (r *schoolRepository) HasAssociatedHistory(id int) (bool, error) {
	var count int
	err := database.WithRLS(context.Background(), r.db, r.supervisorRLS(), func(tx *sqlx.Tx) error {
		if err := tx.Get(&count, "SELECT COUNT(*) FROM students WHERE school_id = $1", id); err == nil && count > 0 {
			return nil
		}
		return tx.Get(&count, "SELECT COUNT(*) FROM users WHERE school_id = $1", id)
	})
	return count > 0, err
}

func (r *schoolRepository) Delete(id int) error {
	return database.WithRLS(context.Background(), r.db, r.supervisorRLS(), func(tx *sqlx.Tx) error {
		_, err := tx.Exec("DELETE FROM schools WHERE id = $1", id)
		return err
	})
}
