package schoolrewards

import (
	"database/sql"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"
)

type memoryBadgeRepository struct {
	mu          sync.RWMutex
	badges      map[int]*BadgeDefinition
	histories   map[int][]BadgeThresholdHistory
	students    map[int]*Student
	awards      map[int]*StudentBadgeAward
	auditLogs   []struct {
		awardID     int
		action      string
		performedBy string
		details     string
		createdAt   time.Time
	}
	nextBadgeID int
	nextHistID  int
	nextAwardID int
}

// NewMemoryBadgeRepository creates an in-memory repository pre-seeded with authentic Balangoda records
func NewMemoryBadgeRepository() BadgeRepository {
	repo := &memoryBadgeRepository{
		badges:      make(map[int]*BadgeDefinition),
		histories:   make(map[int][]BadgeThresholdHistory),
		students:    make(map[int]*Student),
		awards:      make(map[int]*StudentBadgeAward),
		nextBadgeID: 6,
		nextHistID:  6,
		nextAwardID: 5,
	}

	baseTime := time.Now().Add(-30 * 24 * time.Hour)

	// 1. Seed Badges
	badgeSeeds := []struct {
		id        int
		name      string
		desc      string
		icon      string
		threshold float64
		metric    EligibilityMetric
		status    BadgeStatus
	}{
		{id: 1, name: "Eco-Sprout", desc: "Awarded to students embarking on their segregation journey with initial recyclable deposits.", icon: "Leaf", threshold: 50.0, metric: MetricLifetimeEarned, status: BadgeStatusActive},
		{id: 2, name: "Waste Warrior", desc: "Recognizes disciplined sorting habits and sustained participation in classroom waste separation.", icon: "ShieldCheck", threshold: 100.0, metric: MetricLifetimeEarned, status: BadgeStatusActive},
		{id: 3, name: "Recycling Champion", desc: "Honors students who consistently meet high recyclable yield milestones in school collections.", icon: "Sparkles", threshold: 250.0, metric: MetricLifetimeEarned, status: BadgeStatusActive},
		{id: 4, name: "Green Ambassador", desc: "Bestowed upon exemplary student leaders driving community environmental consciousness.", icon: "Award", threshold: 500.0, metric: MetricLifetimeEarned, status: BadgeStatusActive},
		{id: 5, name: "Balangoda Green Guardian", desc: "The highest municipal environmental distinction awarded by the Balangoda Urban Council.", icon: "Crown", threshold: 1000.0, metric: MetricLifetimeEarned, status: BadgeStatusActive},
	}

	for _, b := range badgeSeeds {
		repo.badges[b.id] = &BadgeDefinition{
			ID:                 b.id,
			Name:               b.name,
			Description:        b.desc,
			IconName:           b.icon,
			MilestoneThreshold: b.threshold,
			EligibilityMetric:  b.metric,
			Status:             b.status,
			CreatedAt:          baseTime,
			UpdatedAt:          baseTime,
		}

		repo.histories[b.id] = []BadgeThresholdHistory{
			{
				ID:                 b.id,
				BadgeID:            b.id,
				MilestoneThreshold: b.threshold,
				EligibilityMetric:  b.metric,
				EffectiveFrom:      baseTime,
				EffectiveTo:        nil,
				Reason:             "Municipal baseline threshold established",
				ChangedBy:          "SYSTEM_ADMIN",
				CreatedAt:          baseTime,
			},
		}
	}

	// 2. Seed Students
	studentSeeds := []struct {
		id         int
		schoolID   int
		schoolName string
		identifier string
		firstName  string
		lastName   string
		grade      string
	}{
		{id: 1, schoolID: 1, schoolName: "Balangoda Ananda Maithreya Central College", identifier: "STU-BAMCC-001", firstName: "Kaveesha", lastName: "Tharushi", grade: "Grade 9-A"},
		{id: 2, schoolID: 1, schoolName: "Balangoda Ananda Maithreya Central College", identifier: "STU-BAMCC-002", firstName: "Dineth", lastName: "Sithum", grade: "Grade 10-C"},
		{id: 3, schoolID: 1, schoolName: "Balangoda Ananda Maithreya Central College", identifier: "STU-BAMCC-003", firstName: "Nethmi", lastName: "Rasanjali", grade: "Grade 8-B"},
		{id: 4, schoolID: 1, schoolName: "Balangoda Ananda Maithreya Central College", identifier: "STU-BAMCC-004", firstName: "Ravindu", lastName: "Lakshan", grade: "Grade 11-A"},
		{id: 5, schoolID: 1, schoolName: "Balangoda Ananda Maithreya Central College", identifier: "STU-BAMCC-005", firstName: "Chamodi", lastName: "Nisansala", grade: "Grade 7-D"},
		{id: 6, schoolID: 2, schoolName: "St. Agnes Convent Balangoda", identifier: "STU-SACB-001", firstName: "Sanduni", lastName: "Hansamali", grade: "Grade 9-B"},
		{id: 7, schoolID: 2, schoolName: "St. Agnes Convent Balangoda", identifier: "STU-SACB-002", firstName: "Oshadi", lastName: "Piyumika", grade: "Grade 8-A"},
		{id: 8, schoolID: 2, schoolName: "St. Agnes Convent Balangoda", identifier: "STU-SACB-003", firstName: "Senuri", lastName: "Navodya", grade: "Grade 10-A"},
		{id: 9, schoolID: 3, schoolName: "Meddakanda Maha Vidyalaya", identifier: "STU-MMV-001", firstName: "Kasun", lastName: "Madusanka", grade: "Grade 8-C"},
		{id: 10, schoolID: 3, schoolName: "Meddakanda Maha Vidyalaya", identifier: "STU-MMV-002", firstName: "Dilhani", lastName: "Jayasinghe", grade: "Grade 9-A"},
	}

	for _, s := range studentSeeds {
		repo.students[s.id] = &Student{
			ID:                s.id,
			SchoolID:          s.schoolID,
			SchoolName:        s.schoolName,
			StudentIdentifier: s.identifier,
			FirstName:         s.firstName,
			LastName:          s.lastName,
			Grade:             s.grade,
			Status:            "active",
			CreatedAt:         baseTime,
			UpdatedAt:         baseTime,
		}
	}

	// 3. Seed Recorded Awards
	awardSeeds := []struct {
		id         int
		ref        string
		studentID  int
		badgeID    int
		points     float64
		threshold  float64
		date       string
		by         string
		notes      string
		createdAgo time.Duration
	}{
		{id: 1, ref: "AWD-2026-0001", studentID: 1, badgeID: 1, points: 65.0, threshold: 50.0, date: time.Now().Add(-15 * 24 * time.Hour).Format("2006-01-02"), by: "supervisor@balangoda.uc.gov.lk", notes: "Awarded during school morning assembly", createdAgo: 15 * 24 * time.Hour},
		{id: 2, ref: "AWD-2026-0002", studentID: 2, badgeID: 1, points: 110.0, threshold: 50.0, date: time.Now().Add(-12 * 24 * time.Hour).Format("2006-01-02"), by: "supervisor@balangoda.uc.gov.lk", notes: "Presented at Eco-Club inauguration", createdAgo: 12 * 24 * time.Hour},
		{id: 3, ref: "AWD-2026-0003", studentID: 6, badgeID: 1, points: 58.0, threshold: 50.0, date: time.Now().Add(-10 * 24 * time.Hour).Format("2006-01-02"), by: "teacher.agnes@balangoda.uc.gov.lk", notes: "Verified by St. Agnes Eco Committee", createdAgo: 10 * 24 * time.Hour},
		{id: 4, ref: "AWD-2026-0004", studentID: 1, badgeID: 2, points: 120.0, threshold: 100.0, date: time.Now().Add(-5 * 24 * time.Hour).Format("2006-01-02"), by: "supervisor@balangoda.uc.gov.lk", notes: "Exemplary plastic PET collection yield", createdAgo: 5 * 24 * time.Hour},
	}

	for _, a := range awardSeeds {
		st := repo.students[a.studentID]
		bg := repo.badges[a.badgeID]
		createdAt := time.Now().Add(-a.createdAgo)

		repo.awards[a.id] = &StudentBadgeAward{
			ID:                a.id,
			AwardReference:    a.ref,
			StudentID:         a.studentID,
			StudentName:       st.FullName(),
			StudentIdentifier: st.StudentIdentifier,
			SchoolID:          st.SchoolID,
			SchoolName:        st.SchoolName,
			Grade:             st.Grade,
			BadgeID:           a.badgeID,
			BadgeName:         bg.Name,
			BadgeIcon:         bg.IconName,
			QualifyingPoints:  a.points,
			ThresholdAtAward:  a.threshold,
			AwardDate:         a.date,
			AwardedBy:         a.by,
			Notes:             a.notes,
			Status:            "awarded",
			CreatedAt:         createdAt,
			UpdatedAt:         createdAt,
		}
	}

	return repo
}

