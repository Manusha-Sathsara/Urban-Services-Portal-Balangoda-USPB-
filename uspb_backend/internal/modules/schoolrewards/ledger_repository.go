package schoolrewards

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/BalangodaUC/uspb_backend/pkg/database"
	"github.com/jmoiron/sqlx"
)

var (
	ErrCollectionNotFound   = errors.New("collection not found")
	ErrPayoutNotFound       = errors.New("payout not found")
	ErrInsufficientPoints   = errors.New("insufficient available points (minimum 1000.00 required)")
	ErrStudentInactive      = errors.New("cannot record transaction for an inactive student")
	ErrAlreadyReversed      = errors.New("record has already been reversed")
	ErrCrossSchoolForbidden = errors.New("cross-school access is prohibited")
)

type LedgerRepository interface {
	ListStudents(ctx context.Context, actor ActorContext, schoolFilter *int, search string) ([]SchoolStudent, error)
	GetStudent(ctx context.Context, actor ActorContext, studentID int) (*SchoolStudent, error)
	CreateStudent(ctx context.Context, actor ActorContext, schoolID int, req CreateStudentRequest) (*SchoolStudent, error)
	UpdateStudent(ctx context.Context, actor ActorContext, studentID int, req UpdateStudentRequest) (*SchoolStudent, error)

	RecordCollection(ctx context.Context, actor ActorContext, req RecordCollectionRequest, items []WasteCollectionItem, totalPoints float64) (*WasteCollection, error)
	ListCollections(ctx context.Context, actor ActorContext, studentID *int) ([]WasteCollection, error)
	ReverseCollection(ctx context.Context, actor ActorContext, collectionID int, reason string) error

	RecordPayout(ctx context.Context, actor ActorContext, req RecordPayoutRequest) (*RewardPayout, float64, error)
	ListPayouts(ctx context.Context, actor ActorContext, studentID *int) ([]RewardPayout, error)
	ReversePayout(ctx context.Context, actor ActorContext, payoutID int, reason string) error

	ListStudentTransactions(ctx context.Context, actor ActorContext, studentID int) ([]PointTransaction, error)
	GetDashboardSummary(ctx context.Context, actor ActorContext, schoolFilter *int) (*SchoolDashboardSummary, error)
}

type PostgresLedgerRepository struct {
	db *sqlx.DB
}

func NewLedgerRepository(db *sqlx.DB) *PostgresLedgerRepository {
	return &PostgresLedgerRepository{db: db}
}

func (r *PostgresLedgerRepository) rls(actor ActorContext) database.RLSContext {
	return database.RLSContext{
		UserID:   actor.UserID,
		Role:     actor.Role,
		SchoolID: actor.SchoolID,
	}
}

func (r *PostgresLedgerRepository) ListStudents(ctx context.Context, actor ActorContext, schoolFilter *int, search string) ([]SchoolStudent, error) {
	var students []SchoolStudent
	sf := 0
	if schoolFilter != nil {
		sf = *schoolFilter
	}
	err := database.WithRLS(ctx, r.db, r.rls(actor), func(tx *sqlx.Tx) error {
		return tx.SelectContext(ctx, &students, `
			SELECT s.id, s.school_id, s.membership_no, s.full_name, s.name_with_initials,
			       s.grade, s.class_name, TO_CHAR(s.date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
			       s.address, s.guardian_name, s.guardian_phone, s.is_active,
			       s.cached_available_points, s.created_by, s.created_at, s.updated_at,
			       COALESCE((SELECT SUM(pt.points_delta) FROM point_transactions pt WHERE pt.student_id = s.id AND pt.tx_type IN ('EARN_COLLECTION', 'COLLECTION_REVERSAL')), 0) AS lifetime_earned_points,
			       COALESCE((SELECT COUNT(*) FROM reward_payouts rp WHERE rp.student_id = s.id AND rp.status = 'paid'), 0) AS redeemed_cards
			FROM students s
			WHERE ($1 = 0 OR s.school_id = $1)
			  AND ($2 = '' OR s.full_name ILIKE '%' || $2 || '%' OR s.membership_no ILIKE '%' || $2 || '%')
			ORDER BY s.full_name ASC
		`, sf, search)
	})
	if err != nil {
		return nil, err
	}
	for i := range students {
		students[i].ComputeCardEligibility()
	}
	return students, nil
}

