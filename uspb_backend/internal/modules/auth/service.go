package auth

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/BalangodaUC/uspb_backend/internal/config"
	"github.com/BalangodaUC/uspb_backend/internal/middleware"
	"github.com/BalangodaUC/uspb_backend/pkg/utils"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrAccountLocked      = errors.New("account temporarily locked due to failed login attempts")
	ErrInvalidSession     = errors.New("invalid or expired session")
	ErrValidation         = errors.New("validation error")
)

type Service struct {
	repo Repository
	cfg  *config.Config
}

func NewService(repo Repository, cfg *config.Config) *Service {
	return &Service{repo: repo, cfg: cfg}
}

func (s *Service) Login(ctx context.Context, req LoginRequest, userAgent, ip string) (*AuthResult, error) {
	username := strings.TrimSpace(req.Username)
	if username == "" || req.Password == "" {
		return nil, ErrInvalidCredentials
	}

	user, err := s.repo.FindUserByUsername(ctx, username)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if !user.IsActive {
		_ = s.repo.WriteAuditLog(ctx, &user.ID, "", true, "AUTH_LOGIN_INACTIVE", "user", strconv.Itoa(user.ID), ip, nil)
		return nil, ErrInvalidCredentials
	}

	if user.LockedUntil != nil && user.LockedUntil.After(time.Now()) {
		_ = s.repo.WriteAuditLog(ctx, &user.ID, "", true, "AUTH_LOGIN_LOCKED", "user", strconv.Itoa(user.ID), ip, nil)
		return nil, ErrAccountLocked
	}

	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		attempts := user.FailedLoginAttempts + 1
		var lockUntil *time.Time
		if attempts >= s.cfg.LockoutThreshold {
			t := time.Now().Add(s.cfg.LockoutDuration)
			lockUntil = &t
		}
		_ = s.repo.RecordFailedLogin(ctx, user.ID, attempts, lockUntil)
		_ = s.repo.WriteAuditLog(ctx, &user.ID, "", true, "AUTH_LOGIN_FAILED", "user", strconv.Itoa(user.ID), ip, map[string]any{"attempts": attempts})
		if lockUntil != nil {
			return nil, ErrAccountLocked
		}
		return nil, ErrInvalidCredentials
	}

	if user.FailedLoginAttempts > 0 || user.LockedUntil != nil {
		_ = s.repo.ResetFailedLogin(ctx, user.ID)
	}

	sessionID := uuid.NewString()
	rawRefresh, err := utils.GenerateOpaqueToken()
	if err != nil {
		return nil, err
	}
	csrfToken, err := utils.GenerateOpaqueToken()
	if err != nil {
		return nil, err
	}

	accessToken, err := s.signAccessToken(*user, sessionID)
	if err != nil {
		return nil, err
	}

	session := Session{
		ID:               sessionID,
		UserID:           user.ID,
		RefreshTokenHash: utils.HashToken(rawRefresh),
		ExpiresAt:        time.Now().Add(s.cfg.RefreshTokenTTL),
		UserAgent:        userAgent,
		IPAddress:        ip,
	}
	if err := s.repo.CreateSession(ctx, session); err != nil {
		return nil, err
	}

	_ = s.repo.WriteAuditLog(ctx, &user.ID, user.Role, true, "AUTH_LOGIN_SUCCESS", "session", sessionID, ip, nil)

	return &AuthResult{
		User:         *user,
		AccessToken:  accessToken,
		RefreshToken: rawRefresh,
		CSRFToken:    csrfToken,
	}, nil
}

func (s *Service) Refresh(ctx context.Context, rawRefresh, ip string) (*AuthResult, error) {
	if strings.TrimSpace(rawRefresh) == "" {
		return nil, ErrInvalidSession
	}

	sess, user, err := s.repo.FindSessionByTokenHash(ctx, utils.HashToken(rawRefresh))
	if err != nil {
		return nil, ErrInvalidSession
	}

	if sess.RevokedAt != nil {
		_ = s.repo.RevokeAllUserSessions(ctx, user.ID, user.Role, user.ID)
		_ = s.repo.WriteAuditLog(ctx, &user.ID, user.Role, true, "AUTH_REFRESH_REUSE_DETECTED", "session", sess.ID, ip, nil)
		return nil, ErrInvalidSession
	}

	if sess.ExpiresAt.Before(time.Now()) || !user.IsActive {
		return nil, ErrInvalidSession
	}

	newRefresh, err := utils.GenerateOpaqueToken()
	if err != nil {
		return nil, err
	}
	newCSRF, err := utils.GenerateOpaqueToken()
	if err != nil {
		return nil, err
	}
	newAccess, err := s.signAccessToken(*user, sess.ID)
	if err != nil {
		return nil, err
	}

	if err := s.repo.RotateSession(ctx, sess.ID, utils.HashToken(newRefresh), time.Now().Add(s.cfg.RefreshTokenTTL)); err != nil {
		return nil, ErrInvalidSession
	}

	return &AuthResult{
		User:         *user,
		AccessToken:  newAccess,
		RefreshToken: newRefresh,
		CSRFToken:    newCSRF,
	}, nil
}

func (s *Service) Logout(ctx context.Context, sessionID string, userID int, role, ip string) error {
	if err := s.repo.RevokeSession(ctx, sessionID, userID); err != nil {
		return err
	}
	return s.repo.WriteAuditLog(ctx, &userID, role, false, "AUTH_LOGOUT", "session", sessionID, ip, nil)
}

