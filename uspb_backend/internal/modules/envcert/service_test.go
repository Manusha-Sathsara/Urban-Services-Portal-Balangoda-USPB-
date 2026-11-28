package envcert

import (
	"errors"
	"testing"
)

type mockRepository struct {
	certs            []EnvironmentalCert
	createCalled     bool
	createdCert      *EnvironmentalCert
	createErr        error
	markExpiredCount int64
	markExpiredErr   error
	renewedCert      *EnvironmentalCert
	renewErr         error
	expiringCerts    []EnvironmentalCert
	expiringErr      error
	lastExpiringDays int
}

func (m *mockRepository) GetAll() ([]EnvironmentalCert, error) {
	return m.certs, nil
}

func (m *mockRepository) GetByID(id string) (*EnvironmentalCert, error) {
	if len(m.certs) > 0 {
		return &m.certs[0], nil
	}
	return nil, errors.New("certificate not found")
}

func (m *mockRepository) Create(cert *EnvironmentalCert) error {
	m.createCalled = true
	m.createdCert = cert
	return m.createErr
}

func (m *mockRepository) MarkExpiredCerts() (int64, error) {
	return m.markExpiredCount, m.markExpiredErr
}

func (m *mockRepository) RenewCert(id string) (*EnvironmentalCert, error) {
	if m.renewErr != nil {
		return nil, m.renewErr
	}
	return m.renewedCert, nil
}

func (m *mockRepository) GetExpiringSoon(days int) ([]EnvironmentalCert, error) {
	m.lastExpiringDays = days
	return m.expiringCerts, m.expiringErr
}

func TestCreateCert_ValidationErrors(t *testing.T) {
	tests := []struct {
		name string
		cert EnvironmentalCert
	}{
		{
			name: "missing business_name",
			cert: EnvironmentalCert{
				OwnerName:        "K. A. Perera",
				OwnerNIC:         "198512345678",
				ContactPhone:     "0771234567",
				Address:          "No. 15, Main Street, Balangoda",
				BusinessCategory: "Retail & Commercial",
			},
		},
		{
			name: "missing owner_name",
			cert: EnvironmentalCert{
				BusinessName:     "Balangoda Bakers",
				OwnerNIC:         "198512345678",
				ContactPhone:     "0771234567",
				Address:          "No. 15, Main Street, Balangoda",
				BusinessCategory: "Food & Hospitality",
			},
		},
		{
			name: "missing owner_nic",
			cert: EnvironmentalCert{
				BusinessName:     "Balangoda Bakers",
				OwnerName:        "K. A. Perera",
				ContactPhone:     "0771234567",
				Address:          "No. 15, Main Street, Balangoda",
				BusinessCategory: "Food & Hospitality",
			},
		},
		{
			name: "missing contact_phone",
			cert: EnvironmentalCert{
				BusinessName:     "Balangoda Bakers",
				OwnerName:        "K. A. Perera",
				OwnerNIC:         "198512345678",
				Address:          "No. 15, Main Street, Balangoda",
				BusinessCategory: "Food & Hospitality",
			},
		},
		{
			name: "missing address",
			cert: EnvironmentalCert{
				BusinessName:     "Balangoda Bakers",
				OwnerName:        "K. A. Perera",
				OwnerNIC:         "198512345678",
				ContactPhone:     "0771234567",
				BusinessCategory: "Food & Hospitality",
			},
		},
		{
			name: "missing business_category",
			cert: EnvironmentalCert{
				BusinessName: "Balangoda Bakers",
				OwnerName:    "K. A. Perera",
				OwnerNIC:     "198512345678",
				ContactPhone: "0771234567",
				Address:      "No. 15, Main Street, Balangoda",
			},
		},
	}

	expectedErr := "business_name, owner_name, owner_nic, contact_phone, address, and business_category are required"

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			repo := &mockRepository{}
			svc := NewService(repo)

			err := svc.CreateCert(&tc.cert)
			if err == nil {
				t.Fatalf("expected validation error for %s, got nil", tc.name)
			}
			if err.Error() != expectedErr {
				t.Errorf("expected error %q, got %q", expectedErr, err.Error())
			}
			if repo.createCalled {
				t.Errorf("expected repository Create not to be called when validation fails")
			}
		})
	}
}

