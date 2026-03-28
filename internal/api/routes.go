package api

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/f2b-portal/backend/internal/api/handlers"
	"github.com/f2b-portal/backend/internal/api/middleware"
	"github.com/f2b-portal/backend/internal/repository"
	"github.com/f2b-portal/backend/internal/service"
	"github.com/f2b-portal/backend/pkg/config"
	"github.com/gin-gonic/gin"
)

func SetupRoutes() *gin.Engine {
	router := gin.Default()

	// Middleware
	router.Use(middleware.CORSMiddleware())
	// Note: gin.Default() already includes Logger + Recovery.

	// Serve static files (uploads)
	router.Static("/uploads", "./uploads")

	// Serve built frontend if present (optional).
	// This makes the project "single-process" in production: `go run ...` serves both API and UI.
	if _, err := os.Stat("./dist/index.html"); err == nil {
		router.Static("/assets", "./dist/assets")
		router.StaticFile("/", "./dist/index.html")
		router.StaticFile("/index.html", "./dist/index.html")
		router.NoRoute(func(c *gin.Context) {
			// Only fall back to SPA for non-API GET requests
			if c.Request.Method != http.MethodGet {
				c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
				return
			}
			path := c.Request.URL.Path
			if strings.HasPrefix(path, "/api/") || strings.HasPrefix(path, "/uploads/") || strings.HasPrefix(path, "/assets/") {
				c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
				return
			}
			// If a real file exists in dist (e.g., favicon), serve it; otherwise serve index.html.
			distPath := filepath.Clean(filepath.Join("dist", path))
			if strings.HasPrefix(distPath, "dist"+string(filepath.Separator)) {
				if _, err := os.Stat(distPath); err == nil {
					c.File(distPath)
					return
				}
			}
			c.File("./dist/index.html")
		})
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(config.GetDB())
	productRepo := repository.NewProductRepository(config.GetDB())
	orderRepo := repository.NewOrderRepository(config.GetDB())
	cartRepo := repository.NewCartRepository(config.GetDB())

	// Initialize services
	authService := service.NewAuthService(userRepo)
	productService := service.NewProductService(productRepo)
	orderService := service.NewOrderService(orderRepo, productRepo, userRepo)
	trustScoreService := service.NewTrustScoreService(userRepo, orderRepo)
	cartService := service.NewCartService(cartRepo, productRepo, orderRepo)
	adminService := service.NewAdminService(userRepo, productRepo, orderRepo)
	userPortalService := service.NewUserPortalService(userRepo, productRepo, orderRepo)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	productHandler := handlers.NewProductHandler(productService)
	orderHandler := handlers.NewOrderHandler(orderService)
	userHandler := handlers.NewUserHandler(trustScoreService, userPortalService)
	uploadHandler := handlers.NewUploadHandler()
	cartHandler := handlers.NewCartHandler(cartService)
	adminHandler := handlers.NewAdminHandler(adminService)

	// API routes
	api := router.Group("/api/v1")
	{
		// Public routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.GET("/me", middleware.AuthMiddleware(), authHandler.GetMe)
		}

		// Products (public read, protected write)
		products := api.Group("/products")
		{
			products.GET("", productHandler.GetAllProducts)
			products.GET("/search", productHandler.SearchProducts)
			products.GET("/:id", productHandler.GetProduct)
			products.POST("", middleware.AuthMiddleware(), middleware.FarmerOnly(), productHandler.CreateProduct)
			products.PUT("/:id", middleware.AuthMiddleware(), middleware.FarmerOnly(), productHandler.UpdateProduct)
			products.PATCH("/bulk/status", middleware.AuthMiddleware(), middleware.FarmerOnly(), productHandler.BulkUpdateProductStatus)
			products.PATCH("/:id/status", middleware.AuthMiddleware(), middleware.FarmerOnly(), productHandler.UpdateProductStatus)
			products.PATCH("/:id/price", middleware.AuthMiddleware(), middleware.FarmerOnly(), productHandler.UpdateProductPrice)
			products.POST("/:id/duplicate", middleware.AuthMiddleware(), middleware.FarmerOnly(), productHandler.DuplicateProduct)
			products.GET("/:id/price-history", middleware.AuthMiddleware(), middleware.FarmerOnly(), productHandler.GetProductPriceHistory)
			products.DELETE("/:id", middleware.AuthMiddleware(), middleware.FarmerOnly(), productHandler.DeleteProduct)
			products.GET("/my/listings", middleware.AuthMiddleware(), middleware.FarmerOnly(), productHandler.GetMyProducts)
		}

		// Orders (protected)
		orders := api.Group("/orders")
		orders.Use(middleware.AuthMiddleware())
		{
			orders.POST("", middleware.BuyerOnly(), orderHandler.CreateOrder)
			orders.POST("/bulk", middleware.BuyerOnly(), orderHandler.CreateBulkOrder)
			orders.POST("/harvest-requests", middleware.BuyerOnly(), orderHandler.CreateHarvestRequest)
			orders.GET("/:id", orderHandler.GetOrder)
			orders.GET("/:id/messages", orderHandler.GetOrderMessages)
			orders.POST("/:id/messages", orderHandler.SendOrderMessage)
			orders.GET("/:id/dispute/evidence", orderHandler.GetDisputeEvidences)
			orders.POST("/:id/dispute/evidence", orderHandler.AddDisputeEvidence)
			orders.GET("/my/orders", middleware.BuyerOnly(), orderHandler.GetMyOrders)
			orders.GET("/my/harvest-requests", middleware.BuyerOnly(), orderHandler.GetBuyerHarvestRequests)
			orders.GET("/my/reviews", middleware.BuyerOnly(), orderHandler.GetBuyerReviews)
			orders.GET("/my/notifications", middleware.BuyerOnly(), orderHandler.GetBuyerNotifications)
			orders.POST("/harvest-requests/:id/convert", middleware.BuyerOnly(), orderHandler.ConvertHarvestRequestToOrder)
			orders.PATCH("/harvest-requests/:id", orderHandler.UpdateHarvestRequest)
			orders.POST("/:id/review", middleware.BuyerOnly(), orderHandler.SubmitBuyerReview)
			orders.GET("/farmer/orders", middleware.FarmerOnly(), orderHandler.GetFarmerOrders)
			orders.GET("/farmer/harvest-requests", middleware.FarmerOnly(), orderHandler.GetFarmerHarvestRequests)
			orders.GET("/farmer/payout-summary", middleware.FarmerOnly(), orderHandler.GetFarmerPayoutSummary)
			orders.GET("/farmer/analytics", middleware.FarmerOnly(), orderHandler.GetFarmerAnalytics)
			orders.GET("/farmer/notifications", middleware.FarmerOnly(), orderHandler.GetFarmerNotifications)
			orders.GET("/farmer/summary/weekly", middleware.FarmerOnly(), orderHandler.GetFarmerWeeklySummary)
			orders.GET("/farmer/summary/monthly", middleware.FarmerOnly(), orderHandler.GetFarmerMonthlySummary)
			orders.GET("/farmer/reports/export", middleware.FarmerOnly(), orderHandler.ExportFarmerReport)
			orders.GET("/farmer/reviews", middleware.FarmerOnly(), orderHandler.GetFarmerReviews)
			orders.GET("/farmer/disputes", middleware.FarmerOnly(), orderHandler.GetFarmerDisputes)
			orders.POST("/:id/dispute/open", middleware.FarmerOnly(), orderHandler.OpenDispute)
			orders.POST("/:id/dispute/resolve", middleware.FarmerOnly(), orderHandler.ResolveDispute)
			orders.POST("/:id/dispute/reject", middleware.FarmerOnly(), orderHandler.RejectDispute)
			orders.GET("/:id/invoice", middleware.FarmerOnly(), orderHandler.GetFarmerInvoice)
			orders.GET("/:id/history", orderHandler.GetOrderStatusHistory)
			orders.PUT("/:id/status", orderHandler.UpdateOrderStatus)
			orders.DELETE("/:id", orderHandler.CancelOrder)
		}

		// Users
		users := api.Group("/users")
		{
			users.GET("/:id/trust-score", userHandler.GetTrustScore)
			users.GET("/farmers", userHandler.GetFarmers)
			users.GET("/me/addresses", middleware.AuthMiddleware(), userHandler.GetMyAddresses)
			users.POST("/me/addresses", middleware.AuthMiddleware(), userHandler.SaveAddress)
			users.DELETE("/me/addresses/:id", middleware.AuthMiddleware(), userHandler.DeleteAddress)
			users.GET("/me/favorites", middleware.AuthMiddleware(), middleware.BuyerOnly(), userHandler.GetFavorites)
			users.POST("/me/favorites/:product_id", middleware.AuthMiddleware(), middleware.BuyerOnly(), userHandler.ToggleFavorite)
			users.GET("/me/documents", middleware.AuthMiddleware(), userHandler.GetMyVerificationDocuments)
			users.POST("/me/documents", middleware.AuthMiddleware(), userHandler.UploadVerificationDocument)
		}

		// Cart (buyer only)
		cart := api.Group("/cart")
		cart.Use(middleware.AuthMiddleware(), middleware.BuyerOnly())
		{
			cart.GET("", cartHandler.GetCart)
			cart.POST("", cartHandler.AddToCart)
			cart.PUT("/:id", cartHandler.UpdateItem)
			cart.DELETE("/:id", cartHandler.RemoveItem)
			cart.POST("/checkout", cartHandler.Checkout)
		}

		// Upload
		upload := api.Group("/upload")
		upload.Use(middleware.AuthMiddleware())
		{
			upload.POST("/image", uploadHandler.UploadImage)
			upload.POST("/images", uploadHandler.UploadMultipleImages)
		}

		// Admin data endpoints
		admin := api.Group("/admin")
		admin.Use(middleware.AuthMiddleware(), middleware.AdminOnly())
		{
			admin.GET("/overview", adminHandler.GetOverview)
			admin.GET("/users", adminHandler.GetUsers)
			admin.PATCH("/users/:id/status", adminHandler.UpdateUserStatus)
			admin.PATCH("/users/:id/verification", adminHandler.UpdateUserVerification)
			admin.GET("/products", adminHandler.GetProducts)
			admin.PATCH("/products/:id/moderation", adminHandler.UpdateProductModeration)
			admin.GET("/transactions", adminHandler.GetTransactions)
			admin.GET("/transactions/export", adminHandler.ExportTransactionsCSV)
			admin.GET("/transactions/:id/invoice", adminHandler.GetTransactionInvoice)
			admin.GET("/harvest-requests", adminHandler.GetHarvestRequests)
			admin.GET("/reports", adminHandler.GetReports)
			admin.POST("/reports/action", adminHandler.ResolveReportAction)
			admin.PATCH("/reports/:id/resolve", adminHandler.ResolveReport)
			admin.POST("/reports/:id/resolve", adminHandler.ResolveReport)
			admin.PATCH("/reports/:id", adminHandler.ResolveReport)
			admin.POST("/reports/:id", adminHandler.ResolveReport)
			admin.GET("/novelty-analytics", adminHandler.GetNoveltyAnalytics)
			admin.GET("/verification-documents", userHandler.GetAllVerificationDocuments)
			admin.PATCH("/verification-documents/:id", userHandler.ReviewVerificationDocument)
		}
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	return router
}
