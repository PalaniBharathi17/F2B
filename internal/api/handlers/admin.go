package handlers

import (
	"net/http"
	"strconv"

	"github.com/f2b-portal/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	adminService *service.AdminService
}

type AdminReportActionRequest struct {
	ReportID uint   `json:"report_id" binding:"required"`
	Action   string `json:"action" binding:"required"`
	Note     string `json:"note"`
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

func (h *AdminHandler) GetHarvestRequests(c *gin.Context) {
	items, err := h.adminService.GetHarvestRequests()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch harvest requests"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *AdminHandler) UpdateUserStatus(c *gin.Context) {
	adminID, _ := c.Get("user_id")
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req service.UpdateUserStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.adminService.UpdateUserStatus(uint(userID), adminID.(uint), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": user})
}

func (h *AdminHandler) UpdateUserVerification(c *gin.Context) {
	adminID, _ := c.Get("user_id")
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req service.UpdateUserVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.adminService.UpdateUserVerification(uint(userID), adminID.(uint), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": user})
}

func (h *AdminHandler) UpdateProductModeration(c *gin.Context) {
	adminID, _ := c.Get("user_id")
	productID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req service.UpdateProductModerationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	product, err := h.adminService.UpdateProductModeration(uint(productID), adminID.(uint), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"product": product})
}

func (h *AdminHandler) GetReports(c *gin.Context) {
	items, err := h.adminService.GetReports()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reports"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *AdminHandler) GetNoveltyAnalytics(c *gin.Context) {
	analytics, err := h.adminService.GetNoveltyAnalytics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch novelty analytics"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"analytics": analytics})
}

func (h *AdminHandler) ResolveReport(c *gin.Context) {
	adminID, _ := c.Get("user_id")
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid report ID"})
		return
	}

	var req service.ResolveReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	report, err := h.adminService.ResolveReport(uint(orderID), adminID.(uint), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"report": report})
}

func (h *AdminHandler) ResolveReportAction(c *gin.Context) {
	adminID, _ := c.Get("user_id")

	var req AdminReportActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	report, err := h.adminService.ResolveReport(req.ReportID, adminID.(uint), service.ResolveReportRequest{
		Action: req.Action,
		Note:   req.Note,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"report": report})
}

func (h *AdminHandler) ExportTransactionsCSV(c *gin.Context) {
	payload, err := h.adminService.ExportTransactionsCSV()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to export transactions"})
		return
	}

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=admin_transactions.csv")
	c.String(http.StatusOK, payload)
}

func (h *AdminHandler) GetTransactionInvoice(c *gin.Context) {
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	invoice, err := h.adminService.GetTransactionInvoice(uint(orderID))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"invoice": invoice})
}