func (r *PostgresLedgerRepository) GetStudent(ctx context.Context, actor ActorContext, studentID int) (*SchoolStudent, error) {
	var s SchoolStudent
	err := database.WithRLS(ctx, r.db, r.rls(actor), func(tx *sqlx.Tx) error {
		return tx.GetContext(ctx, &s, `
			SELECT s.id, s.school_id, s.membership_no, s.full_name, s.name_with_initials,
			       s.grade, s.class_name, TO_CHAR(s.date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
			       s.address, s.guardian_name, s.guardian_phone, s.is_active,
			       s.cached_available_points, s.created_by, s.created_at, s.updated_at,
			       COALESCE((SELECT SUM(pt.points_delta) FROM point_transactions pt WHERE pt.student_id = s.id AND pt.tx_type IN ('EARN_COLLECTION', 'COLLECTION_REVERSAL')), 0) AS lifetime_earned_points,
			       COALESCE((SELECT COUNT(*) FROM reward_payouts rp WHERE rp.student_id = s.id AND rp.status = 'paid'), 0) AS redeemed_cards
			FROM students s
			WHERE s.id = $1
		`, studentID)
	})
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrStudentNotFound
	}
	if err != nil {
		return nil, err
	}
	s.ComputeCardEligibility()
	return &s, nil
}

func (r *PostgresLedgerRepository) CreateStudent(ctx context.Context, actor ActorContext, schoolID int, req CreateStudentRequest) (*SchoolStudent, error) {
	var s SchoolStudent
	err := database.WithRLS(ctx, r.db, r.rls(actor), func(tx *sqlx.Tx) error {
		return tx.GetContext(ctx, &s, `
			INSERT INTO students (
				school_id, membership_no, full_name, name_with_initials, grade, class_name,
				date_of_birth, address, guardian_name, guardian_phone, created_by
			)
			VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, '')::DATE, $8, $9, $10, $11)
			RETURNING id, school_id, membership_no, full_name, name_with_initials,
			          grade, class_name, TO_CHAR(date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
			          address, guardian_name, guardian_phone, is_active,
			          cached_available_points, created_by, created_at, updated_at
		`, schoolID, req.MembershipNo, req.FullName, req.NameWithInitials, req.Grade, req.ClassName,
			derefStr(req.DateOfBirth), req.Address, req.GuardianName, req.GuardianPhone, actor.UserID)
	})
	if err != nil {
		return nil, err
	}
	s.ComputeCardEligibility()
	return &s, nil
}

func (r *PostgresLedgerRepository) UpdateStudent(ctx context.Context, actor ActorContext, studentID int, req UpdateStudentRequest) (*SchoolStudent, error) {
	var s SchoolStudent
	err := database.WithRLS(ctx, r.db, r.rls(actor), func(tx *sqlx.Tx) error {
		return tx.GetContext(ctx, &s, `
			UPDATE students
			SET full_name = COALESCE($1, full_name),
			    name_with_initials = COALESCE($2, name_with_initials),
			    grade = COALESCE($3, grade),
			    class_name = COALESCE($4, class_name),
			    address = COALESCE($5, address),
			    guardian_name = COALESCE($6, guardian_name),
			    guardian_phone = COALESCE($7, guardian_phone),
			    is_active = COALESCE($8, is_active),
			    updated_at = NOW()
			WHERE id = $9
			RETURNING id, school_id, membership_no, full_name, name_with_initials,
			          grade, class_name, TO_CHAR(date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
			          address, guardian_name, guardian_phone, is_active,
			          cached_available_points, created_by, created_at, updated_at
		`, req.FullName, req.NameWithInitials, req.Grade, req.ClassName, req.Address,
			req.GuardianName, req.GuardianPhone, req.IsActive, studentID)
	})
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrStudentNotFound
	}
	if err != nil {
		return nil, err
	}
	s.ComputeCardEligibility()
	return &s, nil
}

