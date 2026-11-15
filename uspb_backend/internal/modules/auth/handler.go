package auth

import (
	"errors"
	"strconv"
	"time"

	"github.com/BalangodaUC/uspb_backend/internal/config"
	"github.com/BalangodaUC/uspb_backend/internal/middleware"
	"github.com/BalangodaUC/uspb_backend/pkg/utils"
	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	service *Service
	cfg     *config.Config
}

func NewHandler(service *Service, cfg *config.Config) *Handler {
	return &Handler{service: service, cfg: cfg}
}

func (h *Handler) RegisterRoutes(
	api fiber.Router,
	jwtMW fiber.Handler,
	csrfMW fiber.Handler,
	adminMW fiber.Handler,
	loginLimiter fiber.Handler,
) {
	authGroup := api.Group("/auth")
	if loginLimiter != nil {
		authGroup.Post("/login", loginLimiter, h.Login)
	} else {
		authGroup.Post("/login", h.Login)
	}
	authGroup.Post("/refresh", h.Refresh)

	authGroup.Post("/logout", jwtMW, csrfMW, h.Logout)
	authGroup.Get("/me", jwtMW, h.Me)
	authGroup.Post("/change-password", jwtMW, csrfMW, h.ChangePassword)

	adminGroup := api.Group("/admin", jwtMW, csrfMW, adminMW)
	adminGroup.Get("/users", h.ListUsers)
	adminGroup.Post("/users", h.CreateUser)
	adminGroup.Patch("/users/:id", h.UpdateUser)
	adminGroup.Post("/users/:id/reset-password", h.AdminResetPassword)
	adminGroup.Post("/users/:id/unlock", h.UnlockUser)
	adminGroup.Get("/schools", h.ListSchools)
	adminGroup.Post("/schools", h.CreateSchool)
	adminGroup.Patch("/schools/:id", h.UpdateSchool)
	adminGroup.Get("/sessions", h.ListActiveSessions)
	adminGroup.Post("/sessions/:id/revoke", h.RevokeSessionByID)
	adminGroup.Get("/audit-logs", h.ListAuditLogs)
}

func (h *Handler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	res, err := h.service.Login(c.UserContext(), req, c.Get("User-Agent"), c.IP())
	if err != nil {
		if errors.Is(err, ErrAccountLocked) {
			return utils.ErrorResponse(c, fiber.StatusTooManyRequests, "Account temporarily locked. Try again later.")
		}
		if errors.Is(err, ErrInvalidCredentials) {
			return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Invalid username or password")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Authentication failed")
	}

	h.setAuthCookies(c, res)
	return utils.SuccessResponse(c, fiber.StatusOK, "Login successful", fiber.Map{
		"user":       res.User,
		"csrf_token": res.CSRFToken,
	})
}

func (h *Handler) Refresh(c *fiber.Ctx) error {
	rawRefresh := c.Cookies(middleware.RefreshTokenCookie)
	res, err := h.service.Refresh(c.UserContext(), rawRefresh, c.IP())
	if err != nil {
		h.clearAuthCookies(c)
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Session expired")
	}

	h.setAuthCookies(c, res)
	return utils.SuccessResponse(c, fiber.StatusOK, "Session refreshed", fiber.Map{
		"user":       res.User,
		"csrf_token": res.CSRFToken,
	})
}

func (h *Handler) Logout(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(int)
	role, _ := c.Locals("role").(string)
	sessionID, _ := c.Locals("session_id").(string)

	if err := h.service.Logout(c.UserContext(), sessionID, userID, role, c.IP()); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to logout")
	}
	h.clearAuthCookies(c)
	return utils.SuccessResponse(c, fiber.StatusOK, "Logged out successfully", nil)
}

func (h *Handler) Me(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(int)
	role, _ := c.Locals("role").(string)

	user, err := h.service.Me(c.UserContext(), userID, role)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "User not found")
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Authenticated user", fiber.Map{
		"user": user,
	})
}

func (h *Handler) ChangePassword(c *fiber.Ctx) error {
	var req ChangePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	userID, _ := c.Locals("user_id").(int)
	role, _ := c.Locals("role").(string)

	if err := h.service.ChangePassword(c.UserContext(), userID, role, req, c.IP()); err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Current password is incorrect")
		}
		if errors.Is(err, ErrValidation) {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update password")
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Password updated successfully", nil)
}

func (h *Handler) ListUsers(c *fiber.Ctx) error {
	adminID, _ := c.Locals("user_id").(int)
	users, err := h.service.ListUsers(c.UserContext(), adminID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to list users")
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Users retrieved", users)
}

func (h *Handler) CreateUser(c *fiber.Ctx) error {
	var req CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	adminID, _ := c.Locals("user_id").(int)

	created, err := h.service.CreateUser(c.UserContext(), adminID, req, c.IP())
	if err != nil {
		if errors.Is(err, ErrValidation) {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		}
		return utils.ErrorResponse(c, fiber.StatusConflict, "Could not create user (username may already exist)")
	}
	return utils.SuccessResponse(c, fiber.StatusCreated, "User created", created)
}

func (h *Handler) UpdateUser(c *fiber.Ctx) error {
	targetID, err := strconv.Atoi(c.Params("id"))
	if err != nil || targetID <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	var req UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	adminID, _ := c.Locals("user_id").(int)

	updated, err := h.service.UpdateUser(c.UserContext(), adminID, targetID, req, c.IP())
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "User not found")
		}
		if errors.Is(err, ErrValidation) {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update user")
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "User updated", updated)
}

