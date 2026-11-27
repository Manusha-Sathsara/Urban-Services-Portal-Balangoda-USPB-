package schoolrewards

import (
	"errors"
	"log"
	"strconv"

	"github.com/BalangodaUC/uspb_backend/internal/middleware"
	"github.com/BalangodaUC/uspb_backend/pkg/utils"
	"github.com/gofiber/fiber/v2"
)

type LedgerHandler struct {
	service *LedgerService
}

func NewLedgerHandler(service *LedgerService) *LedgerHandler {
	return &LedgerHandler{service: service}
}

func actorFromCtx(c *fiber.Ctx) ActorContext {
	uid, _ := c.Locals("user_id").(int)
	role, _ := c.Locals("role").(string)
	schoolID, _ := c.Locals("school_id").(*int)
	return ActorContext{
		UserID:   uid,
		Role:     role,
		SchoolID: schoolID,
	}
}

func (h *LedgerHandler) RegisterRoutes(router fiber.Router) {
	sr := router.Group("/school-rewards")

	sr.Get("/dashboard", h.DashboardSummary)

	sr.Get("/students", h.ListStudents)
	sr.Post("/students", h.CreateStudent)
	sr.Get("/students/:id", h.GetStudent)
	sr.Patch("/students/:id", h.UpdateStudent)
	sr.Get("/students/:id/transactions", h.ListStudentTransactions)

	sr.Get("/collections", h.ListCollections)
	sr.Post("/collections", h.RecordCollection)
	sr.Post("/collections/:id/reverse", h.ReverseCollection)

	sr.Get("/payouts", h.ListPayouts)
	sr.Post("/payouts", h.RecordPayout)
	sr.Post("/payouts/:id/reverse", middleware.RequireRoles("GARBAGE_SUPERVISOR", "ADMIN"), h.ReversePayout)

	sr.Get("/classes", h.ListClasses)
	sr.Post("/classes", h.CreateClass)
	sr.Patch("/classes/:id", h.UpdateClass)
	sr.Get("/student-badges", h.ListStudentBadges)
}

func (h *LedgerHandler) DashboardSummary(c *fiber.Ctx) error {
	var schoolFilter *int
	if raw := c.Query("school_id"); raw != "" {
		if id, err := strconv.Atoi(raw); err == nil && id > 0 {
			schoolFilter = &id
		}
	}
	sum, err := h.service.GetDashboardSummary(c.UserContext(), actorFromCtx(c), schoolFilter)
	if err != nil {
		return mapLedgerError(c, err)
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "School rewards summary retrieved", sum)
}

