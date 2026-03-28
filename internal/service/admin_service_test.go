package service

import (
	"os"
	"testing"
	"time"

	"github.com/f2b-portal/backend/internal/models"
	"github.com/f2b-portal/backend/internal/repository"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func TestGetNoveltyAnalyticsAggregatesMetrics(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite db: %v", err)
	}

	if err := db.AutoMigrate(&models.User{}, &models.FarmerProfile{}, &models.Product{}, &models.Order{}, &models.OrderMessage{}, &models.DisputeEvidence{}); err != nil {
		t.Fatalf("failed to migrate db: %v", err)
	}

	farmerOne := &models.User{
		Name:      "Farmer One",
		Email:     "farmer1@example.com",
		Phone:     "9000000011",
		Password:  "x",
		UserType:  "farmer",
		City:      "Madurai",
		State:     "Tamil Nadu",
		CreatedAt: time.Now().AddDate(0, -1, 0),
	}
	farmerTwo := &models.User{
		Name:      "Farmer Two",
		Email:     "farmer2@example.com",
		Phone:     "9000000012",
		Password:  "x",
		UserType:  "farmer",
		City:      "Salem",
		State:     "Tamil Nadu",
		CreatedAt: time.Now().AddDate(-3, 0, 0),
	}
	buyer := &models.User{
		Name:     "Buyer",
		Email:    "buyer1@example.com",
		Phone:    "9000000013",
		Password: "x",
		UserType: "buyer",
	}

	for _, user := range []*models.User{farmerOne, farmerTwo, buyer} {
		if err := db.Create(user).Error; err != nil {
			t.Fatalf("failed to create user %s: %v", user.Email, err)
		}
	}

	for _, profile := range []*models.FarmerProfile{
		{UserID: farmerOne.ID, FarmName: "Farm One", FarmSizeAcres: 2, TrustScore: 0.9, Badge: "GOLD"},
		{UserID: farmerTwo.ID, FarmName: "Farm Two", FarmSizeAcres: 12, TrustScore: 0.3, Badge: "BRONZE"},
	} {
		if err := db.Create(profile).Error; err != nil {
			t.Fatalf("failed to create farmer profile: %v", err)
		}
	}

	products := []*models.Product{
		{
			FarmerID:     farmerOne.ID,
			CropName:     "Tomato",
			Category:     "vegetable",
			Quantity:     20,
			Unit:         "kg",
			PricePerUnit: 50,
			Description:  "cold storage fresh tomatoes",
			City:         "Madurai",
			State:        "Tamil Nadu",
			Status:       "active",
			CreatedAt:    time.Now().Add(-12 * time.Hour),
		},
		{
			FarmerID:     farmerOne.ID,
			CropName:     "Potato",
			Category:     "vegetable",
			Quantity:     20,
			Unit:         "kg",
			PricePerUnit: 30,
			Description:  "ambient stock",
			City:         "Madurai",
			State:        "Tamil Nadu",
			Status:       "active",
			CreatedAt:    time.Now().Add(-8 * 24 * time.Hour),
		},
		{
			FarmerID:     farmerTwo.ID,
			CropName:     "Millet",
			Category:     "grain",
			Quantity:     20,
			Unit:         "kg",
			PricePerUnit: 70,
			Description:  "regular listing",
			City:         "Salem",
			State:        "Tamil Nadu",
			Status:       "active",
			CreatedAt:    time.Now().Add(-3 * 24 * time.Hour),
		},
	}

	for _, product := range products {
		if err := db.Create(product).Error; err != nil {
			t.Fatalf("failed to create product %s: %v", product.CropName, err)
		}
	}

	t.Setenv("NOVELTY_TRUST_ALPHA", "0.20")
	t.Setenv("NOVELTY_FS_WEIGHT_HARVEST", "0.6")
	t.Setenv("NOVELTY_FS_WEIGHT_DISTANCE", "0.2")
	t.Setenv("NOVELTY_FS_WEIGHT_STORAGE", "0.2")
	defer os.Unsetenv("NOVELTY_TRUST_ALPHA")

	svc := NewAdminService(
		repository.NewUserRepository(db),
		repository.NewProductRepository(db),
		repository.NewOrderRepository(db),
	)

	analytics, err := svc.GetNoveltyAnalytics()
	if err != nil {
		t.Fatalf("GetNoveltyAnalytics returned error: %v", err)
	}

	if analytics.Trust.FarmersCount != 2 {
		t.Fatalf("expected 2 farmers, got %d", analytics.Trust.FarmersCount)
	}
	if analytics.Trust.GoldFarmers != 1 || analytics.Trust.BronzeFarmers != 1 {
		t.Fatalf("unexpected trust badge distribution: %+v", analytics.Trust)
	}
	if analytics.Freshness.ActiveProducts != 3 {
		t.Fatalf("expected 3 active products, got %d", analytics.Freshness.ActiveProducts)
	}
	if analytics.Freshness.ColdStorageMentions != 1 || analytics.Freshness.AmbientStorageMentions != 1 {
		t.Fatalf("unexpected storage counts: %+v", analytics.Freshness)
	}
	if analytics.Fairness.FarmersWithListings != 2 {
		t.Fatalf("expected 2 farmers with listings, got %d", analytics.Fairness.FarmersWithListings)
	}
	if analytics.Config.TrustAlpha != 0.2 {
		t.Fatalf("expected trust alpha 0.2, got %v", analytics.Config.TrustAlpha)
	}
	if len(analytics.Recommendations) == 0 {
		t.Fatalf("expected at least one recommendation")
	}
}

func newAdminServiceTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite db: %v", err)
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.FarmerProfile{},
		&models.Product{},
		&models.Order{},
		&models.HarvestRequest{},
		&models.Review{},
		&models.OrderStatusLog{},
		&models.OrderMessage{},
		&models.DisputeEvidence{},
	); err != nil {
		t.Fatalf("failed to migrate db: %v", err)
	}

	return db
}

func TestAdminServiceUpdateUserVerificationAndStatus(t *testing.T) {
	db := newAdminServiceTestDB(t)

	admin := &models.User{
		Name:               "Admin",
		Email:              "admin@example.com",
		Phone:              "9000000091",
		Password:           "x",
		UserType:           "admin",
		IsActive:           true,
		VerificationStatus: "verified",
	}
	farmer := &models.User{
		Name:               "Farmer Pending",
		Email:              "farmer-pending@example.com",
		Phone:              "9000000092",
		Password:           "x",
		UserType:           "farmer",
		IsActive:           true,
		VerificationStatus: "pending",
	}
	for _, user := range []*models.User{admin, farmer} {
		if err := db.Create(user).Error; err != nil {
			t.Fatalf("failed to create user %s: %v", user.Email, err)
		}
	}
	if err := db.Create(&models.FarmerProfile{UserID: farmer.ID, FarmName: "Pending Farm"}).Error; err != nil {
		t.Fatalf("failed to create farmer profile: %v", err)
	}

	svc := NewAdminService(
		repository.NewUserRepository(db),
		repository.NewProductRepository(db),
		repository.NewOrderRepository(db),
	)

	verifiedFarmer, err := svc.UpdateUserVerification(farmer.ID, admin.ID, UpdateUserVerificationRequest{
		VerificationStatus: "verified",
		Note:               "Documents approved",
	})
	if err != nil {
		t.Fatalf("UpdateUserVerification returned error: %v", err)
	}
	if verifiedFarmer.VerificationStatus != "verified" {
		t.Fatalf("expected verified status, got %s", verifiedFarmer.VerificationStatus)
	}
	if !verifiedFarmer.IsActive {
		t.Fatalf("expected verified farmer to remain active")
	}

	suspendedFarmer, err := svc.UpdateUserStatus(farmer.ID, admin.ID, UpdateUserStatusRequest{
		IsActive: false,
		Note:     "Policy breach",
	})
	if err != nil {
		t.Fatalf("UpdateUserStatus returned error: %v", err)
	}
	if suspendedFarmer.IsActive {
		t.Fatalf("expected farmer to be suspended")
	}
	if suspendedFarmer.VerificationNote != "Policy breach" {
		t.Fatalf("expected suspension note to be stored, got %q", suspendedFarmer.VerificationNote)
	}
}

