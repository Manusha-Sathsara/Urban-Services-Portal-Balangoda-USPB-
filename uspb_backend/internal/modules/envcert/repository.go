package envcert

import (
	"time"

	"github.com/jmoiron/sqlx"
)

type EnvironmentalCert struct {
	ID             string     `db:"id" json:"id"`
	BusinessName   string     `db:"business_name" json:"business_name"`
	RegistrationNo string     `db:"registration_no" json:"registration_no"`
	ApplicantName  string     `db:"applicant_name" json:"applicant_name"`
	Category       string     `db:"category" json:"category"`
	Status         string     `db:"status" json:"status"`
	ExpiryDate     *time.Time `db:"expiry_date" json:"expiry_date,omitempty"`
	CreatedAt      time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at" json:"updated_at"`
}

type Repository interface {
	GetAll() ([]EnvironmentalCert, error)
	GetByID(id string) (*EnvironmentalCert, error)
	Create(cert *EnvironmentalCert) error
}

type repository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) Repository {
	return &repository{db: db}
}

func (r *repository) GetAll() ([]EnvironmentalCert, error) {
	var certs []EnvironmentalCert
	query := `SELECT id, business_name, registration_no, applicant_name, category, status, expiry_date, created_at, updated_at FROM environmental_certs ORDER BY created_at DESC`
	err := r.db.Select(&certs, query)
	return certs, err
}

func (r *repository) GetByID(id string) (*EnvironmentalCert, error) {
	var cert EnvironmentalCert
	query := `SELECT id, business_name, registration_no, applicant_name, category, status, expiry_date, created_at, updated_at FROM environmental_certs WHERE id = $1`
	err := r.db.Get(&cert, query, id)
	if err != nil {
		return nil, err
	}
	return &cert, nil
}

func (r *repository) Create(cert *EnvironmentalCert) error {
	query := `INSERT INTO environmental_certs (id, business_name, registration_no, applicant_name, category, status, created_at, updated_at) VALUES (:id, :business_name, :registration_no, :applicant_name, :category, :status, :created_at, :updated_at)`
	_, err := r.db.NamedExec(query, cert)
	return err
}
