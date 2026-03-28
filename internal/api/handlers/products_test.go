package handlers

import (
	"testing"
	"time"

	"github.com/f2b-portal/backend/internal/models"
)

func TestFairnessRankProductsPrefersEquityWhenPricesMatch(t *testing.T) {
	now := time.Now()
	products := []models.Product{
		{
			ID:           1,
			FarmerID:     101,
			CropName:     "Tomato",
			Category:     "vegetable",
			PricePerUnit: 40,
			State:        "Tamil Nadu",
			Farmer: models.User{
				CreatedAt: now.Add(-30 * 24 * time.Hour),
				FarmerProfile: &models.FarmerProfile{
					FarmSizeAcres: 1.5,
				},
			},
		},
		{
			ID:           2,
			FarmerID:     102,
			CropName:     "Tomato",
			Category:     "vegetable",
			PricePerUnit: 40,
			State:        "Tamil Nadu",
			Farmer: models.User{
				CreatedAt: now.Add(-4 * 365 * 24 * time.Hour),
				FarmerProfile: &models.FarmerProfile{
					FarmSizeAcres: 25,
				},
			},
		},
	}

	sorted, meta := fairnessRankProducts(products, "tomato", "vegetable")
	if len(sorted) != 2 {
		t.Fatalf("expected 2 products, got %d", len(sorted))
	}
	if sorted[0].ID != 1 {
		t.Fatalf("expected higher-equity farmer first, got product %d", sorted[0].ID)
	}
	if meta[1].FinalRanking <= meta[2].FinalRanking {
		t.Fatalf("expected product 1 to have higher ranking: %#v", meta)
	}
}

func TestBuildTrustAwareProductIncludesRankingAndPricingFields(t *testing.T) {
	t.Setenv("NOVELTY_TRUST_ALPHA", "0.2")
	product := models.Product{
		ID:           10,
		FarmerID:     77,
		CropName:     "Grapes",
		Category:     "fruit",
		Quantity:     12,
		Unit:         "kg",
		PricePerUnit: 100,
		Description:  "cold storage premium batch",
		City:         "Nashik",
		State:        "Maharashtra",
		Status:       "active",
		CreatedAt:    time.Now().Add(-4 * time.Hour),
		Farmer: models.User{
			City:  "Nashik",
			State: "Maharashtra",
			FarmerProfile: &models.FarmerProfile{
				TrustScore: 1.0,
			},
		},
	}

	item := buildTrustAwareProduct(product, &rankingMeta{
		RelevanceScore: 0.9,
		PriceFactor:    0.8,
		FarmerEquity:   0.7,
		FinalRanking:   0.82,
		RankingExplain: "test explain",
	})

	if item["display_price"].(float64) != 120 {
		t.Fatalf("expected trust-adjusted display price 120, got %v", item["display_price"])
	}
	if item["freshness_label"].(string) != "Very Fresh" {
		t.Fatalf("expected freshness label Very Fresh, got %v", item["freshness_label"])
	}
	if item["final_ranking_score"].(float64) != 0.82 {
		t.Fatalf("expected final ranking score 0.82, got %v", item["final_ranking_score"])
	}
	if item["storage_type"].(string) != "cold_storage" {
		t.Fatalf("expected cold storage, got %v", item["storage_type"])
	}
}
