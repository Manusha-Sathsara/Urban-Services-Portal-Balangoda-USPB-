package schoolrewards

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
)

// BadgeRepository defines data access methods for Badges, Eligibility, and Awards
type BadgeRepository interface {
	// Badge Definition operations
	CreateBadge(badge *BadgeDefinition, reason, changedBy string) error
	GetAllBadges(filter BadgeListFilter) ([]BadgeDefinition, int, error)
	GetActiveBadges() ([]BadgeDefinition, error)
	GetBadgeByID(id int) (*BadgeDefinition, error)
	GetBadgeByName(name string) (*BadgeDefinition, error)
	UpdateBadge(badge *BadgeDefinition) error
	UpdateBadgeStatus(id int, status BadgeStatus) error
	UpdateBadgeThreshold(id int, newThreshold float64, metric EligibilityMetric, reason, changedBy string) error
	GetThresholdHistory(badgeID int) ([]BadgeThresholdHistory, error)
	GetBadgeStats() (*BadgeStats, error)

	// Student operations
	GetStudents(schoolID *int, search string) ([]Student, error)
	GetStudentByID(id int) (*Student, error)

	// Award operations
	CreateAward(award *StudentBadgeAward, performedBy string) error
	UpdateAwardStatus(id int, status, notes, performedBy, reason string) (*StudentBadgeAward, error)
	DeleteAward(id int) error
	GetAllAwards(filter AwardListFilter) ([]StudentBadgeAward, int, error)
	GetAwardByID(id int) (*StudentBadgeAward, error)
	GetAwardByStudentAndBadge(studentID, badgeID int) (*StudentBadgeAward, error)
	GetStudentAwards(studentID int) ([]StudentBadgeAward, error)
	GetNextAwardReference() (string, error)
}

type badgeRepository struct {
	db *sqlx.DB
}

// NewBadgeRepository creates a new PostgreSQL BadgeRepository
func NewBadgeRepository(db *sqlx.DB) BadgeRepository {
	return &badgeRepository{db: db}
}

func (r *badgeRepository) CreateBadge(badge *BadgeDefinition, reason, changedBy string) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// 1. Insert badge definition
	query := `
		INSERT INTO badge_definitions (name, description, icon_name, milestone_threshold, eligibility_metric, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	err = tx.QueryRow(
		query,
		badge.Name,
		badge.Description,
		badge.IconName,
		badge.MilestoneThreshold,
		badge.EligibilityMetric,
		badge.Status,
	).Scan(&badge.ID, &badge.CreatedAt, &badge.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert badge definition: %w", err)
	}

	// 2. Insert initial threshold history
	if reason == "" {
		reason = fmt.Sprintf("Initial badge creation with threshold %.1f pts", badge.MilestoneThreshold)
	}
	if changedBy == "" {
		changedBy = "SYSTEM"
	}

	histQuery := `
		INSERT INTO badge_threshold_history (badge_id, milestone_threshold, eligibility_metric, effective_from, effective_to, reason, changed_by, created_at)
		VALUES ($1, $2, $3, NOW(), NULL, $4, $5, NOW())
	`
	if _, err := tx.Exec(histQuery, badge.ID, badge.MilestoneThreshold, badge.EligibilityMetric, reason, changedBy); err != nil {
		return fmt.Errorf("failed to insert initial threshold history: %w", err)
	}

	return tx.Commit()
}

func (r *badgeRepository) GetAllBadges(filter BadgeListFilter) ([]BadgeDefinition, int, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	if strings.TrimSpace(filter.Search) != "" {
		searchTerm := "%" + strings.ToLower(strings.TrimSpace(filter.Search)) + "%"
		conditions = append(conditions, fmt.Sprintf("(LOWER(b.name) LIKE $%d OR LOWER(b.description) LIKE $%d)", argIdx, argIdx))
		args = append(args, searchTerm)
		argIdx++
	}

	if filter.Status != "" && filter.Status != "all" {
		conditions = append(conditions, fmt.Sprintf("b.status = $%d", argIdx))
		args = append(args, filter.Status)
		argIdx++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Total count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM badge_definitions b %s", whereClause)
	var totalCount int
	if err := r.db.Get(&totalCount, countQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("failed to count badges: %w", err)
	}

	// Order by
	orderBy := "b.id ASC"
	switch strings.ToLower(filter.SortField) {
	case "name":
		if strings.ToLower(filter.SortOrder) == "desc" {
			orderBy = "b.name DESC"
		} else {
			orderBy = "b.name ASC"
		}
	case "threshold", "milestone_threshold":
		if strings.ToLower(filter.SortOrder) == "desc" {
			orderBy = "b.milestone_threshold DESC"
		} else {
			orderBy = "b.milestone_threshold ASC"
		}
	case "status":
		if strings.ToLower(filter.SortOrder) == "desc" {
			orderBy = "b.status DESC"
		} else {
			orderBy = "b.status ASC"
		}
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
		SELECT 
			b.id, b.name, b.description, b.icon_name, b.milestone_threshold, b.eligibility_metric, b.status, b.created_at, b.updated_at,
			COALESCE(COUNT(a.id), 0) AS award_count
		FROM badge_definitions b
		LEFT JOIN student_badge_awards a ON b.id = a.badge_id AND a.status = 'awarded'
		%s
		GROUP BY b.id
		ORDER BY %s
		LIMIT $%d OFFSET $%d
	`, whereClause, orderBy, argIdx, argIdx+1)

	args = append(args, limit, offset)

	var badges []BadgeDefinition
	if err := r.db.Select(&badges, dataQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("failed to fetch badges: %w", err)
	}
	if badges == nil {
		badges = []BadgeDefinition{}
	}

	return badges, totalCount, nil
}

