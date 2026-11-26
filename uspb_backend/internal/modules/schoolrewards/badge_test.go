package schoolrewards

import (
	"errors"
	"strings"
	"testing"
)

func setupTestBadgeService() (BadgeService, BadgeRepository, PointsLedgerProvider) {
	repo := NewMemoryBadgeRepository()
	pointsProvider := NewMemoryPointsLedgerProvider()
	service := NewBadgeService(repo, pointsProvider)
	return service, repo, pointsProvider
}

func TestBadgeService_CreateBadge(t *testing.T) {
	service, _, _ := setupTestBadgeService()

	t.Run("success with valid threshold", func(t *testing.T) {
		req := &CreateBadgeRequest{
			Name:               "Junior Compost Master",
			Description:        "Recognizes students pioneering organic waste and compost management in school gardens.",
			IconName:           "Leaf",
			MilestoneThreshold: 75.0,
			EligibilityMetric:  "lifetime_earned",
			Status:             "active",
		}
		badge, err := service.CreateBadge(req, "admin@balangoda.uc.gov.lk")
		if err != nil {
			t.Fatalf("expected no error, got: %v", err)
		}
		if badge.ID <= 0 {
			t.Errorf("expected positive ID, got: %d", badge.ID)
		}
		if badge.MilestoneThreshold != 75.0 {
			t.Errorf("expected threshold 75.0, got: %f", badge.MilestoneThreshold)
		}

		// Verify initial threshold history record exists
		history, err := service.GetThresholdHistory(badge.ID)
		if err != nil {
			t.Fatalf("expected history to exist, got error: %v", err)
		}
		if len(history) != 1 {
			t.Fatalf("expected 1 initial threshold history record, got: %d", len(history))
		}
		if history[0].MilestoneThreshold != 75.0 {
			t.Errorf("expected history threshold 75.0, got: %f", history[0].MilestoneThreshold)
		}
	})

	t.Run("duplicate badge name rejection", func(t *testing.T) {
		req := &CreateBadgeRequest{
			Name:               "eco-sprout", // Already seeded (ID 1)
			MilestoneThreshold: 50.0,
		}
		_, err := service.CreateBadge(req, "admin")
		if !errors.Is(err, ErrDuplicateBadgeName) {
			t.Errorf("expected ErrDuplicateBadgeName, got: %v", err)
		}
	})

	t.Run("invalid milestone threshold rejection", func(t *testing.T) {
		req := &CreateBadgeRequest{
			Name:               "Zero Points Badge",
			MilestoneThreshold: 0,
		}
		_, err := service.CreateBadge(req, "admin")
		if !errors.Is(err, ErrInvalidThreshold) {
			t.Errorf("expected ErrInvalidThreshold, got: %v", err)
		}
	})

	t.Run("invalid eligibility metric rejection", func(t *testing.T) {
		req := &CreateBadgeRequest{
			Name:               "Unknown Metric Badge",
			MilestoneThreshold: 50.0,
			EligibilityMetric:  "invalid_metric",
		}
		_, err := service.CreateBadge(req, "admin")
		if !errors.Is(err, ErrInvalidMetric) {
			t.Errorf("expected ErrInvalidMetric, got: %v", err)
		}
	})
}

