package schoolrewards

import (
	"errors"
	"fmt"
	"math"
	"strings"
)

var (
	ErrCategoryNotFound       = errors.New("waste category not found")
	ErrDuplicateCategoryName  = errors.New("waste category name already exists")
	ErrInvalidCategoryName    = errors.New("category name is required and must be between 2 and 100 characters")
	ErrInvalidMeasurementUnit = errors.New("measurement unit is required (e.g. kg, g, unit, liter)")
	ErrInvalidPointsRate      = errors.New("points rate must be a positive number greater than zero")
	ErrInvalidCategoryStatus  = errors.New("status must be either 'active' or 'inactive'")
	ErrUnitChangeNotAllowed   = errors.New("cannot change measurement unit because collections have already been recorded with this unit")
	ErrRateUnchanged          = errors.New("new points rate must be different from the current rate")
	ErrCategoryInUse          = errors.New("cannot delete waste category with associated collection records; deactivate it instead")
	ErrReasonRequired         = errors.New("a reason for the rate revision is required")
)

// Allowed measurement units in municipal recycling programs
var allowedUnits = map[string]bool{
	"kg":     true,
	"g":      true,
	"unit":   true,
	"liter":  true,
	"bottle": true,
	"item":   true,
}

// CategoryService defines the business logic operations for Waste Category Management
type CategoryService interface {
	CreateCategory(req *CreateCategoryRequest, changedBy string) (*WasteCategory, error)
	ListCategories(filter CategoryListFilter) (*CategoryListResult, error)
	GetActiveCategories() ([]WasteCategory, error)
	GetCategoryByID(id int) (*WasteCategory, error)
	UpdateCategory(id int, req *UpdateCategoryRequest) (*WasteCategory, error)
	UpdateCategoryStatus(id int, status string) (*WasteCategory, error)
	UpdateCategoryRate(id int, req *UpdateRateRequest, changedBy string) (*WasteCategory, error)
	GetRateHistory(id int) ([]CategoryRateHistory, error)
	GetStats() (*CategoryStats, error)
	DeleteCategory(id int) error
}

type categoryService struct {
	repo CategoryRepository
}

// NewCategoryService creates a new CategoryService instance
func NewCategoryService(repo CategoryRepository) CategoryService {
	return &categoryService{repo: repo}
}

func (s *categoryService) CreateCategory(req *CreateCategoryRequest, changedBy string) (*WasteCategory, error) {
	name := strings.TrimSpace(req.Name)
	if len(name) < 2 || len(name) > 100 {
		return nil, ErrInvalidCategoryName
	}

	unit := strings.ToLower(strings.TrimSpace(req.MeasurementUnit))
	if unit == "" {
		unit = "kg"
	}
	if !allowedUnits[unit] && len(unit) > 20 {
		return nil, ErrInvalidMeasurementUnit
	}

	if req.PointsPerUnit <= 0 {
		return nil, ErrInvalidPointsRate
	}

	// Check name uniqueness (case-insensitive)
	existing, err := s.repo.GetByName(name)
	if err != nil {
		return nil, fmt.Errorf("failed to check category name: %w", err)
	}
	if existing != nil {
		return nil, ErrDuplicateCategoryName
	}

	status := CategoryStatusActive
	if req.Status != "" {
		st := strings.ToLower(strings.TrimSpace(req.Status))
		if st != string(CategoryStatusActive) && st != string(CategoryStatusInactive) {
			return nil, ErrInvalidCategoryStatus
		}
		status = CategoryStatus(st)
	}

	if changedBy == "" {
		changedBy = "COUNCIL_ADMIN"
	}

	category := &WasteCategory{
		Name:                 name,
		Description:          strings.TrimSpace(req.Description),
		MeasurementUnit:      unit,
		CurrentPointsPerUnit: req.PointsPerUnit,
		Status:               status,
	}

	initialReason := fmt.Sprintf("Initial category registration with rate %.1f pts/%s", req.PointsPerUnit, unit)
	if err := s.repo.Create(category, req.PointsPerUnit, initialReason, changedBy); err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			return nil, ErrDuplicateCategoryName
		}
		return nil, fmt.Errorf("failed to create category: %w", err)
	}

	return category, nil
}