func (r *badgeRepository) GetActiveBadges() ([]BadgeDefinition, error) {
	query := `
		SELECT 
			b.id, b.name, b.description, b.icon_name, b.milestone_threshold, b.eligibility_metric, b.status, b.created_at, b.updated_at,
			COALESCE(COUNT(a.id), 0) AS award_count
		FROM badge_definitions b
		LEFT JOIN student_badge_awards a ON b.id = a.badge_id AND a.status = 'awarded'
		WHERE b.status = 'active'
		GROUP BY b.id
		ORDER BY b.milestone_threshold ASC
	`
	var badges []BadgeDefinition
	if err := r.db.Select(&badges, query); err != nil {
		return nil, fmt.Errorf("failed to fetch active badges: %w", err)
	}
	if badges == nil {
		badges = []BadgeDefinition{}
	}
	return badges, nil
}

func (r *badgeRepository) GetBadgeByID(id int) (*BadgeDefinition, error) {
	query := `
		SELECT 
			b.id, b.name, b.description, b.icon_name, b.milestone_threshold, b.eligibility_metric, b.status, b.created_at, b.updated_at,
			COALESCE(COUNT(a.id), 0) AS award_count
		FROM badge_definitions b
		LEFT JOIN student_badge_awards a ON b.id = a.badge_id AND a.status = 'awarded'
		WHERE b.id = $1
		GROUP BY b.id
	`
	var badge BadgeDefinition
	err := r.db.Get(&badge, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get badge by id: %w", err)
	}
	return &badge, nil
}

func (r *badgeRepository) GetBadgeByName(name string) (*BadgeDefinition, error) {
	query := `
		SELECT 
			b.id, b.name, b.description, b.icon_name, b.milestone_threshold, b.eligibility_metric, b.status, b.created_at, b.updated_at,
			COALESCE(COUNT(a.id), 0) AS award_count
		FROM badge_definitions b
		LEFT JOIN student_badge_awards a ON b.id = a.badge_id AND a.status = 'awarded'
		WHERE LOWER(b.name) = LOWER($1)
		GROUP BY b.id
	`
	var badge BadgeDefinition
	err := r.db.Get(&badge, query, name)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get badge by name: %w", err)
	}
	return &badge, nil
}

