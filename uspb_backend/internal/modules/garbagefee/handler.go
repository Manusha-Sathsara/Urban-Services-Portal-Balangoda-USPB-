package garbagefee

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
	group := router.Group("/garbage-fees")
	group.Get("/", h.List)
	group.Get("/:id", h.GetByID)
	group.Post("/", h.Create)
}

func (h *Handler) List(c *fiber.Ctx) error {
	records, err := h.service.ListRecords()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Garbage fee records retrieved", records)
}

func (h *Handler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	record, err := h.service.GetRecord(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Record not found")
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Record retrieved", record)
}

func (h *Handler) Create(c *fiber.Ctx) error {
	var record GarbageFeeRecord
	if err := c.BodyParser(&record); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload")
	}
	if err := h.service.CreateRecord(&record); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}
	return utils.SuccessResponse(c, fiber.StatusCreated, "Record created successfully", record)
}
