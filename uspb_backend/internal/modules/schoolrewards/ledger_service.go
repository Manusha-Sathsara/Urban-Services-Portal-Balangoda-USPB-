package schoolrewards

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
)

var ErrValidation = errors.New("validation error")

type LedgerService struct {
	repo LedgerRepository
}

func NewLedgerService(repo LedgerRepository) *LedgerService {
	return &LedgerService{repo: repo}
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}

func resolveSchoolScope(actor ActorContext, requestedSchoolID *int) (*int, error) {
	if actor.Role == "TEACHER" {
		if actor.SchoolID == nil || *actor.SchoolID <= 0 {
			return nil, ErrCrossSchoolForbidden
		}
		return actor.SchoolID, nil
	}
	return requestedSchoolID, nil
}

func (s *LedgerService) ListStudents(ctx context.Context, actor ActorContext, schoolFilter *int, search string) ([]SchoolStudent, error) {
	scoped, err := resolveSchoolScope(actor, schoolFilter)
	if err != nil {
		return nil, err
	}
	return s.repo.ListStudents(ctx, actor, scoped, strings.TrimSpace(search))
}

func (s *LedgerService) GetStudent(ctx context.Context, actor ActorContext, studentID int) (*SchoolStudent, error) {
	return s.repo.GetStudent(ctx, actor, studentID)
}

func (s *LedgerService) CreateStudent(ctx context.Context, actor ActorContext, req CreateStudentRequest) (*SchoolStudent, error) {
	req.MembershipNo = strings.TrimSpace(req.MembershipNo)
	req.FullName = strings.TrimSpace(req.FullName)
	req.NameWithInitials = strings.TrimSpace(req.NameWithInitials)
	req.Grade = strings.TrimSpace(req.Grade)
	req.ClassName = strings.TrimSpace(req.ClassName)
	req.Address = strings.TrimSpace(req.Address)
	req.GuardianName = strings.TrimSpace(req.GuardianName)
	req.GuardianPhone = strings.TrimSpace(req.GuardianPhone)

	if req.MembershipNo == "" || req.FullName == "" {
		return nil, fmt.Errorf("%w: membership_no and full_name are required", ErrValidation)
	}

	scoped, err := resolveSchoolScope(actor, req.SchoolID)
	if err != nil {
		return nil, err
	}
	if scoped == nil || *scoped <= 0 {
		return nil, fmt.Errorf("%w: school_id is required", ErrValidation)
	}

	return s.repo.CreateStudent(ctx, actor, *scoped, req)
}

func (s *LedgerService) UpdateStudent(ctx context.Context, actor ActorContext, studentID int, req UpdateStudentRequest) (*SchoolStudent, error) {
	if studentID <= 0 {
		return nil, fmt.Errorf("%w: invalid student_id", ErrValidation)
	}
	return s.repo.UpdateStudent(ctx, actor, studentID, req)
}

func (s *LedgerService) RecordCollection(ctx context.Context, actor ActorContext, req RecordCollectionRequest) (*WasteCollection, error) {
	if req.StudentID <= 0 {
		return nil, fmt.Errorf("%w: student_id is required", ErrValidation)
	}
	req.IdempotencyKey = strings.TrimSpace(req.IdempotencyKey)
	if req.IdempotencyKey == "" {
		return nil, fmt.Errorf("%w: idempotency_key is required", ErrValidation)
	}
	if len(req.Items) == 0 {
		return nil, fmt.Errorf("%w: at least one waste item is required", ErrValidation)
	}

	var computed []WasteCollectionItem
	totalPoints := 0.0
	for i, item := range req.Items {
		if item.Quantity <= 0 {
			return nil, fmt.Errorf("%w: item %d quantity must be greater than zero", ErrValidation, i+1)
		}
		if item.RateSnapshot <= 0 {
			return nil, fmt.Errorf("%w: item %d rate must be greater than zero", ErrValidation, i+1)
		}
		if strings.TrimSpace(item.CategoryName) == "" || strings.TrimSpace(item.MeasurementUnit) == "" {
			return nil, fmt.Errorf("%w: item %d category_name and measurement_unit are required", ErrValidation, i+1)
		}
		pts := round2(item.Quantity * item.RateSnapshot)
		if pts <= 0 {
			return nil, fmt.Errorf("%w: item %d calculated points must be positive", ErrValidation, i+1)
		}
		totalPoints = round2(totalPoints + pts)
		computed = append(computed, WasteCollectionItem{
			CategoryID:      item.CategoryID,
			CategoryName:    strings.TrimSpace(item.CategoryName),
			MeasurementUnit: strings.TrimSpace(item.MeasurementUnit),
			Quantity:        item.Quantity,
			RateSnapshot:    item.RateSnapshot,
			PointsEarned:    pts,
		})
	}

	return s.repo.RecordCollection(ctx, actor, req, computed, totalPoints)
}

