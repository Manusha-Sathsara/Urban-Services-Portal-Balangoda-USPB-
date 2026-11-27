package schoolrewards

import (
	"database/sql"
	"fmt"
	"math"
	"strings"
	"sync"
	"time"
)

type memorySchoolRepository struct {
	mu      sync.RWMutex
	schools map[int]*School
	nextID  int
}

// NewMemorySchoolRepository creates an in-memory repository for development or unit testing
func NewMemorySchoolRepository() SchoolRepository {
	repo := &memorySchoolRepository{
		schools: make(map[int]*School),
		nextID:  1,
	}

	// Seed with 5 authentic Balangoda educational institutions
	now := time.Now()
	seeds := []School{
		{
			ID:            1,
			SchoolName:    "Balangoda Ananda Maithreya Central College",
			SchoolCode:    "BAMCC-001",
			Address:       "Barnes Ratwatte Mawatha, Balangoda",
			ContactNumber: "045-2287234",
			Status:        SchoolStatusActive,
			CreatedAt:     now.Add(-60 * 24 * time.Hour),
			UpdatedAt:     now.Add(-10 * 24 * time.Hour),
		},
		{
			ID:            2,
			SchoolName:    "St. Agnes Convent Balangoda",
			SchoolCode:    "SACB-002",
			Address:       "Convent Road, Balangoda",
			ContactNumber: "045-2287512",
			Status:        SchoolStatusActive,
			CreatedAt:     now.Add(-45 * 24 * time.Hour),
			UpdatedAt:     now.Add(-5 * 24 * time.Hour),
		},
		{
			ID:            3,
			SchoolName:    "Meddakanda Maha Vidyalaya",
			SchoolCode:    "MMV-003",
			Address:       "Meddakanda, Balangoda",
			ContactNumber: "045-2288110",
			Status:        SchoolStatusActive,
			CreatedAt:     now.Add(-30 * 24 * time.Hour),
			UpdatedAt:     now.Add(-2 * 24 * time.Hour),
		},
		{
			ID:            4,
			SchoolName:    "Jeilani National College",
			SchoolCode:    "JNC-004",
			Address:       "Colombo Road, Balangoda",
			ContactNumber: "045-2289400",
			Status:        SchoolStatusInactive,
			CreatedAt:     now.Add(-20 * 24 * time.Hour),
			UpdatedAt:     now.Add(-1 * 24 * time.Hour),
		},
		{
			ID:            5,
			SchoolName:    "Balangoda Buddhist Ladies College",
			SchoolCode:    "BBLC-005",
			Address:       "Station Road, Balangoda",
			ContactNumber: "045-2289890",
			Status:        SchoolStatusInactive,
			CreatedAt:     now.Add(-15 * 24 * time.Hour),
			UpdatedAt:     now.Add(-1 * 24 * time.Hour),
		},
	}

	for _, s := range seeds {
		copySchool := s
		repo.schools[s.ID] = &copySchool
		if s.ID >= repo.nextID {
			repo.nextID = s.ID + 1
		}
	}

	return repo
}

func (r *memorySchoolRepository) Create(school *School) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Check code uniqueness
	for _, s := range r.schools {
		if strings.EqualFold(s.SchoolCode, school.SchoolCode) {
			return ErrDuplicateSchoolCode
		}
	}

	school.ID = r.nextID
	r.nextID++
	now := time.Now()
	school.CreatedAt = now
	school.UpdatedAt = now

	saved := *school
	r.schools[school.ID] = &saved
	return nil
}

func (r *memorySchoolRepository) GetAll(filter SchoolListFilter) ([]School, int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var matched []School
	search := strings.ToLower(strings.TrimSpace(filter.Search))
	status := strings.ToLower(strings.TrimSpace(filter.Status))

	for _, s := range r.schools {
		if search != "" {
			nameMatch := strings.Contains(strings.ToLower(s.SchoolName), search)
			codeMatch := strings.Contains(strings.ToLower(s.SchoolCode), search)
			addrMatch := strings.Contains(strings.ToLower(s.Address), search)
			if !nameMatch && !codeMatch && !addrMatch {
				continue
			}
		}

		if status != "" && status != "all" {
			if strings.ToLower(string(s.Status)) != status {
				continue
			}
		}

		matched = append(matched, *s)
	}

	// Sort by ID descending
	for i := 0; i < len(matched)-1; i++ {
		for j := i + 1; j < len(matched); j++ {
			if matched[i].ID < matched[j].ID {
				matched[i], matched[j] = matched[j], matched[i]
			}
		}
	}

	total := len(matched)
	limit := filter.Limit
	if limit <= 0 {
		limit = 10
	}
	offset := (filter.Page - 1) * limit
	if offset < 0 {
		offset = 0
	}

	if offset >= total {
		return []School{}, total, nil
	}

	end := offset + limit
	if end > total {
		end = total
	}

	return matched[offset:end], total, nil
}

func (r *memorySchoolRepository) GetByID(id int) (*School, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	s, ok := r.schools[id]
	if !ok {
		return nil, nil
	}
	copySchool := *s
	return &copySchool, nil
}

func (r *memorySchoolRepository) GetByCode(code string) (*School, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, s := range r.schools {
		if strings.EqualFold(s.SchoolCode, code) {
			copySchool := *s
			return &copySchool, nil
		}
	}
	return nil, nil
}

func (r *memorySchoolRepository) GetStats() (*SchoolStats, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	total := len(r.schools)
	active := 0
	inactive := 0

	for _, s := range r.schools {
		if s.Status == SchoolStatusActive {
			active++
		} else if s.Status == SchoolStatusInactive {
			inactive++
		}
	}

	var coverage float64
	if total > 0 {
		coverage = math.Round((float64(active)/float64(total))*1000) / 10
	}

	return &SchoolStats{
		TotalRegistered: total,
		ActiveSchools:   active,
		InactiveSchools: inactive,
		ProgramCoverage: coverage,
	}, nil
}

func (r *memorySchoolRepository) Update(school *School) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	s, ok := r.schools[school.ID]
	if !ok {
		return sql.ErrNoRows
	}

	// Check code uniqueness
	for id, other := range r.schools {
		if id != school.ID && strings.EqualFold(other.SchoolCode, school.SchoolCode) {
			return ErrDuplicateSchoolCode
		}
	}

	school.UpdatedAt = time.Now()
	s.SchoolName = school.SchoolName
	s.SchoolCode = school.SchoolCode
	s.Address = school.Address
	s.ContactNumber = school.ContactNumber
	s.Status = school.Status
	s.UpdatedAt = school.UpdatedAt

	return nil
}

func (r *memorySchoolRepository) UpdateStatus(id int, status SchoolStatus) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	s, ok := r.schools[id]
	if !ok {
		return sql.ErrNoRows
	}

	s.Status = status
	s.UpdatedAt = time.Now()
	return nil
}

func (r *memorySchoolRepository) HasAssociatedHistory(id int) (bool, error) {
	// In mock/memory mode, schools 1 and 2 have historical reward records
	if id == 1 || id == 2 {
		return true, nil
	}
	return false, nil
}

func (r *memorySchoolRepository) Delete(id int) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.schools[id]; !ok {
		return fmt.Errorf("school with id %d not found", id)
	}
	delete(r.schools, id)
	return nil
}
