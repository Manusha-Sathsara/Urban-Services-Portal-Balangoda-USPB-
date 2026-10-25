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

	ListUsers(ctx context.Context, adminID int) ([]User, error)
	CreateUser(ctx context.Context, adminID int, u User) (*User, error)
	UpdateUser(ctx context.Context, adminID int, targetID int, req UpdateUserRequest) (*User, error)
	AdminResetPassword(ctx context.Context, adminID int, targetID int, newHash string) error
	ListAuditLogs(ctx context.Context, adminID int, limit int) ([]AuditLog, error)

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
			SELECT id, name, username, password_hash, role, school_id, is_active,
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
			SELECT id, name, username, password_hash, role, school_id, is_active,
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
			SELECT id, name, username, password_hash, role, school_id, is_active,
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

func (r *PostgresRepository) ListUsers(ctx context.Context, adminID int) ([]User, error) {
	var users []User
	err := database.WithRLS(ctx, r.db, database.RLSContext{UserID: adminID, Role: RoleAdmin}, func(tx *sqlx.Tx) error {
		return tx.SelectContext(ctx, &users, `
			SELECT id, name, username, role, school_id, is_active,
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
			INSERT INTO users (name, username, password_hash, role, school_id, is_active, must_change_password)
			VALUES ($1, $2, $3, $4, $5, TRUE, TRUE)
			RETURNING id, name, username, role, school_id, is_active, must_change_password, created_at, updated_at
		`, u.Name, u.Username, u.PasswordHash, u.Role, u.SchoolID)
	})
	return &created, err
}

func (r *PostgresRepository) UpdateUser(ctx context.Context, adminID int, targetID int, req UpdateUserRequest) (*User, error) {
	var updated User
	err := database.WithRLS(ctx, r.db, database.RLSContext{UserID: adminID, Role: RoleAdmin}, func(tx *sqlx.Tx) error {
		return tx.GetContext(ctx, &updated, `
			UPDATE users
			SET name = COALESCE($1, name),
			    role = COALESCE($2, role),
			    school_id = CASE WHEN $2 = 'TEACHER' THEN COALESCE($3, school_id)
			                     WHEN $2 IS NOT NULL THEN NULL
			                     ELSE COALESCE($3, school_id) END,
			    is_active = COALESCE($4, is_active),
			    updated_at = NOW()
			WHERE id = $5
			RETURNING id, name, username, role, school_id, is_active, must_change_password, created_at, updated_at
		`, req.Name, req.Role, req.SchoolID, req.IsActive, targetID)
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

func (r *PostgresRepository) ListAuditLogs(ctx context.Context, adminID int, limit int) ([]AuditLog, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	var logs []AuditLog
	err := database.WithRLS(ctx, r.db, database.RLSContext{UserID: adminID, Role: RoleAdmin}, func(tx *sqlx.Tx) error {
		return tx.SelectContext(ctx, &logs, `
			SELECT id, actor_user_id, action, target_type, target_id, ip_address, metadata, created_at
			FROM audit_logs
			ORDER BY created_at DESC
			LIMIT $1
		`, limit)
	})
	return logs, err
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
