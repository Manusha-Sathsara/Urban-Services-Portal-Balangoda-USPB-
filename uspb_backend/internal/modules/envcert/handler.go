package envcert

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
	group := router.Group("/environmental-certs")
	
	group.Get("/", h.List)
	group.Get("/approved", h.GetApproved) // MUST be before /:id
	group.Get("/:id", h.GetByID)
	group.Post("/", h.Create)
	
	// Added for Sub-Module B (Inspection Updates)
	group.Patch("/:id/status", h.UpdateStatus)
}

func (h *Handler) List(c *fiber.Ctx) error {
	certs, err := h.service.ListCerts()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Environmental certificates retrieved", certs)
}

// GetApproved retrieves the queue for the printing engine
func (h *Handler) GetApproved(c *fiber.Ctx) error {
	certs, err := h.service.GetApprovedCerts()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to retrieve approved certificates")
	}
	return utils.SuccessResponse(c, fiber.StatusOK, "Approved certificates retrieved", certs)
}

func (h *Handler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
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
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}
	return utils.SuccessResponse(c, fiber.StatusCreated, "Certificate created successfully", cert)
}

// Request payload struct for the PATCH route
type UpdateStatusRequest struct {
	Status          string `json:"status"`
	InspectionNotes string `json:"inspection_notes"`
}

// UpdateStatus handles the field inspection result submission
func (h *Handler) UpdateStatus(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid ID format")
	}

	var req UpdateStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload")
	}

	if err := h.service.UpdateInspectionStatus(id, req.Status, req.InspectionNotes); err != nil {
		if err.Error() == "status is required" || err.Error() == "invalid status value" {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		}
		// REVERTED: Now safely hides raw database errors from the client again
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update status")
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Inspection status updated successfully", nil)
}