func (s *categoryService) ListCategories(filter CategoryListFilter) (*CategoryListResult, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 10
	} else if filter.Limit > 100 {
		filter.Limit = 100
	}

	categories, totalCount, err := s.repo.GetAll(filter)
	if err != nil {
		return nil, err
	}

	totalPages := int(math.Ceil(float64(totalCount) / float64(filter.Limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	return &CategoryListResult{
		Categories: categories,
		TotalCount: totalCount,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *categoryService) GetActiveCategories() ([]WasteCategory, error) {
	return s.repo.GetActive()
}

func (s *categoryService) GetCategoryByID(id int) (*WasteCategory, error) {
	if id <= 0 {
		return nil, ErrCategoryNotFound
	}
	cat, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if cat == nil {
		return nil, ErrCategoryNotFound
	}
	return cat, nil
}

func (s *categoryService) UpdateCategory(id int, req *UpdateCategoryRequest) (*WasteCategory, error) {
	if id <= 0 {
		return nil, ErrCategoryNotFound
	}

	existing, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ErrCategoryNotFound
	}

	name := strings.TrimSpace(req.Name)
	if len(name) < 2 || len(name) > 100 {
		return nil, ErrInvalidCategoryName
	}

	// Verify name uniqueness across other categories
	withName, err := s.repo.GetByName(name)
	if err != nil {
		return nil, fmt.Errorf("failed to verify category name uniqueness: %w", err)
	}
	if withName != nil && withName.ID != id {
		return nil, ErrDuplicateCategoryName
	}

	unit := strings.ToLower(strings.TrimSpace(req.MeasurementUnit))
	if unit == "" {
		unit = existing.MeasurementUnit
	}
	if !allowedUnits[unit] && len(unit) > 20 {
		return nil, ErrInvalidMeasurementUnit
	}

	// Protect historical transactions if unit is modified:
	if unit != existing.MeasurementUnit {
		hasCollections, err := s.repo.HasAssociatedCollections(id)
		if err != nil {
			return nil, fmt.Errorf("failed to check collection history: %w", err)
		}
		if hasCollections {
			return nil, ErrUnitChangeNotAllowed
		}
	}

	status := existing.Status
	if req.Status != "" {
		st := strings.ToLower(strings.TrimSpace(req.Status))
		if st != string(CategoryStatusActive) && st != string(CategoryStatusInactive) {
			return nil, ErrInvalidCategoryStatus
		}
		status = CategoryStatus(st)
	}

	existing.Name = name
	existing.Description = strings.TrimSpace(req.Description)
	existing.MeasurementUnit = unit
	existing.Status = status

	if err := s.repo.Update(existing); err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			return nil, ErrDuplicateCategoryName
		}
		return nil, fmt.Errorf("failed to update category: %w", err)
	}

	return existing, nil
}

func (s *categoryService) UpdateCategoryStatus(id int, status string) (*WasteCategory, error) {
	if id <= 0 {
		return nil, ErrCategoryNotFound
	}

	st := strings.ToLower(strings.TrimSpace(status))
	if st != string(CategoryStatusActive) && st != string(CategoryStatusInactive) {
		return nil, ErrInvalidCategoryStatus
	}

	existing, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ErrCategoryNotFound
	}

	targetStatus := CategoryStatus(st)
	if existing.Status == targetStatus {
		return existing, nil // No-op idempotent
	}

	if err := s.repo.UpdateStatus(id, targetStatus); err != nil {
		return nil, fmt.Errorf("failed to update status: %w", err)
	}

	existing.Status = targetStatus
	return existing, nil
}

func (s *categoryService) UpdateCategoryRate(id int, req *UpdateRateRequest, changedBy string) (*WasteCategory, error) {
	if id <= 0 {
		return nil, ErrCategoryNotFound
	}

	if req.PointsPerUnit <= 0 {
		return nil, ErrInvalidPointsRate
	}

	reason := strings.TrimSpace(req.Reason)
	if reason == "" {
		return nil, ErrReasonRequired
	}

	existing, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ErrCategoryNotFound
	}

	if existing.CurrentPointsPerUnit == req.PointsPerUnit {
		return nil, ErrRateUnchanged
	}

	if changedBy == "" {
		changedBy = "COUNCIL_COORDINATOR"
	}

	if err := s.repo.UpdateRate(id, req.PointsPerUnit, reason, changedBy); err != nil {
		return nil, fmt.Errorf("failed to update rate: %w", err)
	}

	existing.CurrentPointsPerUnit = req.PointsPerUnit
	return existing, nil
}

func (s *categoryService) GetRateHistory(id int) ([]CategoryRateHistory, error) {
	if id <= 0 {
		return nil, ErrCategoryNotFound
	}

	existing, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ErrCategoryNotFound
	}

	return s.repo.GetRateHistory(id)
}

func (s *categoryService) GetStats() (*CategoryStats, error) {
	return s.repo.GetStats()
}

func (s *categoryService) DeleteCategory(id int) error {
	if id <= 0 {
		return ErrCategoryNotFound
	}

	existing, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if existing == nil {
		return ErrCategoryNotFound
	}

	hasCollections, err := s.repo.HasAssociatedCollections(id)
	if err != nil {
		return fmt.Errorf("failed to check collection history: %w", err)
	}
	if hasCollections {
		return ErrCategoryInUse
	}

	return s.repo.Delete(id)
}
