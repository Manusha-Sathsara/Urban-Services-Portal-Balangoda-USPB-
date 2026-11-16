package auth

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/BalangodaUC/uspb_backend/pkg/database"
	"github.com/jmoiron/sqlx"
)

var (
	ErrUserNotFound    = errors.New("user not found")
	ErrSessionNotFound = errors.New("session not found")
)

// Repository defines persistence operations for authentication, sessions, and audit logs.
type Repository interface {
	FindUserByUsername(ctx context.Context, username string) (*User, error)
	FindUserByID(ctx context.Context, userID int, role string) (*User, error)
	RecordFailedLogin(ctx context.Context, userID int, attempts int, lockedUntil *time.Time) error
	ResetFailedLogin(ctx context.Context, userID int) error

	CreateSession(ctx context.Context, session Session) error
	FindSessionByTokenHash(ctx context.Context, tokenHash string) (*Session, *User, error)
	RotateSession(ctx context.Context, sessionID string, newHash string, newExpiry time.Time) error
	RevokeSession(ctx context.Context, sessionID string, userID int) error
	RevokeAllUserSessions(ctx context.Context, actorID int, actorRole string, targetUserID int) error
	IsSessionActive(sessionID string, userID int) (bool, error)

	UpdatePassword(ctx context.Context, userID int, newHash string) error
	UpdateProfile(ctx context.Context, userID int, req UpdateProfileRequest) (*User, error)

	ListUsers(ctx context.Context, adminID int) ([]User, error)
	CreateUser(ctx context.Context, adminID int, u User) (*User, error)
	UpdateUser(ctx context.Context, adminID int, targetID int, req UpdateUserRequest) (*User, error)
	AdminResetPassword(ctx context.Context, adminID int, targetID int, newHash string) error
	UnlockUser(ctx context.Context, adminID int, targetID int) error

	ListSchools(ctx context.Context, actorID int, actorRole string) ([]School, error)
	CreateSchool(ctx context.Context, adminID int, req CreateSchoolRequest) (*School, error)
	UpdateSchool(ctx context.Context, adminID int, schoolID int, req UpdateSchoolRequest) (*School, error)

	ListAuditLogs(ctx context.Context, adminID int, filter AuditLogFilter) (*AuditLogPage, error)
	ListActiveSessions(ctx context.Context, adminID int) ([]ActiveSessionDTO, error)
	RevokeSessionByID(ctx context.Context, adminID int, sessionID string) error

	WriteAuditLog(ctx context.Context, actorID *int, actorRole string, authFlow bool, action, targetType, targetID, ip string, meta map[string]any) error
}

type PostgresRepository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

func (r *PostgresRepository) FindUserByUsername(ctx context.Context, username string) (*User, error) {
	var u User
	err := database.WithRLS(ctx, r.db, database.RLSContext{AuthFlow: true}, func(tx *sqlx.Tx) error {
		return tx.GetContext(ctx, &u, `
			SELECT id, name, username, email, phone, password_hash, role, school_id, is_active,
			       must_change_password, failed_login_attempts, locked_until, created_at, updated_at
			FROM users
			WHERE username = $1
		`, username)
	})
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find user by username: %w", err)
	}
	return &u, nil
}

func (r *PostgresRepository) FindUserByID(ctx context.Context, userID int, role string) (*User, error) {
	var u User
	err := database.WithRLS(ctx, r.db, database.RLSContext{UserID: userID, Role: role}, func(tx *sqlx.Tx) error {
		return tx.GetContext(ctx, &u, `
			SELECT id, name, username, email, phone, password_hash, role, school_id, is_active,
			       must_change_password, failed_login_attempts, locked_until, created_at, updated_at
			FROM users
			WHERE id = $1
		`, userID)
	})
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find user by id: %w", err)
	}
	return &u, nil
}