func TestCreateCert_DefaultStatusAndSuccess(t *testing.T) {
	t.Run("sets default PENDING status when empty", func(t *testing.T) {
		repo := &mockRepository{}
		svc := NewService(repo)

		cert := EnvironmentalCert{
			BusinessName:     "Balangoda Bakers",
			OwnerName:        "K. A. Perera",
			OwnerNIC:         "198512345678",
			ContactPhone:     "0771234567",
			Address:          "No. 15, Main Street, Balangoda",
			BusinessCategory: "Food & Hospitality",
		}

		if err := svc.CreateCert(&cert); err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if !repo.createCalled {
			t.Fatalf("expected repository Create to be called")
		}
		if cert.Status != "PENDING" {
			t.Errorf("expected default status PENDING, got %q", cert.Status)
		}
	})

	t.Run("preserves explicit status when provided", func(t *testing.T) {
		repo := &mockRepository{}
		svc := NewService(repo)

		cert := EnvironmentalCert{
			BusinessName:     "Samanala Tea Factory",
			OwnerName:        "R. M. Silva",
			OwnerNIC:         "197945612390",
			ContactPhone:     "0719876543",
			Address:          "Rassagala Road, Balangoda",
			BusinessCategory: "Manufacturing & Tea",
			Status:           "APPROVED",
		}

		if err := svc.CreateCert(&cert); err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if cert.Status != "APPROVED" {
			t.Errorf("expected status APPROVED to be preserved, got %q", cert.Status)
		}
	})
}

func TestProcessMonthlyExpiryCheck(t *testing.T) {
	t.Run("returns count of newly expired certificates", func(t *testing.T) {
		repo := &mockRepository{markExpiredCount: 3}
		svc := NewService(repo)

		count, err := svc.ProcessMonthlyExpiryCheck()
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if count != 3 {
			t.Errorf("expected expired count 3, got %d", count)
		}
	})

	t.Run("propagates repository error", func(t *testing.T) {
		repo := &mockRepository{markExpiredErr: errors.New("db connection timeout")}
		svc := NewService(repo)

		count, err := svc.ProcessMonthlyExpiryCheck()
		if err == nil {
			t.Fatalf("expected error, got nil")
		}
		if count != 0 {
			t.Errorf("expected count 0 on error, got %d", count)
		}
	})
}

func TestRenewCert(t *testing.T) {
	t.Run("renews an EXPIRED certificate successfully", func(t *testing.T) {
		repo := &mockRepository{
			certs: []EnvironmentalCert{
				{ID: 1, BusinessName: "Kalthota Spice Mill", Status: "EXPIRED"},
			},
			renewedCert: &EnvironmentalCert{
				ID:           1,
				BusinessName: "Kalthota Spice Mill",
				Status:       "APPROVED",
			},
		}
		svc := NewService(repo)

		renewed, err := svc.RenewCert("1")
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if renewed == nil || renewed.Status != "APPROVED" {
			t.Errorf("expected renewed status APPROVED, got %+v", renewed)
		}
	})

	t.Run("rejects renewal for PENDING certificate", func(t *testing.T) {
		repo := &mockRepository{
			certs: []EnvironmentalCert{
				{ID: 2, BusinessName: "Saman Tea Factory", Status: "PENDING"},
			},
		}
		svc := NewService(repo)

		_, err := svc.RenewCert("2")
		if err == nil {
			t.Fatalf("expected eligibility error, got nil")
		}
		expected := "only approved or expired certificates are eligible for renewal"
		if err.Error() != expected {
			t.Errorf("expected %q, got %q", expected, err.Error())
		}
	})

	t.Run("returns error when certificate does not exist", func(t *testing.T) {
		repo := &mockRepository{}
		svc := NewService(repo)

		_, err := svc.RenewCert("999")
		if err == nil {
			t.Fatalf("expected not found error, got nil")
		}
	})

	t.Run("propagates repository renewal error", func(t *testing.T) {
		repo := &mockRepository{
			certs:    []EnvironmentalCert{{ID: 1, BusinessName: "Balangoda Bakers", Status: "APPROVED"}},
			renewErr: errors.New("database update failed"),
		}
		svc := NewService(repo)

		_, err := svc.RenewCert("1")
		if err == nil || err.Error() != "database update failed" {
			t.Errorf("expected 'database update failed', got %v", err)
		}
	})
}

func TestListExpiringSoon(t *testing.T) {
	t.Run("defaults to 90 days when non-positive window is provided", func(t *testing.T) {
		repo := &mockRepository{
			expiringCerts: []EnvironmentalCert{
				{ID: 3, BusinessName: "Rathna Ayurveda Pharmacy", Status: "APPROVED"},
			},
		}
		svc := NewService(repo)

		certs, err := svc.ListExpiringSoon(0)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if repo.lastExpiringDays != 90 {
			t.Errorf("expected default 90-day window, got %d", repo.lastExpiringDays)
		}
		if len(certs) != 1 {
			t.Errorf("expected 1 expiring certificate, got %d", len(certs))
		}
	})

	t.Run("passes explicit day window to repository", func(t *testing.T) {
		repo := &mockRepository{}
		svc := NewService(repo)

		_, err := svc.ListExpiringSoon(30)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if repo.lastExpiringDays != 30 {
			t.Errorf("expected 30-day window, got %d", repo.lastExpiringDays)
		}
	})

	t.Run("propagates repository error", func(t *testing.T) {
		repo := &mockRepository{expiringErr: errors.New("query timeout")}
		svc := NewService(repo)

		_, err := svc.ListExpiringSoon(90)
		if err == nil || err.Error() != "query timeout" {
			t.Errorf("expected 'query timeout', got %v", err)
		}
	})
}