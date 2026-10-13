package envcert

type Service interface {
	ListCerts() ([]EnvironmentalCert, error)
	GetCert(id string) (*EnvironmentalCert, error)
	CreateCert(cert *EnvironmentalCert) error
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
	return s.repo.Create(cert)
}
