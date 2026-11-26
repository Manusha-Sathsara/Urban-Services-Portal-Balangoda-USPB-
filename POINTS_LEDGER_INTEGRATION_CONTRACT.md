# Points Ledger Integration Contract: Badge Eligibility & Points Policy Isolation
## Urban Services Portal Balangoda (USPB) — School Waste Rewards Subsystem

---

## 1. Executive Summary & Context

In the **School Waste Rewards Management** system for Balangoda Urban Council, badges are awarded to participating students as they reach milestone points thresholds for recycling waste.

Two critical architectural constraints governed the design of this module:
1. **Unsettled Municipal Points Policy**: The council has not finalized whether badge eligibility should evaluate a student's **lifetime earned points** (cumulative environmental effort) or their **available unredeemed points** (net balance remaining after rewards redemptions).
2. **Concurrent Module Development**: The student waste collection logging and points ledger is being developed concurrently by engineer Manusha. The badge subsystem cannot assume Manusha's tables exist in all environments during initial development, nor should it duplicate the ledger table schema.

To guarantee zero coupling and seamless integration, the badge module incorporates an **isolated `PointsLedgerProvider` abstraction layer**.

---

## 2. Core Architectural Principles

1. **Strictly Untrusted Frontend**:
   - The browser never computes, passes, or verifies student points.
   - Any frontend-supplied point values are discarded; point balances are resolved authoritatively on the backend at evaluation time.
2. **Policy Isolation (Single Point of Modification)**:
   - Points policy logic is isolated within `resolvePoints(metric, studentPoints)`.
   - If the council mandates `lifetime_earned`, `available_points`, or a hybrid threshold formula, the modification is made in a single backend function without altering database schemas or existing award records.
3. **Threshold Freezing (Audit Immutability)**:
   - When a badge is bestowed to a student, the exact threshold and qualifying points are frozen permanently in `student_badge_awards.threshold_at_award` and `qualifying_points`.
   - Subsequent threshold changes or future point deductions never retroactively revoke or invalidate previously awarded badges.
4. **Idempotency & Duplicate Award Prevention**:
   - Database constraint `UNIQUE (student_id, badge_id)` guarantees a student cannot be awarded the same milestone badge multiple times.

---

## 3. Go Interface & Data Model Contract

Located in `uspb_backend/internal/modules/schoolrewards/points_ledger_provider.go`:

```go
package schoolrewards

// StudentPoints represents authoritative points balances for a student
type StudentPoints struct {
    StudentID       int     `json:"student_id"`
    LifetimeEarned  float64 `json:"lifetime_earned"`
    AvailablePoints float64 `json:"available_points"`
}

// PointsLedgerProvider defines the interface for points retrieval
type PointsLedgerProvider interface {
    GetStudentPoints(studentID int) (*StudentPoints, error)
    GetBatchStudentPoints(studentIDs []int) (map[int]*StudentPoints, error)
}
```

---

## 4. Database Integration with Manusha's Points Ledger

When Manusha's waste collection and ledger tables (`student_collections` and `student_redemptions`) are applied in PostgreSQL, the `sqlPointsLedgerProvider` directly queries authoritative transactional sums:

### 4.1. Lifetime Earned Points Query:
```sql
SELECT COALESCE(SUM(points_earned), 0) AS lifetime_points
FROM student_collections
WHERE student_id = $1;
```

### 4.2. Net Available Points Query:
```sql
SELECT 
    COALESCE(sc.total_earned, 0) - COALESCE(sr.total_redeemed, 0) AS available_points
FROM (
    SELECT COALESCE(SUM(points_earned), 0) AS total_earned
    FROM student_collections
    WHERE student_id = $1
) sc
CROSS JOIN (
    SELECT COALESCE(SUM(points_spent), 0) AS total_redeemed
    FROM student_redemptions
    WHERE student_id = $1
) sr;
```

### 4.3. Zero-Setup Fallback (Resilient Development):
If `student_collections` does not exist in a local developer's database instance or during isolated unit testing, `sqlPointsLedgerProvider` gracefully falls back to baseline student records without throwing runtime exceptions or blocking council testing.

---

## 5. Policy Resolution Engine

Located in `uspb_backend/internal/modules/schoolrewards/badge_service.go`:

```go
func (s *badgeService) resolvePoints(metric BadgeEligibilityMetric, pts *StudentPoints) float64 {
    if pts == nil {
        return 0
    }
    switch metric {
    case MetricAvailablePoints:
        return pts.AvailablePoints
    case MetricLifetimeEarned:
        fallthrough
    default:
        return pts.LifetimeEarned
    }
}
```

Each badge definition can individually specify its `eligibility_metric` (`lifetime_earned` or `available_points`), defaulting to `lifetime_earned` per Balangoda Environmental Charter standards.

---

## 6. Verification and Integration Checklist for Manusha

| Item | Requirement | Status |
| :--- | :--- | :---: |
| 1 | Table `student_collections` has column `student_id INT` and `points_earned NUMERIC` | Ready for migration |
| 2 | Table `students` has foreign key `school_id INT REFERENCES schools(id)` | Seeded & Active |
| 3 | Badge system never writes to Manusha's collection tables | Verified (Read-only provider) |
| 4 | Badge system transactions never lock collection tables | Verified |
| 5 | Teacher school scoping enforced before checking points | Verified (`403 Forbidden` on cross-school) |
