package auth

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/BalangodaUC/uspb_backend/internal/config"
	"github.com/BalangodaUC/uspb_backend/pkg/utils"
)

type memoryAuthRepo struct {
	users      map[int]*User
	byUsername map[string]int
	sessions   map[string]*Session
	byHash     map[string]string
	auditLogs  []AuditLog
	nextID     int
}

func newMemoryAuthRepo() *memoryAuthRepo {
	return &memoryAuthRepo{
		users:      make(map[int]*User),
		byUsername: make(map[string]int),
		sessions:   make(map[string]*Session),
		byHash:     make(map[string]string),
		nextID:     1,
	}
}

func (m *memoryAuthRepo) seedUser(u User) *User {
	if u.ID == 0 {
		u.ID = m.nextID
		m.nextID++
	}
	cp := u
	m.users[cp.ID] = &cp
	m.byUsername[cp.Username] = cp.ID
	return &cp
}

func (m *memoryAuthRepo) FindUserByUsername(_ context.Context, username string) (*User, error) {
	id, ok := m.byUsername[username]
	if !ok {
		return nil, ErrUserNotFound
	}
	cp := *m.users[id]
	return &cp, nil
}

func (m *memoryAuthRepo) FindUserByID(_ context.Context, userID int, _ string) (*User, error) {
	u, ok := m.users[userID]
	if !ok {
		return nil, ErrUserNotFound
	}
	cp := *u
	return &cp, nil
}

func (m *memoryAuthRepo) RecordFailedLogin(_ context.Context, userID int, attempts int, lockedUntil *time.Time) error {
	if u, ok := m.users[userID]; ok {
		u.FailedLoginAttempts = attempts
		u.LockedUntil = lockedUntil
	}
	return nil
}

func (m *memoryAuthRepo) ResetFailedLogin(_ context.Context, userID int) error {
	if u, ok := m.users[userID]; ok {
		u.FailedLoginAttempts = 0
		u.LockedUntil = nil
	}
	return nil
}

func (m *memoryAuthRepo) CreateSession(_ context.Context, s Session) error {
	cp := s
	m.sessions[s.ID] = &cp
	m.byHash[s.RefreshTokenHash] = s.ID
	return nil
}

func (m *memoryAuthRepo) FindSessionByTokenHash(_ context.Context, tokenHash string) (*Session, *User, error) {
	sid, ok := m.byHash[tokenHash]
	if !ok {
		return nil, nil, ErrSessionNotFound
	}
	s := *m.sessions[sid]
	u := *m.users[s.UserID]
	return &s, &u, nil
}

func (m *memoryAuthRepo) RotateSession(_ context.Context, sessionID string, newHash string, newExpiry time.Time) error {
	s, ok := m.sessions[sessionID]
	if !ok || s.RevokedAt != nil {
		return ErrSessionNotFound
	}
	delete(m.byHash, s.RefreshTokenHash)
	s.RefreshTokenHash = newHash
	s.ExpiresAt = newExpiry
	m.byHash[newHash] = sessionID
	return nil
}

func (m *memoryAuthRepo) RevokeSession(_ context.Context, sessionID string, userID int) error {
	if s, ok := m.sessions[sessionID]; ok && s.UserID == userID {
		now := time.Now()
		s.RevokedAt = &now
	}
	return nil
}

func (m *memoryAuthRepo) RevokeAllUserSessions(_ context.Context, _ int, _ string, targetUserID int) error {
	now := time.Now()
	for _, s := range m.sessions {
		if s.UserID == targetUserID && s.RevokedAt == nil {
			s.RevokedAt = &now
		}
	}
	return nil
}

func (m *memoryAuthRepo) IsSessionActive(sessionID string, userID int) (bool, error) {
	s, ok := m.sessions[sessionID]
	if !ok || s.UserID != userID || s.RevokedAt != nil || s.ExpiresAt.Before(time.Now()) {
		return false, nil
	}
	u, ok := m.users[userID]
	return ok && u.IsActive, nil
}

func (m *memoryAuthRepo) UpdatePassword(_ context.Context, userID int, newHash string) error {
	if u, ok := m.users[userID]; ok {
		u.PasswordHash = newHash
		u.MustChangePassword = false
	}
	return nil
}

func (m *memoryAuthRepo) ListUsers(_ context.Context, _ int) ([]User, error) {
	var out []User
	for _, u := range m.users {
		out = append(out, *u)
	}
	return out, nil
}

