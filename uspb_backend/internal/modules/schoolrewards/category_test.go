package schoolrewards

import (
	"errors"
	"testing"
)

func setupTestCategoryService() (CategoryService, CategoryRepository) {
	repo := NewMemoryCategoryRepository()
	service := NewCategoryService(repo)
	return service, repo
}

func TestCategoryService_CreateCategory(t *testing.T) {
	service, _ := setupTestCategoryService()

	t.Run("success with default unit and active status", func(t *testing.T) {
		req := &CreateCategoryRequest{
			Name:            "Aluminium Scrap & Foils",
			Description:     "Clean household and commercial aluminium sheets and foils",
			MeasurementUnit: "kg",
			PointsPerUnit:   14.0,
			Status:          "active",
		}
		cat, err := service.CreateCategory(req, "admin@balangoda.uc.gov.lk")
		if err != nil {
			t.Fatalf("expected no error, got: %v", err)
		}
		if cat.ID <= 0 {
			t.Errorf("expected positive ID, got: %d", cat.ID)
		}
		if cat.CurrentPointsPerUnit != 14.0 {
			t.Errorf("expected points 14.0, got: %f", cat.CurrentPointsPerUnit)
		}
		if cat.Status != CategoryStatusActive {
			t.Errorf("expected active status, got: %s", cat.Status)
		}

		// Verify initial rate history record exists
		history, err := service.GetRateHistory(cat.ID)
		if err != nil {
			t.Fatalf("expected rate history to exist, got error: %v", err)
		}
		if len(history) != 1 {
			t.Fatalf("expected 1 initial rate history record, got: %d", len(history))
		}
		if history[0].PointsPerUnit != 14.0 {
			t.Errorf("expected rate history to record 14.0, got: %f", history[0].PointsPerUnit)
		}
	})

	t.Run("duplicate name rejection (case-insensitive)", func(t *testing.T) {
		req := &CreateCategoryRequest{
			Name:          "plastic & pet bottles", // Already in seeded categories
			PointsPerUnit: 10.0,
		}
		_, err := service.CreateCategory(req, "admin@balangoda.uc.gov.lk")
		if !errors.Is(err, ErrDuplicateCategoryName) {
			t.Errorf("expected ErrDuplicateCategoryName, got: %v", err)
		}
	})

	t.Run("invalid name rejection", func(t *testing.T) {
		req := &CreateCategoryRequest{
			Name:          "A",
			PointsPerUnit: 5.0,
		}
		_, err := service.CreateCategory(req, "admin@balangoda.uc.gov.lk")
		if !errors.Is(err, ErrInvalidCategoryName) {
			t.Errorf("expected ErrInvalidCategoryName, got: %v", err)
		}
	})

	t.Run("invalid points rate rejection", func(t *testing.T) {
		req := &CreateCategoryRequest{
			Name:          "Invalid Rate Waste",
			PointsPerUnit: 0.0,
		}
		_, err := service.CreateCategory(req, "admin@balangoda.uc.gov.lk")
		if !errors.Is(err, ErrInvalidPointsRate) {
			t.Errorf("expected ErrInvalidPointsRate, got: %v", err)
		}
	})
}

