package handlers

import (
	"fmt"
	"math"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/f2b-portal/backend/internal/models"
	"github.com/f2b-portal/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type ProductHandler struct {
	productService *service.ProductService
}

const (
	defaultTrustPriceAlpha        = 0.15
	defaultFreshnessWeightHarvest = 0.5
	defaultFreshnessWeightDist    = 0.3
	defaultFreshnessWeightStorage = 0.2
	defaultRankingWeightRel       = 0.40
	defaultRankingWeightPrice     = 0.25
	defaultRankingWeightEquity    = 0.35
)
const (
	rankingWeightRelevance = defaultRankingWeightRel
	rankingWeightPrice     = defaultRankingWeightPrice
	rankingWeightEquity    = defaultRankingWeightEquity
)

type rankingMeta struct {
	RelevanceScore   float64
	PriceFactor      float64
	FarmerEquity     float64
	FinalRanking     float64
	RankingExplain   string
}

func getEnvFloat(key string, fallback float64) float64 {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}
	parsed, err := strconv.ParseFloat(raw, 64)
	if err != nil || math.IsNaN(parsed) || math.IsInf(parsed, 0) {
		return fallback
	}
	return parsed
}

func getTrustPriceAlpha() float64 {
	alpha := getEnvFloat("NOVELTY_TRUST_ALPHA", defaultTrustPriceAlpha)
	return clamp(alpha, 0, 1)
}

func getFreshnessWeights() (float64, float64, float64) {
	harvest := getEnvFloat("NOVELTY_FS_WEIGHT_HARVEST", defaultFreshnessWeightHarvest)
	distance := getEnvFloat("NOVELTY_FS_WEIGHT_DISTANCE", defaultFreshnessWeightDist)
	storage := getEnvFloat("NOVELTY_FS_WEIGHT_STORAGE", defaultFreshnessWeightStorage)
	total := harvest + distance + storage
	if total <= 0 {
		return defaultFreshnessWeightHarvest, defaultFreshnessWeightDist, defaultFreshnessWeightStorage
	}
	return harvest / total, distance / total, storage / total
}

func getRankingWeights() (float64, float64, float64) {
	relevance := getEnvFloat("NOVELTY_RANK_WEIGHT_RELEVANCE", defaultRankingWeightRel)
	price := getEnvFloat("NOVELTY_RANK_WEIGHT_PRICE", defaultRankingWeightPrice)
	equity := getEnvFloat("NOVELTY_RANK_WEIGHT_EQUITY", defaultRankingWeightEquity)
	total := relevance + price + equity
	if total <= 0 {
		return defaultRankingWeightRel, defaultRankingWeightPrice, defaultRankingWeightEquity
	}
	return relevance / total, price / total, equity / total
}

func NewProductHandler(productService *service.ProductService) *ProductHandler {
	return &ProductHandler{productService: productService}
}

func clamp(value, min, max float64) float64 {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}

func normalizeTrustScoreForPricing(raw float64) float64 {
	// Existing trust score in DB is 0..1. Convert to novelty model range -1..1.
	if raw >= 0 && raw <= 1 {
		return clamp((raw*2.0)-1.0, -1, 1)
	}
	return clamp(raw, -1, 1)
}

func roundToTwo(value float64) float64 {
	return math.Round(value*100) / 100
}

