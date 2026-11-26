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

// BadgeHandler handles HTTP requests for Badge Configuration, Eligibility, and Awards
type BadgeHandler struct {
	service BadgeService
}

// NewBadgeHandler creates a new BadgeHandler instance
func NewBadgeHandler(service BadgeService) *BadgeHandler {
	return &BadgeHandler{service: service}
}

// RegisterRoutes registers badge endpoints with authorization middleware
func (h *BadgeHandler) RegisterRoutes(router fiber.Router) {
	badges := router.Group("/badges")

	// Protected endpoints - require valid JWT
	badges.Use(middleware.JWTMiddleware())

	// 1. Endpoints accessible to Teachers, Supervisors, and Admins
	badges.Get("/active", middleware.RequireRoles("ADMIN", "GARBAGE_SUPERVISOR", "TEACHER"), h.GetActive)
	badges.Get("/eligibility", middleware.RequireRoles("ADMIN", "GARBAGE_SUPERVISOR", "TEACHER"), h.ListEligibility)
	badges.Get("/awards", middleware.RequireRoles("ADMIN", "GARBAGE_SUPERVISOR", "TEACHER"), h.ListAwards)
	badges.Get("/awards/export/csv", middleware.RequireRoles("ADMIN", "GARBAGE_SUPERVISOR", "TEACHER"), h.ExportAwardsCSV)
	badges.Get("/awards/:id", middleware.RequireRoles("ADMIN", "GARBAGE_SUPERVISOR", "TEACHER"), h.GetAwardByID)
	badges.Post("/awards", middleware.RequireRoles("ADMIN", "GARBAGE_SUPERVISOR", "TEACHER"), h.CreateAward)

	// 2. Badge Catalog inspection (all authorized roles can view)
	badges.Get("/", middleware.RequireRoles("ADMIN", "GARBAGE_SUPERVISOR", "TEACHER"), h.List)
	badges.Get("/stats", middleware.RequireRoles("ADMIN", "GARBAGE_SUPERVISOR"), h.GetStats)
	badges.Get("/:id", middleware.RequireRoles("ADMIN", "GARBAGE_SUPERVISOR", "TEACHER"), h.GetByID)
	badges.Get("/:id/threshold-history", middleware.RequireRoles("ADMIN", "GARBAGE_SUPERVISOR"), h.GetThresholdHistory)

	// 3. Council Supervisor Administration endpoints (create, edit, revise threshold, toggle status)
	councilGroup := badges.Group("", middleware.RequireRoles("ADMIN", "GARBAGE_SUPERVISOR"))
	councilGroup.Post("/", h.Create)
	councilGroup.Put("/:id", h.Update)
	councilGroup.Patch("/:id/status", h.UpdateStatus)
	councilGroup.Put("/:id/status", h.UpdateStatus)
	councilGroup.Patch("/:id/threshold", h.UpdateThreshold)
	councilGroup.Put("/:id/threshold", h.UpdateThreshold)
}

// List returns filtered and paginated badge definitions
func (h *BadgeHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := c.Query("search", "")
	status := c.Query("status", "")
	sortField := c.Query("sort_by", "id")
	sortOrder := c.Query("order", "asc")

	filter := BadgeListFilter{
		Search:    search,
		Status:    status,
		Page:      page,
		Limit:     limit,
		SortField: sortField,
		SortOrder: sortOrder,
	}

	result, err := h.service.ListBadges(filter)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to retrieve badges: "+err.Error())
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Badges retrieved successfully", result)
}

// GetActive returns list of active badge definitions
func (h *BadgeHandler) GetActive(c *fiber.Ctx) error {
	badges, err := h.service.GetActiveBadges()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to retrieve active badges: "+err.Error())
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Active badges retrieved successfully", badges)
}

// GetStats returns aggregated municipal badge indicators
func (h *BadgeHandler) GetStats(c *fiber.Ctx) error {
	stats, err := h.service.GetStats()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to retrieve badge statistics: "+err.Error())
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Badge statistics retrieved successfully", stats)
}

