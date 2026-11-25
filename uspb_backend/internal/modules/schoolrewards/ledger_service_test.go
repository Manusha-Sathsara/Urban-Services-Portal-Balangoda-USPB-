package schoolrewards

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"
)

type memoryLedgerRepo struct {
	mu           sync.Mutex
	students     map[int]*Student
	collections  map[int]*WasteCollection
	payouts      map[int]*RewardPayout
	transactions []PointTransaction
	colByKey     map[string]int
	payByKey     map[string]int
	nextID       int
}

func newMemoryLedgerRepo() *memoryLedgerRepo {
	return &memoryLedgerRepo{
		students:    make(map[int]*Student),
		collections: make(map[int]*WasteCollection),
		payouts:     make(map[int]*RewardPayout),
		colByKey:    make(map[string]int),
		payByKey:    make(map[string]int),
		nextID:      1,
	}
}

func (m *memoryLedgerRepo) ListStudents(_ context.Context, actor ActorContext, schoolFilter *int, _ string) ([]Student, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var out []Student
	for _, s := range m.students {
		if actor.Role == "TEACHER" && (actor.SchoolID == nil || s.SchoolID != *actor.SchoolID) {
			continue
		}
		if schoolFilter != nil && *schoolFilter > 0 && s.SchoolID != *schoolFilter {
			continue
		}
		cp := *s
		cp.ComputeCardEligibility()
		out = append(out, cp)
	}
	return out, nil
}

func (m *memoryLedgerRepo) GetStudent(_ context.Context, actor ActorContext, studentID int) (*Student, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	s, ok := m.students[studentID]
	if !ok {
		return nil, ErrStudentNotFound
	}
	if actor.Role == "TEACHER" && (actor.SchoolID == nil || s.SchoolID != *actor.SchoolID) {
		return nil, ErrStudentNotFound
	}
	cp := *s
	cp.ComputeCardEligibility()
	return &cp, nil
}

func (m *memoryLedgerRepo) CreateStudent(_ context.Context, actor ActorContext, schoolID int, req CreateStudentRequest) (*Student, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	s := &Student{
		ID:           m.nextID,
		SchoolID:     schoolID,
		MembershipNo: req.MembershipNo,
		FullName:     req.FullName,
		IsActive:     true,
		CreatedBy:    actor.UserID,
		CreatedAt:    time.Now(),
	}
	m.nextID++
	m.students[s.ID] = s
	cp := *s
	return &cp, nil
}

func (m *memoryLedgerRepo) UpdateStudent(_ context.Context, _ ActorContext, studentID int, req UpdateStudentRequest) (*Student, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	s, ok := m.students[studentID]
	if !ok {
		return nil, ErrStudentNotFound
	}
	if req.IsActive != nil {
		s.IsActive = *req.IsActive
	}
	cp := *s
	return &cp, nil
}

func (m *memoryLedgerRepo) RecordCollection(_ context.Context, actor ActorContext, req RecordCollectionRequest, items []WasteCollectionItem, totalPoints float64) (*WasteCollection, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if existingID, ok := m.colByKey[req.IdempotencyKey]; ok {
		cp := *m.collections[existingID]
		return &cp, nil
	}

	s, ok := m.students[req.StudentID]
	if !ok {
		return nil, ErrStudentNotFound
	}
	if actor.Role == "TEACHER" && (actor.SchoolID == nil || s.SchoolID != *actor.SchoolID) {
		return nil, ErrStudentNotFound
	}
	if !s.IsActive {
		return nil, ErrStudentInactive
	}

	col := &WasteCollection{
		ID:             m.nextID,
		SchoolID:       s.SchoolID,
		StudentID:      s.ID,
		RecordedBy:     actor.UserID,
		TotalPoints:    totalPoints,
		IdempotencyKey: req.IdempotencyKey,
		Items:          items,
	}
	m.nextID++
	m.collections[col.ID] = col
	m.colByKey[req.IdempotencyKey] = col.ID
	m.transactions = append(m.transactions, PointTransaction{
		ID:          int64(len(m.transactions) + 1),
		SchoolID:    s.SchoolID,
		StudentID:   s.ID,
		TxType:      "EARN_COLLECTION",
		PointsDelta: totalPoints,
	})
	s.CachedAvailablePoints = round2(s.CachedAvailablePoints + totalPoints)
	cp := *col
	return &cp, nil
}

func (m *memoryLedgerRepo) ListCollections(_ context.Context, _ ActorContext, _ *int) ([]WasteCollection, error) {
	return []WasteCollection{}, nil
}