func (s *LedgerService) ListCollections(ctx context.Context, actor ActorContext, studentID *int) ([]WasteCollection, error) {
	return s.repo.ListCollections(ctx, actor, studentID)
}

func (s *LedgerService) ReverseCollection(ctx context.Context, actor ActorContext, collectionID int, reason string) error {
	reason = strings.TrimSpace(reason)
	if reason == "" {
		return fmt.Errorf("%w: reversal reason is required", ErrValidation)
	}
	return s.repo.ReverseCollection(ctx, actor, collectionID, reason)
}

func (s *LedgerService) RecordPayout(ctx context.Context, actor ActorContext, req RecordPayoutRequest) (*RewardPayout, float64, error) {
	if req.StudentID <= 0 {
		return nil, 0, fmt.Errorf("%w: student_id is required", ErrValidation)
	}
	req.IdempotencyKey = strings.TrimSpace(req.IdempotencyKey)
	if req.IdempotencyKey == "" {
		return nil, 0, fmt.Errorf("%w: idempotency_key is required", ErrValidation)
	}
	req.PhysicalCardRef = strings.TrimSpace(req.PhysicalCardRef)
	req.ReceiptNo = strings.TrimSpace(req.ReceiptNo)

	return s.repo.RecordPayout(ctx, actor, req)
}

func (s *LedgerService) ListPayouts(ctx context.Context, actor ActorContext, studentID *int) ([]RewardPayout, error) {
	return s.repo.ListPayouts(ctx, actor, studentID)
}

func (s *LedgerService) ReversePayout(ctx context.Context, actor ActorContext, payoutID int, reason string) error {
	if actor.Role != "GARBAGE_SUPERVISOR" && actor.Role != "ADMIN" {
		return ErrCrossSchoolForbidden
	}
	reason = strings.TrimSpace(reason)
	if reason == "" {
		return fmt.Errorf("%w: reversal reason is required", ErrValidation)
	}
	return s.repo.ReversePayout(ctx, actor, payoutID, reason)
}

func (s *LedgerService) ListStudentTransactions(ctx context.Context, actor ActorContext, studentID int) ([]PointTransaction, error) {
	return s.repo.ListStudentTransactions(ctx, actor, studentID)
}

func (s *LedgerService) GetDashboardSummary(ctx context.Context, actor ActorContext, schoolFilter *int) (*SchoolDashboardSummary, error) {
	scoped, err := resolveSchoolScope(actor, schoolFilter)
	if err != nil {
		return nil, err
	}
	return s.repo.GetDashboardSummary(ctx, actor, scoped)
}

func (s *LedgerService) ListClasses(ctx context.Context, actor ActorContext, schoolFilter *int) ([]SchoolClass, error) {
	scoped, err := resolveSchoolScope(actor, schoolFilter)
	if err != nil {
		return nil, err
	}
	return s.repo.ListClasses(ctx, actor, scoped)
}

func (s *LedgerService) CreateClass(ctx context.Context, actor ActorContext, req CreateClassRequest) (*SchoolClass, error) {
	req.Grade = strings.TrimSpace(req.Grade)
	req.ClassName = strings.TrimSpace(req.ClassName)
	req.TeacherInCharge = strings.TrimSpace(req.TeacherInCharge)
	if req.Grade == "" || req.ClassName == "" {
		return nil, fmt.Errorf("%w: grade and class_name are required", ErrValidation)
	}
	scoped, err := resolveSchoolScope(actor, req.SchoolID)
	if err != nil {
		return nil, err
	}
	if scoped == nil || *scoped <= 0 {
		return nil, fmt.Errorf("%w: school_id is required", ErrValidation)
	}
	return s.repo.CreateClass(ctx, actor, *scoped, req)
}

func (s *LedgerService) UpdateClass(ctx context.Context, actor ActorContext, classID int, req UpdateClassRequest) (*SchoolClass, error) {
	if classID <= 0 {
		return nil, fmt.Errorf("%w: invalid class_id", ErrValidation)
	}
	return s.repo.UpdateClass(ctx, actor, classID, req)
}

func (s *LedgerService) SyncAndListStudentBadges(ctx context.Context, actor ActorContext, schoolFilter *int) ([]StudentBadgeSummary, error) {
	scoped, err := resolveSchoolScope(actor, schoolFilter)
	if err != nil {
		return nil, err
	}
	return s.repo.SyncAndListStudentBadges(ctx, actor, scoped)
}
