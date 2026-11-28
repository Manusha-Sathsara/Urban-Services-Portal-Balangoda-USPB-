package envcert

import (
	"errors"
	"log"
	"strings"
)

type Service interface {
	ListCerts() ([]EnvironmentalCert, error)
	GetCert(id string) (*EnvironmentalCert, error)
	CreateCert(cert *EnvironmentalCert) error
	ProcessMonthlyExpiryCheck() (int64, error)
	RenewCert(id string) (*EnvironmentalCert, error)
	ListExpiringSoon(days int) ([]EnvironmentalCert, error)
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

func (s *service) RenewCert(id string) (*EnvironmentalCert, error) {
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	status := strings.ToUpper(existing.Status)
	if status != "EXPIRED" && status != "RENEWAL_DUE" && status != "APPROVED" {
		return nil, errors.New("only approved or expired certificates are eligible for renewal")
	}

	renewed, err := s.repo.RenewCert(id)
	if err != nil {
		log.Printf("[ERROR] Failed to renew certificate ID %s: %v", id, err)
		return nil, err
	}

	log.Printf("[INFO] Environmental certificate ID %s (%s) renewed for 1 year", id, renewed.BusinessName)
	return renewed, nil
}

func (s *service) ListExpiringSoon(days int) ([]EnvironmentalCert, error) {
	if days <= 0 {
		days = 90
	}
	return s.repo.GetExpiringSoon(days)
}