package schoolrewards

import (
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/BalangodaUC/uspb_backend/internal/middleware"
	"github.com/BalangodaUC/uspb_backend/pkg/utils"
	"github.com/gofiber/fiber/v2"
)

// CategoryHandler handles HTTP requests for Waste Category Management
type CategoryHandler struct {
	service CategoryService
}

// NewCategoryHandler creates a new CategoryHandler instance
func NewCategoryHandler(service CategoryService) *CategoryHandler {
	return &CategoryHandler{service: service}
}

// RegisterRoutes registers category endpoints with authorization middleware
func (h *CategoryHandler) RegisterRoutes(router fiber.Router) {
	categories := router.Group("/categories")

	// Protected endpoints - require valid JWT
	categories.Use(middleware.JWTMiddleware())

	// 1. Endpoint accessible to TEACHERS, SUPERVISORS, and ADMINS
	// Teachers only have read access to active categories for waste logging
	categories.Get("/active", middleware.RequireRoles("ADMIN", "GARBAGE_SUPERVISOR", "TEACHER"), h.GetActive)

	// 2. Municipal Council Administration endpoints (require ADMIN or GARBAGE_SUPERVISOR)
	councilGroup := categories.Group("", middleware.RequireRoles("ADMIN", "GARBAGE_SUPERVISOR"))

	councilGroup.Get("/", h.List)
	councilGroup.Get("/stats", h.GetStats)
	councilGroup.Get("/:id", h.GetByID)
	councilGroup.Get("/:id/rate-history", h.GetRateHistory)
	councilGroup.Post("/", h.Create)
	councilGroup.Put("/:id", h.Update)
	councilGroup.Patch("/:id/status", h.UpdateStatus)
	councilGroup.Put("/:id/status", h.UpdateStatus)
	councilGroup.Patch("/:id/rate", h.UpdateRate)
	councilGroup.Put("/:id/rate", h.UpdateRate)

	// 3. Deletion restricted strictly to ADMIN
	categories.Delete("/:id", middleware.RequireRoles("ADMIN"), h.Delete)
}

// GetActive returns list of active categories for drop-downs and teachers
func (h *CategoryHandler) GetActive(c *fiber.Ctx) error {
	categories, err := h.service.GetActiveCategories()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to retrieve active categories: "+err.Error())
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Active categories retrieved successfully", categories)
}

// GetStats returns municipal metrics regarding waste categories
func (h *CategoryHandler) GetStats(c *fiber.Ctx) error {
	stats, err := h.service.GetStats()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to retrieve category statistics: "+err.Error())
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Category statistics retrieved successfully", stats)
}

// List returns filtered and paginated waste categories
func (h *CategoryHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := c.Query("search", "")
	status := c.Query("status", "")
	sortField := c.Query("sort_by", "id")
	sortOrder := c.Query("order", "asc")

	filter := CategoryListFilter{
		Search:    search,
		Status:    status,
		Page:      page,
		Limit:     limit,
		SortField: sortField,
		SortOrder: sortOrder,
	}

	result, err := h.service.ListCategories(filter)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to retrieve categories: "+err.Error())
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Categories retrieved successfully", result)
}

// GetByID returns category details by ID
func (h *CategoryHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID parameter")
	}

	cat, err := h.service.GetCategoryByID(id)
	if err != nil {
		if errors.Is(err, ErrCategoryNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Waste category not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to retrieve category: "+err.Error())
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Category retrieved successfully", cat)
}

// GetRateHistory returns chronological rate change records for a category
func (h *CategoryHandler) GetRateHistory(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID parameter")
	}

	history, err := h.service.GetRateHistory(id)
	if err != nil {
		if errors.Is(err, ErrCategoryNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Waste category not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to retrieve rate history: "+err.Error())
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Rate history retrieved successfully", history)
}

// Create handles waste category registration
func (h *CategoryHandler) Create(c *fiber.Ctx) error {
	var req CreateCategoryRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload format")
	}

	changedBy := getOperatorIdentifier(c)

	cat, err := h.service.CreateCategory(&req, changedBy)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidCategoryName), errors.Is(err, ErrInvalidMeasurementUnit),
			errors.Is(err, ErrInvalidPointsRate), errors.Is(err, ErrInvalidCategoryStatus):
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		case errors.Is(err, ErrDuplicateCategoryName):
			return utils.ErrorResponse(c, fiber.StatusConflict, fmt.Sprintf("A waste category named '%s' already exists", strings.TrimSpace(req.Name)))
		default:
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create category: "+err.Error())
		}
	}

	return utils.SuccessResponse(c, fiber.StatusCreated, "Waste category created successfully", cat)
}

