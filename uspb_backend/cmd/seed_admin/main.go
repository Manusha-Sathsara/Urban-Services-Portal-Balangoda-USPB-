package main

import (
	"context"
	"log"
	"os"
	"strings"
	"time"

	"github.com/BalangodaUC/uspb_backend/internal/modules/auth"
	"github.com/BalangodaUC/uspb_backend/pkg/database"
	"github.com/BalangodaUC/uspb_backend/pkg/utils"
	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	username := strings.TrimSpace(os.Getenv("ADMIN_USERNAME"))
	password := os.Getenv("ADMIN_PASSWORD")
	name := strings.TrimSpace(os.Getenv("ADMIN_NAME"))
	if name == "" {
		name = "System Administrator"
	}

	if username == "" || len(password) < 8 {
		log.Fatal("ADMIN_USERNAME and ADMIN_PASSWORD (min 8 chars) environment variables are required")
	}

	db, err := database.ConnectPostgres()
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer db.Close()

	hash, err := utils.HashPassword(password)
	if err != nil {
		log.Fatalf("Password hash failed: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = database.WithRLS(ctx, db, database.RLSContext{Role: auth.RoleAdmin}, func(tx *sqlx.Tx) error {
		_, execErr := tx.ExecContext(ctx, `
			INSERT INTO users (name, username, password_hash, role, school_id, is_active, must_change_password)
			VALUES ($1, $2, $3, 'ADMIN', NULL, TRUE, FALSE)
			ON CONFLICT (username) DO NOTHING
		`, name, username, hash)
		return execErr
	})
	if err != nil {
		log.Fatalf("Failed to seed initial admin: %v", err)
	}

	log.Printf("Initial admin bootstrap completed for username=%q", username)
}