func TestBadgeService_ThresholdRevision_AndHistory(t *testing.T) {
	service, _, _ := setupTestBadgeService()

	// Badge 1 ("Eco-Sprout") has initial threshold 50.0
	badge, err := service.GetBadgeByID(1)
	if err != nil {
		t.Fatalf("failed to retrieve badge 1: %v", err)
	}
	if badge.MilestoneThreshold != 50.0 {
		t.Fatalf("expected threshold 50.0, got: %f", badge.MilestoneThreshold)
	}

	// Revise threshold from 50.0 to 60.0 with official council reason
	updateReq := &UpdateThresholdRequest{
		MilestoneThreshold: 60.0,
		EligibilityMetric:  "lifetime_earned",
		Reason:             "Council Health Committee adjusted foundational milestone",
	}
	updated, err := service.UpdateBadgeThreshold(1, updateReq, "officer@balangoda.uc.gov.lk")
	if err != nil {
		t.Fatalf("expected successful threshold revision, got: %v", err)
	}
	if updated.MilestoneThreshold != 60.0 {
		t.Errorf("expected new threshold 60.0, got: %f", updated.MilestoneThreshold)
	}

	// Verify history preservation
	history, err := service.GetThresholdHistory(1)
	if err != nil {
		t.Fatalf("failed to retrieve threshold history: %v", err)
	}
	if len(history) < 2 {
		t.Fatalf("expected at least 2 history records, got: %d", len(history))
	}

	// Latest history record
	latest := history[0]
	if latest.MilestoneThreshold != 60.0 {
		t.Errorf("expected latest history threshold 60.0, got: %f", latest.MilestoneThreshold)
	}
	if latest.EffectiveTo != nil {
		t.Errorf("expected active threshold effective_to to be nil")
	}

	// Previous history record
	previous := history[1]
	if previous.MilestoneThreshold != 50.0 {
		t.Errorf("expected previous history threshold 50.0, got: %f", previous.MilestoneThreshold)
	}
	if previous.EffectiveTo == nil {
		t.Errorf("expected previous threshold effective_to to be closed, but was nil")
	}

	// Reject identical threshold
	_, err = service.UpdateBadgeThreshold(1, updateReq, "admin")
	if !errors.Is(err, ErrThresholdUnchanged) {
		t.Errorf("expected ErrThresholdUnchanged, got: %v", err)
	}

	// Reject missing reason
	_, err = service.UpdateBadgeThreshold(1, &UpdateThresholdRequest{MilestoneThreshold: 70.0, Reason: ""}, "admin")
	if !errors.Is(err, ErrReasonRequired) {
		t.Errorf("expected ErrReasonRequired, got: %v", err)
	}
}

func TestBadgeService_EligibilityEvaluation(t *testing.T) {
	service, _, _ := setupTestBadgeService()

	// Student 1 (Kaveesha Tharushi) has 135.0 lifetime points
	// Badge 1 (Eco-Sprout) requires 50.0 -> Already Awarded (seeded AWD-2026-0001)
	// Badge 2 (Waste Warrior) requires 100.0 -> Already Awarded (seeded AWD-2026-0004)
	// Badge 3 (Recycling Champion) requires 250.0 -> Ineligible (135 < 250)
	badge1ID := 1
	res, err := service.GetStudentEligibility(1, badge1ID)
	if err != nil {
		t.Fatalf("failed to get student eligibility: %v", err)
	}
	if !res.IsEligible {
		t.Errorf("student 1 with 135 pts should be eligible for 50 pt badge")
	}
	if !res.IsAwarded {
		t.Errorf("student 1 should be marked as already awarded for badge 1")
	}

	badge3ID := 3
	res3, err := service.GetStudentEligibility(1, badge3ID)
	if err != nil {
		t.Fatalf("failed to get student eligibility for badge 3: %v", err)
	}
	if res3.IsEligible {
		t.Errorf("student 1 with 135 pts should NOT be eligible for 250 pt badge")
	}
	if res3.IsAwarded {
		t.Errorf("student 1 should NOT be awarded badge 3")
	}

	// Test Student 4 (Ravindu Lakshan) with 280.0 lifetime points -> Eligible for Badge 3 (250) and not yet awarded!
	res4, err := service.GetStudentEligibility(4, badge3ID)
	if err != nil {
		t.Fatalf("failed to evaluate student 4: %v", err)
	}
	if !res4.IsEligible {
		t.Errorf("student 4 with 280 pts must be eligible for badge 3 (threshold 250)")
	}
	if res4.IsAwarded {
		t.Errorf("student 4 has not yet been awarded badge 3")
	}
}