func (h *LedgerHandler) ListStudents(c *fiber.Ctx) error {
	var schoolFilter *int
	if raw := c.Query("school_id"); raw != "" {
		if id, err := strconv.Atoi(raw); err == nil && id > 0 {
			schoolFilter = &id
		}
	}
	students, err := h.service.ListStudents(c.UserContext(), actorFromCtx(c), schoolFilter, c.Query("search"))
	if err != nil {
		return mapLedgerError(c, err)
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Students retrieved", students)
}

func (h *LedgerHandler) GetStudent(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid student ID")
	}
	student, err := h.service.GetStudent(c.UserContext(), actorFromCtx(c), id)
	if err != nil {
		return mapLedgerError(c, err)
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Student retrieved", student)
}

func (h *LedgerHandler) CreateStudent(c *fiber.Ctx) error {
	var req CreateStudentRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	created, err := h.service.CreateStudent(c.UserContext(), actorFromCtx(c), req)
	if err != nil {
		return mapLedgerError(c, err)
	}
	return utils.SuccessResponse(c, fiber.StatusCreated, "Student registered", created)
}

func (h *LedgerHandler) UpdateStudent(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid student ID")
	}
	var req UpdateStudentRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	updated, err := h.service.UpdateStudent(c.UserContext(), actorFromCtx(c), id, req)
	if err != nil {
		return mapLedgerError(c, err)
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Student updated", updated)
}

func (h *LedgerHandler) ListStudentTransactions(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid student ID")
	}
	txs, err := h.service.ListStudentTransactions(c.UserContext(), actorFromCtx(c), id)
	if err != nil {
		return mapLedgerError(c, err)
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Student point transactions retrieved", txs)
}

func (h *LedgerHandler) ListCollections(c *fiber.Ctx) error {
	var studentID *int
	if raw := c.Query("student_id"); raw != "" {
		if id, err := strconv.Atoi(raw); err == nil && id > 0 {
			studentID = &id
		}
	}
	cols, err := h.service.ListCollections(c.UserContext(), actorFromCtx(c), studentID)
	if err != nil {
		return mapLedgerError(c, err)
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Collections retrieved", cols)
}

func (h *LedgerHandler) RecordCollection(c *fiber.Ctx) error {
	var req RecordCollectionRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	col, err := h.service.RecordCollection(c.UserContext(), actorFromCtx(c), req)
	if err != nil {
		return mapLedgerError(c, err)
	}
	return utils.SuccessResponse(c, fiber.StatusCreated, "Waste collection recorded", col)
}

func (h *LedgerHandler) ReverseCollection(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid collection ID")
	}
	var req ReverseRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.service.ReverseCollection(c.UserContext(), actorFromCtx(c), id, req.Reason); err != nil {
		return mapLedgerError(c, err)
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Collection reversed", nil)
}

func (h *LedgerHandler) ListPayouts(c *fiber.Ctx) error {
	var studentID *int
	if raw := c.Query("student_id"); raw != "" {
		if id, err := strconv.Atoi(raw); err == nil && id > 0 {
			studentID = &id
		}
	}
	payouts, err := h.service.ListPayouts(c.UserContext(), actorFromCtx(c), studentID)
	if err != nil {
		return mapLedgerError(c, err)
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Payouts retrieved", payouts)
}

func (h *LedgerHandler) RecordPayout(c *fiber.Ctx) error {
	var req RecordPayoutRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	payout, remaining, err := h.service.RecordPayout(c.UserContext(), actorFromCtx(c), req)
	if err != nil {
		return mapLedgerError(c, err)
	}
	return utils.SuccessResponse(c, fiber.StatusCreated, "Reward payout recorded", fiber.Map{
		"payout":            payout,
		"remaining_points":  remaining,
	})
}

func (h *LedgerHandler) ReversePayout(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid payout ID")
	}
	var req ReverseRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.service.ReversePayout(c.UserContext(), actorFromCtx(c), id, req.Reason); err != nil {
		return mapLedgerError(c, err)
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Payout reversed", nil)
}

func (h *LedgerHandler) ListClasses(c *fiber.Ctx) error {
	var schoolFilter *int
	if raw := c.Query("school_id"); raw != "" {
		if id, err := strconv.Atoi(raw); err == nil && id > 0 {
			schoolFilter = &id
		}
	}
	classes, err := h.service.ListClasses(c.UserContext(), actorFromCtx(c), schoolFilter)
	if err != nil {
		return mapLedgerError(c, err)
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Classes retrieved", classes)
}

func (h *LedgerHandler) CreateClass(c *fiber.Ctx) error {
	var req CreateClassRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	created, err := h.service.CreateClass(c.UserContext(), actorFromCtx(c), req)
	if err != nil {
		return mapLedgerError(c, err)
	}
	return utils.SuccessResponse(c, fiber.StatusCreated, "Class created", created)
}

func (h *LedgerHandler) UpdateClass(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid class ID")
	}
	var req UpdateClassRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	updated, err := h.service.UpdateClass(c.UserContext(), actorFromCtx(c), id, req)
	if err != nil {
		return mapLedgerError(c, err)
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Class updated", updated)
}

func (h *LedgerHandler) ListStudentBadges(c *fiber.Ctx) error {
	var schoolFilter *int
	if raw := c.Query("school_id"); raw != "" {
		if id, err := strconv.Atoi(raw); err == nil && id > 0 {
			schoolFilter = &id
		}
	}
	list, err := h.service.SyncAndListStudentBadges(c.UserContext(), actorFromCtx(c), schoolFilter)
	if err != nil {
		return mapLedgerError(c, err)
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Student badges retrieved", list)
}

func mapLedgerError(c *fiber.Ctx, err error) error {
	switch {
	case errors.Is(err, ErrValidation):
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	case errors.Is(err, ErrCrossSchoolForbidden):
		return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
	case errors.Is(err, ErrStudentNotFound), errors.Is(err, ErrCollectionNotFound), errors.Is(err, ErrPayoutNotFound):
		return utils.ErrorResponse(c, fiber.StatusNotFound, err.Error())
	case errors.Is(err, ErrInsufficientPoints), errors.Is(err, ErrStudentInactive), errors.Is(err, ErrAlreadyReversed):
		return utils.ErrorResponse(c, fiber.StatusConflict, err.Error())
	default:
		log.Printf("[schoolrewards] unexpected error: %v", err)
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "School rewards operation failed")
	}
}
