package schoolrewards

import (
	"database/sql"
	"math"
	"sort"
	"strings"
	"sync"
	"time"
)

type memoryCategoryRepository struct {
	mu          sync.RWMutex
	categories  map[int]*WasteCategory
	rateHistory map[int][]CategoryRateHistory
	nextID      int
	nextRateID  int
}

// NewMemoryCategoryRepository creates an in-memory repository seeded with standard Balangoda categories
func NewMemoryCategoryRepository() CategoryRepository {
	repo := &memoryCategoryRepository{
		categories:  make(map[int]*WasteCategory),
		rateHistory: make(map[int][]CategoryRateHistory),
		nextID:      1,
		nextRateID:  1,
	}

	baseTime := time.Now().Add(-30 * 24 * time.Hour)

	seeds := []struct {
		cat  WasteCategory
		rate float64
	}{
		{
			cat: WasteCategory{
				ID:                   1,
				Name:                 "Plastic & PET Bottles",
				Description:          "Clean beverage PET bottles, household plastic containers, and HDPE flacons.",
				MeasurementUnit:      "kg",
				CurrentPointsPerUnit: 10.00,
				Status:               CategoryStatusActive,
				CreatedAt:            baseTime,
				UpdatedAt:            baseTime,
			},
			rate: 10.00,
		},
		{
			cat: WasteCategory{
				ID:                   2,
				Name:                 "Paper & Cardboard",
				Description:          "Clean dry newspapers, textbooks, office stationery, and corrugated cardboard boxes.",
				MeasurementUnit:      "kg",
				CurrentPointsPerUnit: 5.00,
				Status:               CategoryStatusActive,
				CreatedAt:            baseTime,
				UpdatedAt:            baseTime,
			},
			rate: 5.00,
		},
		{
			cat: WasteCategory{
				ID:                   3,
				Name:                 "Metal & Aluminium Cans",
				Description:          "Empty food tins, soft drink aluminium cans, and clean discarded household metals.",
				MeasurementUnit:      "kg",
				CurrentPointsPerUnit: 15.00,
				Status:               CategoryStatusActive,
				CreatedAt:            baseTime,
				UpdatedAt:            baseTime,
			},
			rate: 15.00,
		},
		{
			cat: WasteCategory{
				ID:                   4,
				Name:                 "Glass Bottles",
				Description:          "Clear and amber glass bottles, intact jars, and unbroken beverage glass.",
				MeasurementUnit:      "kg",
				CurrentPointsPerUnit: 3.00,
				Status:               CategoryStatusActive,
				CreatedAt:            baseTime,
				UpdatedAt:            baseTime,
			},
			rate: 3.00,
		},
		{
			cat: WasteCategory{
				ID:                   5,
				Name:                 "Electronic Waste (E-Waste)",
				Description:          "Spent domestic batteries, printed circuit boards, keyboards, chargers, and small peripherals.",
				MeasurementUnit:      "kg",
				CurrentPointsPerUnit: 25.00,
				Status:               CategoryStatusActive,
				CreatedAt:            baseTime,
				UpdatedAt:            baseTime,
			},
			rate: 25.00,
		},
		{
			cat: WasteCategory{
				ID:                   6,
				Name:                 "Coconut Shells & Biomass",
				Description:          "Clean sorted dry coconut shells for council bio-char and industrial fuel recovery.",
				MeasurementUnit:      "kg",
				CurrentPointsPerUnit: 2.00,
				Status:               CategoryStatusInactive,
				CreatedAt:            baseTime,
				UpdatedAt:            baseTime,
			},
			rate: 2.00,
		},
	}

	for _, item := range seeds {
		c := item.cat
		repo.categories[c.ID] = &c
		if c.ID >= repo.nextID {
			repo.nextID = c.ID + 1
		}

		// Initial rate history record
		hist := CategoryRateHistory{
			ID:            repo.nextRateID,
			CategoryID:    c.ID,
			PointsPerUnit: item.rate,
			EffectiveFrom: baseTime,
			EffectiveTo:   nil,
			Reason:        "Initial council baseline rate",
			ChangedBy:     "admin@balangoda.gov.lk",
			CreatedAt:     baseTime,
		}
		repo.nextRateID++
		repo.rateHistory[c.ID] = []CategoryRateHistory{hist}
	}

	return repo
}