func buildTrustAwareProduct(product models.Product, rank *rankingMeta) gin.H {
	basePrice := product.PricePerUnit
	trustPriceAlpha := getTrustPriceAlpha()
	rawTrust := 0.0
	if product.Farmer.FarmerProfile != nil {
		rawTrust = product.Farmer.FarmerProfile.TrustScore
	}
	trustScore := normalizeTrustScoreForPricing(rawTrust)
	displayPrice := basePrice * (1 + (trustPriceAlpha * trustScore))
	if displayPrice < 0 {
		displayPrice = 0
	}

	harvestComponent, hoursSinceHarvest := calculateHarvestFreshness(product)
	distanceComponent := calculateDistanceFreshness(product)
	storageType, storageComponent := inferStorageTypeAndFreshness(product)
	freshnessWeightHarvest, freshnessWeightDistance, freshnessWeightStorage := getFreshnessWeights()
	freshnessScore := roundToTwo(
		(freshnessWeightHarvest * harvestComponent) +
			(freshnessWeightDistance * distanceComponent) +
			(freshnessWeightStorage * storageComponent),
	)
	freshnessLabel := freshnessBandFromScore(freshnessScore)

	item := gin.H{
		"id":                product.ID,
		"farmer_id":         product.FarmerID,
		"farmer":            product.Farmer,
		"crop_name":         product.CropName,
		"category":          product.Category,
		"quantity":          product.Quantity,
		"unit":              product.Unit,
		"price_per_unit":    basePrice,
		"base_price":        roundToTwo(basePrice),
		"trust_score":       roundToTwo(trustScore),
		"price_alpha":       trustPriceAlpha,
		"display_price":     roundToTwo(displayPrice),
		"price_explanation": fmt.Sprintf("Base INR %.2f adjusted by trust score %.2f (alpha %.2f).", basePrice, trustScore, trustPriceAlpha),
		"freshness_score":   freshnessScore,
		"freshness_label":   freshnessLabel,
		"storage_type":      storageType,
		"freshness_explanation": fmt.Sprintf(
			"FS = 0.5*Harvest(%.2f) + 0.3*Distance(%.2f) + 0.2*Storage(%.2f), %.1f hours since harvest/listing.",
			harvestComponent,
			distanceComponent,
			storageComponent,
			hoursSinceHarvest,
		),
		"description":       product.Description,
		"city":              product.City,
		"state":             product.State,
		"image_url":         product.ImageURL,
		"status":            product.Status,
		"is_bulk_available": product.IsBulkAvailable,
		"minimum_bulk_quantity": product.MinimumBulkQuantity,
		"supports_harvest_request": product.SupportsHarvestRequest,
		"harvest_lead_days": product.HarvestLeadDays,
		"created_at":        product.CreatedAt,
		"updated_at":        product.UpdatedAt,
	}

	if rank != nil {
		item["relevance_score"] = roundToTwo(rank.RelevanceScore)
		item["price_factor"] = roundToTwo(rank.PriceFactor)
		item["farmer_equity_score"] = roundToTwo(rank.FarmerEquity)
		item["final_ranking_score"] = roundToTwo(rank.FinalRanking)
		item["ranking_explanation"] = rank.RankingExplain
	}

	return item
}

func relevanceScore(product models.Product, query, category string) float64 {
	q := strings.ToLower(strings.TrimSpace(query))
	cat := strings.ToLower(strings.TrimSpace(category))

	score := 0.70
	if q != "" {
		crop := strings.ToLower(product.CropName)
		desc := strings.ToLower(product.Description)
		switch {
		case crop == q:
			score = 1.0
		case strings.HasPrefix(crop, q):
			score = 0.9
		case strings.Contains(crop, q):
			score = 0.8
		case strings.Contains(desc, q):
			score = 0.7
		default:
			score = 0.4
		}
	}

	if cat != "" && strings.EqualFold(strings.TrimSpace(product.Category), cat) {
		score += 0.1
	}
	return clamp(score, 0, 1)
}

func farmSizeEquityScore(acres float64) float64 {
	switch {
	case acres <= 0:
		return 0.7
	case acres <= 2:
		return 1.0
	case acres <= 5:
		return 0.85
	case acres <= 10:
		return 0.7
	case acres <= 20:
		return 0.55
	default:
		return 0.4
	}
}

func sellerExperienceEquityScore(createdAt time.Time) float64 {
	days := time.Since(createdAt).Hours() / 24.0
	switch {
	case days <= 90:
		return 1.0
	case days <= 365:
		return 0.8
	case days <= 730:
		return 0.65
	default:
		return 0.5
	}
}

func regionalRepresentationScore(product models.Product, stateCounts map[string]int, maxStateCount int) float64 {
	if maxStateCount <= 1 {
		return 1.0
	}
	state := strings.ToLower(strings.TrimSpace(product.State))
	count := stateCounts[state]
	if count <= 0 {
		count = 1
	}
	score := 1.0 - (float64(count-1) / float64(maxStateCount-1))
	return clamp(score, 0.2, 1.0)
}