func (m *memoryLedgerRepo) ReverseCollection(_ context.Context, _ ActorContext, collectionID int, reason string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	col, ok := m.collections[collectionID]
	if !ok {
		return ErrCollectionNotFound
	}
	if col.IsReversed {
		return ErrAlreadyReversed
	}
	s := m.students[col.StudentID]
	if s.CachedAvailablePoints < col.TotalPoints {
		return ErrInsufficientPoints
	}
	col.IsReversed = true
	col.ReversalReason = reason
	s.CachedAvailablePoints = round2(s.CachedAvailablePoints - col.TotalPoints)
	return nil
}

func (m *memoryLedgerRepo) RecordPayout(_ context.Context, actor ActorContext, req RecordPayoutRequest) (*RewardPayout, float64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if existingID, ok := m.payByKey[req.IdempotencyKey]; ok {
		p := *m.payouts[existingID]
		return &p, m.students[p.StudentID].CachedAvailablePoints, nil
	}

	s, ok := m.students[req.StudentID]
	if !ok {
		return nil, 0, ErrStudentNotFound
	}
	if actor.Role == "TEACHER" && (actor.SchoolID == nil || s.SchoolID != *actor.SchoolID) {
		return nil, 0, ErrStudentNotFound
	}
	if s.CachedAvailablePoints < RedemptionPointsCost {
		return nil, 0, ErrInsufficientPoints
	}

	p := &RewardPayout{
		ID:              m.nextID,
		SchoolID:        s.SchoolID,
		StudentID:       s.ID,
		RecordedBy:      actor.UserID,
		PointsDeducted:  RedemptionPointsCost,
		AmountLKR:       RedemptionPayoutLKR,
		PhysicalCardRef: req.PhysicalCardRef,
		IdempotencyKey:  req.IdempotencyKey,
		Status:          "paid",
	}
	m.nextID++
	m.payouts[p.ID] = p
	m.payByKey[req.IdempotencyKey] = p.ID
	s.CachedAvailablePoints = round2(s.CachedAvailablePoints - RedemptionPointsCost)
	cp := *p
	return &cp, s.CachedAvailablePoints, nil
}

func (m *memoryLedgerRepo) ListPayouts(_ context.Context, _ ActorContext, _ *int) ([]RewardPayout, error) {
	return []RewardPayout{}, nil
}

func (m *memoryLedgerRepo) ReversePayout(_ context.Context, _ ActorContext, payoutID int, reason string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	p, ok := m.payouts[payoutID]
	if !ok {
		return ErrPayoutNotFound
	}
	if p.Status == "reversed" {
		return ErrAlreadyReversed
	}
	p.Status = "reversed"
	p.ReversalReason = reason
	m.students[p.StudentID].CachedAvailablePoints = round2(m.students[p.StudentID].CachedAvailablePoints + p.PointsDeducted)
	return nil
}

func (m *memoryLedgerRepo) ListStudentTransactions(_ context.Context, _ ActorContext, _ int) ([]PointTransaction, error) {
	return m.transactions, nil
}

func (m *memoryLedgerRepo) GetDashboardSummary(_ context.Context, _ ActorContext, _ *int) (*SchoolDashboardSummary, error) {
	return &SchoolDashboardSummary{}, nil
}