// GetByID returns a single badge definition by ID
func (h *BadgeHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid badge ID parameter")
	}

	badge, err := h.service.GetBadgeByID(id)
	if err != nil {
		if errors.Is(err, ErrBadgeNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Badge definition not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to retrieve badge: "+err.Error())
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Badge retrieved successfully", badge)
}

// GetThresholdHistory returns the chronological threshold change records
func (h *BadgeHandler) GetThresholdHistory(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid badge ID parameter")
	}

	history, err := h.service.GetThresholdHistory(id)
	if err != nil {
		if errors.Is(err, ErrBadgeNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Badge definition not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to retrieve threshold history: "+err.Error())
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Threshold history retrieved successfully", history)
}

// Create handles badge registration
func (h *BadgeHandler) Create(c *fiber.Ctx) error {
	var req CreateBadgeRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload format")
	}

	changedBy := getOperatorIdentifier(c)

	badge, err := h.service.CreateBadge(&req, changedBy)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidBadgeName), errors.Is(err, ErrInvalidThreshold),
			errors.Is(err, ErrInvalidMetric), errors.Is(err, ErrInvalidBadgeStatus):
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		case errors.Is(err, ErrDuplicateBadgeName):
			return utils.ErrorResponse(c, fiber.StatusConflict, fmt.Sprintf("A badge definition named '%s' already exists", strings.TrimSpace(req.Name)))
		default:
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create badge definition: "+err.Error())
		}
	}

	return utils.SuccessResponse(c, fiber.StatusCreated, "Badge definition registered successfully", badge)
}

// Update handles editing badge description, icon, and status
func (h *BadgeHandler) Update(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid badge ID parameter")
	}

	var req UpdateBadgeRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload format")
	}

	badge, err := h.service.UpdateBadge(id, &req)
	if err != nil {
		switch {
		case errors.Is(err, ErrBadgeNotFound):
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Badge definition not found")
		case errors.Is(err, ErrInvalidBadgeName), errors.Is(err, ErrInvalidBadgeStatus):
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		case errors.Is(err, ErrDuplicateBadgeName):
			return utils.ErrorResponse(c, fiber.StatusConflict, fmt.Sprintf("Badge name '%s' is already in use", strings.TrimSpace(req.Name)))
		default:
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update badge: "+err.Error())
		}
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Badge definition updated successfully", badge)
}

// UpdateStatus activates or deactivates a badge definition
func (h *BadgeHandler) UpdateStatus(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid badge ID parameter")
	}

	var req UpdateBadgeStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload format")
	}

	badge, err := h.service.UpdateBadgeStatus(id, req.Status)
	if err != nil {
		switch {
		case errors.Is(err, ErrBadgeNotFound):
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Badge definition not found")
		case errors.Is(err, ErrInvalidBadgeStatus):
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		default:
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update badge status: "+err.Error())
		}
	}

	action := "activated"
	if badge.Status == BadgeStatusInactive {
		action = "deactivated"
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Badge "+action+" successfully", badge)
}

// UpdateThreshold revises the milestone threshold with audit tracking
func (h *BadgeHandler) UpdateThreshold(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid badge ID parameter")
	}

	var req UpdateThresholdRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload format")
	}

	changedBy := getOperatorIdentifier(c)

	badge, err := h.service.UpdateBadgeThreshold(id, &req, changedBy)
	if err != nil {
		switch {
		case errors.Is(err, ErrBadgeNotFound):
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Badge definition not found")
		case errors.Is(err, ErrInvalidThreshold), errors.Is(err, ErrReasonRequired), errors.Is(err, ErrInvalidMetric):
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		case errors.Is(err, ErrThresholdUnchanged):
			return utils.ErrorResponse(c, fiber.StatusBadRequest, "New threshold must be different from current configuration")
		default:
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update badge threshold: "+err.Error())
		}
	}

	return utils.SuccessResponse(c, fiber.StatusOK, fmt.Sprintf("Milestone threshold for '%s' updated to %.1f pts", badge.Name, badge.MilestoneThreshold), badge)
}