func (s *Service) Me(ctx context.Context, userID int, role string) (*User, error) {
	return s.repo.FindUserByID(ctx, userID, role)
}

func (s *Service) ChangePassword(ctx context.Context, userID int, role string, req ChangePasswordRequest, ip string) error {
	if len(req.NewPassword) < 8 {
		return fmt.Errorf("%w: new password must be at least 8 characters", ErrValidation)
	}
	if req.CurrentPassword == req.NewPassword {
		return fmt.Errorf("%w: new password must differ from current password", ErrValidation)
	}

	user, err := s.repo.FindUserByID(ctx, userID, role)
	if err != nil {
		return err
	}
	if !utils.CheckPasswordHash(req.CurrentPassword, user.PasswordHash) {
		return ErrInvalidCredentials
	}

	newHash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return err
	}
	if err := s.repo.UpdatePassword(ctx, userID, newHash); err != nil {
		return err
	}
	return s.repo.WriteAuditLog(ctx, &userID, role, false, "AUTH_PASSWORD_CHANGED", "user", strconv.Itoa(userID), ip, nil)
}

func (s *Service) ListUsers(ctx context.Context, adminID int) ([]User, error) {
	return s.repo.ListUsers(ctx, adminID)
}

func (s *Service) CreateUser(ctx context.Context, adminID int, req CreateUserRequest, ip string) (*User, error) {
	req.Name = strings.TrimSpace(req.Name)
	req.Username = strings.TrimSpace(req.Username)
	if req.Name == "" || req.Username == "" {
		return nil, fmt.Errorf("%w: name and username are required", ErrValidation)
	}
	if !IsValidRole(req.Role) {
		return nil, fmt.Errorf("%w: invalid role", ErrValidation)
	}
	if len(req.TemporaryPassword) < 8 {
		return nil, fmt.Errorf("%w: temporary password must be at least 8 characters", ErrValidation)
	}
	if req.Role == RoleTeacher && (req.SchoolID == nil || *req.SchoolID <= 0) {
		return nil, fmt.Errorf("%w: school_id is required for TEACHER accounts", ErrValidation)
	}
	if req.Role != RoleTeacher {
		req.SchoolID = nil
	}

	hash, err := utils.HashPassword(req.TemporaryPassword)
	if err != nil {
		return nil, err
	}

	created, err := s.repo.CreateUser(ctx, adminID, User{
		Name:         req.Name,
		Username:     req.Username,
		PasswordHash: hash,
		Role:         req.Role,
		SchoolID:     req.SchoolID,
	})
	if err != nil {
		return nil, err
	}

	_ = s.repo.WriteAuditLog(ctx, &adminID, RoleAdmin, false, "ADMIN_USER_CREATED", "user", strconv.Itoa(created.ID), ip, map[string]any{
		"username": created.Username,
		"role":     created.Role,
	})
	return created, nil
}

func (s *Service) UpdateUser(ctx context.Context, adminID int, targetID int, req UpdateUserRequest, ip string) (*User, error) {
	if req.Role != nil && !IsValidRole(*req.Role) {
		return nil, fmt.Errorf("%w: invalid role", ErrValidation)
	}
	if req.Role != nil && *req.Role == RoleTeacher && (req.SchoolID == nil || *req.SchoolID <= 0) {
		return nil, fmt.Errorf("%w: school_id is required when assigning TEACHER role", ErrValidation)
	}

	updated, err := s.repo.UpdateUser(ctx, adminID, targetID, req)
	if err != nil {
		return nil, err
	}

	if req.IsActive != nil && !*req.IsActive {
		_ = s.repo.RevokeAllUserSessions(ctx, adminID, RoleAdmin, targetID)
	}

	_ = s.repo.WriteAuditLog(ctx, &adminID, RoleAdmin, false, "ADMIN_USER_UPDATED", "user", strconv.Itoa(targetID), ip, nil)
	return updated, nil
}

func (s *Service) AdminResetPassword(ctx context.Context, adminID int, targetID int, req ResetPasswordRequest, ip string) error {
	if len(req.TemporaryPassword) < 8 {
		return fmt.Errorf("%w: temporary password must be at least 8 characters", ErrValidation)
	}

	hash, err := utils.HashPassword(req.TemporaryPassword)
	if err != nil {
		return err
	}
	if err := s.repo.AdminResetPassword(ctx, adminID, targetID, hash); err != nil {
		return err
	}
	if err := s.repo.RevokeAllUserSessions(ctx, adminID, RoleAdmin, targetID); err != nil {
		return err
	}
	return s.repo.WriteAuditLog(ctx, &adminID, RoleAdmin, false, "ADMIN_PASSWORD_RESET", "user", strconv.Itoa(targetID), ip, nil)
}

func (s *Service) ListAuditLogs(ctx context.Context, adminID int, limit int) ([]AuditLog, error) {
	return s.repo.ListAuditLogs(ctx, adminID, limit)
}

func (s *Service) IsSessionActive(sessionID string, userID int) (bool, error) {
	return s.repo.IsSessionActive(sessionID, userID)
}

func (s *Service) signAccessToken(user User, sessionID string) (string, error) {
	now := time.Now()
	claims := middleware.JWTClaims{
		UserID:    user.ID,
		Username:  user.Username,
		Role:      user.Role,
		SchoolID:  user.SchoolID,
		SessionID: sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   strconv.Itoa(user.ID),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.cfg.AccessTokenTTL)),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return tok.SignedString([]byte(s.cfg.JWTSecret))
}
