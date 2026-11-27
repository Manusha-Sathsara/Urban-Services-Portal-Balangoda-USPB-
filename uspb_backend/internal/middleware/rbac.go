package middleware

import (
	"strconv"

	"github.com/BalangodaUC/uspb_backend/pkg/utils"
	"github.com/gofiber/fiber/v2"
)

// RequireRoles restricts endpoint access to specified user roles.
func RequireRoles(allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole, ok := c.Locals("role").(string)
		if !ok || userRole == "" {
			return utils.ErrorResponse(c, fiber.StatusForbidden, "Access denied: role not resolved")
		}

		for _, role := range allowedRoles {
			if userRole == role {
				return c.Next()
			}
		}

		return utils.ErrorResponse(c, fiber.StatusForbidden, "Access denied: insufficient permissions")
	}
}

// RequireSchoolScope ensures TEACHER accounts can only access resources belonging to their assigned school.
func RequireSchoolScope(paramName string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, _ := c.Locals("role").(string)
		if role != "TEACHER" {
			return c.Next()
		}

		assignedSchool, ok := c.Locals("school_id").(*int)
		if !ok || assignedSchool == nil {
			return utils.ErrorResponse(c, fiber.StatusForbidden, "Access denied: teacher has no assigned school")
		}

		if paramName != "" {
			if raw := c.Params(paramName); raw != "" {
				reqSchoolID, err := strconv.Atoi(raw)
				if err != nil || reqSchoolID != *assignedSchool {
					return utils.ErrorResponse(c, fiber.StatusForbidden, "Access denied: cross-school access is prohibited")
				}
			}
		}

		return c.Next()
	}
}