func (r *badgeRepository) UpdateBadge(badge *BadgeDefinition) error {
	query := `
		UPDATE badge_definitions
		SET name = $1, description = $2, icon_name = $3, status = $4, updated_at = NOW()
		WHERE id = $5
		RETURNING updated_at
	`
	return r.db.QueryRow(
		query,
		badge.Name,
		badge.Description,
		badge.IconName,
		badge.Status,
		badge.ID,
	).Scan(&badge.UpdatedAt)
}

func (r *badgeRepository) UpdateBadgeStatus(id int, status BadgeStatus) error {
	query := `
		UPDATE badge_definitions
		SET status = $1, updated_at = NOW()
		WHERE id = $2
	`
	res, err := r.db.Exec(query, status, id)
	if err != nil {
		return fmt.Errorf("failed to update badge status: %w", err)
	}
	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *badgeRepository) UpdateBadgeThreshold(id int, newThreshold float64, metric EligibilityMetric, reason, changedBy string) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// 1. Close current threshold history record
	closeQuery := `
		UPDATE badge_threshold_history
		SET effective_to = NOW()
		WHERE badge_id = $1 AND effective_to IS NULL
	`
	if _, err := tx.Exec(closeQuery, id); err != nil {
		return fmt.Errorf("failed to close previous threshold history: %w", err)
	}

	// 2. Insert new threshold history record
	if reason == "" {
		reason = "Threshold revised by municipal eco-rewards coordinator"
	}
	if changedBy == "" {
		changedBy = "COUNCIL_SUPERVISOR"
	}

	insertQuery := `
		INSERT INTO badge_threshold_history (badge_id, milestone_threshold, eligibility_metric, effective_from, effective_to, reason, changed_by, created_at)
		VALUES ($1, $2, $3, NOW(), NULL, $4, $5, NOW())
	`
	if _, err := tx.Exec(insertQuery, id, newThreshold, metric, reason, changedBy); err != nil {
		return fmt.Errorf("failed to insert new threshold history record: %w", err)
	}

	// 3. Update current badge definition threshold
	updateBadgeQuery := `
		UPDATE badge_definitions
		SET milestone_threshold = $1, eligibility_metric = $2, updated_at = NOW()
		WHERE id = $3
	`
	res, err := tx.Exec(updateBadgeQuery, newThreshold, metric, id)
	if err != nil {
		return fmt.Errorf("failed to update badge threshold: %w", err)
	}
	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return tx.Commit()
}

func (r *badgeRepository) GetThresholdHistory(badgeID int) ([]BadgeThresholdHistory, error) {
	query := `
		SELECT id, badge_id, milestone_threshold, eligibility_metric, effective_from, effective_to, reason, changed_by, created_at
		FROM badge_threshold_history
		WHERE badge_id = $1
		ORDER BY effective_from DESC
	`
	var history []BadgeThresholdHistory
	if err := r.db.Select(&history, query, badgeID); err != nil {
		return nil, fmt.Errorf("failed to retrieve threshold history: %w", err)
	}
	if history == nil {
		history = []BadgeThresholdHistory{}
	}
	return history, nil
}

func (r *badgeRepository) GetBadgeStats() (*BadgeStats, error) {
	query := `
		SELECT 
			COUNT(DISTINCT b.id) AS total_badges,
			COALESCE(COUNT(DISTINCT CASE WHEN b.status = 'active' THEN b.id END), 0) AS active_badges,
			COALESCE(COUNT(DISTINCT CASE WHEN b.status = 'inactive' THEN b.id END), 0) AS inactive_badges,
			(SELECT COUNT(*) FROM student_badge_awards WHERE status = 'awarded') AS total_awards
		FROM badge_definitions b
	`
	var stats BadgeStats
	if err := r.db.Get(&stats, query); err != nil {
		return nil, fmt.Errorf("failed to retrieve badge statistics: %w", err)
	}
	return &stats, nil
}

