package garbagefee

import (
	"time"

	"github.com/jmoiron/sqlx"
)

type GarbageFeeRecord struct {
	ID           string     `db:"id" json:"id"`
	TaxPayerName string     `db:"tax_payer_name" json:"tax_payer_name"`
	WardNo       string     `db:"ward_no" json:"ward_no"`
	AssessmentNo string     `db:"assessment_no" json:"assessment_no"`
	Amount       float64    `db:"amount" json:"amount"`
	Status       string     `db:"status" json:"status"`
	Period       string     `db:"period" json:"period"`
	PaidAt       *time.Time `db:"paid_at" json:"paid_at,omitempty"`
	CreatedAt    time.Time  `db:"created_at" json:"created_at"`
}

type Repository interface {
	GetAll() ([]GarbageFeeRecord, error)
	GetByID(id string) (*GarbageFeeRecord, error)
	Create(record *GarbageFeeRecord) error
}

type repository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) Repository {
	return &repository{db: db}
}

func (r *repository) GetAll() ([]GarbageFeeRecord, error) {
	var records []GarbageFeeRecord
	query := `SELECT id, tax_payer_name, ward_no, assessment_no, amount, status, period, paid_at, created_at FROM garbage_fees ORDER BY created_at DESC`
	err := r.db.Select(&records, query)
	return records, err
}

func (r *repository) GetByID(id string) (*GarbageFeeRecord, error) {
	var record GarbageFeeRecord
	query := `SELECT id, tax_payer_name, ward_no, assessment_no, amount, status, period, paid_at, created_at FROM garbage_fees WHERE id = $1`
	err := r.db.Get(&record, query, id)
	if err != nil {
		return nil, err
	}
	return &record, nil
}

func (r *repository) Create(record *GarbageFeeRecord) error {
	query := `INSERT INTO garbage_fees (id, tax_payer_name, ward_no, assessment_no, amount, status, period, created_at) VALUES (:id, :tax_payer_name, :ward_no, :assessment_no, :amount, :status, :period, :created_at)`
	_, err := r.db.NamedExec(query, record)
	return err
}
