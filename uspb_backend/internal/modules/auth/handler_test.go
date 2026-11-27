package auth

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/BalangodaUC/uspb_backend/internal/middleware"
	"github.com/BalangodaUC/uspb_backend/pkg/utils"
	"github.com/gofiber/fiber/v2"
)

func TestHandler_LoginMeLogoutFlow(t *testing.T) {
	repo := newMemoryAuthRepo()
	hash, _ := utils.HashPassword("OfficerPass123!")
	repo.seedUser(User{
		Name:         "Env Officer",
		Username:     "env_officer",
		PasswordHash: hash,
		Role:         RoleEnvOfficer,
		IsActive:     true,
	})

	cfg := testConfig()
	svc := NewService(repo, cfg)
	h := NewHandler(svc, cfg)

	app := fiber.New()
	api := app.Group("/api/v1")
	jwtMW := middleware.JWTMiddleware(cfg.JWTSecret, svc)
	csrfMW := middleware.CSRFMiddleware()
	adminMW := middleware.RequireRoles(RoleAdmin)
	h.RegisterRoutes(api, jwtMW, csrfMW, adminMW, nil)

	// 1. Login
	body, _ := json.Marshal(LoginRequest{Username: "env_officer", Password: "OfficerPass123!"})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("login request error: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("login status: got %d, want 200", resp.StatusCode)
	}

	cookies := resp.Cookies()
	var csrfVal string
	for _, ck := range cookies {
		if ck.Name == middleware.CSRFCookie {
			csrfVal = ck.Value
		}
	}
	if csrfVal == "" {
		t.Fatal("expected CSRF cookie on login")
	}

	// 2. GET /auth/me with cookies
	meReq := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	for _, ck := range cookies {
		meReq.AddCookie(ck)
	}
	meResp, _ := app.Test(meReq)
	if meResp.StatusCode != http.StatusOK {
		t.Fatalf("me status: got %d, want 200", meResp.StatusCode)
	}

	// 3. Non-admin hitting /admin/users -> 403
	adminReq := httptest.NewRequest(http.MethodGet, "/api/v1/admin/users", nil)
	for _, ck := range cookies {
		adminReq.AddCookie(ck)
	}
	adminResp, _ := app.Test(adminReq)
	if adminResp.StatusCode != http.StatusForbidden {
		t.Fatalf("non-admin /admin/users status: got %d, want 403", adminResp.StatusCode)
	}

	// 4. Logout with CSRF header -> 200
	logoutReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/logout", nil)
	for _, ck := range cookies {
		logoutReq.AddCookie(ck)
	}
	logoutReq.Header.Set(middleware.CSRFHeader, csrfVal)
	logoutResp, _ := app.Test(logoutReq)
	if logoutResp.StatusCode != http.StatusOK {
		t.Fatalf("logout status: got %d, want 200", logoutResp.StatusCode)
	}

	// 5. GET /auth/me after logout -> 401
	meAfterReq := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	for _, ck := range cookies {
		meAfterReq.AddCookie(ck)
	}
	meAfterResp, _ := app.Test(meAfterReq)
	if meAfterResp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("me after logout: got %d, want 401", meAfterResp.StatusCode)
	}
}
