package api

import (
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
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Serve static files (uploads)
	router.Static("/uploads", "./uploads")

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

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	productHandler := handlers.NewProductHandler(productService)
	orderHandler := handlers.NewOrderHandler(orderService)
	userHandler := handlers.NewUserHandler(trustScoreService)
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
			orders.GET("/:id", orderHandler.GetOrder)
			orders.GET("/my/orders", middleware.BuyerOnly(), orderHandler.GetMyOrders)
			orders.GET("/my/reviews", middleware.BuyerOnly(), orderHandler.GetBuyerReviews)
			orders.GET("/my/notifications", middleware.BuyerOnly(), orderHandler.GetBuyerNotifications)
			orders.POST("/:id/review", middleware.BuyerOnly(), orderHandler.SubmitBuyerReview)
			orders.GET("/farmer/orders", middleware.FarmerOnly(), orderHandler.GetFarmerOrders)
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
		{
			admin.GET("/overview", adminHandler.GetOverview)
			admin.GET("/users", adminHandler.GetUsers)
			admin.GET("/products", adminHandler.GetProducts)
			admin.GET("/transactions", adminHandler.GetTransactions)
			admin.GET("/reports", adminHandler.GetReports)
		}
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	return router
}