func fairnessRankProducts(products []models.Product, query, category string) ([]models.Product, map[uint]rankingMeta) {
	if len(products) == 0 {
		return products, map[uint]rankingMeta{}
	}

	minPrice := products[0].PricePerUnit
	maxPrice := products[0].PricePerUnit
	stateCounts := make(map[string]int)
	maxStateCount := 0
	for _, p := range products {
		if p.PricePerUnit < minPrice {
			minPrice = p.PricePerUnit
		}
		if p.PricePerUnit > maxPrice {
			maxPrice = p.PricePerUnit
		}

		state := strings.ToLower(strings.TrimSpace(p.State))
		if state == "" {
			state = "unknown"
		}
		stateCounts[state]++
		if stateCounts[state] > maxStateCount {
			maxStateCount = stateCounts[state]
		}
	}

	type ranked struct {
		product models.Product
		meta    rankingMeta
	}
	rankedItems := make([]ranked, 0, len(products))
	weightRelevance, weightPrice, weightEquity := getRankingWeights()
	for _, p := range products {
		relevance := relevanceScore(p, query, category)

		priceFactor := 0.7
		if maxPrice > minPrice {
			priceFactor = 1.0 - ((p.PricePerUnit - minPrice) / (maxPrice - minPrice))
		}
		priceFactor = clamp(priceFactor, 0, 1)

		farmSize := 0.0
		if p.Farmer.FarmerProfile != nil {
			farmSize = p.Farmer.FarmerProfile.FarmSizeAcres
		}
		farmSizeScore := farmSizeEquityScore(farmSize)
		experienceScore := sellerExperienceEquityScore(p.Farmer.CreatedAt)
		regionScore := regionalRepresentationScore(p, stateCounts, maxStateCount)
		equity := clamp((0.45*farmSizeScore)+(0.35*experienceScore)+(0.20*regionScore), 0, 1)

		finalScore := clamp(
			(weightRelevance * relevance) +
				(weightPrice * priceFactor) +
				(weightEquity * equity),
			0,
			1,
		)

		rankedItems = append(rankedItems, ranked{
			product: p,
			meta: rankingMeta{
				RelevanceScore: relevance,
				PriceFactor:    priceFactor,
				FarmerEquity:   equity,
				FinalRanking:   finalScore,
				RankingExplain: fmt.Sprintf(
					"R=%.2f*%.2f + P=%.2f*%.2f + E=%.2f*%.2f",
					weightRelevance, relevance,
					weightPrice, priceFactor,
					weightEquity, equity,
				),
			},
		})
	}

	sort.SliceStable(rankedItems, func(i, j int) bool {
		return rankedItems[i].meta.FinalRanking > rankedItems[j].meta.FinalRanking
	})

	sorted := make([]models.Product, 0, len(rankedItems))
	metas := make(map[uint]rankingMeta, len(rankedItems))
	for _, item := range rankedItems {
		sorted = append(sorted, item.product)
		metas[item.product.ID] = item.meta
	}
	return sorted, metas
}

func calculateHarvestFreshness(product models.Product) (float64, float64) {
	referenceTime := product.CreatedAt
	ageHours := time.Since(referenceTime).Hours()
	ageDays := ageHours / 24.0

	switch {
	case ageDays <= 1:
		return 1.0, ageHours
	case ageDays <= 2:
		return 0.9, ageHours
	case ageDays <= 4:
		return 0.75, ageHours
	case ageDays <= 7:
		return 0.6, ageHours
	case ageDays <= 10:
		return 0.45, ageHours
	default:
		return 0.3, ageHours
	}
}

func calculateDistanceFreshness(product models.Product) float64 {
	productCity := strings.ToLower(strings.TrimSpace(product.City))
	productState := strings.ToLower(strings.TrimSpace(product.State))
	farmerCity := strings.ToLower(strings.TrimSpace(product.Farmer.City))
	farmerState := strings.ToLower(strings.TrimSpace(product.Farmer.State))

	if productCity == "" && productState == "" {
		return 0.6
	}
	if productCity != "" && farmerCity != "" && productCity == farmerCity {
		return 1.0
	}
	if productState != "" && farmerState != "" && productState == farmerState {
		return 0.75
	}
	return 0.45
}

func inferStorageTypeAndFreshness(product models.Product) (string, float64) {
	description := strings.ToLower(product.Description)
	switch {
	case strings.Contains(description, "cold storage"),
		strings.Contains(description, "cold-chain"),
		strings.Contains(description, "refrigerated"),
		strings.Contains(description, "chiller"):
		return "cold_storage", 1.0
	case strings.Contains(description, "ambient"),
		strings.Contains(description, "room temperature"):
		return "ambient", 0.6
	default:
		return "standard", 0.7
	}
}

func freshnessBandFromScore(score float64) string {
	switch {
	case score >= 0.8:
		return "Very Fresh"
	case score >= 0.5:
		return "Fresh"
	default:
		return "Aged"
	}
}

func (h *ProductHandler) CreateProduct(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)

	var req service.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	product, err := h.productService.CreateProduct(userIDUint, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Product created successfully",
		"product": product,
	})
}

func (h *ProductHandler) GetProduct(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	product, err := h.productService.GetProductByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"product": buildTrustAwareProduct(*product, nil)})
}

