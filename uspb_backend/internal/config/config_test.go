package config

import (
	"strings"
	"testing"
)

func TestLoadRejectsShortJWTSecret(t *testing.T) {
	t.Setenv("JWT_SECRET", "too-short")
	t.Setenv("APP_ENV", "development")

	_, err := Load()
	if err == nil {
		t.Fatal("expected error for short JWT_SECRET, got nil")
	}
}

func TestLoadRejectsPlaceholderInProduction(t *testing.T) {
	t.Setenv("JWT_SECRET", strings.Repeat("a", 16)+"_change_in_production")
	t.Setenv("APP_ENV", "production")

	_, err := Load()
	if err == nil {
		t.Fatal("expected error for placeholder JWT_SECRET in production, got nil")
	}
}

func TestLoadValidConfigDefaults(t *testing.T) {
	t.Setenv("JWT_SECRET", strings.Repeat("x", 32))
	t.Setenv("APP_ENV", "development")
	t.Setenv("DB_USER", "")
	t.Setenv("DB_NAME", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.DBUser != "uspb_app" {
		t.Errorf("expected default DBUser uspb_app, got %s", cfg.DBUser)
	}
	if cfg.DBName != "uspb_auth_db" {
		t.Errorf("expected default DBName uspb_auth_db, got %s", cfg.DBName)
	}
	if cfg.CookieSecure {
		t.Error("expected CookieSecure false in development by default")
	}
}
