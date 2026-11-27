package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

type stubSessionValidator struct {
	active bool
}

func (s stubSessionValidator) IsSessionActive(_ string, _ int) (bool, error) {
	return s.active, nil
}

func signTestToken(t *testing.T, secret string, claims JWTClaims) string {
	t.Helper()
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tok.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("sign test token: %v", err)
	}
	return signed
}

func TestJWTMiddleware_CookieAndBearerAndRevocation(t *testing.T) {
	secret := strings.Repeat("s", 32)
	schoolID := 4
	validClaims := JWTClaims{
		UserID:    7,
		Username:  "teacher_kamal",
		Role:      "TEACHER",
		SchoolID:  &schoolID,
		SessionID: "sess-123",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(10 * time.Minute)),
		},
	}
	tokenStr := signTestToken(t, secret, validClaims)

	app := fiber.New()
	app.Get("/protected", JWTMiddleware(secret, stubSessionValidator{active: true}), func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	// Missing token -> 401
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	resp, _ := app.Test(req)
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("missing token: got %d, want 401", resp.StatusCode)
	}

	// Valid cookie -> 200
	req = httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.AddCookie(&http.Cookie{Name: AccessTokenCookie, Value: tokenStr})
	resp, _ = app.Test(req)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("valid cookie: got %d, want 200", resp.StatusCode)
	}

	// Valid bearer -> 200
	req = httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	resp, _ = app.Test(req)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("valid bearer: got %d, want 200", resp.StatusCode)
	}

	// Revoked session -> 401
	revokedApp := fiber.New()
	revokedApp.Get("/protected", JWTMiddleware(secret, stubSessionValidator{active: false}), func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})
	req = httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.AddCookie(&http.Cookie{Name: AccessTokenCookie, Value: tokenStr})
	resp, _ = revokedApp.Test(req)
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("revoked session: got %d, want 401", resp.StatusCode)
	}
}

func TestRequireRolesAndSchoolScope(t *testing.T) {
	schoolID := 3
	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error {
		c.Locals("role", "TEACHER")
		c.Locals("school_id", &schoolID)
		return c.Next()
	})
	app.Get("/admin-only", RequireRoles("ADMIN"), func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})
	app.Get("/schools/:schoolId/students", RequireRoles("TEACHER"), RequireSchoolScope("schoolId"), func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	// Teacher hitting admin route -> 403
	resp, _ := app.Test(httptest.NewRequest(http.MethodGet, "/admin-only", nil))
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("admin route as teacher: got %d, want 403", resp.StatusCode)
	}

	// Teacher hitting own school -> 200
	resp, _ = app.Test(httptest.NewRequest(http.MethodGet, "/schools/3/students", nil))
	if resp.StatusCode != http.StatusOK {
		t.Errorf("own school: got %d, want 200", resp.StatusCode)
	}

	// Teacher hitting another school -> 403
	resp, _ = app.Test(httptest.NewRequest(http.MethodGet, "/schools/9/students", nil))
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("other school: got %d, want 403", resp.StatusCode)
	}
}

func TestCSRFMiddleware(t *testing.T) {
	app := fiber.New()
	app.Post("/mutate", CSRFMiddleware(), func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	// Cookie auth without CSRF header -> 403
	req := httptest.NewRequest(http.MethodPost, "/mutate", nil)
	req.AddCookie(&http.Cookie{Name: CSRFCookie, Value: "abc123"})
	resp, _ := app.Test(req)
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("missing csrf header: got %d, want 403", resp.StatusCode)
	}

	// Matching CSRF cookie & header -> 200
	req = httptest.NewRequest(http.MethodPost, "/mutate", nil)
	req.AddCookie(&http.Cookie{Name: CSRFCookie, Value: "abc123"})
	req.Header.Set(CSRFHeader, "abc123")
	resp, _ = app.Test(req)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("matching csrf: got %d, want 200", resp.StatusCode)
	}
}
