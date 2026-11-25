package jobs

import (
	"log"

	"github.com/BalangodaUC/uspb_backend/internal/modules/envcert"
	"github.com/jmoiron/sqlx"
	"github.com/robfig/cron/v3"
)

type JobRunner struct {
	cron *cron.Cron
	db   *sqlx.DB
}

// NewJobRunner creates a new cron runner instance
func NewJobRunner(db *sqlx.DB) *JobRunner {
	c := cron.New()
	return &JobRunner{
		cron: c,
		db:   db,
	}
}

// StartCronJobs registers and starts scheduled municipal recurring jobs
func (jr *JobRunner) StartCronJobs() {
	// Monthly job scheduled on the 1st of every month
	_, err := jr.cron.AddFunc("0 0 1 * *", func() {
		log.Println("[CRON] Executing monthly Balangoda municipal assessment roll & school rewards cycle...")
	})
	if err != nil {
		log.Printf("[CRON ERROR] Failed to register monthly assessment job: %v", err)
		return
	}

	// Monthly environmental certificate expiry & renewal check (1st of every month at 00:00)
	_, err = jr.cron.AddFunc("0 0 1 * *", func() {
		jr.RunEnvCertExpiryCheck()
	})
	if err != nil {
		log.Printf("[CRON ERROR] Failed to register monthly environmental certificate expiry job: %v", err)
		return
	}

	jr.cron.Start()
	log.Println("[CRON] Municipal background cron scheduler started successfully")
}

// RunEnvCertExpiryCheck scans approved environmental certificates and flags expired ones for renewal
func (jr *JobRunner) RunEnvCertExpiryCheck() {
	log.Println("[CRON] Executing monthly Environmental Certificate expiry & renewal check...")
	repo := envcert.NewRepository(jr.db)
	svc := envcert.NewService(repo)
	if _, err := svc.ProcessMonthlyExpiryCheck(); err != nil {
		log.Printf("[CRON ERROR] Environmental certificate expiry check failed: %v", err)
	}
}

// Stop terminates active cron schedulers
func (jr *JobRunner) Stop() {
	if jr.cron != nil {
		jr.cron.Stop()
	}
}