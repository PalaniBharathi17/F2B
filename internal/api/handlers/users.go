package handlers

import (
	"net/http"
	"strconv"

	"github.com/f2b-portal/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	trustScoreService *service.TrustScoreService
}

func NewUserHandler(trustScoreService *service.TrustScoreService) *UserHandler {
	return &UserHandler{trustScoreService: trustScoreService}
}

func (h *UserHandler) GetTrustScore(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid farmer ID"})
		return
	}

	profile, err := h.trustScoreService.GetFarmerWithTrust(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Farmer profile not found"})
		return
	}

	trustScore, badge, err := h.trustScoreService.CalculateTrustScore(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate trust score"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"farmer_id":       profile.UserID,
		"trust_score":     trustScore,
		"badge":           badge,
		"total_orders":    profile.TotalOrders,
		"completed_orders": profile.CompletedOrders,
		"average_rating":  profile.RatingAverage,
	})
}

func (h *UserHandler) GetFarmers(c *gin.Context) {
	farmers, err := h.trustScoreService.ListFarmers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch farmers"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"items": farmers})
}
