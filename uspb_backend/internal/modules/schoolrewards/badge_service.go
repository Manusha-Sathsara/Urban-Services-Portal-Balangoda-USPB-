package schoolrewards

import (
	"bytes"
	"encoding/csv"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"
)

var (
	ErrBadgeNotFound            = errors.New("badge definition not found")
	ErrDuplicateBadgeName       = errors.New("badge name already exists")
	ErrInvalidBadgeName         = errors.New("badge name is required and must be between 2 and 100 characters")
	ErrInvalidThreshold         = errors.New("milestone threshold must be greater than zero")
	ErrInvalidMetric            = errors.New("eligibility metric must be either 'lifetime_earned' or 'available_points'")
	ErrInvalidBadgeStatus       = errors.New("status must be either 'active' or 'inactive'")
	ErrThresholdUnchanged       = errors.New("new threshold must be different from current threshold")
	ErrStudentNotFound          = errors.New("student not found")
	ErrBadgeNotActive           = errors.New("cannot award an inactive badge")
	ErrStudentNotEligible       = errors.New("student does not satisfy the required points threshold for this badge")
	ErrBadgeAlreadyAwarded      = errors.New("this badge has already been awarded to this student")
	ErrUnauthorizedSchoolAccess = errors.New("teachers can only access students from their assigned school")
)

// BadgeService defines business logic operations for Badge Configuration, Eligibility, and Awards
type BadgeService interface {
	// Badge Definition operations
	CreateBadge(req *CreateBadgeRequest, changedBy string) (*BadgeDefinition, error)
	ListBadges(filter BadgeListFilter) (*BadgeListResult, error)
	GetActiveBadges() ([]BadgeDefinition, error)
	GetBadgeByID(id int) (*BadgeDefinition, error)
	UpdateBadge(id int, req *UpdateBadgeRequest) (*BadgeDefinition, error)
	UpdateBadgeStatus(id int, status string) (*BadgeDefinition, error)
	UpdateBadgeThreshold(id int, req *UpdateThresholdRequest, changedBy string) (*BadgeDefinition, error)
	GetThresholdHistory(id int) ([]BadgeThresholdHistory, error)
	GetStats() (*BadgeStats, error)

	// Eligibility operations
	ListEligibility(filter EligibilityFilter) (*EligibilityListResult, error)
	GetStudentEligibility(studentID, badgeID int) (*StudentEligibility, error)

	// Award operations
	CreateAward(req *CreateAwardRequest, awardedBy string, teacherSchoolID *int) (*StudentBadgeAward, error)
	ListAwards(filter AwardListFilter) (*AwardListResult, error)
	GetAwardByID(id int, teacherSchoolID *int) (*StudentBadgeAward, error)
	ExportAwardsCSV(filter AwardListFilter) ([]byte, error)
}

type badgeService struct {
	repo           BadgeRepository
	pointsProvider PointsLedgerProvider
}

// NewBadgeService creates a new BadgeService instance
func NewBadgeService(repo BadgeRepository, pointsProvider PointsLedgerProvider) BadgeService {
	return &badgeService{
		repo:           repo,
		pointsProvider: pointsProvider,
	}
}

func (s *badgeService) CreateBadge(req *CreateBadgeRequest, changedBy string) (*BadgeDefinition, error) {
	name := strings.TrimSpace(req.Name)
	if len(name) < 2 || len(name) > 100 {
		return nil, ErrInvalidBadgeName
	}

	if req.MilestoneThreshold <= 0 {
		return nil, ErrInvalidThreshold
	}

	metric := MetricLifetimeEarned
	if req.EligibilityMetric != "" {
		m := EligibilityMetric(strings.ToLower(strings.TrimSpace(req.EligibilityMetric)))
		if m != MetricLifetimeEarned && m != MetricAvailablePoints {
			return nil, ErrInvalidMetric
		}
		metric = m
	}

	// Check name uniqueness (case-insensitive)
	existing, err := s.repo.GetBadgeByName(name)
	if err != nil {
		return nil, fmt.Errorf("failed to check badge name uniqueness: %w", err)
	}
	if existing != nil {
		return nil, ErrDuplicateBadgeName
	}

	status := BadgeStatusActive
	if req.Status != "" {
		st := strings.ToLower(strings.TrimSpace(req.Status))
		if st != string(BadgeStatusActive) && st != string(BadgeStatusInactive) {
			return nil, ErrInvalidBadgeStatus
		}
		status = BadgeStatus(st)
	}

	icon := strings.TrimSpace(req.IconName)
	if icon == "" {
		icon = "Award"
	}

	if changedBy == "" {
		changedBy = "COUNCIL_ADMIN"
	}

	badge := &BadgeDefinition{
		Name:               name,
		Description:        strings.TrimSpace(req.Description),
		IconName:           icon,
		MilestoneThreshold: req.MilestoneThreshold,
		EligibilityMetric:  metric,
		Status:             status,
	}

	initialReason := fmt.Sprintf("Initial badge configuration with milestone %.1f pts", req.MilestoneThreshold)
	if err := s.repo.CreateBadge(badge, initialReason, changedBy); err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			return nil, ErrDuplicateBadgeName
		}
		return nil, fmt.Errorf("failed to create badge definition: %w", err)
	}

	return badge, nil
}

