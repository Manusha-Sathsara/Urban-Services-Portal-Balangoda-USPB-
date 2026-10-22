package middleware

import (
	"crypto/subtle"
	"strings"

	"github.com/BalangodaUC/uspb_backend/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

const (
	AccessTokenCookie  = "uspb_access_token"
	RefreshTokenCookie = "uspb_refresh_token"
	CSRFCookie         = "uspb_csrf_token"
	CSRFHeader         = "X-CSRF-Token"
)

// JWTClaims represents claims stored inside the USPB access JWT.
type JWTClaims struct {
	UserID    int    `json:"user_id"`
	Username  string `json:"username"`
	Role      string `json:"role"`
	SchoolID  *int   `json:"school_id,omitempty"`
	SessionID string `json:"session_id"`
	jwt.RegisteredClaims
}

// SessionValidator checks whether a session and user are still active.
type SessionValidator interface {
	IsSessionActive(sessionID string, userID int) (bool, error)
}

// JWTMiddleware validates incoming access tokens from HttpOnly cookies or Bearer headers.
func JWTMiddleware(jwtSecret string, validator SessionValidator) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tokenStr := c.Cookies(AccessTokenCookie)
		authSource := "cookie"

		if tokenStr == "" {
			authHeader := c.Get("Authorization")
			if authHeader != "" {
				parts := strings.SplitN(authHeader, " ", 2)
				if len(parts) != 2 || parts[0] != "Bearer" || strings.TrimSpace(parts[1]) == "" {
					return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Invalid Authorization token format")
				}
				tokenStr = strings.TrimSpace(parts[1])
				authSource = "bearer"
			}
		}

		if tokenStr == "" {
			return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Authentication required")
		}

		token, err := jwt.ParseWithClaims(tokenStr, &JWTClaims{}, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.ErrUnauthorized
			}
			return []byte(jwtSecret), nil
		})
		if err != nil || !token.Valid {
			return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Invalid or expired token")
		}

		claims, ok := token.Claims.(*JWTClaims)
		if !ok || claims.UserID <= 0 || claims.SessionID == "" {
			return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Malformed token claims")
		}

		if validator != nil {
			active, err := validator.IsSessionActive(claims.SessionID, claims.UserID)
			if err != nil || !active {
				return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Session has been revoked or expired")
			}
		}

		c.Locals("user_id", claims.UserID)
		c.Locals("username", claims.Username)
		c.Locals("role", claims.Role)
		c.Locals("school_id", claims.SchoolID)
		c.Locals("session_id", claims.SessionID)
		c.Locals("auth_source", authSource)

		return c.Next()
	}
}

// CSRFMiddleware enforces double-submit CSRF protection on cookie-authenticated state-changing requests.
func CSRFMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		method := c.Method()
		if method == fiber.MethodGet || method == fiber.MethodHead || method == fiber.MethodOptions {
			return c.Next()
		}

		// Bearer-authenticated API clients are not vulnerable to ambient cookie CSRF.
		if strings.HasPrefix(c.Get("Authorization"), "Bearer ") {
			return c.Next()
		}

		cookieToken := c.Cookies(CSRFCookie)
		headerToken := c.Get(CSRFHeader)
		if cookieToken == "" || headerToken == "" {
			return utils.ErrorResponse(c, fiber.StatusForbidden, "Missing CSRF token")
		}
		if subtle.ConstantTimeCompare([]byte(cookieToken), []byte(headerToken)) != 1 {
			return utils.ErrorResponse(c, fiber.StatusForbidden, "Invalid CSRF token")
		}

		return c.Next()
	}
}