func (m *memoryAuthRepo) CreateUser(_ context.Context, _ int, u User) (*User, error) {
	u.ID = m.nextID
	m.nextID++
	u.IsActive = true
	u.MustChangePassword = true
	cp := u
	m.users[cp.ID] = &cp
	m.byUsername[cp.Username] = cp.ID
	return &cp, nil
}

func (m *memoryAuthRepo) UpdateUser(_ context.Context, _ int, targetID int, req UpdateUserRequest) (*User, error) {
	u, ok := m.users[targetID]
	if !ok {
		return nil, ErrUserNotFound
	}
	if req.Name != nil {
		u.Name = *req.Name
	}
	if req.Role != nil {
		u.Role = *req.Role
	}
	if req.SchoolID != nil {
		u.SchoolID = req.SchoolID
	}
	if req.IsActive != nil {
		u.IsActive = *req.IsActive
	}
	cp := *u
	return &cp, nil
}

func (m *memoryAuthRepo) AdminResetPassword(_ context.Context, _ int, targetID int, newHash string) error {
	u, ok := m.users[targetID]
	if !ok {
		return ErrUserNotFound
	}
	u.PasswordHash = newHash
	u.MustChangePassword = true
	return nil
}

func (m *memoryAuthRepo) ListAuditLogs(_ context.Context, _ int, filter AuditLogFilter) (*AuditLogPage, error) {
	return &AuditLogPage{
		Logs:  m.auditLogs,
		Total: len(m.auditLogs),
		Page:  filter.Page,
		Limit: filter.Limit,
	}, nil
}

func (m *memoryAuthRepo) UnlockUser(_ context.Context, _ int, targetID int) error {
	if u, ok := m.users[targetID]; ok {
		u.FailedLoginAttempts = 0
		u.LockedUntil = nil
		return nil
	}
	return ErrUserNotFound
}

func (m *memoryAuthRepo) ListSchools(_ context.Context, _ int, _ string) ([]School, error) {
	return []School{}, nil
}

func (m *memoryAuthRepo) CreateSchool(_ context.Context, _ int, req CreateSchoolRequest) (*School, error) {
	return &School{ID: 1, Name: req.Name, Code: req.Code, Address: req.Address, IsActive: true}, nil
}

func (m *memoryAuthRepo) UpdateSchool(_ context.Context, _ int, schoolID int, _ UpdateSchoolRequest) (*School, error) {
	return &School{ID: schoolID, IsActive: true}, nil
}

func (m *memoryAuthRepo) ListActiveSessions(_ context.Context, _ int) ([]ActiveSessionDTO, error) {
	return []ActiveSessionDTO{}, nil
}

func (m *memoryAuthRepo) RevokeSessionByID(_ context.Context, _ int, sessionID string) error {
	if s, ok := m.sessions[sessionID]; ok {
		now := time.Now()
		s.RevokedAt = &now
		return nil
	}
	return ErrSessionNotFound
}

func (m *memoryAuthRepo) WriteAuditLog(_ context.Context, actorID *int, _ string, _ bool, action, targetType, targetID, ip string, _ map[string]any) error {
	m.auditLogs = append(m.auditLogs, AuditLog{
		ID:          int64(len(m.auditLogs) + 1),
		ActorUserID: actorID,
		Action:      action,
		TargetType:  targetType,
		TargetID:    targetID,
		IPAddress:   ip,
	})
	return nil
}

func testConfig() *config.Config {
	return &config.Config{
		JWTSecret:         strings.Repeat("k", 32),
		AccessTokenTTL:    15 * time.Minute,
		RefreshTokenTTL:   7 * 24 * time.Hour,
		LockoutThreshold:  3,
		LockoutDuration:   10 * time.Minute,
	}
}

func TestLogin_SuccessAndLockout(t *testing.T) {
	repo := newMemoryAuthRepo()
	hash, _ := utils.HashPassword("CorrectPass123!")
	repo.seedUser(User{
		Name:         "Admin User",
		Username:     "admin",
		PasswordHash: hash,
		Role:         RoleAdmin,
		IsActive:     true,
	})
	svc := NewService(repo, testConfig())
	ctx := context.Background()

	// 2 wrong attempts -> ErrInvalidCredentials
	for i := 0; i < 2; i++ {
		_, err := svc.Login(ctx, LoginRequest{Username: "admin", Password: "wrong"}, "ua", "127.0.0.1")
		if !errors.Is(err, ErrInvalidCredentials) {
			t.Fatalf("attempt %d: got %v, want ErrInvalidCredentials", i+1, err)
		}
	}

	// 3rd wrong attempt -> ErrAccountLocked
	_, err := svc.Login(ctx, LoginRequest{Username: "admin", Password: "wrong"}, "ua", "127.0.0.1")
	if !errors.Is(err, ErrAccountLocked) {
		t.Fatalf("3rd attempt: got %v, want ErrAccountLocked", err)
	}

	// Even correct password is blocked while locked
	_, err = svc.Login(ctx, LoginRequest{Username: "admin", Password: "CorrectPass123!"}, "ua", "127.0.0.1")
	if !errors.Is(err, ErrAccountLocked) {
		t.Fatalf("locked login: got %v, want ErrAccountLocked", err)
	}
}