func TestAdminServiceUpdateProductModeration(t *testing.T) {
	db := newAdminServiceTestDB(t)

	admin := &models.User{
		Name:               "Admin",
		Email:              "admin2@example.com",
		Phone:              "9000000093",
		Password:           "x",
		UserType:           "admin",
		IsActive:           true,
		VerificationStatus: "verified",
	}
	farmer := &models.User{
		Name:               "Farmer",
		Email:              "farmer2@example.com",
		Phone:              "9000000094",
		Password:           "x",
		UserType:           "farmer",
		IsActive:           true,
		VerificationStatus: "verified",
	}
	for _, user := range []*models.User{admin, farmer} {
		if err := db.Create(user).Error; err != nil {
			t.Fatalf("failed to create user %s: %v", user.Email, err)
		}
	}
	product := &models.Product{
		FarmerID:     farmer.ID,
		CropName:     "Onion",
		Category:     "vegetables",
		Quantity:     12,
		Unit:         "kg",
		PricePerUnit: 45,
		Status:       "pending_review",
	}
	if err := db.Create(product).Error; err != nil {
		t.Fatalf("failed to create product: %v", err)
	}

	svc := NewAdminService(
		repository.NewUserRepository(db),
		repository.NewProductRepository(db),
		repository.NewOrderRepository(db),
	)

	approved, err := svc.UpdateProductModeration(product.ID, admin.ID, UpdateProductModerationRequest{
		Status: "active",
		Note:   "Approved for marketplace",
	})
	if err != nil {
		t.Fatalf("UpdateProductModeration returned error: %v", err)
	}
	if approved.Status != "active" {
		t.Fatalf("expected active status, got %s", approved.Status)
	}
	if approved.ModerationNote != "Approved for marketplace" {
		t.Fatalf("expected moderation note to be stored, got %q", approved.ModerationNote)
	}
}

func TestAdminServiceResolveReportLifecycle(t *testing.T) {
	db := newAdminServiceTestDB(t)

	admin := &models.User{
		Name:               "Admin",
		Email:              "admin3@example.com",
		Phone:              "9000000095",
		Password:           "x",
		UserType:           "admin",
		IsActive:           true,
		VerificationStatus: "verified",
	}
	buyer := &models.User{
		Name:               "Buyer",
		Email:              "buyer2@example.com",
		Phone:              "9000000096",
		Password:           "x",
		UserType:           "buyer",
		IsActive:           true,
		VerificationStatus: "verified",
	}
	farmer := &models.User{
		Name:               "Farmer",
		Email:              "farmer3@example.com",
		Phone:              "9000000097",
		Password:           "x",
		UserType:           "farmer",
		IsActive:           true,
		VerificationStatus: "verified",
	}
	for _, user := range []*models.User{admin, buyer, farmer} {
		if err := db.Create(user).Error; err != nil {
			t.Fatalf("failed to create user %s: %v", user.Email, err)
		}
	}
	product := &models.Product{
		FarmerID:     farmer.ID,
		CropName:     "Rice",
		Category:     "grains",
		Quantity:     5,
		Unit:         "kg",
		PricePerUnit: 80,
		Status:       "active",
	}
	if err := db.Create(product).Error; err != nil {
		t.Fatalf("failed to create product: %v", err)
	}
	order := &models.Order{
		ProductID:         product.ID,
		BuyerID:           buyer.ID,
		FarmerID:          farmer.ID,
		Quantity:          2,
		TotalPrice:        160,
		Status:            "completed",
		DisputeStatus:     "open",
		AdminReviewStatus: "open",
	}
	if err := db.Create(order).Error; err != nil {
		t.Fatalf("failed to create order: %v", err)
	}

	svc := NewAdminService(
		repository.NewUserRepository(db),
		repository.NewProductRepository(db),
		repository.NewOrderRepository(db),
	)

	resolved, err := svc.ResolveReport(order.ID, admin.ID, ResolveReportRequest{
		Action: "resolve",
		Note:   "Resolved after review",
	})
	if err != nil {
		t.Fatalf("ResolveReport(resolve) returned error: %v", err)
	}
	if resolved.ResolutionState != "Closed" {
		t.Fatalf("expected closed resolution state, got %s", resolved.ResolutionState)
	}

	reopened, err := svc.ResolveReport(order.ID, admin.ID, ResolveReportRequest{
		Action: "reopen",
		Note:   "",
	})
	if err != nil {
		t.Fatalf("ResolveReport(reopen) returned error: %v", err)
	}
	if reopened.AdminReviewStatus != "open" {
		t.Fatalf("expected admin review to reopen, got %s", reopened.AdminReviewStatus)
	}
	if reopened.DisputeStatus != "open" {
		t.Fatalf("expected dispute to reopen, got %s", reopened.DisputeStatus)
	}
}

