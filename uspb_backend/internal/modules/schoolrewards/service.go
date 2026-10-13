package schoolrewards

type Service interface {
	ListRewards() ([]SchoolRewardRecord, error)
	GetReward(id string) (*SchoolRewardRecord, error)
	CreateReward(record *SchoolRewardRecord) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) ListRewards() ([]SchoolRewardRecord, error) {
	return s.repo.GetAll()
}

func (s *service) GetReward(id string) (*SchoolRewardRecord, error) {
	return s.repo.GetByID(id)
}

func (s *service) CreateReward(record *SchoolRewardRecord) error {
	// Standard calculation: 2 points per kg of recyclables
	if record.PointsEarned == 0 {
		record.PointsEarned = int(record.QuantityKg * 2.0)
	}
	return s.repo.Create(record)
}
