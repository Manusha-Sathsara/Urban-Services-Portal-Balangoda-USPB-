package schoolrewards

import (
	"time"

	"github.com/jmoiron/sqlx"
)

type SchoolRewardRecord struct {
	ID           string    `db:"id" json:"id"`
	SchoolName   string    `db:"school_name" json:"school_name"`
	WasteType    string    `db:"waste_type" json:"waste_type"`
	QuantityKg   float64   `db:"quantity_kg" json:"quantity_kg"`
	PointsEarned int       `db:"points_earned" json:"points_earned"`
	RecordedBy   string    `db:"recorded_by" json:"recorded_by"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
}

type Repository interface {
	GetAll() ([]SchoolRewardRecord, error)
	GetByID(id string) (*SchoolRewardRecord, error)
	Create(record *SchoolRewardRecord) error
}

type repository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) Repository {
	return &repository{db: db}
}

func (r *repository) GetAll() ([]SchoolRewardRecord, error) {
	var records []SchoolRewardRecord
	query := `SELECT id, school_name, waste_type, quantity_kg, points_earned, recorded_by, created_at FROM school_rewards ORDER BY created_at DESC`
	err := r.db.Select(&records, query)
	return records, err
}

func (r *repository) GetByID(id string) (*SchoolRewardRecord, error) {
	var record SchoolRewardRecord
	query := `SELECT id, school_name, waste_type, quantity_kg, points_earned, recorded_by, created_at FROM school_rewards WHERE id = $1`
	err := r.db.Get(&record, query, id)
	if err != nil {
		return nil, err
	}
	return &record, nil
}

func (r *repository) Create(record *SchoolRewardRecord) error {
	query := `INSERT INTO school_rewards (id, school_name, waste_type, quantity_kg, points_earned, recorded_by, created_at) VALUES (:id, :school_name, :waste_type, :quantity_kg, :points_earned, :recorded_by, :created_at)`
	_, err := r.db.NamedExec(query, record)
	return err
}