func (r *memoryCategoryRepository) Create(category *WasteCategory, initialRate float64, reason, changedBy string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, c := range r.categories {
		if strings.EqualFold(c.Name, category.Name) {
			return ErrDuplicateCategoryName
		}
	}

	category.ID = r.nextID
	r.nextID++

	now := time.Now()
	category.CurrentPointsPerUnit = initialRate
	category.CreatedAt = now
	category.UpdatedAt = now

	savedCat := *category
	r.categories[category.ID] = &savedCat

	if reason == "" {
		reason = "Initial baseline rate creation"
	}
	if changedBy == "" {
		changedBy = "SYSTEM"
	}

	hist := CategoryRateHistory{
		ID:            r.nextRateID,
		CategoryID:    category.ID,
		PointsPerUnit: initialRate,
		EffectiveFrom: now,
		EffectiveTo:   nil,
		Reason:        reason,
		ChangedBy:     changedBy,
		CreatedAt:     now,
	}
	r.nextRateID++
	r.rateHistory[category.ID] = []CategoryRateHistory{hist}

	return nil
}

func (r *memoryCategoryRepository) GetAll(filter CategoryListFilter) ([]WasteCategory, int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var filtered []WasteCategory
	search := strings.ToLower(strings.TrimSpace(filter.Search))
	status := strings.ToLower(strings.TrimSpace(filter.Status))

	for _, c := range r.categories {
		if search != "" {
			nameMatch := strings.Contains(strings.ToLower(c.Name), search)
			descMatch := strings.Contains(strings.ToLower(c.Description), search)
			if !nameMatch && !descMatch {
				continue
			}
		}
		if status != "" && status != "all" {
			if strings.ToLower(string(c.Status)) != status {
				continue
			}
		}
		filtered = append(filtered, *c)
	}

	// Sort
	sortField := strings.ToLower(filter.SortField)
	isDesc := strings.ToLower(filter.SortOrder) == "desc"

	sort.Slice(filtered, func(i, j int) bool {
		switch sortField {
		case "name":
			if isDesc {
				return filtered[i].Name > filtered[j].Name
			}
			return filtered[i].Name < filtered[j].Name
		case "points", "rate", "current_points_per_unit":
			if isDesc {
				return filtered[i].CurrentPointsPerUnit > filtered[j].CurrentPointsPerUnit
			}
			return filtered[i].CurrentPointsPerUnit < filtered[j].CurrentPointsPerUnit
		case "status":
			if isDesc {
				return filtered[i].Status > filtered[j].Status
			}
			return filtered[i].Status < filtered[j].Status
		case "unit", "measurement_unit":
			if isDesc {
				return filtered[i].MeasurementUnit > filtered[j].MeasurementUnit
			}
			return filtered[i].MeasurementUnit < filtered[j].MeasurementUnit
		default:
			return filtered[i].ID < filtered[j].ID
		}
	})

	totalCount := len(filtered)
	limit := filter.Limit
	if limit <= 0 {
		limit = 10
	}
	page := filter.Page
	if page <= 0 {
		page = 1
	}

	start := (page - 1) * limit
	if start > totalCount {
		start = totalCount
	}
	end := start + limit
	if end > totalCount {
		end = totalCount
	}

	result := filtered[start:end]
	if result == nil {
		result = []WasteCategory{}
	}

	return result, totalCount, nil
}

func (r *memoryCategoryRepository) GetActive() ([]WasteCategory, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var active []WasteCategory
	for _, c := range r.categories {
		if c.Status == CategoryStatusActive {
			active = append(active, *c)
		}
	}
	sort.Slice(active, func(i, j int) bool {
		return active[i].Name < active[j].Name
	})
	return active, nil
}

