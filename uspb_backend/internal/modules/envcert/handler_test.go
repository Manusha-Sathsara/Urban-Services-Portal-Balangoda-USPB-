package envcert

import (
	"errors"
	"io"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
)

type mockService struct {
	certs          []EnvironmentalCert
	listErr        error
	certByID       *EnvironmentalCert
	getByIDErr     error
	createErr      error
	expiryCount    int64
	expiryCheckErr error
}

func (m *mockService) ListCerts() ([]EnvironmentalCert, error) {
	return m.certs, m.listErr
}

func (m *mockService) GetCert(id string) (*EnvironmentalCert, error) {
	if m.getByIDErr != nil {
		return nil, m.getByIDErr
	}
	if m.certByID != nil {
		return m.certByID, nil
	}
	return nil, errors.New("certificate not found")
}

func (m *mockService) CreateCert(cert *EnvironmentalCert) error {
	if m.createErr != nil {
		return m.createErr
	}
	if cert.BusinessName == "" || cert.OwnerName == "" || cert.OwnerNIC == "" ||
		cert.ContactPhone == "" || cert.Address == "" || cert.BusinessCategory == "" {
		return errors.New("business_name, owner_name, owner_nic, contact_phone, address, and business_category are required")
	}
	if cert.Status == "" {
		cert.Status = "PENDING"
	}
	return nil
}

func (m *mockService) ProcessMonthlyExpiryCheck() (int64, error) {
	return m.expiryCount, m.expiryCheckErr
}

func (m *mockService) RenewCert(id string) (*EnvironmentalCert, error) {
	return nil, nil
}

func (m *mockService) ListExpiringSoon(days int) ([]EnvironmentalCert, error) {
	return nil, nil
}

func setupTestApp(svc Service) *fiber.App {
	app := fiber.New()
	api := app.Group("/api/v1")
	NewHandler(svc).RegisterRoutes(api)
	return app
}

func TestHandler_List(t *testing.T) {
	t.Run("returns 200 OK with environmental certificates", func(t *testing.T) {
		svc := &mockService{
			certs: []EnvironmentalCert{
				{
					BusinessName:     "Balangoda Bakers",
					OwnerName:        "K. A. Perera",
					OwnerNIC:         "198512345678",
					ContactPhone:     "0771234567",
					Address:          "No. 15, Main Street, Balangoda",
					BusinessCategory: "Food & Hospitality",
					Status:           "APPROVED",
				},
			},
		}
		app := setupTestApp(svc)

		req := httptest.NewRequest("GET", "/api/v1/environmental-certs", nil)
		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("failed to execute request: %v", err)
		}
		if resp.StatusCode != fiber.StatusOK {
			t.Errorf("expected status 200, got %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		if !strings.Contains(string(body), "Balangoda Bakers") {
			t.Errorf("expected response body to contain 'Balangoda Bakers', got %s", string(body))
		}
	})

	t.Run("returns 500 Internal Server Error when service fails", func(t *testing.T) {
		svc := &mockService{listErr: errors.New("database unavailable")}
		app := setupTestApp(svc)

		req := httptest.NewRequest("GET", "/api/v1/environmental-certs", nil)
		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("failed to execute request: %v", err)
		}
		if resp.StatusCode != fiber.StatusInternalServerError {
			t.Errorf("expected status 500, got %d", resp.StatusCode)
		}
	})
}

func TestHandler_GetByID(t *testing.T) {
	t.Run("returns 200 OK when certificate exists", func(t *testing.T) {
		svc := &mockService{
			certByID: &EnvironmentalCert{
				BusinessName:     "Samanala Tea Factory",
				OwnerName:        "R. M. Silva",
				OwnerNIC:         "197945612390",
				ContactPhone:     "0719876543",
				Address:          "Rassagala Road, Balangoda",
				BusinessCategory: "Manufacturing & Tea",
				Status:           "PENDING",
			},
		}
		app := setupTestApp(svc)

		req := httptest.NewRequest("GET", "/api/v1/environmental-certs/1", nil)
		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("failed to execute request: %v", err)
		}
		if resp.StatusCode != fiber.StatusOK {
			t.Errorf("expected status 200, got %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		if !strings.Contains(string(body), "Samanala Tea Factory") {
			t.Errorf("expected response body to contain 'Samanala Tea Factory', got %s", string(body))
		}
	})

	t.Run("returns 400 Bad Request for non-numeric ID", func(t *testing.T) {
		svc := &mockService{}
		app := setupTestApp(svc)

		req := httptest.NewRequest("GET", "/api/v1/environmental-certs/abc", nil)
		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("failed to execute request: %v", err)
		}
		if resp.StatusCode != fiber.StatusBadRequest {
			t.Errorf("expected status 400, got %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		if !strings.Contains(string(body), "Invalid certificate ID") {
			t.Errorf("expected 'Invalid certificate ID' message, got %s", string(body))
		}
	})

	t.Run("returns 404 Not Found when certificate does not exist", func(t *testing.T) {
		svc := &mockService{getByIDErr: errors.New("record not found")}
		app := setupTestApp(svc)

		req := httptest.NewRequest("GET", "/api/v1/environmental-certs/999", nil)
		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("failed to execute request: %v", err)
		}
		if resp.StatusCode != fiber.StatusNotFound {
			t.Errorf("expected status 404, got %d", resp.StatusCode)
		}
	})
}

