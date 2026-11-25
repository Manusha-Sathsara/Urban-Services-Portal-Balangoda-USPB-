package envcert

import (
	"errors"
	"log"
)

type Service interface {
	ListCerts() ([]EnvironmentalCert, error)
	GetCert(id string) (*EnvironmentalCert, error)
	CreateCert(cert *EnvironmentalCert) error
	ProcessMonthlyExpiryCheck() (int64, error)
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

func (s *service) ProcessMonthlyExpiryCheck() (int64, error) {
	count, err := s.repo.MarkExpiredCerts()
	if err != nil {
		log.Printf("[ERROR] Environmental certificate expiry check failed: %v", err)
		return 0, err
	}
	log.Printf("[INFO] Environmental certificate expiry check completed: %d certificate(s) flagged as EXPIRED", count)
	return count, nil
}