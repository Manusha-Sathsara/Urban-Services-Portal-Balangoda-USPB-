package main

import (
	"log"
	"strings"

	"github.com/BalangodaUC/uspb_backend/internal/config"
	"github.com/BalangodaUC/uspb_backend/internal/jobs"
	"github.com/BalangodaUC/uspb_backend/internal/middleware"
	"github.com/BalangodaUC/uspb_backend/internal/modules/auth"
	"github.com/BalangodaUC/uspb_backend/internal/modules/envcert"
	"github.com/BalangodaUC/uspb_backend/internal/modules/garbagefee"
	"github.com/BalangodaUC/uspb_backend/internal/modules/schoolrewards"
	"github.com/BalangodaUC/uspb_backend/pkg/database"
	"github.com/BalangodaUC/uspb_backend/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("[INFO] No .env file loaded, relying on system environment variables")
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Configuration error: %v", err)
	}

	app := fiber.New(fiber.Config{
		AppName: "Urban Services Portal Balangoda (USPB) Backend",
	})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Join(cfg.AllowedOrigins, ","),
		AllowCredentials: true,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, X-CSRF-Token",
		AllowMethods:     "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	}))

	db, err := database.ConnectPostgres()
	if err != nil {
		log.Printf("[WARN] PostgreSQL connection warning: %v.", err)
	} else {
		defer db.Close()

		jobRunner := jobs.NewJobRunner(db)
		jobRunner.StartCronJobs()
		defer jobRunner.Stop()
	}

	api := app.Group("/api/v1")

	api.Get("/health", func(c *fiber.Ctx) error {
		dbStatus := "connected"
		if db == nil {
			dbStatus = "disconnected"
		}
		return utils.SuccessResponse(c, fiber.StatusOK, "USPB API is healthy and running", fiber.Map{
			"version":  "1.0.0",
			"status":   "operational",
			"database": dbStatus,
		})
	})

	api.Get("/ready", func(c *fiber.Ctx) error {
		if db == nil {
			return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database is not connected")
		}
		if err := db.Ping(); err != nil {
			return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database ping failed")
		}
		return utils.SuccessResponse(c, fiber.StatusOK, "Service ready", fiber.Map{"database": "connected"})
	})

	if db != nil {
		authRepo := auth.NewRepository(db)
		authService := auth.NewService(authRepo, cfg)
		authHandler := auth.NewHandler(authService, cfg)

		jwtMW := middleware.JWTMiddleware(cfg.JWTSecret, authService)
		csrfMW := middleware.CSRFMiddleware()
		adminMW := middleware.RequireRoles(auth.RoleAdmin)
		loginLimiter := limiter.New(limiter.Config{
			Max:        cfg.LoginRateLimitMax,
			Expiration: cfg.LoginRateLimitWin,
			LimitReached: func(c *fiber.Ctx) error {
				return utils.ErrorResponse(c, fiber.StatusTooManyRequests, "Too many login attempts. Please wait and try again.")
			},
		})

		authHandler.RegisterRoutes(api, jwtMW, csrfMW, adminMW, loginLimiter)

		// Garbage Fee Management
		api.Use("/garbage-fees", jwtMW, csrfMW, middleware.RequireRoles(auth.RoleFeeOfficer, auth.RoleAdmin))
		gfRepo := garbagefee.NewRepository(db)
		gfService := garbagefee.NewService(gfRepo)
		gfHandler := garbagefee.NewHandler(gfService)
		gfHandler.RegisterRoutes(api)

		// Environmental Certificates
		api.Use("/environmental-certs", jwtMW, csrfMW, middleware.RequireRoles(auth.RoleEnvOfficer, auth.RoleAdmin))
		envRepo := envcert.NewRepository(db)
		envService := envcert.NewService(envRepo)
		envHandler := envcert.NewHandler(envService)
		envHandler.RegisterRoutes(api)

		// School Waste Rewards (Manusha + Praneepa)
		srRoleMW := middleware.RequireRoles(auth.RoleTeacher, auth.RoleGarbageSupervisor, auth.RoleAdmin)
		for _, prefix := range []string{"/schools", "/categories", "/badges", "/school-rewards"} {
			api.Use(prefix, jwtMW, csrfMW, srRoleMW)
		}

		schoolRepo := schoolrewards.NewSchoolRepository(db)
		schoolService := schoolrewards.NewSchoolService(schoolRepo)
		schoolHandler := schoolrewards.NewSchoolHandler(schoolService)
		schoolHandler.RegisterRoutes(api)

		categoryRepo := schoolrewards.NewCategoryRepository(db)
		categoryService := schoolrewards.NewCategoryService(categoryRepo)
		categoryHandler := schoolrewards.NewCategoryHandler(categoryService)
		categoryHandler.RegisterRoutes(api)

		badgeRepo := schoolrewards.NewBadgeRepository(db)
		pointsProvider := schoolrewards.NewSQLPointsLedgerProvider(db)
		badgeService := schoolrewards.NewBadgeService(badgeRepo, pointsProvider)
		badgeHandler := schoolrewards.NewBadgeHandler(badgeService)
		badgeHandler.RegisterRoutes(api)

		ledgerRepo := schoolrewards.NewLedgerRepository(db)
		ledgerService := schoolrewards.NewLedgerService(ledgerRepo)
		ledgerHandler := schoolrewards.NewLedgerHandler(ledgerService)
		ledgerHandler.RegisterRoutes(api)
	}

	log.Printf("Starting USPB Backend server on port :%s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("Server startup failed: %v", err)
	}
}