// ListEligibility evaluates student eligibility against configured badge milestones
func (h *BadgeHandler) ListEligibility(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := c.Query("search", "")
	awardedStatus := c.Query("awarded_status", "all")

	var schoolIDPtr *int
	if schoolParam := c.Query("school_id", ""); schoolParam != "" {
		if sid, err := strconv.Atoi(schoolParam); err == nil && sid > 0 {
			schoolIDPtr = &sid
		}
	}

	// Security & School Isolation: Teachers are strictly bound to their assigned school
	role, _ := c.Locals("role").(string)
	if role == "TEACHER" {
		teacherSchoolID, ok := c.Locals("school_id").(int)
		if !ok || teacherSchoolID <= 0 {
			return utils.ErrorResponse(c, fiber.StatusForbidden, "Teacher user profile lacks assigned school affiliation")
		}
		if schoolIDPtr != nil && *schoolIDPtr != teacherSchoolID {
			return utils.ErrorResponse(c, fiber.StatusForbidden, "Access forbidden: Teachers can only view student eligibility for their own school")
		}
		schoolIDPtr = &teacherSchoolID
	}

	var badgeIDPtr *int
	if badgeParam := c.Query("badge_id", ""); badgeParam != "" {
		if bid, err := strconv.Atoi(badgeParam); err == nil && bid > 0 {
			badgeIDPtr = &bid
		}
	}

	var eligibleOnlyPtr *bool
	if elParam := c.Query("eligible_only", ""); elParam != "" {
		b := (elParam == "true" || elParam == "1")
		eligibleOnlyPtr = &b
	}

	filter := EligibilityFilter{
		SchoolID:      schoolIDPtr,
		BadgeID:       badgeIDPtr,
		EligibleOnly:  eligibleOnlyPtr,
		AwardedStatus: awardedStatus,
		Search:        search,
		Page:          page,
		Limit:         limit,
	}

	result, err := h.service.ListEligibility(filter)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to evaluate student eligibility: "+err.Error())
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Student eligibility evaluated successfully", result)
}

// CreateAward records a badge bestowal for an eligible student
func (h *BadgeHandler) CreateAward(c *fiber.Ctx) error {
	var req CreateAwardRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload format")
	}

	awardedBy := getOperatorIdentifier(c)

	// School isolation check for teachers
	role, _ := c.Locals("role").(string)
	var teacherSchoolIDPtr *int
	if role == "TEACHER" {
		tsID, ok := c.Locals("school_id").(int)
		if !ok || tsID <= 0 {
			return utils.ErrorResponse(c, fiber.StatusForbidden, "Teacher user profile lacks assigned school affiliation")
		}
		teacherSchoolIDPtr = &tsID
	}

	award, err := h.service.CreateAward(&req, awardedBy, teacherSchoolIDPtr)
	if err != nil {
		switch {
		case errors.Is(err, ErrStudentNotFound), errors.Is(err, ErrBadgeNotFound):
			return utils.ErrorResponse(c, fiber.StatusNotFound, err.Error())
		case errors.Is(err, ErrBadgeNotActive), errors.Is(err, ErrStudentNotEligible):
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		case errors.Is(err, ErrBadgeAlreadyAwarded):
			return utils.ErrorResponse(c, fiber.StatusConflict, "This badge has already been awarded to this student")
		case errors.Is(err, ErrUnauthorizedSchoolAccess):
			return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
		default:
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to record badge award: "+err.Error())
		}
	}

	return utils.SuccessResponse(c, fiber.StatusCreated, fmt.Sprintf("Badge '%s' successfully awarded to %s (Ref: %s)", award.BadgeName, award.StudentName, award.AwardReference), award)
}