func TestCategoryService_UpdateRate_AndHistoryPreservation(t *testing.T) {
	service, _ := setupTestCategoryService()

	// 1. Get seeded "Plastic & PET Bottles" (ID 1, initial rate 10.0)
	cat, err := service.GetCategoryByID(1)
	if err != nil {
		t.Fatalf("failed to retrieve seeded category: %v", err)
	}
	if cat.CurrentPointsPerUnit != 10.0 {
		t.Fatalf("expected initial rate 10.0, got: %f", cat.CurrentPointsPerUnit)
	}

	// 2. Perform a rate increase due to higher municipal recycling subsidy
	rateReq := &UpdateRateRequest{
		PointsPerUnit: 12.5,
		Reason:        "Annual revision approved by Balangoda Urban Council",
	}
	updated, err := service.UpdateCategoryRate(1, rateReq, "officer@balangoda.uc.gov.lk")
	if err != nil {
		t.Fatalf("expected successful rate update, got: %v", err)
	}
	if updated.CurrentPointsPerUnit != 12.5 {
		t.Errorf("expected new rate 12.5, got: %f", updated.CurrentPointsPerUnit)
	}

	// 3. Verify history preserves the previous rate (10.0) and adds the new rate (12.5)
	history, err := service.GetRateHistory(1)
	if err != nil {
		t.Fatalf("failed to get rate history: %v", err)
	}
	if len(history) < 2 {
		t.Fatalf("expected at least 2 rate history entries, got: %d", len(history))
	}

	// Most recent history entry should be 12.5 with effective_to = nil
	latest := history[0]
	if latest.PointsPerUnit != 12.5 {
		t.Errorf("expected latest history points 12.5, got: %f", latest.PointsPerUnit)
	}
	if latest.EffectiveTo != nil {
		t.Errorf("expected latest effective_to to be nil (current active rate)")
	}
	if latest.Reason != "Annual revision approved by Balangoda Urban Council" {
		t.Errorf("expected custom reason, got: %s", latest.Reason)
	}

	// Previous history entry should have closed effective_to timestamp
	prev := history[1]
	if prev.PointsPerUnit != 10.0 {
		t.Errorf("expected previous points 10.0, got: %f", prev.PointsPerUnit)
	}
	if prev.EffectiveTo == nil {
		t.Errorf("expected previous rate history effective_to to be closed, but was nil")
	}

	// 4. Test rejecting identical rate update
	_, err = service.UpdateCategoryRate(1, &UpdateRateRequest{PointsPerUnit: 12.5, Reason: "No change"}, "admin")
	if !errors.Is(err, ErrRateUnchanged) {
		t.Errorf("expected ErrRateUnchanged when submitting identical rate, got: %v", err)
	}

	// 5. Test rejecting missing reason
	_, err = service.UpdateCategoryRate(1, &UpdateRateRequest{PointsPerUnit: 15.0, Reason: ""}, "admin")
	if !errors.Is(err, ErrReasonRequired) {
		t.Errorf("expected ErrReasonRequired, got: %v", err)
	}
}

func TestCategoryService_StatusToggle(t *testing.T) {
	service, _ := setupTestCategoryService()

	// Deactivate
	updated, err := service.UpdateCategoryStatus(1, "inactive")
	if err != nil {
		t.Fatalf("expected successful deactivation, got: %v", err)
	}
	if updated.Status != CategoryStatusInactive {
		t.Errorf("expected status inactive, got: %s", updated.Status)
	}

	// Verify excluded from active categories list
	activeCats, err := service.GetActiveCategories()
	if err != nil {
		t.Fatalf("failed to get active categories: %v", err)
	}
	for _, c := range activeCats {
		if c.ID == 1 {
			t.Errorf("category 1 should NOT be in active list after deactivation")
		}
	}

	// Reactivate
	reactivated, err := service.UpdateCategoryStatus(1, "active")
	if err != nil {
		t.Fatalf("expected successful reactivation, got: %v", err)
	}
	if reactivated.Status != CategoryStatusActive {
		t.Errorf("expected status active, got: %s", reactivated.Status)
	}
}

func TestCategoryService_UnitProtectionAndDeletionRules(t *testing.T) {
	service, repo := setupTestCategoryService()

	// Category 1 ("Plastic & PET Bottles") has associated collection records
	hasColl, _ := repo.HasAssociatedCollections(1)
	if !hasColl {
		t.Fatalf("expected category 1 to have associated collections")
	}

	// Attempting to change measurement unit must be rejected
	_, err := service.UpdateCategory(1, &UpdateCategoryRequest{
		Name:            "Plastic & PET Bottles",
		Description:     "Bottles",
		MeasurementUnit: "liter",
		Status:          "active",
	})
	if !errors.Is(err, ErrUnitChangeNotAllowed) {
		t.Errorf("expected ErrUnitChangeNotAllowed, got: %v", err)
	}

	// Attempting to delete category with collections must be rejected
	err = service.DeleteCategory(1)
	if !errors.Is(err, ErrCategoryInUse) {
		t.Errorf("expected ErrCategoryInUse, got: %v", err)
	}
}

func TestCategoryService_Stats(t *testing.T) {
	service, _ := setupTestCategoryService()

	stats, err := service.GetStats()
	if err != nil {
		t.Fatalf("expected stats calculation to succeed, got: %v", err)
	}
	if stats.TotalCategories < 6 {
		t.Errorf("expected at least 6 categories, got: %d", stats.TotalCategories)
	}
	if stats.ActiveCategories <= 0 {
		t.Errorf("expected active categories > 0, got: %d", stats.ActiveCategories)
	}
	if stats.AverageRate <= 0 {
		t.Errorf("expected average rate > 0, got: %f", stats.AverageRate)
	}
}
