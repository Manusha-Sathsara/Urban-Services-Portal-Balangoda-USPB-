package schoolrewards

import (
	"errors"
	"fmt"
	"math"
	"regexp"
	"strings"
)

var (
	ErrSchoolNotFound       = errors.New("school not found")
	ErrDuplicateSchoolCode  = errors.New("school code already exists")
	ErrInvalidSchoolName    = errors.New("school name is required and must be between 2 and 255 characters")
	ErrInvalidSchoolCode    = errors.New("school code is required (2-50 characters, alphanumeric and hyphens)")
	ErrInvalidStatus        = errors.New("status must be either 'active' or 'inactive'")
	ErrHasAssociatedHistory = errors.New("cannot delete school with associated students, collections, or records; deactivate it instead")
)

var codeRegex = regexp.MustCompile(`^[A-Za-z0-9\-_]+$`)

// SchoolService defines the business logic operations for School Management
type SchoolService interface {
	CreateSchool(req *CreateSchoolRequest) (*School, error)
	ListSchools(filter SchoolListFilter) (*SchoolListResult, error)
	GetSchoolByID(id int) (*School, error)
	UpdateSchool(id int, req *UpdateSchoolRequest) (*School, error)
	UpdateSchoolStatus(id int, status string) (*School, error)
	DeleteSchool(id int) error
}

type schoolService struct {
	repo SchoolRepository
}

// NewSchoolService creates a new SchoolService instance
func NewSchoolService(repo SchoolRepository) SchoolService {
	return &schoolService{repo: repo}
}

func (s *schoolService) CreateSchool(req *CreateSchoolRequest) (*School, error) {
	name := strings.TrimSpace(req.SchoolName)
	if len(name) < 2 || len(name) > 255 {
		return nil, ErrInvalidSchoolName
	}

	code := strings.ToUpper(strings.TrimSpace(req.SchoolCode))
	if len(code) < 2 || len(code) > 50 || !codeRegex.MatchString(code) {
		return nil, ErrInvalidSchoolCode
	}

	// Check code uniqueness
	existing, err := s.repo.GetByCode(code)
	if err != nil {
		return nil, fmt.Errorf("failed to check school code: %w", err)
	}
	if existing != nil {
		return nil, ErrDuplicateSchoolCode
	}

	status := SchoolStatusActive
	if req.Status != "" {
		st := strings.ToLower(strings.TrimSpace(req.Status))
		if st != string(SchoolStatusActive) && st != string(SchoolStatusInactive) {
			return nil, ErrInvalidStatus
		}
		status = SchoolStatus(st)
	}

	school := &School{
		SchoolName:    name,
		SchoolCode:    code,
		Address:       strings.TrimSpace(req.Address),
		ContactNumber: strings.TrimSpace(req.ContactNumber),
		Status:        status,
	}

	if err := s.repo.Create(school); err != nil {
		// In case race condition hits unique constraint in DB
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			return nil, ErrDuplicateSchoolCode
		}
		return nil, fmt.Errorf("failed to create school: %w", err)
	}

	return school, nil
}

func (s *schoolService) ListSchools(filter SchoolListFilter) (*SchoolListResult, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 10
	} else if filter.Limit > 100 {
		filter.Limit = 100
	}

	schools, totalCount, err := s.repo.GetAll(filter)
	if err != nil {
		return nil, err
	}

	totalPages := int(math.Ceil(float64(totalCount) / float64(filter.Limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	return &SchoolListResult{
		Schools:    schools,
		TotalCount: totalCount,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *schoolService) GetSchoolByID(id int) (*School, error) {
	if id <= 0 {
		return nil, ErrSchoolNotFound
	}
	school, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if school == nil {
		return nil, ErrSchoolNotFound
	}

	// In Phase 1, student module is not yet implemented.
	// Leave StudentCount as nil so frontend displays the appropriate unavailable state.
	return school, nil
}

func (s *schoolService) UpdateSchool(id int, req *UpdateSchoolRequest) (*School, error) {
	if id <= 0 {
		return nil, ErrSchoolNotFound
	}

	existing, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ErrSchoolNotFound
	}

	name := strings.TrimSpace(req.SchoolName)
	if len(name) < 2 || len(name) > 255 {
		return nil, ErrInvalidSchoolName
	}

	code := strings.ToUpper(strings.TrimSpace(req.SchoolCode))
	if len(code) < 2 || len(code) > 50 || !codeRegex.MatchString(code) {
		return nil, ErrInvalidSchoolCode
	}

	// Verify code uniqueness: ensure no other school has this code
	withCode, err := s.repo.GetByCode(code)
	if err != nil {
		return nil, fmt.Errorf("failed to verify school code uniqueness: %w", err)
	}
	if withCode != nil && withCode.ID != id {
		return nil, ErrDuplicateSchoolCode
	}

	status := existing.Status
	if req.Status != "" {
		st := strings.ToLower(strings.TrimSpace(req.Status))
		if st != string(SchoolStatusActive) && st != string(SchoolStatusInactive) {
			return nil, ErrInvalidStatus
		}
		status = SchoolStatus(st)
	}

	existing.SchoolName = name
	existing.SchoolCode = code
	existing.Address = strings.TrimSpace(req.Address)
	existing.ContactNumber = strings.TrimSpace(req.ContactNumber)
	existing.Status = status

	if err := s.repo.Update(existing); err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			return nil, ErrDuplicateSchoolCode
		}
		return nil, fmt.Errorf("failed to update school: %w", err)
	}

	return existing, nil
}

func (s *schoolService) UpdateSchoolStatus(id int, status string) (*School, error) {
	if id <= 0 {
		return nil, ErrSchoolNotFound
	}

	st := strings.ToLower(strings.TrimSpace(status))
	if st != string(SchoolStatusActive) && st != string(SchoolStatusInactive) {
		return nil, ErrInvalidStatus
	}

	existing, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ErrSchoolNotFound
	}

	if err := s.repo.UpdateStatus(id, SchoolStatus(st)); err != nil {
		return nil, fmt.Errorf("failed to update status: %w", err)
	}

	existing.Status = SchoolStatus(st)
	return existing, nil
}

func (s *schoolService) DeleteSchool(id int) error {
	if id <= 0 {
		return ErrSchoolNotFound
	}

	existing, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if existing == nil {
		return ErrSchoolNotFound
	}

	// Enforce: Never permanently delete a school that has associated history
	hasHistory, err := s.repo.HasAssociatedHistory(id)
	if err != nil {
		return fmt.Errorf("failed to check school history: %w", err)
	}
	if hasHistory {
		return ErrHasAssociatedHistory
	}

	return s.repo.Delete(id)
}
