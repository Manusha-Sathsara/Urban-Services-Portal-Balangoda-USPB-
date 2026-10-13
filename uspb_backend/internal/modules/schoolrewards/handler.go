package schoolrewards

import (
	"github.com/BalangodaUC/uspb_backend/pkg/utils"
	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	group := router.Group("/school-rewards")
	group.Get("/", h.List)
	group.Get("/:id", h.GetByID)
	group.Post("/", h.Create)
}

func (h *Handler) List(c *fiber.Ctx) error {
	records, err := h.service.ListRewards()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "School reward records retrieved", records)
}

func (h *Handler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	record, err := h.service.GetReward(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Reward record not found")
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Reward record retrieved", record)
}

func (h *Handler) Create(c *fiber.Ctx) error {
	var record SchoolRewardRecord
	if err := c.BodyParser(&record); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload")
	}
	if err := h.service.CreateReward(&record); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}
	return utils.SuccessResponse(c, fiber.StatusCreated, "Reward record created successfully", record)
}