func (h *Handler) AdminResetPassword(c *fiber.Ctx) error {
	targetID, err := strconv.Atoi(c.Params("id"))
	if err != nil || targetID <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	var req ResetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	adminID, _ := c.Locals("user_id").(int)

	if err := h.service.AdminResetPassword(c.UserContext(), adminID, targetID, req, c.IP()); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "User not found")
		}
		if errors.Is(err, ErrValidation) {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to reset password")
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Password reset and existing sessions revoked", nil)
}

func (h *Handler) ListAuditLogs(c *fiber.Ctx) error {
	adminID, _ := c.Locals("user_id").(int)
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	filter := AuditLogFilter{
		Page:   page,
		Limit:  limit,
		Action: c.Query("action", ""),
		Search: c.Query("search", ""),
	}

	result, err := h.service.ListAuditLogs(c.UserContext(), adminID, filter)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch audit logs")
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Audit logs retrieved", result)
}

func (h *Handler) UnlockUser(c *fiber.Ctx) error {
	targetID, err := strconv.Atoi(c.Params("id"))
	if err != nil || targetID <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}
	adminID, _ := c.Locals("user_id").(int)
	if err := h.service.UnlockUser(c.UserContext(), adminID, targetID, c.IP()); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "User not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to unlock user")
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "User account unlocked", nil)
}

func (h *Handler) ListSchools(c *fiber.Ctx) error {
	adminID, _ := c.Locals("user_id").(int)
	role, _ := c.Locals("role").(string)
	schools, err := h.service.ListSchools(c.UserContext(), adminID, role)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to list schools")
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Schools retrieved", schools)
}

func (h *Handler) CreateSchool(c *fiber.Ctx) error {
	var req CreateSchoolRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	adminID, _ := c.Locals("user_id").(int)
	school, err := h.service.CreateSchool(c.UserContext(), adminID, req, c.IP())
	if err != nil {
		if errors.Is(err, ErrValidation) {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		}
		return utils.ErrorResponse(c, fiber.StatusConflict, "Could not create school (code may already exist)")
	}
	return utils.SuccessResponse(c, fiber.StatusCreated, "School created", school)
}

func (h *Handler) UpdateSchool(c *fiber.Ctx) error {
	schoolID, err := strconv.Atoi(c.Params("id"))
	if err != nil || schoolID <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid school ID")
	}
	var req UpdateSchoolRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	adminID, _ := c.Locals("user_id").(int)
	school, err := h.service.UpdateSchool(c.UserContext(), adminID, schoolID, req, c.IP())
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "School not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update school")
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "School updated", school)
}

func (h *Handler) ListActiveSessions(c *fiber.Ctx) error {
	adminID, _ := c.Locals("user_id").(int)
	sessions, err := h.service.ListActiveSessions(c.UserContext(), adminID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to list active sessions")
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Active sessions retrieved", sessions)
}

func (h *Handler) RevokeSessionByID(c *fiber.Ctx) error {
	sessionID := c.Params("id")
	if sessionID == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Session ID is required")
	}
	adminID, _ := c.Locals("user_id").(int)
	if err := h.service.RevokeSessionByID(c.UserContext(), adminID, sessionID, c.IP()); err != nil {
		if errors.Is(err, ErrSessionNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Active session not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to revoke session")
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Session revoked", nil)
}

func (h *Handler) setAuthCookies(c *fiber.Ctx, res *AuthResult) {
	c.Cookie(&fiber.Cookie{
		Name:     middleware.AccessTokenCookie,
		Value:    res.AccessToken,
		Path:     "/",
		Expires:  time.Now().Add(h.cfg.AccessTokenTTL),
		HTTPOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: h.cfg.CookieSameSite,
	})
	c.Cookie(&fiber.Cookie{
		Name:     middleware.RefreshTokenCookie,
		Value:    res.RefreshToken,
		Path:     "/api/v1/auth",
		Expires:  time.Now().Add(h.cfg.RefreshTokenTTL),
		HTTPOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: h.cfg.CookieSameSite,
	})
	c.Cookie(&fiber.Cookie{
		Name:     middleware.CSRFCookie,
		Value:    res.CSRFToken,
		Path:     "/",
		Expires:  time.Now().Add(h.cfg.RefreshTokenTTL),
		HTTPOnly: false,
		Secure:   h.cfg.CookieSecure,
		SameSite: h.cfg.CookieSameSite,
	})
}

func (h *Handler) clearAuthCookies(c *fiber.Ctx) {
	expired := time.Unix(0, 0)
	c.Cookie(&fiber.Cookie{
		Name:     middleware.AccessTokenCookie,
		Value:    "",
		Path:     "/",
		Expires:  expired,
		HTTPOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: h.cfg.CookieSameSite,
	})
	c.Cookie(&fiber.Cookie{
		Name:     middleware.RefreshTokenCookie,
		Value:    "",
		Path:     "/api/v1/auth",
		Expires:  expired,
		HTTPOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: h.cfg.CookieSameSite,
	})
	c.Cookie(&fiber.Cookie{
		Name:     middleware.CSRFCookie,
		Value:    "",
		Path:     "/",
		Expires:  expired,
		HTTPOnly: false,
		Secure:   h.cfg.CookieSecure,
		SameSite: h.cfg.CookieSameSite,
	})
}