func TestHandler_Create(t *testing.T) {
	t.Run("returns 201 Created for valid intake payload", func(t *testing.T) {
		svc := &mockService{}
		app := setupTestApp(svc)

		payload := `{
			"business_name": "Balangoda Spice Mills",
			"owner_name": "N. K. Jayasinghe",
			"owner_nic": "198823456789",
			"contact_phone": "0775551234",
			"address": "No. 42, Ratnapura Road, Balangoda",
			"business_category": "Manufacturing & Processing"
		}`

		req := httptest.NewRequest("POST", "/api/v1/environmental-certs", strings.NewReader(payload))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("failed to execute request: %v", err)
		}
		if resp.StatusCode != fiber.StatusCreated {
			t.Errorf("expected status 201, got %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		if !strings.Contains(string(body), "PENDING") {
			t.Errorf("expected response body to contain default status 'PENDING', got %s", string(body))
		}
	})

	t.Run("returns 400 Bad Request for malformed JSON", func(t *testing.T) {
		svc := &mockService{}
		app := setupTestApp(svc)

		req := httptest.NewRequest("POST", "/api/v1/environmental-certs", strings.NewReader(`{"business_name":`))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("failed to execute request: %v", err)
		}
		if resp.StatusCode != fiber.StatusBadRequest {
			t.Errorf("expected status 400, got %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		if !strings.Contains(string(body), "Invalid request payload") {
			t.Errorf("expected 'Invalid request payload' message, got %s", string(body))
		}
	})

	t.Run("returns 400 Bad Request when required fields are missing", func(t *testing.T) {
		svc := &mockService{}
		app := setupTestApp(svc)

		payload := `{"business_name": "Incomplete Shop"}`
		req := httptest.NewRequest("POST", "/api/v1/environmental-certs", strings.NewReader(payload))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("failed to execute request: %v", err)
		}
		if resp.StatusCode != fiber.StatusBadRequest {
			t.Errorf("expected status 400, got %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		if !strings.Contains(string(body), "are required") {
			t.Errorf("expected validation error message, got %s", string(body))
		}
	})

	t.Run("returns 500 Internal Server Error when service fails", func(t *testing.T) {
		svc := &mockService{createErr: errors.New("insert failed")}
		app := setupTestApp(svc)

		payload := `{
			"business_name": "Balangoda Spice Mills",
			"owner_name": "N. K. Jayasinghe",
			"owner_nic": "198823456789",
			"contact_phone": "0775551234",
			"address": "No. 42, Ratnapura Road, Balangoda",
			"business_category": "Manufacturing & Processing"
		}`

		req := httptest.NewRequest("POST", "/api/v1/environmental-certs", strings.NewReader(payload))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("failed to execute request: %v", err)
		}
		if resp.StatusCode != fiber.StatusInternalServerError {
			t.Errorf("expected status 500, got %d", resp.StatusCode)
		}
	})
}

func TestHandler_RunExpiryCheck(t *testing.T) {
	t.Run("returns 200 OK with expired certificate count", func(t *testing.T) {
		svc := &mockService{expiryCount: 4}
		app := setupTestApp(svc)

		req := httptest.NewRequest("POST", "/api/v1/environmental-certs/check-expiry", nil)
		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("failed to execute request: %v", err)
		}
		if resp.StatusCode != fiber.StatusOK {
			t.Errorf("expected status 200, got %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		if !strings.Contains(string(body), `"expired_count":4`) {
			t.Errorf("expected response body to contain '\"expired_count\":4', got %s", string(body))
		}
		if !strings.Contains(string(body), "Environmental certificate expiry check completed") {
			t.Errorf("expected completion message in response body, got %s", string(body))
		}
	})

	t.Run("returns 500 Internal Server Error when expiry scan fails", func(t *testing.T) {
		svc := &mockService{expiryCheckErr: errors.New("expiry scan database error")}
		app := setupTestApp(svc)

		req := httptest.NewRequest("POST", "/api/v1/environmental-certs/check-expiry", nil)
		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("failed to execute request: %v", err)
		}
		if resp.StatusCode != fiber.StatusInternalServerError {
			t.Errorf("expected status 500, got %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		if !strings.Contains(string(body), "expiry scan database error") {
			t.Errorf("expected error message in response body, got %s", string(body))
		}
	})
}