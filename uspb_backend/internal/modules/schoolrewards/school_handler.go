package schoolrewards

import (
	"errors"
	"strconv"
	"strings"

	"github.com/BalangodaUC/uspb_backend/internal/middleware"
	"github.com/BalangodaUC/uspb_backend/pkg/utils"
	"github.com/gofiber/fiber/v2"
)

// SchoolHandler handles HTTP requests for School Management
type SchoolHandler struct {
	service SchoolService
}

// NewSchoolHandler creates a new SchoolHandler
func NewSchoolHandler(service SchoolService) *SchoolHandler {
	return &SchoolHandler{service: service}
}

// RegisterRoutes registers school endpoints with authorization middleware
func (h *SchoolHandler) RegisterRoutes(router fiber.Router) {
	schools := router.Group("/schools")

	// Protected endpoints - require valid JWT and authorized council role
	schools.Use(middleware.JWTMiddleware())
	schools.Use(middleware.RequireRoles("ADMIN", "GARBAGE_SUPERVISOR"))

	schools.Get("/", h.List)
	schools.Get("/stats", h.GetStats)
	schools.Get("/:id", h.GetByID)
	schools.Post("/", h.Create)
	schools.Put("/:id", h.Update)
	schools.Patch("/:id/status", h.UpdateStatus)
	schools.Put("/:id/status", h.UpdateStatus)
	schools.Delete("/:id", middleware.RequireRoles("ADMIN"), h.Delete)
}

// GetStats retrieves global municipal program statistics across all schools
func (h *SchoolHandler) GetStats(c *fiber.Ctx) error {
	stats, err := h.service.GetStats()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to retrieve school statistics: "+err.Error())
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "School statistics retrieved successfully", stats)
}

// List retrieves paginated and filtered schools
func (h *SchoolHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := c.Query("search", "")
	status := c.Query("status", "")

	filter := SchoolListFilter{
		Search: search,
		Status: status,
		Page:   page,
		Limit:  limit,
	}

	result, err := h.service.ListSchools(filter)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to retrieve schools: "+err.Error())
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Schools retrieved successfully", result)
}

// GetByID retrieves a single school by its ID
func (h *SchoolHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid school ID parameter")
	}

	school, err := h.service.GetSchoolByID(id)
	if err != nil {
		if errors.Is(err, ErrSchoolNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "School not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to retrieve school: "+err.Error())
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "School retrieved successfully", school)
}

// Create handles school registration
func (h *SchoolHandler) Create(c *fiber.Ctx) error {
	var req CreateSchoolRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload format")
	}

	school, err := h.service.CreateSchool(&req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidSchoolName), errors.Is(err, ErrInvalidSchoolCode), errors.Is(err, ErrInvalidStatus):
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		case errors.Is(err, ErrDuplicateSchoolCode):
			return utils.ErrorResponse(c, fiber.StatusConflict, "School code '"+strings.ToUpper(strings.TrimSpace(req.SchoolCode))+"' is already registered")
		default:
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to register school: "+err.Error())
		}
	}

	return utils.SuccessResponse(c, fiber.StatusCreated, "School registered successfully", school)
}

// Update handles updating school details
func (h *SchoolHandler) Update(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid school ID parameter")
	}

	var req UpdateSchoolRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload format")
	}

	school, err := h.service.UpdateSchool(id, &req)
	if err != nil {
		switch {
		case errors.Is(err, ErrSchoolNotFound):
			return utils.ErrorResponse(c, fiber.StatusNotFound, "School not found")
		case errors.Is(err, ErrInvalidSchoolName), errors.Is(err, ErrInvalidSchoolCode), errors.Is(err, ErrInvalidStatus):
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		case errors.Is(err, ErrDuplicateSchoolCode):
			return utils.ErrorResponse(c, fiber.StatusConflict, "School code '"+strings.ToUpper(strings.TrimSpace(req.SchoolCode))+"' is already registered by another institution")
		default:
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update school: "+err.Error())
		}
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "School updated successfully", school)
}

// UpdateStatus activates or deactivates a school
func (h *SchoolHandler) UpdateStatus(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid school ID parameter")
	}

	var req UpdateSchoolStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload format")
	}

	school, err := h.service.UpdateSchoolStatus(id, req.Status)
	if err != nil {
		switch {
		case errors.Is(err, ErrSchoolNotFound):
			return utils.ErrorResponse(c, fiber.StatusNotFound, "School not found")
		case errors.Is(err, ErrInvalidStatus):
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		default:
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update school status: "+err.Error())
		}
	}

	action := "activated"
	if school.Status == SchoolStatusInactive {
		action = "deactivated"
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "School "+action+" successfully", school)
}

// Delete checks history and permanently deletes only if no historical records exist
func (h *SchoolHandler) Delete(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid school ID parameter")
	}

	err = h.service.DeleteSchool(id)
	if err != nil {
		switch {
		case errors.Is(err, ErrSchoolNotFound):
			return utils.ErrorResponse(c, fiber.StatusNotFound, "School not found")
		case errors.Is(err, ErrHasAssociatedHistory):
			return utils.ErrorResponse(c, fiber.StatusConflict, err.Error())
		default:
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete school: "+err.Error())
		}
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "School record deleted successfully", nil)
}
