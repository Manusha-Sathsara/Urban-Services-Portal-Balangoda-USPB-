package envcert

import "errors"

type Service interface {
	ListCerts() ([]EnvironmentalCert, error)
	GetCert(id string) (*EnvironmentalCert, error)
	CreateCert(cert *EnvironmentalCert) error
	
	// Added for Sub-Module B (Inspection & Printing)
	UpdateInspectionStatus(id int, status string, notes string) error
	GetApprovedCerts() ([]EnvironmentalCert, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) ListCerts() ([]EnvironmentalCert, error) {
	return s.repo.GetAll()
}

func (s *service) GetCert(id string) (*EnvironmentalCert, error) {
	return s.repo.GetByID(id)
}

func (s *service) CreateCert(cert *EnvironmentalCert) error {
	if cert.BusinessName == "" || cert.OwnerName == "" || cert.OwnerNIC == "" ||
		cert.ContactPhone == "" || cert.Address == "" || cert.BusinessCategory == "" {
		return errors.New("business_name, owner_name, owner_nic, contact_phone, address, and business_category are required")
	}

	if cert.Status == "" {
		cert.Status = "PENDING"
	}

	return s.repo.Create(cert)
}

// UpdateInspectionStatus validates the status before sending it to the database
func (s *service) UpdateInspectionStatus(id int, status string, notes string) error {
	if status == "" {
		return errors.New("status is required")
	}

	// Prevent bad data from entering the database
	validStatuses := map[string]bool{
		"PENDING":          true,
		"UNDER_INSPECTION": true,
		"APPROVED":         true,
		"REJECTED":         true,
		"EXPIRED":          true,
	}

	if !validStatuses[status] {
		return errors.New("invalid status value")
	}

	return s.repo.UpdateInspectionStatus(id, status, notes)
}

// GetApprovedCerts retrieves only the certificates ready for printing
func (s *service) GetApprovedCerts() ([]EnvironmentalCert, error) {
	return s.repo.GetApproved()
}