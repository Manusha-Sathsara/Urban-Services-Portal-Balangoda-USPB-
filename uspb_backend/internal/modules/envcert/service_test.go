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