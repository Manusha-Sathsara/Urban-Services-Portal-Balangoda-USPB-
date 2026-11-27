package schoolrewards

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/BalangodaUC/uspb_backend/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func generateTestToken(role string) string {
	secret := "test_secret_key_that_is_at_least_32_chars"
	os.Setenv("JWT_SECRET", secret)

	claims := middleware.JWTClaims{
		UserID:    99,
		Username:  "test_supervisor",
		Role:      role,
		SessionID: "test-session",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte(secret))
	return tokenStr
}

func setupTestApp() (*fiber.App, SchoolService) {
	app := fiber.New()
	repo := NewMemorySchoolRepository()
	service := NewSchoolService(repo)
	handler := NewSchoolHandler(service)

	api := app.Group("/api/v1", middleware.JWTMiddleware("test_secret_key_that_is_at_least_32_chars", nil))
	handler.RegisterRoutes(api)

	return app, service
}

// 1. Test School Creation & Success
func TestCreateSchool_Success(t *testing.T) {
	app, _ := setupTestApp()
	token := generateTestToken("ADMIN")

	body := CreateSchoolRequest{
		SchoolName:    "Balangoda Central Girls High School",
		SchoolCode:    "BCGHS-101",
		Address:       "Barnes Ratwatte Mawatha, Balangoda",
		ContactNumber: "+94 45 228 9900",
		Status:        "active",
	}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/v1/schools", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Failed to execute request: %v", err)
	}

	if resp.StatusCode != http.StatusCreated {
		t.Errorf("Expected status 201 Created, got %d", resp.StatusCode)
	}
}

// 2. Test Required-Field Validation
func TestCreateSchool_Validation(t *testing.T) {
	app, _ := setupTestApp()
	token := generateTestToken("ADMIN")

	// Missing school name
	body1 := CreateSchoolRequest{
		SchoolName: "",
		SchoolCode: "TEST-001",
	}
	bodyBytes1, _ := json.Marshal(body1)
	req1 := httptest.NewRequest("POST", "/api/v1/schools", bytes.NewReader(bodyBytes1))
	req1.Header.Set("Content-Type", "application/json")
	req1.Header.Set("Authorization", "Bearer "+token)

	resp1, _ := app.Test(req1)
	if resp1.StatusCode != http.StatusBadRequest {
		t.Errorf("Expected 400 for empty school name, got %d", resp1.StatusCode)
	}

	// Missing school code
	body2 := CreateSchoolRequest{
		SchoolName: "Valid School Name",
		SchoolCode: "",
	}
	bodyBytes2, _ := json.Marshal(body2)
	req2 := httptest.NewRequest("POST", "/api/v1/schools", bytes.NewReader(bodyBytes2))
	req2.Header.Set("Content-Type", "application/json")
	req2.Header.Set("Authorization", "Bearer "+token)

	resp2, _ := app.Test(req2)
	if resp2.StatusCode != http.StatusBadRequest {
		t.Errorf("Expected 400 for empty school code, got %d", resp2.StatusCode)
	}
}