func TestBadgeService_CreateAward_AndRestrictions(t *testing.T) {
	service, _, _ := setupTestBadgeService()

	// Student 4 has 280 pts and is eligible for Badge 3 (threshold 250)
	awardReq := &CreateAwardRequest{
		StudentID: 4,
		BadgeID:   3,
		AwardDate: "2026-11-25",
		Notes:     "Outstanding paper recycling collection volume",
	}

	award, err := service.CreateAward(awardReq, "supervisor@balangoda.uc.gov.lk", nil)
	if err != nil {
		t.Fatalf("expected successful award creation, got: %v", err)
	}
	if award.AwardReference == "" {
		t.Errorf("expected generated award reference, got empty")
	}
	if award.QualifyingPoints != 280.0 {
		t.Errorf("expected qualifying points 280.0, got: %f", award.QualifyingPoints)
	}
	if award.ThresholdAtAward != 250.0 {
		t.Errorf("expected frozen threshold 250.0, got: %f", award.ThresholdAtAward)
	}

	// Attempting duplicate award for same student & badge must be rejected
	_, err = service.CreateAward(awardReq, "supervisor", nil)
	if !errors.Is(err, ErrBadgeAlreadyAwarded) {
		t.Errorf("expected ErrBadgeAlreadyAwarded on duplicate bestowal, got: %v", err)
	}

	// Attempting award for ineligible student (Student 5 has 30 pts, Badge 2 requires 100)
	ineligibleReq := &CreateAwardRequest{
		StudentID: 5,
		BadgeID:   2,
		AwardDate: "2026-11-25",
	}
	_, err = service.CreateAward(ineligibleReq, "supervisor", nil)
	if !errors.Is(err, ErrStudentNotEligible) {
		t.Errorf("expected ErrStudentNotEligible, got: %v", err)
	}

	// Attempting award for inactive badge
	_, err = service.UpdateBadgeStatus(1, "inactive")
	if err != nil {
		t.Fatalf("failed to deactivate badge 1: %v", err)
	}
	inactiveReq := &CreateAwardRequest{
		StudentID: 3,
		BadgeID:   1,
	}
	_, err = service.CreateAward(inactiveReq, "supervisor", nil)
	if !errors.Is(err, ErrBadgeNotActive) {
		t.Errorf("expected ErrBadgeNotActive when awarding inactive badge, got: %v", err)
	}
}

func TestBadgeService_SchoolIsolation(t *testing.T) {
	service, _, _ := setupTestBadgeService()

	// Student 6 belongs to School 2 (St. Agnes Convent)
	// Teacher from School 1 (Central College) tries to award Student 6
	school1ID := 1
	teacherReq := &CreateAwardRequest{
		StudentID: 6,
		BadgeID:   1,
		Notes:     "Unauthorized cross-school award attempt",
	}
	_, err := service.CreateAward(teacherReq, "teacher.ananda@balangoda.uc.gov.lk", &school1ID)
	if !errors.Is(err, ErrUnauthorizedSchoolAccess) {
		t.Errorf("expected ErrUnauthorizedSchoolAccess when teacher accesses other school's student, got: %v", err)
	}

	// Cross-school inspection of single award
	_, err = service.GetAwardByID(3, &school1ID) // Award 3 belongs to Student 6 in School 2
	if !errors.Is(err, ErrUnauthorizedSchoolAccess) {
		t.Errorf("expected ErrUnauthorizedSchoolAccess when inspecting other school's award, got: %v", err)
	}
}

func TestBadgeService_ExportAwardsCSV(t *testing.T) {
	service, _, _ := setupTestBadgeService()

	csvBytes, err := service.ExportAwardsCSV(AwardListFilter{})
	if err != nil {
		t.Fatalf("expected CSV export to succeed, got: %v", err)
	}
	csvStr := string(csvBytes)

	if !strings.Contains(csvStr, "Award Reference,Student Name") {
		t.Errorf("expected CSV header row, got:\n%s", csvStr)
	}
	if !strings.Contains(csvStr, "AWD-2026-0001") {
		t.Errorf("expected AWD-2026-0001 in CSV export, got:\n%s", csvStr)
	}
}