// Update handles editing waste category information
func (h *CategoryHandler) Update(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID parameter")
	}

	var req UpdateCategoryRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload format")
	}

	cat, err := h.service.UpdateCategory(id, &req)
	if err != nil {
		switch {
		case errors.Is(err, ErrCategoryNotFound):
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Waste category not found")
		case errors.Is(err, ErrInvalidCategoryName), errors.Is(err, ErrInvalidMeasurementUnit), errors.Is(err, ErrInvalidCategoryStatus):
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		case errors.Is(err, ErrDuplicateCategoryName):
			return utils.ErrorResponse(c, fiber.StatusConflict, fmt.Sprintf("Category name '%s' is already taken by another category", strings.TrimSpace(req.Name)))
		case errors.Is(err, ErrUnitChangeNotAllowed):
			return utils.ErrorResponse(c, fiber.StatusConflict, err.Error())
		default:
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update category: "+err.Error())
		}
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Waste category updated successfully", cat)
}

// UpdateStatus activates or deactivates a waste category
func (h *CategoryHandler) UpdateStatus(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID parameter")
	}

	var req UpdateCategoryStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload format")
	}

	cat, err := h.service.UpdateCategoryStatus(id, req.Status)
	if err != nil {
		switch {
		case errors.Is(err, ErrCategoryNotFound):
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Waste category not found")
		case errors.Is(err, ErrInvalidCategoryStatus):
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		default:
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update category status: "+err.Error())
		}
	}

	action := "activated"
	if cat.Status == CategoryStatusInactive {
		action = "deactivated"
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Waste category "+action+" successfully", cat)
}

// UpdateRate handles point rate revision with audit tracking
func (h *CategoryHandler) UpdateRate(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID parameter")
	}

	var req UpdateRateRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload format")
	}

	changedBy := getOperatorIdentifier(c)

	cat, err := h.service.UpdateCategoryRate(id, &req, changedBy)
	if err != nil {
		switch {
		case errors.Is(err, ErrCategoryNotFound):
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Waste category not found")
		case errors.Is(err, ErrInvalidPointsRate), errors.Is(err, ErrReasonRequired):
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		case errors.Is(err, ErrRateUnchanged):
			return utils.ErrorResponse(c, fiber.StatusBadRequest, "New point rate must be different from the current rate")
		default:
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update category rate: "+err.Error())
		}
	}

	return utils.SuccessResponse(c, fiber.StatusOK, fmt.Sprintf("Point rate for '%s' successfully revised to %.1f pts/%s", cat.Name, cat.CurrentPointsPerUnit, cat.MeasurementUnit), cat)
}

// Delete permanently removes a category if no collections exist
func (h *CategoryHandler) Delete(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID parameter")
	}

	err = h.service.DeleteCategory(id)
	if err != nil {
		switch {
		case errors.Is(err, ErrCategoryNotFound):
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Waste category not found")
		case errors.Is(err, ErrCategoryInUse):
			return utils.ErrorResponse(c, fiber.StatusConflict, err.Error())
		default:
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete category: "+err.Error())
		}
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Waste category deleted successfully", nil)
}

// getOperatorIdentifier extracts the user identity for audit trail records
func getOperatorIdentifier(c *fiber.Ctx) string {
	email, _ := c.Locals("email").(string)
	role, _ := c.Locals("role").(string)
	if email != "" {
		if role != "" {
			return fmt.Sprintf("%s (%s)", email, role)
		}
		return email
	}
	userID, _ := c.Locals("user_id").(string)
	if userID != "" {
		return fmt.Sprintf("User #%s (%s)", userID, role)
	}
	return "Council Officer"
}