// ListAwards returns filtered and paginated recorded badge awards
func (h *BadgeHandler) ListAwards(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := c.Query("search", "")
	startDate := c.Query("start_date", "")
	endDate := c.Query("end_date", "")

	var schoolIDPtr *int
	if schoolParam := c.Query("school_id", ""); schoolParam != "" {
		if sid, err := strconv.Atoi(schoolParam); err == nil && sid > 0 {
			schoolIDPtr = &sid
		}
	}

	// Security & School Isolation: Teachers can only view awards for their assigned school
	role, _ := c.Locals("role").(string)
	if role == "TEACHER" {
		teacherSchoolID, ok := c.Locals("school_id").(int)
		if !ok || teacherSchoolID <= 0 {
			return utils.ErrorResponse(c, fiber.StatusForbidden, "Teacher user profile lacks assigned school affiliation")
		}
		if schoolIDPtr != nil && *schoolIDPtr != teacherSchoolID {
			return utils.ErrorResponse(c, fiber.StatusForbidden, "Access forbidden: Teachers can only view awards from their own school")
		}
		schoolIDPtr = &teacherSchoolID
	}

	var badgeIDPtr *int
	if badgeParam := c.Query("badge_id", ""); badgeParam != "" {
		if bid, err := strconv.Atoi(badgeParam); err == nil && bid > 0 {
			badgeIDPtr = &bid
		}
	}

	filter := AwardListFilter{
		SchoolID:  schoolIDPtr,
		BadgeID:   badgeIDPtr,
		Search:    search,
		StartDate: startDate,
		EndDate:   endDate,
		Page:      page,
		Limit:     limit,
	}

	result, err := h.service.ListAwards(filter)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to retrieve awards: "+err.Error())
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Awards retrieved successfully", result)
}

// GetAwardByID returns a single award by its ID
func (h *BadgeHandler) GetAwardByID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid award ID parameter")
	}

	role, _ := c.Locals("role").(string)
	var teacherSchoolIDPtr *int
	if role == "TEACHER" {
		tsID, ok := c.Locals("school_id").(int)
		if ok && tsID > 0 {
			teacherSchoolIDPtr = &tsID
		}
	}

	award, err := h.service.GetAwardByID(id, teacherSchoolIDPtr)
	if err != nil {
		if errors.Is(err, ErrUnauthorizedSchoolAccess) {
			return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
		}
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Badge award record not found")
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Award details retrieved successfully", award)
}

// ExportAwardsCSV generates a downloadable CSV of award records
func (h *BadgeHandler) ExportAwardsCSV(c *fiber.Ctx) error {
	search := c.Query("search", "")
	startDate := c.Query("start_date", "")
	endDate := c.Query("end_date", "")

	var schoolIDPtr *int
	if schoolParam := c.Query("school_id", ""); schoolParam != "" {
		if sid, err := strconv.Atoi(schoolParam); err == nil && sid > 0 {
			schoolIDPtr = &sid
		}
	}

	role, _ := c.Locals("role").(string)
	if role == "TEACHER" {
		teacherSchoolID, ok := c.Locals("school_id").(int)
		if ok && teacherSchoolID > 0 {
			schoolIDPtr = &teacherSchoolID
		}
	}

	var badgeIDPtr *int
	if badgeParam := c.Query("badge_id", ""); badgeParam != "" {
		if bid, err := strconv.Atoi(badgeParam); err == nil && bid > 0 {
			badgeIDPtr = &bid
		}
	}

	filter := AwardListFilter{
		SchoolID:  schoolIDPtr,
		BadgeID:   badgeIDPtr,
		Search:    search,
		StartDate: startDate,
		EndDate:   endDate,
	}

	csvData, err := h.service.ExportAwardsCSV(filter)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to export awards: "+err.Error())
	}

	filename := fmt.Sprintf("uspb_badge_awards_%s.csv", strings.ReplaceAll(c.Query("start_date", "all"), "-", ""))
	c.Set("Content-Type", "text/csv")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

	return c.Send(csvData)
}