func (m *memoryBadgeRepository) CreateBadge(badge *BadgeDefinition, reason, changedBy string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	badge.ID = m.nextBadgeID
	m.nextBadgeID++
	now := time.Now()
	badge.CreatedAt = now
	badge.UpdatedAt = now

	copied := *badge
	m.badges[badge.ID] = &copied

	if reason == "" {
		reason = fmt.Sprintf("Initial badge creation with threshold %.1f pts", badge.MilestoneThreshold)
	}
	if changedBy == "" {
		changedBy = "SYSTEM"
	}

	m.histories[badge.ID] = []BadgeThresholdHistory{
		{
			ID:                 m.nextHistID,
			BadgeID:            badge.ID,
			MilestoneThreshold: badge.MilestoneThreshold,
			EligibilityMetric:  badge.EligibilityMetric,
			EffectiveFrom:      now,
			EffectiveTo:        nil,
			Reason:             reason,
			ChangedBy:          changedBy,
			CreatedAt:          now,
		},
	}
	m.nextHistID++

	return nil
}

func (m *memoryBadgeRepository) GetAllBadges(filter BadgeListFilter) ([]BadgeDefinition, int, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var filtered []*BadgeDefinition
	for _, b := range m.badges {
		if strings.TrimSpace(filter.Search) != "" {
			term := strings.ToLower(strings.TrimSpace(filter.Search))
			if !strings.Contains(strings.ToLower(b.Name), term) && !strings.Contains(strings.ToLower(b.Description), term) {
				continue
			}
		}

		if filter.Status != "" && filter.Status != "all" {
			if strings.ToLower(string(b.Status)) != strings.ToLower(filter.Status) {
				continue
			}
		}

		filtered = append(filtered, b)
	}

	totalCount := len(filtered)

	// Sorting
	sort.Slice(filtered, func(i, j int) bool {
		switch strings.ToLower(filter.SortField) {
		case "name":
			if strings.ToLower(filter.SortOrder) == "desc" {
				return filtered[i].Name > filtered[j].Name
			}
			return filtered[i].Name < filtered[j].Name
		case "threshold", "milestone_threshold":
			if strings.ToLower(filter.SortOrder) == "desc" {
				return filtered[i].MilestoneThreshold > filtered[j].MilestoneThreshold
			}
			return filtered[i].MilestoneThreshold < filtered[j].MilestoneThreshold
		case "status":
			if strings.ToLower(filter.SortOrder) == "desc" {
				return filtered[i].Status > filtered[j].Status
			}
			return filtered[i].Status < filtered[j].Status
		default:
			return filtered[i].ID < filtered[j].ID
		}
	})

	// Pagination
	limit := filter.Limit
	if limit <= 0 {
		limit = 10
	}
	offset := (filter.Page - 1) * limit
	if offset < 0 {
		offset = 0
	}

	var paged []BadgeDefinition
	for i := offset; i < offset+limit && i < len(filtered); i++ {
		item := *filtered[i]
		// Calculate award count
		count := 0
		for _, a := range m.awards {
			if a.BadgeID == item.ID && a.Status == "awarded" {
				count++
			}
		}
		item.AwardCount = count
		paged = append(paged, item)
	}

	return paged, totalCount, nil
}

