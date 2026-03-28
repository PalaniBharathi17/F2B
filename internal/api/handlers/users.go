package handlers

import (
	"net/http"
	"strconv"

	"github.com/f2b-portal/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	trustScoreService *service.TrustScoreService
	userPortalService *service.UserPortalService
}

func NewUserHandler(trustScoreService *service.TrustScoreService, userPortalService *service.UserPortalService) *UserHandler {
	return &UserHandler{trustScoreService: trustScoreService, userPortalService: userPortalService}
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

func (h *UserHandler) GetMyAddresses(c *gin.Context) {
	userID, _ := c.Get("user_id")
	items, err := h.userPortalService.GetAddresses(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load addresses"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *UserHandler) SaveAddress(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req service.SaveAddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item, err := h.userPortalService.SaveAddress(userID.(uint), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"address": item})
}

func (h *UserHandler) DeleteAddress(c *gin.Context) {
	userID, _ := c.Get("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid address id"})
		return
	}
	if err := h.userPortalService.DeleteAddress(userID.(uint), uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "address deleted"})
}

func (h *UserHandler) GetFavorites(c *gin.Context) {
	userID, _ := c.Get("user_id")
	items, err := h.userPortalService.ListFavorites(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load favorites"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *UserHandler) ToggleFavorite(c *gin.Context) {
	userID, _ := c.Get("user_id")
	id, err := strconv.ParseUint(c.Param("product_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}
	active, err := h.userPortalService.ToggleFavorite(userID.(uint), uint(id))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"active": active})
}

func (h *UserHandler) UploadVerificationDocument(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req service.UploadVerificationDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item, err := h.userPortalService.UploadVerificationDocument(userID.(uint), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"document": item})
}

func (h *UserHandler) GetMyVerificationDocuments(c *gin.Context) {
	userID, _ := c.Get("user_id")
	items, err := h.userPortalService.GetVerificationDocuments(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load documents"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *UserHandler) GetAllVerificationDocuments(c *gin.Context) {
	items, err := h.userPortalService.ListAllVerificationDocuments()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load documents"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *UserHandler) ReviewVerificationDocument(c *gin.Context) {
	adminID, _ := c.Get("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid document id"})
		return
	}
	var req service.ReviewVerificationDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item, err := h.userPortalService.ReviewVerificationDocument(uint(id), adminID.(uint), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"document": item})
}
