package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds validated runtime configuration for the USPB backend.
type Config struct {
	Port               string
	Env                string
	DBHost             string
	DBPort             string
	DBUser             string
	DBPassword         string
	DBName             string
	DBSSLMode          string
	JWTSecret          string
	AccessTokenTTL     time.Duration
	RefreshTokenTTL    time.Duration
	CookieSecure       bool
	CookieSameSite     string
	AllowedOrigins     []string
	LoginRateLimitMax  int
	LoginRateLimitWin  time.Duration
	LockoutThreshold   int
	LockoutDuration    time.Duration
}

// Load reads configuration from environment variables and validates security-critical fields.
func Load() (*Config, error) {
	env := getEnv("APP_ENV", "development")
	jwtSecret := strings.TrimSpace(os.Getenv("JWT_SECRET"))

	if len(jwtSecret) < 32 {
		return nil, fmt.Errorf("JWT_SECRET must be set and at least 32 characters long")
	}
	if env == "production" && strings.Contains(jwtSecret, "change_in_production") {
		return nil, fmt.Errorf("JWT_SECRET must not use the example placeholder in production")
	}

	accessMins := getEnvInt("ACCESS_TOKEN_TTL_MINUTES", 15)
	refreshDays := getEnvInt("REFRESH_TOKEN_TTL_DAYS", 7)
	rateMax := getEnvInt("LOGIN_RATE_LIMIT_MAX", 10)
	rateWinSecs := getEnvInt("LOGIN_RATE_LIMIT_WINDOW_SECONDS", 60)
	lockThreshold := getEnvInt("LOGIN_LOCKOUT_THRESHOLD", 5)
	lockMins := getEnvInt("LOGIN_LOCKOUT_MINUTES", 15)

	cookieSecure := getEnvBool("COOKIE_SECURE", env == "production")
	sameSite := getEnv("COOKIE_SAMESITE", "Lax")

	originsRaw := getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3100")
	var origins []string
	for _, o := range strings.Split(originsRaw, ",") {
		if trimmed := strings.TrimSpace(o); trimmed != "" {
			origins = append(origins, trimmed)
		}
	}

	return &Config{
		Port:              getEnv("PORT", "8080"),
		Env:               env,
		DBHost:            getEnv("DB_HOST", "localhost"),
		DBPort:            getEnv("DB_PORT", "5432"),
		DBUser:            getEnv("DB_USER", "uspb_app"),
		DBPassword:        os.Getenv("DB_PASSWORD"),
		DBName:            getEnv("DB_NAME", "uspb_auth_db"),
		DBSSLMode:         getEnv("DB_SSLMODE", "disable"),
		JWTSecret:         jwtSecret,
		AccessTokenTTL:    time.Duration(accessMins) * time.Minute,
		RefreshTokenTTL:   time.Duration(refreshDays) * 24 * time.Hour,
		CookieSecure:      cookieSecure,
		CookieSameSite:    sameSite,
		AllowedOrigins:    origins,
		LoginRateLimitMax: rateMax,
		LoginRateLimitWin: time.Duration(rateWinSecs) * time.Second,
		LockoutThreshold:  lockThreshold,
		LockoutDuration:   time.Duration(lockMins) * time.Minute,
	}, nil
}

func getEnv(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil && parsed > 0 {
			return parsed
		}
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		if parsed, err := strconv.ParseBool(v); err == nil {
			return parsed
		}
	}
	return fallback
}