func (r *badgeRepository) GetStudents(schoolID *int, search string) ([]Student, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	if schoolID != nil && *schoolID > 0 {
		conditions = append(conditions, fmt.Sprintf("st.school_id = $%d", argIdx))
		args = append(args, *schoolID)
		argIdx++
	}

	if strings.TrimSpace(search) != "" {
		term := "%" + strings.ToLower(strings.TrimSpace(search)) + "%"
		conditions = append(conditions, fmt.Sprintf("(LOWER(st.first_name) LIKE $%d OR LOWER(st.last_name) LIKE $%d OR LOWER(st.student_identifier) LIKE $%d)", argIdx, argIdx, argIdx))
		args = append(args, term)
		argIdx++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	query := fmt.Sprintf(`
		SELECT 
			st.id, st.school_id, sc.school_name, st.student_identifier, st.first_name, st.last_name, st.grade, st.status, st.created_at, st.updated_at
		FROM students st
		JOIN schools sc ON st.school_id = sc.id
		%s
		ORDER BY sc.school_name ASC, st.last_name ASC, st.first_name ASC
	`, whereClause)

	var students []Student
	if err := r.db.Select(&students, query, args...); err != nil {
		return nil, fmt.Errorf("failed to retrieve students: %w", err)
	}
	if students == nil {
		students = []Student{}
	}
	return students, nil
}

func (r *badgeRepository) GetStudentByID(id int) (*Student, error) {
	query := `
		SELECT 
			st.id, st.school_id, sc.school_name, st.student_identifier, st.first_name, st.last_name, st.grade, st.status, st.created_at, st.updated_at
		FROM students st
		JOIN schools sc ON st.school_id = sc.id
		WHERE st.id = $1
	`
	var student Student
	err := r.db.Get(&student, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get student by id: %w", err)
	}
	return &student, nil
}

func (r *badgeRepository) CreateAward(award *StudentBadgeAward, performedBy string) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// 1. Insert award record
	query := `
		INSERT INTO student_badge_awards (
			award_reference, student_id, badge_id, qualifying_points, threshold_at_award, 
			award_date, awarded_by, notes, status, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, 'awarded', NOW(), NOW()
		)
		RETURNING id, created_at, updated_at
	`
	err = tx.QueryRow(
		query,
		award.AwardReference,
		award.StudentID,
		award.BadgeID,
		award.QualifyingPoints,
		award.ThresholdAtAward,
		award.AwardDate,
		award.AwardedBy,
		award.Notes,
	).Scan(&award.ID, &award.CreatedAt, &award.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert badge award: %w", err)
	}

	// 2. Insert audit log record
	auditQuery := `
		INSERT INTO badge_award_audit_logs (award_id, action, performed_by, details, created_at)
		VALUES ($1, 'AWARD_BESTOWED', $2, $3, NOW())
	`
	details := fmt.Sprintf("Badge '%s' (Ref: %s) awarded with %.1f pts (threshold: %.1f). Note: %s",
		award.BadgeName, award.AwardReference, award.QualifyingPoints, award.ThresholdAtAward, award.Notes)

	if _, err := tx.Exec(auditQuery, award.ID, performedBy, details); err != nil {
		return fmt.Errorf("failed to insert award audit log: %w", err)
	}

	return tx.Commit()
}