func (r *PostgresLedgerRepository) RecordCollection(ctx context.Context, actor ActorContext, req RecordCollectionRequest, items []WasteCollectionItem, totalPoints float64) (*WasteCollection, error) {
	var out WasteCollection
	err := database.WithRLS(ctx, r.db, r.rls(actor), func(tx *sqlx.Tx) error {
		// 1. Idempotency check
		err := tx.GetContext(ctx, &out, `
			SELECT id, school_id, student_id, recorded_by, TO_CHAR(collection_date, 'YYYY-MM-DD') AS collection_date,
			       total_points, idempotency_key, notes, is_reversed, reversal_reason, created_at
			FROM waste_collections
			WHERE idempotency_key = $1
		`, req.IdempotencyKey)
		if err == nil {
			_ = tx.SelectContext(ctx, &out.Items, `SELECT id, collection_id, category_id, category_name, measurement_unit, quantity, rate_snapshot, points_earned FROM waste_collection_items WHERE collection_id = $1`, out.ID)
			return nil
		}
		if !errors.Is(err, sql.ErrNoRows) {
			return err
		}

		// 2. Pessimistic row lock on student
		var studentSchoolID int
		var isActive bool
		if err := tx.QueryRowContext(ctx, `
			SELECT school_id, is_active
			FROM students
			WHERE id = $1
			FOR UPDATE
		`, req.StudentID).Scan(&studentSchoolID, &isActive); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return ErrStudentNotFound
			}
			return err
		}
		if !isActive {
			return ErrStudentInactive
		}

		// 3. Insert collection header
		if err := tx.GetContext(ctx, &out, `
			INSERT INTO waste_collections (school_id, student_id, recorded_by, collection_date, total_points, idempotency_key, notes)
			VALUES ($1, $2, $3, COALESCE(NULLIF($4, '')::DATE, CURRENT_DATE), $5, $6, $7)
			RETURNING id, school_id, student_id, recorded_by, TO_CHAR(collection_date, 'YYYY-MM-DD') AS collection_date,
			          total_points, idempotency_key, notes, is_reversed, reversal_reason, created_at
		`, studentSchoolID, req.StudentID, actor.UserID, req.CollectionDate, totalPoints, req.IdempotencyKey, req.Notes); err != nil {
			return err
		}

		// 4. Insert line items with rate snapshot
		for i := range items {
			var item WasteCollectionItem
			if err := tx.GetContext(ctx, &item, `
				INSERT INTO waste_collection_items (collection_id, category_id, category_name, measurement_unit, quantity, rate_snapshot, points_earned)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				RETURNING id, collection_id, category_id, category_name, measurement_unit, quantity, rate_snapshot, points_earned
			`, out.ID, items[i].CategoryID, items[i].CategoryName, items[i].MeasurementUnit, items[i].Quantity, items[i].RateSnapshot, items[i].PointsEarned); err != nil {
				return err
			}
			out.Items = append(out.Items, item)
		}

		// 5. Append to authoritative point_transactions ledger
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO point_transactions (school_id, student_id, tx_type, points_delta, reference_type, reference_id, idempotency_key, note, created_by)
			VALUES ($1, $2, 'EARN_COLLECTION', $3, 'waste_collection', $4, $5, $6, $7)
		`, studentSchoolID, req.StudentID, totalPoints, out.ID, "col:"+req.IdempotencyKey, req.Notes, actor.UserID); err != nil {
			return err
		}

		// 6. Sync cached balance from ledger inside same locked transaction
		_, err = tx.ExecContext(ctx, `
			UPDATE students
			SET cached_available_points = COALESCE((SELECT SUM(points_delta) FROM point_transactions WHERE student_id = $1), 0),
			    updated_at = NOW()
			WHERE id = $1
		`, req.StudentID)
		return err
	})
	if err != nil {
		return nil, err
	}
	return &out, nil
}

func (r *PostgresLedgerRepository) ListCollections(ctx context.Context, actor ActorContext, studentID *int) ([]WasteCollection, error) {
	sid := 0
	if studentID != nil {
		sid = *studentID
	}
	var cols []WasteCollection
	err := database.WithRLS(ctx, r.db, r.rls(actor), func(tx *sqlx.Tx) error {
		if err := tx.SelectContext(ctx, &cols, `
			SELECT wc.id, wc.school_id, wc.student_id, s.full_name AS student_name, wc.recorded_by,
			       TO_CHAR(wc.collection_date, 'YYYY-MM-DD') AS collection_date,
			       wc.total_points, wc.idempotency_key, wc.notes, wc.is_reversed, wc.reversal_reason, wc.created_at
			FROM waste_collections wc
			JOIN students s ON s.id = wc.student_id
			WHERE ($1 = 0 OR wc.student_id = $1)
			ORDER BY wc.created_at DESC
			LIMIT 100
		`, sid); err != nil {
			return err
		}
		for i := range cols {
			_ = tx.SelectContext(ctx, &cols[i].Items, `
				SELECT id, collection_id, category_id, category_name, measurement_unit, quantity, rate_snapshot, points_earned
				FROM waste_collection_items WHERE collection_id = $1
			`, cols[i].ID)
		}
		return nil
	})
	if cols == nil {
		cols = []WasteCollection{}
	}
	return cols, err
}

func (r *PostgresLedgerRepository) ReverseCollection(ctx context.Context, actor ActorContext, collectionID int, reason string) error {
	return database.WithRLS(ctx, r.db, r.rls(actor), func(tx *sqlx.Tx) error {
		var col WasteCollection
		if err := tx.GetContext(ctx, &col, `
			SELECT id, school_id, student_id, total_points, is_reversed
			FROM waste_collections
			WHERE id = $1
			FOR UPDATE
		`, collectionID); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return ErrCollectionNotFound
			}
			return err
		}
		if col.IsReversed {
			return ErrAlreadyReversed
		}

		// Lock student
		var bal float64
		if err := tx.QueryRowContext(ctx, `SELECT COALESCE(SUM(points_delta), 0) FROM point_transactions WHERE student_id = $1`, col.StudentID).Scan(&bal); err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, `SELECT id FROM students WHERE id = $1 FOR UPDATE`, col.StudentID); err != nil {
			return err
		}
		if bal < col.TotalPoints {
			return fmt.Errorf("%w: student balance (%.2f) is lower than collection points (%.2f)", ErrInsufficientPoints, bal, col.TotalPoints)
		}

		if _, err := tx.ExecContext(ctx, `
			UPDATE waste_collections
			SET is_reversed = TRUE, reversed_by = $1, reversal_reason = $2, reversed_at = NOW()
			WHERE id = $3
		`, actor.UserID, reason, collectionID); err != nil {
			return err
		}

		if _, err := tx.ExecContext(ctx, `
			INSERT INTO point_transactions (school_id, student_id, tx_type, points_delta, reference_type, reference_id, idempotency_key, note, created_by)
			VALUES ($1, $2, 'COLLECTION_REVERSAL', $3, 'waste_collection', $4, $5, $6, $7)
		`, col.SchoolID, col.StudentID, -col.TotalPoints, collectionID, fmt.Sprintf("revcol:%d", collectionID), reason, actor.UserID); err != nil {
			return err
		}

		_, err := tx.ExecContext(ctx, `
			UPDATE students
			SET cached_available_points = COALESCE((SELECT SUM(points_delta) FROM point_transactions WHERE student_id = $1), 0),
			    updated_at = NOW()
			WHERE id = $1
		`, col.StudentID)
		return err
	})
}

func (r *PostgresLedgerRepository) RecordPayout(ctx context.Context, actor ActorContext, req RecordPayoutRequest) (*RewardPayout, float64, error) {
	var payout RewardPayout
	var newBalance float64

	err := database.WithRLS(ctx, r.db, r.rls(actor), func(tx *sqlx.Tx) error {
		// 1. Idempotency check
		err := tx.GetContext(ctx, &payout, `
			SELECT id, school_id, student_id, recorded_by, points_deducted, amount_lkr,
			       physical_card_ref, receipt_no, idempotency_key, status, paid_at
			FROM reward_payouts
			WHERE idempotency_key = $1
		`, req.IdempotencyKey)
		if err == nil {
			_ = tx.QueryRowContext(ctx, `SELECT COALESCE(SUM(points_delta), 0) FROM point_transactions WHERE student_id = $1`, payout.StudentID).Scan(&newBalance)
			return nil
		}
		if !errors.Is(err, sql.ErrNoRows) {
			return err
		}

		// 2. Lock student row to serialize concurrent redemptions
		var studentSchoolID int
		var isActive bool
		if err := tx.QueryRowContext(ctx, `
			SELECT school_id, is_active
			FROM students
			WHERE id = $1
			FOR UPDATE
		`, req.StudentID).Scan(&studentSchoolID, &isActive); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return ErrStudentNotFound
			}
			return err
		}
		if !isActive {
			return ErrStudentInactive
		}

		// 3. Authoritative ledger sum check
		var available float64
		if err := tx.QueryRowContext(ctx, `
			SELECT COALESCE(SUM(points_delta), 0)
			FROM point_transactions
			WHERE student_id = $1
		`, req.StudentID).Scan(&available); err != nil {
			return err
		}
		if available < RedemptionPointsCost {
			return ErrInsufficientPoints
		}

		// 4. Insert payout (deducts exactly 1000.00 points, LKR 1000.00)
		if err := tx.GetContext(ctx, &payout, `
			INSERT INTO reward_payouts (school_id, student_id, recorded_by, points_deducted, amount_lkr, physical_card_ref, receipt_no, idempotency_key)
			VALUES ($1, $2, $3, 1000.00, 1000.00, $4, $5, $6)
			RETURNING id, school_id, student_id, recorded_by, points_deducted, amount_lkr,
			          physical_card_ref, receipt_no, idempotency_key, status, paid_at
		`, studentSchoolID, req.StudentID, actor.UserID, req.PhysicalCardRef, req.ReceiptNo, req.IdempotencyKey); err != nil {
			return err
		}

		// 5. Append -1000.00 to point_transactions
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO point_transactions (school_id, student_id, tx_type, points_delta, reference_type, reference_id, idempotency_key, note, created_by)
			VALUES ($1, $2, 'REDEEM_PAYOUT', -1000.00, 'reward_payout', $3, $4, $5, $6)
		`, studentSchoolID, req.StudentID, payout.ID, "pay:"+req.IdempotencyKey, "Card "+req.PhysicalCardRef, actor.UserID); err != nil {
			return err
		}

		// 6. Update cached balance preserving remainder
		newBalance = available - RedemptionPointsCost
		_, err = tx.ExecContext(ctx, `
			UPDATE students
			SET cached_available_points = $1, updated_at = NOW()
			WHERE id = $2
		`, newBalance, req.StudentID)
		return err
	})
	if err != nil {
		return nil, 0, err
	}
	return &payout, newBalance, nil
}

