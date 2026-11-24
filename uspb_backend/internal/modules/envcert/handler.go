package envcert

import (
	"strconv"
	"strings"

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
	group := router.Group("/environmental-certs")
	group.Get("/", h.List)
	group.Get("/:id", h.GetByID)
	group.Post("/", h.Create)
}

func (h *Handler) List(c *fiber.Ctx) error {
	certs, err := h.service.ListCerts()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Environmental certificates retrieved", certs)
}

func (h *Handler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	if _, err := strconv.Atoi(id); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid certificate ID")
	}

	cert, err := h.service.GetCert(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Certificate not found")
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Certificate retrieved", cert)
}

func (h *Handler) Create(c *fiber.Ctx) error {
	var cert EnvironmentalCert
	if err := c.BodyParser(&cert); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload")
	}
	if err := h.service.CreateCert(&cert); err != nil {
		if strings.Contains(err.Error(), "are required") {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}
	return utils.SuccessResponse(c, fiber.StatusCreated, "Certificate created successfully", cert)
}