func (r *badgeRepository) UpdateAwardStatus(id int, status, notes, performedBy, reason string) (*StudentBadgeAward, error) {
	tx, err := r.db.Beginx()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	var current struct {
		ID        int    `db:"id"`
		Status    string `db:"status"`
		Notes     string `db:"notes"`
		BadgeID   int    `db:"badge_id"`
		StudentID int    `db:"student_id"`
	}
	err = tx.Get(&current, "SELECT id, status, notes, badge_id, student_id FROM student_badge_awards WHERE id = $1 FOR UPDATE", id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, sql.ErrNoRows
		}
		return nil, fmt.Errorf("failed to get award: %w", err)
	}

	finalNotes := current.Notes
	if strings.TrimSpace(notes) != "" {
		finalNotes = strings.TrimSpace(notes)
	}

	updateQuery := `
		UPDATE student_badge_awards
		SET status = $1, notes = $2, updated_at = NOW()
		WHERE id = $3
	`
	if _, err := tx.Exec(updateQuery, status, finalNotes, id); err != nil {
		return nil, fmt.Errorf("failed to update award status: %w", err)
	}

	action := "AWARD_STATUS_CHANGED"
	if status == "revoked" {
		action = "AWARD_REVOKED"
	} else if status == "awarded" && current.Status == "revoked" {
		action = "AWARD_REINSTATED"
	}

	details := fmt.Sprintf("Status changed from '%s' to '%s'. Reason: %s", current.Status, status, reason)
	auditQuery := `
		INSERT INTO badge_award_audit_logs (award_id, action, performed_by, details, created_at)
		VALUES ($1, $2, $3, $4, NOW())
	`
	if _, err := tx.Exec(auditQuery, id, action, performedBy, details); err != nil {
		return nil, fmt.Errorf("failed to log award audit: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit award status change: %w", err)
	}

	return r.GetAwardByID(id)
}