func (r *PostgresLedgerRepository) ListPayouts(ctx context.Context, actor ActorContext, studentID *int) ([]RewardPayout, error) {
	sid := 0
	if studentID != nil {
		sid = *studentID
	}
	var payouts []RewardPayout
	err := database.WithRLS(ctx, r.db, r.rls(actor), func(tx *sqlx.Tx) error {
		return tx.SelectContext(ctx, &payouts, `
			SELECT rp.id, rp.school_id, rp.student_id, s.full_name AS student_name, rp.recorded_by,
			       rp.points_deducted, rp.amount_lkr, rp.physical_card_ref, rp.receipt_no,
			       rp.idempotency_key, rp.status, rp.reversed_by, rp.reversal_reason, rp.reversed_at, rp.paid_at
			FROM reward_payouts rp
			JOIN students s ON s.id = rp.student_id
			WHERE ($1 = 0 OR rp.student_id = $1)
			ORDER BY rp.paid_at DESC
			LIMIT 100
		`, sid)
	})
	if payouts == nil {
		payouts = []RewardPayout{}
	}
	return payouts, err
}

func (r *PostgresLedgerRepository) ReversePayout(ctx context.Context, actor ActorContext, payoutID int, reason string) error {
	return database.WithRLS(ctx, r.db, r.rls(actor), func(tx *sqlx.Tx) error {
		var p RewardPayout
		if err := tx.GetContext(ctx, &p, `
			SELECT id, school_id, student_id, points_deducted, status
			FROM reward_payouts
			WHERE id = $1
			FOR UPDATE
		`, payoutID); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return ErrPayoutNotFound
			}
			return err
		}
		if p.Status == "reversed" {
			return ErrAlreadyReversed
		}

		if _, err := tx.ExecContext(ctx, `SELECT id FROM students WHERE id = $1 FOR UPDATE`, p.StudentID); err != nil {
			return err
		}

		if _, err := tx.ExecContext(ctx, `
			UPDATE reward_payouts
			SET status = 'reversed', reversed_by = $1, reversal_reason = $2, reversed_at = NOW()
			WHERE id = $3
		`, actor.UserID, reason, payoutID); err != nil {
			return err
		}

		if _, err := tx.ExecContext(ctx, `
			INSERT INTO point_transactions (school_id, student_id, tx_type, points_delta, reference_type, reference_id, idempotency_key, note, created_by)
			VALUES ($1, $2, 'PAYOUT_REVERSAL', $3, 'reward_payout', $4, $5, $6, $7)
		`, p.SchoolID, p.StudentID, p.PointsDeducted, payoutID, fmt.Sprintf("revpay:%d", payoutID), reason, actor.UserID); err != nil {
			return err
		}

		_, err := tx.ExecContext(ctx, `
			UPDATE students
			SET cached_available_points = COALESCE((SELECT SUM(points_delta) FROM point_transactions WHERE student_id = $1), 0),
			    updated_at = NOW()
			WHERE id = $1
		`, p.StudentID)
		return err
	})
}

