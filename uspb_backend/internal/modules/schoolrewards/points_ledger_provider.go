package schoolrewards

import (
	"context"
	"fmt"
	"sync"

	"github.com/BalangodaUC/uspb_backend/pkg/database"
	"github.com/jmoiron/sqlx"
)

// PointsLedgerProvider defines the integration contract for fetching authoritative
// points balances for students without trusting frontend-submitted values.
type PointsLedgerProvider interface {
	GetStudentPoints(studentID int) (*StudentPoints, error)
	GetBatchStudentPoints(studentIDs []int) (map[int]*StudentPoints, error)
}

type sqlPointsLedgerProvider struct {
	db *sqlx.DB
}

func NewSQLPointsLedgerProvider(db *sqlx.DB) PointsLedgerProvider {
	return &sqlPointsLedgerProvider{db: db}
}

func (p *sqlPointsLedgerProvider) GetStudentPoints(studentID int) (*StudentPoints, error) {
	var lifetime, available float64
	err := database.WithRLS(context.Background(), p.db, database.RLSContext{Role: "GARBAGE_SUPERVISOR"}, func(tx *sqlx.Tx) error {
		return tx.QueryRow(`
			SELECT
				COALESCE(SUM(CASE WHEN tx_type IN ('EARN_COLLECTION', 'COLLECTION_REVERSAL') THEN points_delta ELSE 0 END), 0),
				COALESCE(SUM(points_delta), 0)
			FROM point_transactions
			WHERE student_id = $1
		`, studentID).Scan(&lifetime, &available)
	})
	if err != nil {
		return nil, fmt.Errorf("query student ledger points: %w", err)
	}
	return &StudentPoints{
		StudentID:       studentID,
		LifetimeEarned:  lifetime,
		AvailablePoints: available,
	}, nil
}

func (p *sqlPointsLedgerProvider) GetBatchStudentPoints(studentIDs []int) (map[int]*StudentPoints, error) {
	result := make(map[int]*StudentPoints)
	for _, id := range studentIDs {
		pts, err := p.GetStudentPoints(id)
		if err != nil {
			return nil, err
		}
		result[id] = pts
	}
	return result, nil
}

type memoryPointsLedgerProvider struct {
	mu       sync.RWMutex
	balances map[int]*StudentPoints
}

func NewMemoryPointsLedgerProvider() PointsLedgerProvider {
	return &memoryPointsLedgerProvider{
		balances: map[int]*StudentPoints{
			1:  {StudentID: 1, LifetimeEarned: 135, AvailablePoints: 85},
			2:  {StudentID: 2, LifetimeEarned: 110, AvailablePoints: 110},
			3:  {StudentID: 3, LifetimeEarned: 65, AvailablePoints: 65},
			4:  {StudentID: 4, LifetimeEarned: 280, AvailablePoints: 180},
			5:  {StudentID: 5, LifetimeEarned: 30, AvailablePoints: 30},
			6:  {StudentID: 6, LifetimeEarned: 75, AvailablePoints: 75},
			7:  {StudentID: 7, LifetimeEarned: 140, AvailablePoints: 140},
			8:  {StudentID: 8, LifetimeEarned: 45, AvailablePoints: 45},
			9:  {StudentID: 9, LifetimeEarned: 120, AvailablePoints: 120},
			10: {StudentID: 10, LifetimeEarned: 25, AvailablePoints: 25},
		},
	}
}

func (m *memoryPointsLedgerProvider) GetStudentPoints(studentID int) (*StudentPoints, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if pts, ok := m.balances[studentID]; ok {
		return pts, nil
	}
	return &StudentPoints{StudentID: studentID}, nil
}

func (m *memoryPointsLedgerProvider) GetBatchStudentPoints(studentIDs []int) (map[int]*StudentPoints, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	result := make(map[int]*StudentPoints, len(studentIDs))
	for _, id := range studentIDs {
		if pts, ok := m.balances[id]; ok {
			result[id] = pts
		} else {
			result[id] = &StudentPoints{StudentID: id}
		}
	}
	return result, nil
}