func TestCollectionDecimalPointsAndRedemptionPreservesRemainder(t *testing.T) {
	repo := newMemoryLedgerRepo()
	svc := NewLedgerService(repo)
	ctx := context.Background()
	school1 := 1
	teacher := ActorContext{UserID: 2, Role: "TEACHER", SchoolID: &school1}

	st, err := svc.CreateStudent(ctx, teacher, CreateStudentRequest{
		MembershipNo: "3R-001",
		FullName:     "Nimali Silva",
	})
	if err != nil {
		t.Fatalf("create student: %v", err)
	}

	// 0.5 kg Plastic @ 40.00 = 20.00 pts, plus 37 kg PET @ 40.00 = 1480.00 pts -> 1500.00 pts
	col, err := svc.RecordCollection(ctx, teacher, RecordCollectionRequest{
		StudentID:      st.ID,
		IdempotencyKey: "col-1",
		Items: []WasteCollectionItemInput{
			{CategoryID: 2, CategoryName: "Plastic", MeasurementUnit: "kg", Quantity: 0.5, RateSnapshot: 40.00},
			{CategoryID: 13, CategoryName: "PET Bottles", MeasurementUnit: "kg", Quantity: 37, RateSnapshot: 40.00},
		},
	})
	if err != nil {
		t.Fatalf("record collection: %v", err)
	}
	if col.TotalPoints != 1500.00 {
		t.Fatalf("got %.2f points, want 1500.00", col.TotalPoints)
	}

	// Retry same idempotency key -> must NOT double credit
	_, _ = svc.RecordCollection(ctx, teacher, RecordCollectionRequest{
		StudentID:      st.ID,
		IdempotencyKey: "col-1",
		Items: []WasteCollectionItemInput{
			{CategoryID: 2, CategoryName: "Plastic", MeasurementUnit: "kg", Quantity: 0.5, RateSnapshot: 40.00},
		},
	})

	// Redeem 1,000 points -> must leave 500.00 points
	_, remaining, err := svc.RecordPayout(ctx, teacher, RecordPayoutRequest{
		StudentID:       st.ID,
		PhysicalCardRef: "CARD-01",
		IdempotencyKey:  "pay-1",
	})
	if err != nil {
		t.Fatalf("record payout: %v", err)
	}
	if remaining != 500.00 {
		t.Fatalf("got remaining %.2f, want 500.00", remaining)
	}

	// Second redemption with 500.00 remaining -> ErrInsufficientPoints
	if _, _, err := svc.RecordPayout(ctx, teacher, RecordPayoutRequest{
		StudentID:      st.ID,
		IdempotencyKey: "pay-2",
	}); !errors.Is(err, ErrInsufficientPoints) {
		t.Fatalf("expected ErrInsufficientPoints, got %v", err)
	}
}

func TestConcurrentPayoutsAndTeacherIsolationAndSupervisorReversal(t *testing.T) {
	repo := newMemoryLedgerRepo()
	svc := NewLedgerService(repo)
	ctx := context.Background()
	school1 := 1
	school2 := 2
	teacher1 := ActorContext{UserID: 2, Role: "TEACHER", SchoolID: &school1}
	teacher2 := ActorContext{UserID: 3, Role: "TEACHER", SchoolID: &school2}
	supervisor := ActorContext{UserID: 4, Role: "GARBAGE_SUPERVISOR"}

	st, _ := svc.CreateStudent(ctx, teacher1, CreateStudentRequest{
		MembershipNo: "3R-002",
		FullName:     "Kasun Bandara",
	})
	_, _ = svc.RecordCollection(ctx, teacher1, RecordCollectionRequest{
		StudentID:      st.ID,
		IdempotencyKey: "col-2",
		Items: []WasteCollectionItemInput{
			{CategoryID: 15, CategoryName: "Vehicle Batteries", MeasurementUnit: "kg", Quantity: 7.5, RateSnapshot: 200.00},
		},
	})

	// Teacher from school 2 cannot read or redeem school 1's student
	if _, err := svc.GetStudent(ctx, teacher2, st.ID); !errors.Is(err, ErrStudentNotFound) {
		t.Fatalf("expected cross-school isolation, got %v", err)
	}

	// Concurrent redemptions on 1,500 points -> only 1 succeeds
	var wg sync.WaitGroup
	successes := 0
	var mu sync.Mutex
	var payoutID int
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			p, _, err := svc.RecordPayout(ctx, teacher1, RecordPayoutRequest{
				StudentID:      st.ID,
				IdempotencyKey: "concurrent-" + string(rune('a'+idx)),
			})
			if err == nil {
				mu.Lock()
				successes++
				payoutID = p.ID
				mu.Unlock()
			}
		}(i)
	}
	wg.Wait()
	if successes != 1 {
		t.Fatalf("expected exactly 1 concurrent payout to succeed, got %d", successes)
	}

	// Teacher cannot reverse payout; supervisor can
	if err := svc.ReversePayout(ctx, teacher1, payoutID, "mistake"); !errors.Is(err, ErrCrossSchoolForbidden) {
		t.Fatalf("expected ErrCrossSchoolForbidden for teacher reversal, got %v", err)
	}
	if err := svc.ReversePayout(ctx, supervisor, payoutID, "card returned"); err != nil {
		t.Fatalf("supervisor reversal failed: %v", err)
	}
	updated, _ := svc.GetStudent(ctx, teacher1, st.ID)
	if updated.CachedAvailablePoints != 1500.00 {
		t.Fatalf("expected 1500.00 after payout reversal, got %.2f", updated.CachedAvailablePoints)
	}
}
