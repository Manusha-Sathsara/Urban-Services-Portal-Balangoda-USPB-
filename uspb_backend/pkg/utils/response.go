package utils

import "github.com/gofiber/fiber/v2"

// Standard API response envelope
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// SuccessResponse sends a standard JSON success response
func SuccessResponse(c *fiber.Ctx, statusCode int, message string, data interface{}) error {
	return c.Status(statusCode).JSON(Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// ErrorResponse sends a standard JSON error response
func ErrorResponse(c *fiber.Ctx, statusCode int, errMessage string) error {
	return c.Status(statusCode).JSON(Response{
		Success: false,
		Error:   errMessage,
	})
}
