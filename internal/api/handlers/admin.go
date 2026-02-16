package handlers

import (
	"net/http"

	"github.com/f2b-portal/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	adminService *service.AdminService
}

func NewAdminHandler(adminService *service.AdminService) *AdminHandler {
	return &AdminHandler{adminService: adminService}
}

func (h *AdminHandler) GetOverview(c *gin.Context) {
	stats, err := h.adminService.GetOverview()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch overview"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

func (h *AdminHandler) GetUsers(c *gin.Context) {
	users, err := h.adminService.GetUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": users})
}

func (h *AdminHandler) GetProducts(c *gin.Context) {
	products, err := h.adminService.GetProducts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": products})
}

func (h *AdminHandler) GetTransactions(c *gin.Context) {
	orders, err := h.adminService.GetTransactions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transactions"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": orders})
}

func (h *AdminHandler) GetReports(c *gin.Context) {
	items, err := h.adminService.GetReports()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reports"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

