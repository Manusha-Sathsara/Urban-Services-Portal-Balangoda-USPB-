package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/jmoiron/sqlx"
)

// RLSContext defines transaction-local PostgreSQL session settings used by RLS policies.
type RLSContext struct {
	UserID   int
	Role     string
	AuthFlow bool
}

// ConnectPostgres initializes a connection pool to PostgreSQL using sqlx and pgx.
func ConnectPostgres() (*sqlx.DB, error) {
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	sslmode := os.Getenv("DB_SSLMODE")

	if host == "" {
		host = "localhost"
	}
	if port == "" {
		port = "5432"
	}
	if user == "" {
		user = "uspb_app"
	}
	if dbname == "" {
		dbname = "uspb_auth_db"
	}
	if sslmode == "" {
		sslmode = "disable"
	}

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", user, password, host, port, dbname, sslmode)

	db, err := sqlx.Connect("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to PostgreSQL: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		log.Printf("Warning: initial ping to PostgreSQL failed: %v", err)
	} else {
		log.Println("Successfully established PostgreSQL connection pool")
	}

	return db, nil
}

// WithRLS executes fn inside a transaction with transaction-local PostgreSQL RLS settings.
func WithRLS(ctx context.Context, db *sqlx.DB, rls RLSContext, fn func(tx *sqlx.Tx) error) error {
	tx, err := db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin rls tx: %w", err)
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	userIDStr := ""
	if rls.UserID > 0 {
		userIDStr = strconv.Itoa(rls.UserID)
	}
	authFlowStr := "false"
	if rls.AuthFlow {
		authFlowStr = "true"
	}

	if _, err := tx.ExecContext(ctx,
		`SELECT set_config('app.current_user_id', $1, true),
		        set_config('app.current_role', $2, true),
		        set_config('app.auth_flow', $3, true)`,
		userIDStr, rls.Role, authFlowStr,
	); err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("apply rls context: %w", err)
	}

	if err := fn(tx); err != nil {
		_ = tx.Rollback()
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit rls tx: %w", err)
	}
	return nil
}