func TestRefresh_RotationAndReuseDetection(t *testing.T) {
	repo := newMemoryAuthRepo()
	hash, _ := utils.HashPassword("Secret1234!")
	repo.seedUser(User{
		Name:         "Fee Officer",
		Username:     "fee_officer",
		PasswordHash: hash,
		Role:         RoleFeeOfficer,
		IsActive:     true,
	})
	svc := NewService(repo, testConfig())
	ctx := context.Background()

	loginRes, err := svc.Login(ctx, LoginRequest{Username: "fee_officer", Password: "Secret1234!"}, "ua", "127.0.0.1")
	if err != nil {
		t.Fatalf("login failed: %v", err)
	}

	// Rotate once
	refRes, err := svc.Refresh(ctx, loginRes.RefreshToken, "127.0.0.1")
	if err != nil {
		t.Fatalf("refresh failed: %v", err)
	}
	if refRes.RefreshToken == loginRes.RefreshToken {
		t.Error("expected refresh token to rotate")
	}

	// Logout revokes session
	if err := svc.Logout(ctx, repo.byHash[utils.HashToken(refRes.RefreshToken)], loginRes.User.ID, RoleFeeOfficer, "127.0.0.1"); err != nil {
		t.Fatalf("logout failed: %v", err)
	}

	// Reusing revoked refresh token -> ErrInvalidSession
	if _, err := svc.Refresh(ctx, refRes.RefreshToken, "127.0.0.1"); !errors.Is(err, ErrInvalidSession) {
		t.Fatalf("expected ErrInvalidSession on revoked token, got %v", err)
	}
}

func TestAdminCreateTeacherRequiresSchoolAndDeactivateRevokesSessions(t *testing.T) {
	repo := newMemoryAuthRepo()
	hash, _ := utils.HashPassword("TeacherPass123!")
	adminHash, _ := utils.HashPassword("AdminPass123!")
	admin := repo.seedUser(User{Name: "Admin", Username: "admin", PasswordHash: adminHash, Role: RoleAdmin, IsActive: true})
	svc := NewService(repo, testConfig())
	ctx := context.Background()

	// Teacher without school_id must fail
	if _, err := svc.CreateUser(ctx, admin.ID, CreateUserRequest{
		Name:              "Kamal",
		Username:          "kamal",
		TemporaryPassword: "TempPassword1!",
		Role:              RoleTeacher,
	}, "127.0.0.1"); !errors.Is(err, ErrValidation) {
		t.Fatalf("expected ErrValidation for teacher without school_id, got %v", err)
	}

	// Teacher with school_id succeeds
	schoolID := 5
	teacher, err := svc.CreateUser(ctx, admin.ID, CreateUserRequest{
		Name:              "Kamal",
		Username:          "kamal",
		TemporaryPassword: "TempPassword1!",
		Role:              RoleTeacher,
		SchoolID:          &schoolID,
	}, "127.0.0.1")
	if err != nil {
		t.Fatalf("create teacher failed: %v", err)
	}

	// Update password hash to known value and login
	repo.users[teacher.ID].PasswordHash = hash
	res, err := svc.Login(ctx, LoginRequest{Username: "kamal", Password: "TeacherPass123!"}, "ua", "127.0.0.1")
	if err != nil {
		t.Fatalf("teacher login failed: %v", err)
	}
	sid := repo.byHash[utils.HashToken(res.RefreshToken)]

	// Deactivate teacher -> revokes sessions
	inactive := false
	if _, err := svc.UpdateUser(ctx, admin.ID, teacher.ID, UpdateUserRequest{IsActive: &inactive}, "127.0.0.1"); err != nil {
		t.Fatalf("deactivate failed: %v", err)
	}
	if active, _ := svc.IsSessionActive(sid, teacher.ID); active {
		t.Error("expected session to be revoked after user deactivation")
	}
}