func (h *ProductHandler) GetAllProducts(c *gin.Context) {
	// Parse query parameters
	filters := make(map[string]interface{})

	if cropName := c.Query("crop_name"); cropName != "" {
		filters["crop_name"] = cropName
	}
	if city := c.Query("city"); city != "" {
		filters["city"] = city
	}
	if state := c.Query("state"); state != "" {
		filters["state"] = state
	}
	if category := c.Query("category"); category != "" {
		filters["category"] = category
	}
	if minPriceStr := c.Query("min_price"); minPriceStr != "" {
		if minPrice, err := strconv.ParseFloat(minPriceStr, 64); err == nil {
			filters["min_price"] = minPrice
		}
	}
	if maxPriceStr := c.Query("max_price"); maxPriceStr != "" {
		if maxPrice, err := strconv.ParseFloat(maxPriceStr, 64); err == nil {
			filters["max_price"] = maxPrice
		}
	}
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}
	if farmerIDStr := c.Query("farmer_id"); farmerIDStr != "" {
		if farmerID, err := strconv.ParseUint(farmerIDStr, 10, 32); err == nil && farmerID > 0 {
			filters["farmer_id"] = uint(farmerID)
		}
	}
	if sortBy := c.Query("sort_by"); sortBy != "" {
		filters["sort_by"] = sortBy
	}
	rankingMode := strings.ToLower(strings.TrimSpace(c.DefaultQuery("ranking_mode", "none")))

	page := 1
	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	limit := 20
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	products, total, totalPages, err := h.productService.GetAllProducts(filters, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}

	var rankingByID map[uint]rankingMeta
	if rankingMode == "fairness" {
		products, rankingByID = fairnessRankProducts(products, c.Query("crop_name"), c.Query("category"))
	}

	items := make([]gin.H, 0, len(products))
	for _, product := range products {
		var rank *rankingMeta
		if rankingByID != nil {
			if m, ok := rankingByID[product.ID]; ok {
				mCopy := m
				rank = &mCopy
			}
		}
		items = append(items, buildTrustAwareProduct(product, rank))
	}

	c.JSON(http.StatusOK, gin.H{
		"items":       items,
		"total":       total,
		"page":        page,
		"per_page":    limit,
		"total_pages": totalPages,
	})
}

func (h *ProductHandler) GetMyProducts(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)

	products, err := h.productService.GetProductsByFarmer(userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"products": products})
}

func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req service.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	product, err := h.productService.UpdateProduct(uint(id), userIDUint, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Product updated successfully",
		"product": product,
	})
}

func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	if err := h.productService.DeleteProduct(uint(id), userIDUint); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}

func (h *ProductHandler) SearchProducts(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	limit := 20
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	products, err := h.productService.SearchProducts(query, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search products"})
		return
	}

	rankingMode := strings.ToLower(strings.TrimSpace(c.DefaultQuery("ranking_mode", "fairness")))
	var rankingByID map[uint]rankingMeta
	if rankingMode == "fairness" {
		products, rankingByID = fairnessRankProducts(products, query, "")
	}

	items := make([]gin.H, 0, len(products))
	for _, product := range products {
		var rank *rankingMeta
		if rankingByID != nil {
			if m, ok := rankingByID[product.ID]; ok {
				mCopy := m
				rank = &mCopy
			}
		}
		items = append(items, buildTrustAwareProduct(product, rank))
	}

	c.JSON(http.StatusOK, gin.H{"products": items})
}

func (h *ProductHandler) UpdateProductStatus(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req service.UpdateProductStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	product, err := h.productService.UpdateProductStatus(uint(id), userIDUint, req.Status)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Product status updated successfully",
		"product": product,
	})
}

func (h *ProductHandler) BulkUpdateProductStatus(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)

	var req service.BulkUpdateProductStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.productService.BulkUpdateProductStatus(userIDUint, req.ProductIDs, req.Status); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Products updated successfully",
	})
}

func (h *ProductHandler) UpdateProductPrice(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req service.UpdateProductPriceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	product, err := h.productService.UpdateProductPrice(uint(id), userIDUint, req.PricePerUnit)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Product price updated successfully",
		"product": product,
	})
}

func (h *ProductHandler) DuplicateProduct(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	product, err := h.productService.DuplicateProduct(uint(id), userIDUint)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Product duplicated successfully",
		"product": product,
	})
}

func (h *ProductHandler) GetProductPriceHistory(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	history, err := h.productService.GetProductPriceHistory(uint(id), userIDUint)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"history": history})
}
