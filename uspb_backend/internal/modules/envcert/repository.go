package envcert

import (
	"time"

	"github.com/jmoiron/sqlx"
)

type EnvironmentalCert struct {
	ID               int        `db:"id" json:"id"`
	BusinessName     string     `db:"business_name" json:"business_name"`
	RegistrationNo   *string    `db:"registration_no" json:"registration_no,omitempty"`
	OwnerName        string     `db:"owner_name" json:"owner_name"`
	OwnerNIC         string     `db:"owner_nic" json:"owner_nic"`
	ContactPhone     string     `db:"contact_phone" json:"contact_phone"`
	ContactEmail     *string    `db:"contact_email" json:"contact_email,omitempty"`
	Address          string     `db:"address" json:"address"`
	WardNo           *string    `db:"ward_no" json:"ward_no,omitempty"`
	BusinessCategory string     `db:"business_category" json:"business_category"`
	Status           string     `db:"status" json:"status"`
	IssuedDate       *time.Time `db:"issued_date" json:"issued_date,omitempty"`
	ExpiryDate       *time.Time `db:"expiry_date" json:"expiry_date,omitempty"`
	CreatedBy        *int       `db:"created_by" json:"created_by,omitempty"`
	CreatedAt        time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt        time.Time  `db:"updated_at" json:"updated_at"`
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
	certs := []EnvironmentalCert{}
	query := `
		SELECT id, business_name, registration_no, owner_name, owner_nic,
		       contact_phone, contact_email, address, ward_no, business_category,
		       status, issued_date, expiry_date, created_by, created_at, updated_at
		FROM env_cert_businesses
		ORDER BY created_at DESC`
	err := r.db.Select(&certs, query)
	return certs, err
}

func (r *repository) GetByID(id string) (*EnvironmentalCert, error) {
	var cert EnvironmentalCert
	query := `
		SELECT id, business_name, registration_no, owner_name, owner_nic,
		       contact_phone, contact_email, address, ward_no, business_category,
		       status, issued_date, expiry_date, created_by, created_at, updated_at
		FROM env_cert_businesses
		WHERE id = $1`
	err := r.db.Get(&cert, query, id)
	if err != nil {
		return nil, err
	}
	return &cert, nil
}

func (r *repository) Create(cert *EnvironmentalCert) error {
	query := `
		INSERT INTO env_cert_businesses (
			business_name, registration_no, owner_name, owner_nic,
			contact_phone, contact_email, address, ward_no,
			business_category, status, created_by
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, created_at, updated_at`
	return r.db.QueryRow(
		query,
		cert.BusinessName,
		cert.RegistrationNo,
		cert.OwnerName,
		cert.OwnerNIC,
		cert.ContactPhone,
		cert.ContactEmail,
		cert.Address,
		cert.WardNo,
		cert.BusinessCategory,
		cert.Status,
		cert.CreatedBy,
	).Scan(&cert.ID, &cert.CreatedAt, &cert.UpdatedAt)
}