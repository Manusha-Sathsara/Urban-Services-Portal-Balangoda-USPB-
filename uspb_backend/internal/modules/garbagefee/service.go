package garbagefee

type Service interface {
	ListRecords() ([]GarbageFeeRecord, error)
	GetRecord(id string) (*GarbageFeeRecord, error)
	CreateRecord(record *GarbageFeeRecord) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) ListRecords() ([]GarbageFeeRecord, error) {
	return s.repo.GetAll()
}

func (s *service) GetRecord(id string) (*GarbageFeeRecord, error) {
	return s.repo.GetByID(id)
}

func (s *service) CreateRecord(record *GarbageFeeRecord) error {
	return s.repo.Create(record)
}