func (s *badgeService) ListBadges(filter BadgeListFilter) (*BadgeListResult, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 10
	} else if filter.Limit > 100 {
		filter.Limit = 100
	}

	badges, totalCount, err := s.repo.GetAllBadges(filter)
	if err != nil {
		return nil, err
	}

	totalPages := int(math.Ceil(float64(totalCount) / float64(filter.Limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	return &BadgeListResult{
		Badges:     badges,
		TotalCount: totalCount,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *badgeService) GetActiveBadges() ([]BadgeDefinition, error) {
	return s.repo.GetActiveBadges()
}

func (s *badgeService) GetBadgeByID(id int) (*BadgeDefinition, error) {
	if id <= 0 {
		return nil, ErrBadgeNotFound
	}
	b, err := s.repo.GetBadgeByID(id)
	if err != nil {
		return nil, err
	}
	if b == nil {
		return nil, ErrBadgeNotFound
	}
	return b, nil
}

func (s *badgeService) UpdateBadge(id int, req *UpdateBadgeRequest) (*BadgeDefinition, error) {
	if id <= 0 {
		return nil, ErrBadgeNotFound
	}

	existing, err := s.repo.GetBadgeByID(id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ErrBadgeNotFound
	}

	name := strings.TrimSpace(req.Name)
	if len(name) < 2 || len(name) > 100 {
		return nil, ErrInvalidBadgeName
	}

	// Verify name uniqueness across other badges
	withName, err := s.repo.GetBadgeByName(name)
	if err != nil {
		return nil, fmt.Errorf("failed to verify badge name uniqueness: %w", err)
	}
	if withName != nil && withName.ID != id {
		return nil, ErrDuplicateBadgeName
	}

	status := existing.Status
	if req.Status != "" {
		st := strings.ToLower(strings.TrimSpace(req.Status))
		if st != string(BadgeStatusActive) && st != string(BadgeStatusInactive) {
			return nil, ErrInvalidBadgeStatus
		}
		status = BadgeStatus(st)
	}

	icon := strings.TrimSpace(req.IconName)
	if icon == "" {
		icon = existing.IconName
	}

	existing.Name = name
	existing.Description = strings.TrimSpace(req.Description)
	existing.IconName = icon
	existing.Status = status

	if err := s.repo.UpdateBadge(existing); err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			return nil, ErrDuplicateBadgeName
		}
		return nil, fmt.Errorf("failed to update badge definition: %w", err)
	}

	return existing, nil
}

func (s *badgeService) UpdateBadgeStatus(id int, status string) (*BadgeDefinition, error) {
	if id <= 0 {
		return nil, ErrBadgeNotFound
	}

	st := strings.ToLower(strings.TrimSpace(status))
	if st != string(BadgeStatusActive) && st != string(BadgeStatusInactive) {
		return nil, ErrInvalidBadgeStatus
	}

	existing, err := s.repo.GetBadgeByID(id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ErrBadgeNotFound
	}

	targetStatus := BadgeStatus(st)
	if existing.Status == targetStatus {
		return existing, nil
	}

	if err := s.repo.UpdateBadgeStatus(id, targetStatus); err != nil {
		return nil, fmt.Errorf("failed to update badge status: %w", err)
	}

	existing.Status = targetStatus
	return existing, nil
}

func (s *badgeService) UpdateBadgeThreshold(id int, req *UpdateThresholdRequest, changedBy string) (*BadgeDefinition, error) {
	if id <= 0 {
		return nil, ErrBadgeNotFound
	}

	if req.MilestoneThreshold <= 0 {
		return nil, ErrInvalidThreshold
	}

	reason := strings.TrimSpace(req.Reason)
	if reason == "" {
		return nil, ErrReasonRequired
	}

	existing, err := s.repo.GetBadgeByID(id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ErrBadgeNotFound
	}

	metric := existing.EligibilityMetric
	if req.EligibilityMetric != "" {
		m := EligibilityMetric(strings.ToLower(strings.TrimSpace(req.EligibilityMetric)))
		if m != MetricLifetimeEarned && m != MetricAvailablePoints {
			return nil, ErrInvalidMetric
		}
		metric = m
	}

	if existing.MilestoneThreshold == req.MilestoneThreshold && existing.EligibilityMetric == metric {
		return nil, ErrThresholdUnchanged
	}

	if changedBy == "" {
		changedBy = "COUNCIL_COORDINATOR"
	}

	if err := s.repo.UpdateBadgeThreshold(id, req.MilestoneThreshold, metric, reason, changedBy); err != nil {
		return nil, fmt.Errorf("failed to update threshold: %w", err)
	}

	existing.MilestoneThreshold = req.MilestoneThreshold
	existing.EligibilityMetric = metric
	return existing, nil
}

func (s *badgeService) GetThresholdHistory(id int) ([]BadgeThresholdHistory, error) {
	if id <= 0 {
		return nil, ErrBadgeNotFound
	}

	existing, err := s.repo.GetBadgeByID(id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ErrBadgeNotFound
	}

	return s.repo.GetThresholdHistory(id)
}

func (s *badgeService) GetStats() (*BadgeStats, error) {
	return s.repo.GetBadgeStats()
}

func (s *badgeService) ListEligibility(filter EligibilityFilter) (*EligibilityListResult, error) {
	// 1. Fetch relevant students
	students, err := s.repo.GetStudents(filter.SchoolID, filter.Search)
	if err != nil {
		return nil, fmt.Errorf("failed to query students for eligibility: %w", err)
	}

	// 2. Fetch badges in scope
	var badges []BadgeDefinition
	if filter.BadgeID != nil && *filter.BadgeID > 0 {
		b, err := s.repo.GetBadgeByID(*filter.BadgeID)
		if err != nil {
			return nil, err
		}
		if b != nil {
			badges = []BadgeDefinition{*b}
		}
	} else {
		activeBadges, err := s.repo.GetActiveBadges()
		if err != nil {
			return nil, err
		}
		badges = activeBadges
	}

	if len(badges) == 0 || len(students) == 0 {
		return &EligibilityListResult{
			Records:    []StudentEligibility{},
			TotalCount: 0,
			Page:       1,
			Limit:      filter.Limit,
			TotalPages: 1,
		}, nil
	}

	// 3. Batch fetch student points from points provider
	studentIDs := make([]int, len(students))
	for i, st := range students {
		studentIDs[i] = st.ID
	}
	pointsMap, err := s.pointsProvider.GetBatchStudentPoints(studentIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to get authoritative points balances: %w", err)
	}

	// 4. Evaluate eligibility for student x badge matrix
	var allRecords []StudentEligibility
	for _, st := range students {
		pts := pointsMap[st.ID]
		if pts == nil {
			pts = &StudentPoints{StudentID: st.ID, LifetimeEarned: 0, AvailablePoints: 0}
		}

		// Fetch existing awards for student to check if already awarded
		studentAwards, _ := s.repo.GetStudentAwards(st.ID)
		awardedMap := make(map[int]*StudentBadgeAward)
		for i := range studentAwards {
			awardedMap[studentAwards[i].BadgeID] = &studentAwards[i]
		}

		for _, b := range badges {
			var qualifyingPoints float64
			if b.EligibilityMetric == MetricAvailablePoints {
				qualifyingPoints = pts.AvailablePoints
			} else {
				qualifyingPoints = pts.LifetimeEarned
			}

			isEligible := qualifyingPoints >= b.MilestoneThreshold
			existingAward := awardedMap[b.ID]
			isAwarded := existingAward != nil && existingAward.Status == "awarded"

			var awardRef *string
			var awardDate *string
			if isAwarded {
				ref := existingAward.AwardReference
				awardRef = &ref
				dt := existingAward.AwardDate
				awardDate = &dt
			}

			// Apply filters
			if filter.EligibleOnly != nil && *filter.EligibleOnly && !isEligible {
				continue
			}

			if filter.AwardedStatus == "awarded" && !isAwarded {
				continue
			}
			if filter.AwardedStatus == "not_awarded" && isAwarded {
				continue
			}

			rec := StudentEligibility{
				StudentID:          st.ID,
				StudentIdentifier:  st.StudentIdentifier,
				StudentName:        st.FullName(),
				SchoolID:           st.SchoolID,
				SchoolName:         st.SchoolName,
				Grade:              st.Grade,
				BadgeID:            b.ID,
				BadgeName:          b.Name,
				BadgeIcon:          b.IconName,
				MilestoneThreshold: b.MilestoneThreshold,
				EligibilityMetric:  b.EligibilityMetric,
				QualifyingPoints:   qualifyingPoints,
				IsEligible:         isEligible,
				IsAwarded:          isAwarded,
				AwardReference:     awardRef,
				AwardDate:          awardDate,
			}
			allRecords = append(allRecords, rec)
		}
	}

	totalCount := len(allRecords)

	// Pagination
	limit := filter.Limit
	if limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	page := filter.Page
	if page <= 0 {
		page = 1
	}

	totalPages := int(math.Ceil(float64(totalCount) / float64(limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	offset := (page - 1) * limit
	if offset < 0 {
		offset = 0
	}

	var paged []StudentEligibility
	for i := offset; i < offset+limit && i < len(allRecords); i++ {
		paged = append(paged, allRecords[i])
	}

	return &EligibilityListResult{
		Records:    paged,
		TotalCount: totalCount,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (s *badgeService) GetStudentEligibility(studentID, badgeID int) (*StudentEligibility, error) {
	st, err := s.repo.GetStudentByID(studentID)
	if err != nil || st == nil {
		return nil, ErrStudentNotFound
	}

	b, err := s.repo.GetBadgeByID(badgeID)
	if err != nil || b == nil {
		return nil, ErrBadgeNotFound
	}

	pts, err := s.pointsProvider.GetStudentPoints(studentID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve points: %w", err)
	}

	var qualifyingPoints float64
	if b.EligibilityMetric == MetricAvailablePoints {
		qualifyingPoints = pts.AvailablePoints
	} else {
		qualifyingPoints = pts.LifetimeEarned
	}

	award, _ := s.repo.GetAwardByStudentAndBadge(studentID, badgeID)
	isAwarded := award != nil && award.Status == "awarded"

	var awardRef *string
	var awardDate *string
	if isAwarded {
		ref := award.AwardReference
		awardRef = &ref
		dt := award.AwardDate
		awardDate = &dt
	}

	return &StudentEligibility{
		StudentID:          st.ID,
		StudentIdentifier:  st.StudentIdentifier,
		StudentName:        st.FullName(),
		SchoolID:           st.SchoolID,
		SchoolName:         st.SchoolName,
		Grade:              st.Grade,
		BadgeID:            b.ID,
		BadgeName:          b.Name,
		BadgeIcon:          b.IconName,
		MilestoneThreshold: b.MilestoneThreshold,
		EligibilityMetric:  b.EligibilityMetric,
		QualifyingPoints:   qualifyingPoints,
		IsEligible:         qualifyingPoints >= b.MilestoneThreshold,
		IsAwarded:          isAwarded,
		AwardReference:     awardRef,
		AwardDate:          awardDate,
	}, nil
}

func (s *badgeService) CreateAward(req *CreateAwardRequest, awardedBy string, teacherSchoolID *int) (*StudentBadgeAward, error) {
	if req.StudentID <= 0 {
		return nil, ErrStudentNotFound
	}
	if req.BadgeID <= 0 {
		return nil, ErrBadgeNotFound
	}

	// 1. Verify student
	student, err := s.repo.GetStudentByID(req.StudentID)
	if err != nil || student == nil {
		return nil, ErrStudentNotFound
	}

	// Enforce school isolation for teachers
	if teacherSchoolID != nil && *teacherSchoolID > 0 && student.SchoolID != *teacherSchoolID {
		return nil, ErrUnauthorizedSchoolAccess
	}

	// 2. Verify badge
	badge, err := s.repo.GetBadgeByID(req.BadgeID)
	if err != nil || badge == nil {
		return nil, ErrBadgeNotFound
	}
	if badge.Status != BadgeStatusActive {
		return nil, ErrBadgeNotActive
	}

	// 3. Verify not already awarded
	existing, err := s.repo.GetAwardByStudentAndBadge(req.StudentID, req.BadgeID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing award: %w", err)
	}
	if existing != nil && existing.Status == "awarded" {
		return nil, ErrBadgeAlreadyAwarded
	}

	// 4. Calculate authoritative eligibility
	pts, err := s.pointsProvider.GetStudentPoints(req.StudentID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch student points: %w", err)
	}

	var qualifyingPoints float64
	if badge.EligibilityMetric == MetricAvailablePoints {
		qualifyingPoints = pts.AvailablePoints
	} else {
		qualifyingPoints = pts.LifetimeEarned
	}

	if qualifyingPoints < badge.MilestoneThreshold {
		return nil, fmt.Errorf("%w (Student points: %.1f, Required threshold: %.1f)",
			ErrStudentNotEligible, qualifyingPoints, badge.MilestoneThreshold)
	}

	// 5. Generate unique award reference
	ref, err := s.repo.GetNextAwardReference()
	if err != nil {
		ref = fmt.Sprintf("AWD-%d-%04d", time.Now().Year(), time.Now().UnixNano()%10000)
	}

	awardDate := strings.TrimSpace(req.AwardDate)
	if awardDate == "" {
		awardDate = time.Now().Format("2006-01-02")
	}

	if awardedBy == "" {
		awardedBy = "Municipal Rewards Officer"
	}

	award := &StudentBadgeAward{
		AwardReference:    ref,
		StudentID:         student.ID,
		StudentName:       student.FullName(),
		StudentIdentifier: student.StudentIdentifier,
		SchoolID:          student.SchoolID,
		SchoolName:        student.SchoolName,
		Grade:             student.Grade,
		BadgeID:           badge.ID,
		BadgeName:         badge.Name,
		BadgeIcon:         badge.IconName,
		QualifyingPoints:  qualifyingPoints,
		ThresholdAtAward:  badge.MilestoneThreshold,
		AwardDate:         awardDate,
		AwardedBy:         awardedBy,
		Notes:             strings.TrimSpace(req.Notes),
		Status:            "awarded",
	}

	if err := s.repo.CreateAward(award, awardedBy); err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "unique") || strings.Contains(strings.ToLower(err.Error()), "already") {
			return nil, ErrBadgeAlreadyAwarded
		}
		return nil, fmt.Errorf("failed to record badge award: %w", err)
	}

	return award, nil
}

func (s *badgeService) ListAwards(filter AwardListFilter) (*AwardListResult, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 10
	} else if filter.Limit > 100 {
		filter.Limit = 100
	}

	awards, totalCount, err := s.repo.GetAllAwards(filter)
	if err != nil {
		return nil, err
	}

	totalPages := int(math.Ceil(float64(totalCount) / float64(filter.Limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	return &AwardListResult{
		Awards:     awards,
		TotalCount: totalCount,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *badgeService) GetAwardByID(id int, teacherSchoolID *int) (*StudentBadgeAward, error) {
	if id <= 0 {
		return nil, errors.New("award not found")
	}
	award, err := s.repo.GetAwardByID(id)
	if err != nil || award == nil {
		return nil, errors.New("award not found")
	}

	// Enforce school isolation for teachers
	if teacherSchoolID != nil && *teacherSchoolID > 0 && award.SchoolID != *teacherSchoolID {
		return nil, ErrUnauthorizedSchoolAccess
	}

	return award, nil
}

func (s *badgeService) ExportAwardsCSV(filter AwardListFilter) ([]byte, error) {
	// Retrieve all matching awards without pagination limits
	exportFilter := filter
	exportFilter.Page = 1
	exportFilter.Limit = 5000

	awards, _, err := s.repo.GetAllAwards(exportFilter)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve awards for export: %w", err)
	}

	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)

	// CSV Header
	header := []string{
		"Award Reference",
		"Student Name",
		"Student Identifier",
		"School Name",
		"Grade",
		"Badge Name",
		"Qualifying Points",
		"Threshold at Award",
		"Award Date",
		"Awarded By",
		"Status",
		"Notes",
	}
	if err := writer.Write(header); err != nil {
		return nil, err
	}

	// CSV Rows
	for _, a := range awards {
		row := []string{
			a.AwardReference,
			a.StudentName,
			a.StudentIdentifier,
			a.SchoolName,
			a.Grade,
			a.BadgeName,
			fmt.Sprintf("%.1f", a.QualifyingPoints),
			fmt.Sprintf("%.1f", a.ThresholdAtAward),
			a.AwardDate,
			a.AwardedBy,
			a.Status,
			a.Notes,
		}
		if err := writer.Write(row); err != nil {
			return nil, err
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}