func (r *badgeRepository) DeleteAward(id int) error {
	query := `DELETE FROM student_badge_awards WHERE id = $1`
	res, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete award: %w", err)
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *badgeRepository) GetAllAwards(filter AwardListFilter) ([]StudentBadgeAward, int, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	if filter.SchoolID != nil && *filter.SchoolID > 0 {
		conditions = append(conditions, fmt.Sprintf("st.school_id = $%d", argIdx))
		args = append(args, *filter.SchoolID)
		argIdx++
	}

	if filter.BadgeID != nil && *filter.BadgeID > 0 {
		conditions = append(conditions, fmt.Sprintf("a.badge_id = $%d", argIdx))
		args = append(args, *filter.BadgeID)
		argIdx++
	}

	if strings.TrimSpace(filter.Status) != "" && strings.ToLower(strings.TrimSpace(filter.Status)) != "all" {
		conditions = append(conditions, fmt.Sprintf("a.status = $%d", argIdx))
		args = append(args, strings.ToLower(strings.TrimSpace(filter.Status)))
		argIdx++
	}

	if strings.TrimSpace(filter.Search) != "" {
		term := "%" + strings.ToLower(strings.TrimSpace(filter.Search)) + "%"
		conditions = append(conditions, fmt.Sprintf("(LOWER(st.first_name) LIKE $%d OR LOWER(st.last_name) LIKE $%d OR LOWER(st.student_identifier) LIKE $%d OR LOWER(a.award_reference) LIKE $%d)", argIdx, argIdx, argIdx, argIdx))
		args = append(args, term)
		argIdx++
	}

	if strings.TrimSpace(filter.StartDate) != "" {
		conditions = append(conditions, fmt.Sprintf("a.award_date >= $%d", argIdx))
		args = append(args, filter.StartDate)
		argIdx++
	}

	if strings.TrimSpace(filter.EndDate) != "" {
		conditions = append(conditions, fmt.Sprintf("a.award_date <= $%d", argIdx))
		args = append(args, filter.EndDate)
		argIdx++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	countQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM student_badge_awards a
		JOIN students st ON a.student_id = st.id
		JOIN schools sc ON st.school_id = sc.id
		JOIN badge_definitions b ON a.badge_id = b.id
		%s
	`, whereClause)

	var totalCount int
	if err := r.db.Get(&totalCount, countQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("failed to count awards: %w", err)
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
		SELECT 
			a.id, a.award_reference, a.student_id, 
			(st.first_name || ' ' || st.last_name) AS student_name,
			st.student_identifier, st.school_id, sc.school_name, st.grade,
			a.badge_id, b.name AS badge_name, b.icon_name AS badge_icon,
			a.qualifying_points, a.threshold_at_award, TO_CHAR(a.award_date, 'YYYY-MM-DD') AS award_date,
			a.awarded_by, a.notes, a.status, a.created_at, a.updated_at
		FROM student_badge_awards a
		JOIN students st ON a.student_id = st.id
		JOIN schools sc ON st.school_id = sc.id
		JOIN badge_definitions b ON a.badge_id = b.id
		%s
		ORDER BY a.award_date DESC, a.id DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)

	args = append(args, limit, offset)

	var awards []StudentBadgeAward
	if err := r.db.Select(&awards, dataQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("failed to fetch awards: %w", err)
	}
	if awards == nil {
		awards = []StudentBadgeAward{}
	}

	return awards, totalCount, nil
}

func (r *badgeRepository) GetAwardByID(id int) (*StudentBadgeAward, error) {
	query := `
		SELECT 
			a.id, a.award_reference, a.student_id, 
			(st.first_name || ' ' || st.last_name) AS student_name,
			st.student_identifier, st.school_id, sc.school_name, st.grade,
			a.badge_id, b.name AS badge_name, b.icon_name AS badge_icon,
			a.qualifying_points, a.threshold_at_award, TO_CHAR(a.award_date, 'YYYY-MM-DD') AS award_date,
			a.awarded_by, a.notes, a.status, a.created_at, a.updated_at
		FROM student_badge_awards a
		JOIN students st ON a.student_id = st.id
		JOIN schools sc ON st.school_id = sc.id
		JOIN badge_definitions b ON a.badge_id = b.id
		WHERE a.id = $1
	`
	var award StudentBadgeAward
	err := r.db.Get(&award, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get award by id: %w", err)
	}
	return &award, nil
}

func (r *badgeRepository) GetAwardByStudentAndBadge(studentID, badgeID int) (*StudentBadgeAward, error) {
	query := `
		SELECT 
			a.id, a.award_reference, a.student_id, 
			(st.first_name || ' ' || st.last_name) AS student_name,
			st.student_identifier, st.school_id, sc.school_name, st.grade,
			a.badge_id, b.name AS badge_name, b.icon_name AS badge_icon,
			a.qualifying_points, a.threshold_at_award, TO_CHAR(a.award_date, 'YYYY-MM-DD') AS award_date,
			a.awarded_by, a.notes, a.status, a.created_at, a.updated_at
		FROM student_badge_awards a
		JOIN students st ON a.student_id = st.id
		JOIN schools sc ON st.school_id = sc.id
		JOIN badge_definitions b ON a.badge_id = b.id
		WHERE a.student_id = $1 AND a.badge_id = $2
	`
	var award StudentBadgeAward
	err := r.db.Get(&award, query, studentID, badgeID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get award by student and badge: %w", err)
	}
	return &award, nil
}

func (r *badgeRepository) GetStudentAwards(studentID int) ([]StudentBadgeAward, error) {
	query := `
		SELECT 
			a.id, a.award_reference, a.student_id, 
			(st.first_name || ' ' || st.last_name) AS student_name,
			st.student_identifier, st.school_id, sc.school_name, st.grade,
			a.badge_id, b.name AS badge_name, b.icon_name AS badge_icon,
			a.qualifying_points, a.threshold_at_award, TO_CHAR(a.award_date, 'YYYY-MM-DD') AS award_date,
			a.awarded_by, a.notes, a.status, a.created_at, a.updated_at
		FROM student_badge_awards a
		JOIN students st ON a.student_id = st.id
		JOIN schools sc ON st.school_id = sc.id
		JOIN badge_definitions b ON a.badge_id = b.id
		WHERE a.student_id = $1
		ORDER BY a.award_date DESC
	`
	var awards []StudentBadgeAward
	if err := r.db.Select(&awards, query, studentID); err != nil {
		return nil, fmt.Errorf("failed to get student awards: %w", err)
	}
	if awards == nil {
		awards = []StudentBadgeAward{}
	}
	return awards, nil
}

func (r *badgeRepository) GetNextAwardReference() (string, error) {
	year := time.Now().Year()
	var count int
	query := `SELECT COUNT(*) FROM student_badge_awards WHERE EXTRACT(YEAR FROM created_at) = $1`
	if err := r.db.Get(&count, query, year); err != nil {
		count = 0
	}
	return fmt.Sprintf("AWD-%d-%04d", year, count+1), nil
}