func (r *PostgresRepository) RecordFailedLogin(ctx context.Context, userID int, attempts int, lockedUntil *time.Time) error {
	return database.WithRLS(ctx, r.db, database.RLSContext{AuthFlow: true}, func(tx *sqlx.Tx) error {
		_, err := tx.ExecContext(ctx, `
			UPDATE users
			SET failed_login_attempts = $1, locked_until = $2, updated_at = NOW()
			WHERE id = $3
		`, attempts, lockedUntil, userID)
		return err
	})
}

func (r *PostgresRepository) ResetFailedLogin(ctx context.Context, userID int) error {
	return database.WithRLS(ctx, r.db, database.RLSContext{AuthFlow: true}, func(tx *sqlx.Tx) error {
		_, err := tx.ExecContext(ctx, `
			UPDATE users
			SET failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
			WHERE id = $1
		`, userID)
		return err
	})
}

func (r *PostgresRepository) CreateSession(ctx context.Context, s Session) error {
	return database.WithRLS(ctx, r.db, database.RLSContext{AuthFlow: true}, func(tx *sqlx.Tx) error {
		_, err := tx.ExecContext(ctx, `
			INSERT INTO auth_sessions (id, user_id, refresh_token_hash, expires_at, user_agent, ip_address)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, s.ID, s.UserID, s.RefreshTokenHash, s.ExpiresAt, s.UserAgent, s.IPAddress)
		return err
	})
}

func (r *PostgresRepository) FindSessionByTokenHash(ctx context.Context, tokenHash string) (*Session, *User, error) {
	var s Session
	var u User
	err := database.WithRLS(ctx, r.db, database.RLSContext{AuthFlow: true}, func(tx *sqlx.Tx) error {
		if err := tx.GetContext(ctx, &s, `
			SELECT id, user_id, refresh_token_hash, expires_at, revoked_at, user_agent, ip_address, created_at
			FROM auth_sessions
			WHERE refresh_token_hash = $1
		`, tokenHash); err != nil {
			return err
		}
		return tx.GetContext(ctx, &u, `
			SELECT id, name, username, email, phone, password_hash, role, school_id, is_active,
			       must_change_password, failed_login_attempts, locked_until, created_at, updated_at
			FROM users
			WHERE id = $1
		`, s.UserID)
	})
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil, ErrSessionNotFound
	}
	if err != nil {
		return nil, nil, fmt.Errorf("find session by token hash: %w", err)
	}
	return &s, &u, nil
}

func (r *PostgresRepository) RotateSession(ctx context.Context, sessionID string, newHash string, newExpiry time.Time) error {
	return database.WithRLS(ctx, r.db, database.RLSContext{AuthFlow: true}, func(tx *sqlx.Tx) error {
		res, err := tx.ExecContext(ctx, `
			UPDATE auth_sessions
			SET refresh_token_hash = $1, expires_at = $2
			WHERE id = $3 AND revoked_at IS NULL
		`, newHash, newExpiry, sessionID)
		if err != nil {
			return err
		}
		if rows, _ := res.RowsAffected(); rows == 0 {
			return ErrSessionNotFound
		}
		return nil
	})
}

func (r *PostgresRepository) RevokeSession(ctx context.Context, sessionID string, userID int) error {
	return database.WithRLS(ctx, r.db, database.RLSContext{UserID: userID}, func(tx *sqlx.Tx) error {
		_, err := tx.ExecContext(ctx, `
			UPDATE auth_sessions
			SET revoked_at = NOW()
			WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
		`, sessionID, userID)
		return err
	})
}

func (r *PostgresRepository) RevokeAllUserSessions(ctx context.Context, actorID int, actorRole string, targetUserID int) error {
	return database.WithRLS(ctx, r.db, database.RLSContext{UserID: actorID, Role: actorRole}, func(tx *sqlx.Tx) error {
		_, err := tx.ExecContext(ctx, `
			UPDATE auth_sessions
			SET revoked_at = NOW()
			WHERE user_id = $1 AND revoked_at IS NULL
		`, targetUserID)
		return err
	})
}

func (r *PostgresRepository) IsSessionActive(sessionID string, userID int) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	var active bool
	err := database.WithRLS(ctx, r.db, database.RLSContext{AuthFlow: true}, func(tx *sqlx.Tx) error {
		return tx.GetContext(ctx, &active, `
			SELECT EXISTS (
				SELECT 1
				FROM auth_sessions s
				JOIN users u ON u.id = s.user_id
				WHERE s.id = $1
				  AND s.user_id = $2
				  AND s.revoked_at IS NULL
				  AND s.expires_at > NOW()
				  AND u.is_active = TRUE
			)
		`, sessionID, userID)
	})
	return active, err
}

func (r *PostgresRepository) UpdatePassword(ctx context.Context, userID int, newHash string) error {
	return database.WithRLS(ctx, r.db, database.RLSContext{UserID: userID}, func(tx *sqlx.Tx) error {
		_, err := tx.ExecContext(ctx, `
			UPDATE users
			SET password_hash = $1, must_change_password = FALSE, updated_at = NOW()
			WHERE id = $2
		`, newHash, userID)
		return err
	})
}

func (r *PostgresRepository) UpdateProfile(ctx context.Context, userID int, req UpdateProfileRequest) (*User, error) {
	var updated User
	err := database.WithRLS(ctx, r.db, database.RLSContext{UserID: userID}, func(tx *sqlx.Tx) error {
		return tx.GetContext(ctx, &updated, `
			UPDATE users
			SET name = $1,
			    username = $2,
			    email = $3,
			    phone = $4,
			    updated_at = NOW()
			WHERE id = $5
			RETURNING id, name, username, email, phone, role, school_id, is_active, must_change_password, created_at, updated_at
		`, req.Name, req.Username, req.Email, req.Phone, userID)
	})
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrUserNotFound
	}
	return &updated, err
}

func (r *PostgresRepository) ListUsers(ctx context.Context, adminID int) ([]User, error) {
	var users []User
	err := database.WithRLS(ctx, r.db, database.RLSContext{UserID: adminID, Role: RoleAdmin}, func(tx *sqlx.Tx) error {
		return tx.SelectContext(ctx, &users, `
			SELECT id, name, username, email, phone, role, school_id, is_active,
			       must_change_password, created_at, updated_at
			FROM users
			ORDER BY id ASC
		`)
	})
	return users, err
}

func (r *PostgresRepository) CreateUser(ctx context.Context, adminID int, u User) (*User, error) {
	var created User
	err := database.WithRLS(ctx, r.db, database.RLSContext{UserID: adminID, Role: RoleAdmin}, func(tx *sqlx.Tx) error {
		return tx.GetContext(ctx, &created, `
			INSERT INTO users (name, username, email, phone, password_hash, role, school_id, is_active, must_change_password)
			VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, TRUE)
			RETURNING id, name, username, email, phone, role, school_id, is_active, must_change_password, created_at, updated_at
		`, u.Name, u.Username, u.Email, u.Phone, u.PasswordHash, u.Role, u.SchoolID)
	})
	return &created, err
}

func (r *PostgresRepository) UpdateUser(ctx context.Context, adminID int, targetID int, req UpdateUserRequest) (*User, error) {
	var updated User
	err := database.WithRLS(ctx, r.db, database.RLSContext{UserID: adminID, Role: RoleAdmin}, func(tx *sqlx.Tx) error {
		return tx.GetContext(ctx, &updated, `
			UPDATE users
			SET name = COALESCE($1, name),
			    username = COALESCE($2, username),
			    email = COALESCE($3, email),
			    phone = COALESCE($4, phone),
			    role = COALESCE($5, role),
			    school_id = CASE WHEN $5 = 'TEACHER' THEN COALESCE($6, school_id)
			                     WHEN $5 IS NOT NULL THEN NULL
			                     ELSE COALESCE($6, school_id) END,
			    is_active = COALESCE($7, is_active),
			    updated_at = NOW()
			WHERE id = $8
			RETURNING id, name, username, email, phone, role, school_id, is_active, must_change_password, created_at, updated_at
		`, req.Name, req.Username, req.Email, req.Phone, req.Role, req.SchoolID, req.IsActive, targetID)
	})
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrUserNotFound
	}
	return &updated, err
}

func (r *PostgresRepository) AdminResetPassword(ctx context.Context, adminID int, targetID int, newHash string) error {
	return database.WithRLS(ctx, r.db, database.RLSContext{UserID: adminID, Role: RoleAdmin}, func(tx *sqlx.Tx) error {
		res, err := tx.ExecContext(ctx, `
			UPDATE users
			SET password_hash = $1,
			    must_change_password = TRUE,
			    failed_login_attempts = 0,
			    locked_until = NULL,
			    updated_at = NOW()
			WHERE id = $2
		`, newHash, targetID)
		if err != nil {
			return err
		}
		if rows, _ := res.RowsAffected(); rows == 0 {
			return ErrUserNotFound
		}
		return nil
	})
}

func (r *PostgresRepository) UnlockUser(ctx context.Context, adminID int, targetID int) error {
	return database.WithRLS(ctx, r.db, database.RLSContext{UserID: adminID, Role: RoleAdmin}, func(tx *sqlx.Tx) error {
		res, err := tx.ExecContext(ctx, `
			UPDATE users
			SET failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
			WHERE id = $1
		`, targetID)
		if err != nil {
			return err
		}
		if rows, _ := res.RowsAffected(); rows == 0 {
			return ErrUserNotFound
		}
		return nil
	})
}

func (r *PostgresRepository) ListSchools(ctx context.Context, actorID int, actorRole string) ([]School, error) {
	var schools []School
	err := database.WithRLS(ctx, r.db, database.RLSContext{UserID: actorID, Role: actorRole}, func(tx *sqlx.Tx) error {
		return tx.SelectContext(ctx, &schools, `
			SELECT id, name, code, address, is_active, created_at, updated_at
			FROM schools
			ORDER BY name ASC
		`)
	})
	return schools, err
}

func (r *PostgresRepository) CreateSchool(ctx context.Context, adminID int, req CreateSchoolRequest) (*School, error) {
	var s School
	err := database.WithRLS(ctx, r.db, database.RLSContext{UserID: adminID, Role: RoleAdmin}, func(tx *sqlx.Tx) error {
		return tx.GetContext(ctx, &s, `
			INSERT INTO schools (name, code, address)
			VALUES ($1, $2, $3)
			RETURNING id, name, code, address, is_active, created_at, updated_at
		`, req.Name, req.Code, req.Address)
	})
	return &s, err
}

func (r *PostgresRepository) UpdateSchool(ctx context.Context, adminID int, schoolID int, req UpdateSchoolRequest) (*School, error) {
	var s School
	err := database.WithRLS(ctx, r.db, database.RLSContext{UserID: adminID, Role: RoleAdmin}, func(tx *sqlx.Tx) error {
		return tx.GetContext(ctx, &s, `
			UPDATE schools
			SET name = COALESCE($1, name),
			    address = COALESCE($2, address),
			    is_active = COALESCE($3, is_active),
			    updated_at = NOW()
			WHERE id = $4
			RETURNING id, name, code, address, is_active, created_at, updated_at
		`, req.Name, req.Address, req.IsActive, schoolID)
	})
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrUserNotFound
	}
	return &s, err
}

func (r *PostgresRepository) ListAuditLogs(ctx context.Context, adminID int, filter AuditLogFilter) (*AuditLogPage, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 || filter.Limit > 100 {
		filter.Limit = 20
	}
	offset := (filter.Page - 1) * filter.Limit

	var total int
	var logs []AuditLog
	err := database.WithRLS(ctx, r.db, database.RLSContext{UserID: adminID, Role: RoleAdmin}, func(tx *sqlx.Tx) error {
		if err := tx.GetContext(ctx, &total, `
			SELECT COUNT(*)
			FROM audit_logs
			WHERE ($1 = '' OR action = $1)
			  AND ($2 = '' OR action ILIKE '%' || $2 || '%' OR target_id ILIKE '%' || $2 || '%' OR ip_address ILIKE '%' || $2 || '%')
		`, filter.Action, filter.Search); err != nil {
			return err
		}
		return tx.SelectContext(ctx, &logs, `
			SELECT id, actor_user_id, action, target_type, target_id, ip_address, metadata, created_at
			FROM audit_logs
			WHERE ($1 = '' OR action = $1)
			  AND ($2 = '' OR action ILIKE '%' || $2 || '%' OR target_id ILIKE '%' || $2 || '%' OR ip_address ILIKE '%' || $2 || '%')
			ORDER BY created_at DESC
			LIMIT $3 OFFSET $4
		`, filter.Action, filter.Search, filter.Limit, offset)
	})
	if err != nil {
		return nil, err
	}
	if logs == nil {
		logs = []AuditLog{}
	}
	return &AuditLogPage{
		Logs:  logs,
		Total: total,
		Page:  filter.Page,
		Limit: filter.Limit,
	}, nil
}

func (r *PostgresRepository) ListActiveSessions(ctx context.Context, adminID int) ([]ActiveSessionDTO, error) {
	var sessions []ActiveSessionDTO
	err := database.WithRLS(ctx, r.db, database.RLSContext{UserID: adminID, Role: RoleAdmin}, func(tx *sqlx.Tx) error {
		return tx.SelectContext(ctx, &sessions, `
			SELECT s.id, s.user_id, u.username, u.role, s.user_agent, s.ip_address, s.created_at, s.expires_at
			FROM auth_sessions s
			JOIN users u ON u.id = s.user_id
			WHERE s.revoked_at IS NULL AND s.expires_at > NOW()
			ORDER BY s.created_at DESC
		`)
	})
	if sessions == nil {
		sessions = []ActiveSessionDTO{}
	}
	return sessions, err
}

func (r *PostgresRepository) RevokeSessionByID(ctx context.Context, adminID int, sessionID string) error {
	return database.WithRLS(ctx, r.db, database.RLSContext{UserID: adminID, Role: RoleAdmin}, func(tx *sqlx.Tx) error {
		res, err := tx.ExecContext(ctx, `
			UPDATE auth_sessions
			SET revoked_at = NOW()
			WHERE id = $1 AND revoked_at IS NULL
		`, sessionID)
		if err != nil {
			return err
		}
		if rows, _ := res.RowsAffected(); rows == 0 {
			return ErrSessionNotFound
		}
		return nil
	})
}

func (r *PostgresRepository) WriteAuditLog(ctx context.Context, actorID *int, actorRole string, authFlow bool, action, targetType, targetID, ip string, meta map[string]any) error {
	rawMeta := []byte("{}")
	if meta != nil {
		if b, err := json.Marshal(meta); err == nil {
			rawMeta = b
		}
	}
	return database.WithRLS(ctx, r.db, database.RLSContext{
		UserID:   derefInt(actorID),
		Role:     actorRole,
		AuthFlow: authFlow,
	}, func(tx *sqlx.Tx) error {
		_, err := tx.ExecContext(ctx, `
			INSERT INTO audit_logs (actor_user_id, action, target_type, target_id, ip_address, metadata)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, actorID, action, targetType, targetID, ip, rawMeta)
		return err
	})
}

func derefInt(p *int) int {
	if p == nil {
		return 0
	}
	return *p
}