func TestAdminServiceHarvestVisibilityAndBulkMetrics(t *testing.T) {
	db := newAdminServiceTestDB(t)

	buyer := &models.User{Name: "Buyer", Email: "buyer3@example.com", Phone: "9000000098", Password: "x", UserType: "buyer", IsActive: true, VerificationStatus: "verified"}
	farmer := &models.User{Name: "Farmer", Email: "farmer4@example.com", Phone: "9000000099", Password: "x", UserType: "farmer", IsActive: true, VerificationStatus: "verified"}
	for _, user := range []*models.User{buyer, farmer} {
		if err := db.Create(user).Error; err != nil {
			t.Fatalf("failed to create user %s: %v", user.Email, err)
		}
	}
	product := &models.Product{
		FarmerID:               farmer.ID,
		CropName:               "Tomato",
		Category:               "vegetables",
		Quantity:               25,
		Unit:                   "kg",
		PricePerUnit:           30,
		Status:                 "active",
		IsBulkAvailable:        true,
		MinimumBulkQuantity:    10,
		SupportsHarvestRequest: true,
	}
	if err := db.Create(product).Error; err != nil {
		t.Fatalf("failed to create product: %v", err)
	}
	order := &models.Order{
		ProductID:  product.ID,
		BuyerID:    buyer.ID,
		FarmerID:   farmer.ID,
		Quantity:   12,
		TotalPrice: 360,
		OrderType:  "bulk",
		Status:     "completed",
	}
	if err := db.Create(order).Error; err != nil {
		t.Fatalf("failed to create order: %v", err)
	}
	requestItem := &models.HarvestRequest{
		ProductID:            product.ID,
		BuyerID:              buyer.ID,
		FarmerID:             farmer.ID,
		RequestedQuantity:    15,
		PreferredHarvestDate: time.Now().UTC().AddDate(0, 0, 5),
		Status:               "ready",
	}
	if err := db.Create(requestItem).Error; err != nil {
		t.Fatalf("failed to create harvest request: %v", err)
	}

	svc := NewAdminService(
		repository.NewUserRepository(db),
		repository.NewProductRepository(db),
		repository.NewOrderRepository(db),
	)

	stats, err := svc.GetOverview()
	if err != nil {
		t.Fatalf("GetOverview returned error: %v", err)
	}
	if stats.BulkOrderCount != 1 {
		t.Fatalf("expected 1 bulk order, got %d", stats.BulkOrderCount)
	}
	if stats.HarvestReadyCount != 1 {
		t.Fatalf("expected 1 ready harvest request, got %d", stats.HarvestReadyCount)
	}

	items, err := svc.GetHarvestRequests()
	if err != nil {
		t.Fatalf("GetHarvestRequests returned error: %v", err)
	}
	if len(items) != 1 {
		t.Fatalf("expected 1 harvest request, got %d", len(items))
	}
	if items[0].Status != "ready" {
		t.Fatalf("expected ready harvest request status, got %s", items[0].Status)
	}
}
