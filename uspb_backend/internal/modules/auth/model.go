package auth

import (
	"encoding/json"
	"time"
)

const (
	RoleAdmin             = "ADMIN"
	RoleFeeOfficer        = "FEE_OFFICER"
	RoleEnvOfficer        = "ENV_OFFICER"
	RoleGarbageSupervisor = "GARBAGE_SUPERVISOR"
	RoleTeacher           = "TEACHER"
)

// IsValidRole checks whether role is one of the 5 allowed USPB roles.
func IsValidRole(role string) bool {
	switch role {
	case RoleAdmin, RoleFeeOfficer, RoleEnvOfficer, RoleGarbageSupervisor, RoleTeacher:
		return true
	default:
		return false
	}
}

// User maps to the PostgreSQL users table.
type User struct {
	ID                  int        `db:"id" json:"id"`
	Name                string     `db:"name" json:"name"`
	Username            string     `db:"username" json:"username"`
	PasswordHash        string     `db:"password_hash" json:"-"`
	Role                string     `db:"role" json:"role"`
	SchoolID            *int       `db:"school_id" json:"school_id"`
	IsActive            bool       `db:"is_active" json:"is_active"`
	MustChangePassword  bool       `db:"must_change_password" json:"must_change_password"`
	FailedLoginAttempts int        `db:"failed_login_attempts" json:"-"`
	LockedUntil         *time.Time `db:"locked_until" json:"-"`
	CreatedAt           time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt           time.Time  `db:"updated_at" json:"updated_at"`
}

// Session maps to the PostgreSQL auth_sessions table.
type Session struct {
	ID               string     `db:"id"`
	UserID           int        `db:"user_id"`
	RefreshTokenHash string     `db:"refresh_token_hash"`
	ExpiresAt        time.Time  `db:"expires_at"`
	RevokedAt        *time.Time `db:"revoked_at"`
	UserAgent        string     `db:"user_agent"`
	IPAddress        string     `db:"ip_address"`
	CreatedAt        time.Time  `db:"created_at"`
}

// AuditLog maps to the PostgreSQL audit_logs table.
type AuditLog struct {
	ID          int64           `db:"id" json:"id"`
	ActorUserID *int            `db:"actor_user_id" json:"actor_user_id"`
	Action      string          `db:"action" json:"action"`
	TargetType  string          `db:"target_type" json:"target_type"`
	TargetID    string          `db:"target_id" json:"target_id"`
	IPAddress   string          `db:"ip_address" json:"ip_address"`
	Metadata    json.RawMessage `db:"metadata" json:"metadata"`
	CreatedAt   time.Time       `db:"created_at" json:"created_at"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

type CreateUserRequest struct {
	Name              string `json:"name"`
	Username          string `json:"username"`
	TemporaryPassword string `json:"temporary_password"`
	Role              string `json:"role"`
	SchoolID          *int   `json:"school_id"`
}

type UpdateUserRequest struct {
	Name     *string `json:"name"`
	Role     *string `json:"role"`
	SchoolID *int    `json:"school_id"`
	IsActive *bool   `json:"is_active"`
}

type ResetPasswordRequest struct {
	TemporaryPassword string `json:"temporary_password"`
}

type AuthResult struct {
	User         User   `json:"user"`
	AccessToken  string `json:"-"`
	RefreshToken string `json:"-"`
	CSRFToken    string `json:"csrf_token,omitempty"`
}