// 3. Test Duplicate School Code Prevention
func TestCreateSchool_DuplicateCode(t *testing.T) {
	app, _ := setupTestApp()
	token := generateTestToken("ADMIN")

	// Seed code BAMCC-001 already exists in memory repo
	body := CreateSchoolRequest{
		SchoolName: "Another College with Duplicate Code",
		SchoolCode: "BAMCC-001",
	}
	bodyBytes, _ := json.Marshal(body)
	req := httptest.NewRequest("POST", "/api/v1/schools", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	resp, _ := app.Test(req)
	if resp.StatusCode != http.StatusConflict {
		t.Errorf("Expected 409 Conflict for duplicate school code, got %d", resp.StatusCode)
	}
}

// 4. Test School Listing & Filtering
func TestListSchools(t *testing.T) {
	app, _ := setupTestApp()
	token := generateTestToken("ADMIN")

	req := httptest.NewRequest("GET", "/api/v1/schools?search=Ananda&status=active&page=1&limit=5", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Failed to execute list request: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected 200 OK, got %d", resp.StatusCode)
	}
}

// 5. Test School Updates
func TestUpdateSchool(t *testing.T) {
	app, _ := setupTestApp()
	token := generateTestToken("ADMIN")

	updateBody := UpdateSchoolRequest{
		SchoolName:    "Balangoda Central College Updated",
		SchoolCode:    "BAMCC-001",
		Address:       "New Address 123",
		ContactNumber: "+94 45 999 8888",
		Status:        "active",
	}
	bodyBytes, _ := json.Marshal(updateBody)
	req := httptest.NewRequest("PUT", "/api/v1/schools/1", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	resp, _ := app.Test(req)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected 200 OK for school update, got %d", resp.StatusCode)
	}
}

// 6. Test School Activation/Deactivation
func TestUpdateSchoolStatus(t *testing.T) {
	app, _ := setupTestApp()
	token := generateTestToken("ADMIN")

	statusBody := UpdateSchoolStatusRequest{
		Status: "inactive",
	}
	bodyBytes, _ := json.Marshal(statusBody)
	req := httptest.NewRequest("PATCH", "/api/v1/schools/1/status", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	resp, _ := app.Test(req)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected 200 OK for status change, got %d", resp.StatusCode)
	}

	// Test invalid status
	invalidBody := UpdateSchoolStatusRequest{Status: "pending_something"}
	invalidBytes, _ := json.Marshal(invalidBody)
	req2 := httptest.NewRequest("PATCH", "/api/v1/schools/1/status", bytes.NewReader(invalidBytes))
	req2.Header.Set("Content-Type", "application/json")
	req2.Header.Set("Authorization", "Bearer "+token)

	resp2, _ := app.Test(req2)
	if resp2.StatusCode != http.StatusBadRequest {
		t.Errorf("Expected 400 Bad Request for invalid status, got %d", resp2.StatusCode)
	}
}

// 7. Test Unauthorized Access
func TestUnauthorizedAccess(t *testing.T) {
	app, _ := setupTestApp()

	// Missing token -> 401 Unauthorized
	reqNoToken := httptest.NewRequest("GET", "/api/v1/schools", nil)
	resp1, _ := app.Test(reqNoToken)
	if resp1.StatusCode != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized without token, got %d", resp1.StatusCode)
	}

	// Invalid token -> 401 Unauthorized
	reqInvalidToken := httptest.NewRequest("GET", "/api/v1/schools", nil)
	reqInvalidToken.Header.Set("Authorization", "Bearer invalid.jwt.token")
	resp2, _ := app.Test(reqInvalidToken)
	if resp2.StatusCode != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized with invalid token, got %d", resp2.StatusCode)
	}

	// Unauthorized role (TEACHER) -> 403 Forbidden
	teacherToken := generateTestToken("TEACHER")
	reqForbidden := httptest.NewRequest("POST", "/api/v1/schools", bytes.NewReader([]byte("{}")))
	reqForbidden.Header.Set("Content-Type", "application/json")
	reqForbidden.Header.Set("Authorization", "Bearer "+teacherToken)
	resp3, _ := app.Test(reqForbidden)
	if resp3.StatusCode != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden for non-council role, got %d", resp3.StatusCode)
	}
}

// 8. Test Associated History Protection
func TestDeleteSchool_ProtectedHistory(t *testing.T) {
	app, _ := setupTestApp()
	token := generateTestToken("ADMIN")

	// School 1 has history in memory repo -> cannot be hard deleted
	req := httptest.NewRequest("DELETE", "/api/v1/schools/1", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, _ := app.Test(req)
	if resp.StatusCode != http.StatusConflict {
		t.Errorf("Expected 409 Conflict when deleting school with history, got %d", resp.StatusCode)
	}
}

// 9. Test Global Municipal Statistics & Coverage Formula
func TestGetSchoolStats(t *testing.T) {
	app, _ := setupTestApp()
	token := generateTestToken("ADMIN")

	req := httptest.NewRequest("GET", "/api/v1/schools/stats", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Failed to execute request: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200 OK for stats, got %d", resp.StatusCode)
	}

	var res struct {
		Success bool `json:"success"`
		Data    struct {
			TotalRegistered int     `json:"total_registered"`
			ActiveSchools   int     `json:"active_schools"`
			InactiveSchools int     `json:"inactive_schools"`
			ProgramCoverage float64 `json:"program_coverage"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if res.Data.TotalRegistered != 5 {
		t.Errorf("Expected 5 total registered schools, got %d", res.Data.TotalRegistered)
	}
	if res.Data.ActiveSchools != 3 {
		t.Errorf("Expected 3 active schools, got %d", res.Data.ActiveSchools)
	}
	if res.Data.InactiveSchools != 2 {
		t.Errorf("Expected 2 inactive schools, got %d", res.Data.InactiveSchools)
	}
	// Coverage = (3 / 5) * 100 = 60.0%
	if res.Data.ProgramCoverage != 60.0 {
		t.Errorf("Expected program coverage 60.0%%, got %.1f%%", res.Data.ProgramCoverage)
	}
}

// 10. Test Deletion Strictly Restricted to ADMIN
func TestDeleteSchool_RoleRestriction(t *testing.T) {
	app, _ := setupTestApp()
	supervisorToken := generateTestToken("GARBAGE_SUPERVISOR")

	// Supervisor should NOT be allowed to delete a school -> 403 Forbidden
	req := httptest.NewRequest("DELETE", "/api/v1/schools/1", nil)
	req.Header.Set("Authorization", "Bearer "+supervisorToken)

	resp, _ := app.Test(req)
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden when supervisor attempts deletion, got %d", resp.StatusCode)
	}
}
