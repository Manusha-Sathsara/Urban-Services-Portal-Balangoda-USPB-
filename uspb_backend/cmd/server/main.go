package main

import (
	"log"
	"os"

	"github.com/BalangodaUC/uspb_backend/internal/jobs"
	"github.com/BalangodaUC/uspb_backend/internal/modules/envcert"
	"github.com/BalangodaUC/uspb_backend/internal/modules/garbagefee"
	"github.com/BalangodaUC/uspb_backend/internal/modules/schoolrewards"
	"github.com/BalangodaUC/uspb_backend/pkg/database"
	"github.com/BalangodaUC/uspb_backend/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
)

func main() {
	// 1. Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("[INFO] No .env file loaded, relying on system environment variables")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// 2. Initialize Fiber app
	app := fiber.New(fiber.Config{
		AppName: "Urban Services Portal Balangoda (USPB) Backend",
	})

	// Middlewares
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// 3. Database connection pool
	db, err := database.ConnectPostgres()
	if err != nil {
		log.Printf("[WARN] PostgreSQL connection warning: %v. Scaffolding mode active.", err)
	} else {
		defer db.Close()

		// Start background cron jobs if DB connected
		jobRunner := jobs.NewJobRunner(db)
		jobRunner.StartCronJobs()
		defer jobRunner.Stop()
	}

	// 4. API v1 routing group
	api := app.Group("/api/v1")

	// Health check endpoint
	api.Get("/health", func(c *fiber.Ctx) error {
		return utils.SuccessResponse(c, fiber.StatusOK, "USPB API is healthy and running", fiber.Map{
			"version": "1.0.0",
			"status":  "operational",
		})
	})

	// Register module handlers if db is initialized
	if db != nil {
		gfRepo := garbagefee.NewRepository(db)
		gfService := garbagefee.NewService(gfRepo)
		gfHandler := garbagefee.NewHandler(gfService)
		gfHandler.RegisterRoutes(api)

		envRepo := envcert.NewRepository(db)
		envService := envcert.NewService(envRepo)
		envHandler := envcert.NewHandler(envService)
		envHandler.RegisterRoutes(api)

		srRepo := schoolrewards.NewRepository(db)
		srService := schoolrewards.NewService(srRepo)
		srHandler := schoolrewards.NewHandler(srService)
		srHandler.RegisterRoutes(api)
	}

	// 5. Start Server
	log.Printf("Starting USPB Backend server on port :%s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Server startup failed: %v", err)
	}
}