func (r *PostgresLedgerRepository) ListStudentTransactions(ctx context.Context, actor ActorContext, studentID int) ([]PointTransaction, error) {
	var txs []PointTransaction
	err := database.WithRLS(ctx, r.db, r.rls(actor), func(tx *sqlx.Tx) error {
		return tx.SelectContext(ctx, &txs, `
			SELECT id, school_id, student_id, tx_type, points_delta, reference_type, reference_id,
			       idempotency_key, note, created_by, created_at
			FROM point_transactions
			WHERE student_id = $1
			ORDER BY created_at DESC, id DESC
		`, studentID)
	})
	if txs == nil {
		txs = []PointTransaction{}
	}
	return txs, err
}

func (r *PostgresLedgerRepository) GetDashboardSummary(ctx context.Context, actor ActorContext, schoolFilter *int) (*SchoolDashboardSummary, error) {
	sf := 0
	if schoolFilter != nil {
		sf = *schoolFilter
	}
	var sum SchoolDashboardSummary
	err := database.WithRLS(ctx, r.db, r.rls(actor), func(tx *sqlx.Tx) error {
		if err := tx.QueryRowContext(ctx, `
			SELECT COUNT(*),
			       COUNT(*) FILTER (WHERE is_active),
			       COUNT(*) FILTER (WHERE is_active AND cached_available_points >= 1000.00),
			       COALESCE(SUM(cached_available_points), 0)
			FROM students
			WHERE ($1 = 0 OR school_id = $1)
		`, sf).Scan(&sum.TotalStudents, &sum.ActiveStudents, &sum.EligibleStudents, &sum.TotalAvailablePts); err != nil {
			return err
		}
		if err := tx.QueryRowContext(ctx, `
			SELECT COALESCE(SUM(amount_lkr), 0)
			FROM reward_payouts
			WHERE status = 'paid' AND ($1 = 0 OR school_id = $1)
		`, sf).Scan(&sum.TotalPayoutsLKR); err != nil {
			return err
		}
		return tx.QueryRowContext(ctx, `
			SELECT COUNT(*)
			FROM waste_collections
			WHERE NOT is_reversed AND ($1 = 0 OR school_id = $1)
		`, sf).Scan(&sum.TotalCollections)
	})
	return &sum, err
}

func derefStr(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}