func (m *memoryBadgeRepository) GetActiveBadges() ([]BadgeDefinition, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var result []BadgeDefinition
	for _, b := range m.badges {
		if b.Status == BadgeStatusActive {
			item := *b
			count := 0
			for _, a := range m.awards {
				if a.BadgeID == item.ID && a.Status == "awarded" {
					count++
				}
			}
			item.AwardCount = count
			result = append(result, item)
		}
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].MilestoneThreshold < result[j].MilestoneThreshold
	})

	return result, nil
}

func (m *memoryBadgeRepository) GetBadgeByID(id int) (*BadgeDefinition, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if b, ok := m.badges[id]; ok {
		item := *b
		count := 0
		for _, a := range m.awards {
			if a.BadgeID == item.ID && a.Status == "awarded" {
				count++
			}
		}
		item.AwardCount = count
		return &item, nil
	}
	return nil, nil
}

func (m *memoryBadgeRepository) GetBadgeByName(name string) (*BadgeDefinition, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, b := range m.badges {
		if strings.EqualFold(b.Name, name) {
			item := *b
			return &item, nil
		}
	}
	return nil, nil
}

func (m *memoryBadgeRepository) UpdateBadge(badge *BadgeDefinition) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	existing, ok := m.badges[badge.ID]
	if !ok {
		return sql.ErrNoRows
	}

	existing.Name = badge.Name
	existing.Description = badge.Description
	existing.IconName = badge.IconName
	existing.Status = badge.Status
	existing.UpdatedAt = time.Now()
	badge.UpdatedAt = existing.UpdatedAt

	return nil
}