func (r *memoryCategoryRepository) GetByID(id int) (*WasteCategory, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	c, ok := r.categories[id]
	if !ok {
		return nil, nil
	}
	copyCat := *c
	return &copyCat, nil
}

func (r *memoryCategoryRepository) GetByName(name string) (*WasteCategory, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, c := range r.categories {
		if strings.EqualFold(c.Name, name) {
			copyCat := *c
			return &copyCat, nil
		}
	}
	return nil, nil
}

func (r *memoryCategoryRepository) Update(category *WasteCategory) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	c, ok := r.categories[category.ID]
	if !ok {
		return sql.ErrNoRows
	}

	c.Name = category.Name
	c.Description = category.Description
	c.MeasurementUnit = category.MeasurementUnit
	c.Status = category.Status
	c.UpdatedAt = time.Now()
	category.UpdatedAt = c.UpdatedAt
	return nil
}

func (r *memoryCategoryRepository) UpdateStatus(id int, status CategoryStatus) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	c, ok := r.categories[id]
	if !ok {
		return sql.ErrNoRows
	}

	c.Status = status
	c.UpdatedAt = time.Now()
	return nil
}

func (r *memoryCategoryRepository) UpdateRate(id int, newRate float64, reason, changedBy string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	c, ok := r.categories[id]
	if !ok {
		return sql.ErrNoRows
	}

	now := time.Now()

	// 1. Close current active rate history record
	historyList := r.rateHistory[id]
	for i := range historyList {
		if historyList[i].EffectiveTo == nil {
			closeTime := now
			historyList[i].EffectiveTo = &closeTime
		}
	}

	if reason == "" {
		reason = "Point rate revised by council coordinator"
	}
	if changedBy == "" {
		changedBy = "COUNCIL_SUPERVISOR"
	}

	// 2. Add new active rate history
	newHist := CategoryRateHistory{
		ID:            r.nextRateID,
		CategoryID:    id,
		PointsPerUnit: newRate,
		EffectiveFrom: now,
		EffectiveTo:   nil,
		Reason:        reason,
		ChangedBy:     changedBy,
		CreatedAt:     now,
	}
	r.nextRateID++
	r.rateHistory[id] = append([]CategoryRateHistory{newHist}, historyList...)

	// 3. Update category current rate
	c.CurrentPointsPerUnit = newRate
	c.UpdatedAt = now

	return nil
}

func (r *memoryCategoryRepository) GetRateHistory(categoryID int) ([]CategoryRateHistory, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	hist, ok := r.rateHistory[categoryID]
	if !ok {
		return []CategoryRateHistory{}, nil
	}

	copyHist := make([]CategoryRateHistory, len(hist))
	copy(copyHist, hist)

	// Ensure sorted by EffectiveFrom DESC
	sort.Slice(copyHist, func(i, j int) bool {
		return copyHist[i].EffectiveFrom.After(copyHist[j].EffectiveFrom)
	})

	return copyHist, nil
}

func (r *memoryCategoryRepository) GetStats() (*CategoryStats, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	total := len(r.categories)
	active := 0
	inactive := 0
	var sumRate float64

	for _, c := range r.categories {
		if c.Status == CategoryStatusActive {
			active++
		} else {
			inactive++
		}
		sumRate += c.CurrentPointsPerUnit
	}

	var avg float64
	if total > 0 {
		avg = math.Round((sumRate/float64(total))*10) / 10
	}

	return &CategoryStats{
		TotalCategories:    total,
		ActiveCategories:   active,
		InactiveCategories: inactive,
		AverageRate:        avg,
	}, nil
}

func (r *memoryCategoryRepository) HasAssociatedCollections(categoryID int) (bool, error) {
	// In mock/development mode, let category 1 and 2 represent categories with existing collection history
	if categoryID == 1 || categoryID == 2 {
		return true, nil
	}
	return false, nil
}

func (r *memoryCategoryRepository) Delete(id int) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.categories, id)
	delete(r.rateHistory, id)
	return nil
}