func (m *memoryBadgeRepository) UpdateBadgeStatus(id int, status BadgeStatus) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	existing, ok := m.badges[id]
	if !ok {
		return sql.ErrNoRows
	}

	existing.Status = status
	existing.UpdatedAt = time.Now()
	return nil
}

func (m *memoryBadgeRepository) UpdateBadgeThreshold(id int, newThreshold float64, metric EligibilityMetric, reason, changedBy string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	existing, ok := m.badges[id]
	if !ok {
		return sql.ErrNoRows
	}

	now := time.Now()

	// 1. Close current rate
	histList := m.histories[id]
	for i := range histList {
		if histList[i].EffectiveTo == nil {
			histList[i].EffectiveTo = &now
		}
	}

	// 2. Insert new record
	newHist := BadgeThresholdHistory{
		ID:                 m.nextHistID,
		BadgeID:            id,
		MilestoneThreshold: newThreshold,
		EligibilityMetric:  metric,
		EffectiveFrom:      now,
		EffectiveTo:        nil,
		Reason:             reason,
		ChangedBy:          changedBy,
		CreatedAt:          now,
	}
	m.nextHistID++

	histList = append([]BadgeThresholdHistory{newHist}, histList...)
	m.histories[id] = histList

	// 3. Update current badge
	existing.MilestoneThreshold = newThreshold
	existing.EligibilityMetric = metric
	existing.UpdatedAt = now

	return nil
}

func (m *memoryBadgeRepository) GetThresholdHistory(badgeID int) ([]BadgeThresholdHistory, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if list, ok := m.histories[badgeID]; ok {
		res := make([]BadgeThresholdHistory, len(list))
		copy(res, list)
		return res, nil
	}
	return []BadgeThresholdHistory{}, nil
}

func (m *memoryBadgeRepository) GetBadgeStats() (*BadgeStats, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	total := len(m.badges)
	active := 0
	inactive := 0
	for _, b := range m.badges {
		if b.Status == BadgeStatusActive {
			active++
		} else {
			inactive++
		}
	}

	awards := 0
	for _, a := range m.awards {
		if a.Status == "awarded" {
			awards++
		}
	}

	return &BadgeStats{
		TotalBadges:    total,
		ActiveBadges:   active,
		InactiveBadges: inactive,
		TotalAwards:    awards,
	}, nil
}

func (m *memoryBadgeRepository) GetStudents(schoolID *int, search string) ([]Student, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var result []Student
	for _, st := range m.students {
		if schoolID != nil && *schoolID > 0 && st.SchoolID != *schoolID {
			continue
		}

		if strings.TrimSpace(search) != "" {
			term := strings.ToLower(strings.TrimSpace(search))
			matchName := strings.Contains(strings.ToLower(st.FullName()), term)
			matchID := strings.Contains(strings.ToLower(st.StudentIdentifier), term)
			if !matchName && !matchID {
				continue
			}
		}

		result = append(result, *st)
	}

	sort.Slice(result, func(i, j int) bool {
		if result[i].SchoolName != result[j].SchoolName {
			return result[i].SchoolName < result[j].SchoolName
		}
		return result[i].StudentIdentifier < result[j].StudentIdentifier
	})

	return result, nil
}

func (m *memoryBadgeRepository) GetStudentByID(id int) (*Student, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if st, ok := m.students[id]; ok {
		item := *st
		return &item, nil
	}
	return nil, nil
}

func (m *memoryBadgeRepository) CreateAward(award *StudentBadgeAward, performedBy string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Check unique constraint: student_id and badge_id
	for _, a := range m.awards {
		if a.StudentID == award.StudentID && a.BadgeID == award.BadgeID && a.Status == "awarded" {
			return fmt.Errorf("student #%d has already received badge #%d", award.StudentID, award.BadgeID)
		}
	}

	award.ID = m.nextAwardID
	m.nextAwardID++
	now := time.Now()
	award.CreatedAt = now
	award.UpdatedAt = now
	award.Status = "awarded"

	copied := *award
	m.awards[award.ID] = &copied

	m.auditLogs = append(m.auditLogs, struct {
		awardID     int
		action      string
		performedBy string
		details     string
		createdAt   time.Time
	}{
		awardID:     award.ID,
		action:      "AWARD_BESTOWED",
		performedBy: performedBy,
		details:     fmt.Sprintf("Badge '%s' (Ref: %s) awarded", award.BadgeName, award.AwardReference),
		createdAt:   now,
	})

	return nil
}

func (m *memoryBadgeRepository) UpdateAwardStatus(id int, status, notes, performedBy, reason string) (*StudentBadgeAward, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	award, ok := m.awards[id]
	if !ok {
		return nil, sql.ErrNoRows
	}

	prevStatus := award.Status
	award.Status = status
	if strings.TrimSpace(notes) != "" {
		award.Notes = strings.TrimSpace(notes)
	}
	now := time.Now()
	award.UpdatedAt = now

	action := "AWARD_STATUS_CHANGED"
	if status == "revoked" {
		action = "AWARD_REVOKED"
	} else if status == "awarded" && prevStatus == "revoked" {
		action = "AWARD_REINSTATED"
	}

	m.auditLogs = append(m.auditLogs, struct {
		awardID     int
		action      string
		performedBy string
		details     string
		createdAt   time.Time
	}{
		awardID:     id,
		action:      action,
		performedBy: performedBy,
		details:     fmt.Sprintf("Status changed from '%s' to '%s'. Reason: %s", prevStatus, status, reason),
		createdAt:   now,
	})

	copied := *award
	return &copied, nil
}

func (m *memoryBadgeRepository) DeleteAward(id int) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, ok := m.awards[id]; !ok {
		return sql.ErrNoRows
	}
	delete(m.awards, id)
	return nil
}

func (m *memoryBadgeRepository) GetAllAwards(filter AwardListFilter) ([]StudentBadgeAward, int, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var filtered []*StudentBadgeAward
	for _, a := range m.awards {
		if filter.SchoolID != nil && *filter.SchoolID > 0 && a.SchoolID != *filter.SchoolID {
			continue
		}

		if filter.BadgeID != nil && *filter.BadgeID > 0 && a.BadgeID != *filter.BadgeID {
			continue
		}

		if strings.TrimSpace(filter.Status) != "" && strings.ToLower(strings.TrimSpace(filter.Status)) != "all" {
			if !strings.EqualFold(a.Status, strings.TrimSpace(filter.Status)) {
				continue
			}
		}

		if strings.TrimSpace(filter.Search) != "" {
			term := strings.ToLower(strings.TrimSpace(filter.Search))
			matchName := strings.Contains(strings.ToLower(a.StudentName), term)
			matchID := strings.Contains(strings.ToLower(a.StudentIdentifier), term)
			matchRef := strings.Contains(strings.ToLower(a.AwardReference), term)
			if !matchName && !matchID && !matchRef {
				continue
			}
		}

		if strings.TrimSpace(filter.StartDate) != "" {
			if a.AwardDate < filter.StartDate {
				continue
			}
		}

		if strings.TrimSpace(filter.EndDate) != "" {
			if a.AwardDate > filter.EndDate {
				continue
			}
		}

		filtered = append(filtered, a)
	}

	totalCount := len(filtered)

	sort.Slice(filtered, func(i, j int) bool {
		if filtered[i].AwardDate != filtered[j].AwardDate {
			return filtered[i].AwardDate > filtered[j].AwardDate
		}
		return filtered[i].ID > filtered[j].ID
	})

	limit := filter.Limit
	if limit <= 0 {
		limit = 10
	}
	offset := (filter.Page - 1) * limit
	if offset < 0 {
		offset = 0
	}

	var paged []StudentBadgeAward
	for i := offset; i < offset+limit && i < len(filtered); i++ {
		paged = append(paged, *filtered[i])
	}

	return paged, totalCount, nil
}

func (m *memoryBadgeRepository) GetAwardByID(id int) (*StudentBadgeAward, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if a, ok := m.awards[id]; ok {
		item := *a
		return &item, nil
	}
	return nil, nil
}

func (m *memoryBadgeRepository) GetAwardByStudentAndBadge(studentID, badgeID int) (*StudentBadgeAward, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, a := range m.awards {
		if a.StudentID == studentID && a.BadgeID == badgeID && a.Status == "awarded" {
			item := *a
			return &item, nil
		}
	}
	return nil, nil
}

func (m *memoryBadgeRepository) GetStudentAwards(studentID int) ([]StudentBadgeAward, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var result []StudentBadgeAward
	for _, a := range m.awards {
		if a.StudentID == studentID && a.Status == "awarded" {
			result = append(result, *a)
		}
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].AwardDate > result[j].AwardDate
	})

	return result, nil
}

func (m *memoryBadgeRepository) GetNextAwardReference() (string, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	year := time.Now().Year()
	count := len(m.awards)
	return fmt.Sprintf("AWD-%d-%04d", year, count+1), nil
}
