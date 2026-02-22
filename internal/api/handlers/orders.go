package handlers

import (
	"net/http"
	"strconv"

	"github.com/f2b-portal/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	orderService *service.OrderService
}

type disputeActionRequest struct {
	Note string `json:"note"`
}

type submitReviewRequest struct {
	Rating  int    `json:"rating"`
	Comment string `json:"comment"`
}

func parsePageLimit(c *gin.Context) (int, int) {
	page := 1
	limit := 20

	if pageStr := c.Query("page"); pageStr != "" {
		if parsed, err := strconv.Atoi(pageStr); err == nil && parsed > 0 {
			page = parsed
		}
	}
	if limitStr := c.Query("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if limit > 100 {
		limit = 100
	}
	return page, limit
}

func NewOrderHandler(orderService *service.OrderService) *OrderHandler {
	return &OrderHandler{orderService: orderService}
}

func (h *OrderHandler) CreateOrder(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)

	var req service.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	order, err := h.orderService.CreateOrder(userIDUint, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Order created successfully",
		"order":   order,
	})
}

func (h *OrderHandler) GetOrder(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	order, err := h.orderService.GetOrderByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}
	if order.BuyerID != userIDUint && order.FarmerID != userIDUint {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized access to order"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"order": order})
}

func (h *OrderHandler) GetMyOrders(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)

	orders, err := h.orderService.GetOrdersByBuyer(userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"orders": orders})
}

func (h *OrderHandler) GetFarmerOrders(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)

	orders, err := h.orderService.GetOrdersByFarmer(userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"orders": orders})
}

func (h *OrderHandler) UpdateOrderStatus(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var req service.UpdateOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	order, err := h.orderService.UpdateOrderStatusWithDetails(uint(id), userIDUint, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Order status updated successfully",
		"order":   order,
	})
}

func (h *OrderHandler) CancelOrder(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	if err := h.orderService.CancelOrder(uint(id), userIDUint); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order cancelled successfully"})
}

func (h *OrderHandler) GetFarmerPayoutSummary(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)

	summary, err := h.orderService.GetFarmerPayoutSummary(userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"summary": summary})
}

func (h *OrderHandler) GetFarmerInvoice(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	invoice, err := h.orderService.GetFarmerInvoice(uint(id), userIDUint)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"invoice": invoice})
}

func (h *OrderHandler) GetFarmerAnalytics(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)

	summary, err := h.orderService.GetFarmerAnalytics(userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"summary": summary})
}

func (h *OrderHandler) GetFarmerNotifications(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)

	items, err := h.orderService.GetFarmerNotifications(userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *OrderHandler) GetOrderStatusHistory(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	page, limit := parsePageLimit(c)
	logs, total, err := h.orderService.GetOrderStatusHistoryPaginated(uint(id), userIDUint, page, limit)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"logs":        logs,
		"total":       total,
		"page":        page,
		"per_page":    limit,
		"total_pages": int((total + int64(limit) - 1) / int64(limit)),
	})
}

func (h *OrderHandler) GetFarmerReviews(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)

	page, limit := parsePageLimit(c)
	items, total, err := h.orderService.GetFarmerReviewsPaginated(userIDUint, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"items":       items,
		"total":       total,
		"page":        page,
		"per_page":    limit,
		"total_pages": int((total + int64(limit) - 1) / int64(limit)),
	})
}

func (h *OrderHandler) GetFarmerDisputes(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)

	page, limit := parsePageLimit(c)
	orders, total, err := h.orderService.GetFarmerDisputesPaginated(userIDUint, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"orders":      orders,
		"total":       total,
		"page":        page,
		"per_page":    limit,
		"total_pages": int((total + int64(limit) - 1) / int64(limit)),
	})
}

func (h *OrderHandler) OpenDispute(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var req disputeActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	order, err := h.orderService.OpenDispute(uint(id), userIDUint, req.Note)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Dispute opened successfully", "order": order})
}

func (h *OrderHandler) ResolveDispute(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var req disputeActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	order, err := h.orderService.ResolveDispute(uint(id), userIDUint, req.Note)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Dispute resolved successfully", "order": order})
}

func (h *OrderHandler) RejectDispute(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var req disputeActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	order, err := h.orderService.RejectDispute(uint(id), userIDUint, req.Note)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Dispute rejected successfully", "order": order})
}

func (h *OrderHandler) SubmitBuyerReview(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var req submitReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	review, err := h.orderService.SubmitBuyerReview(uint(id), userIDUint, service.SubmitReviewRequest{
		Rating:  req.Rating,
		Comment: req.Comment,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Review submitted successfully", "review": review})
}

func (h *OrderHandler) GetBuyerReviews(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)
	page, limit := parsePageLimit(c)

	items, total, err := h.orderService.GetBuyerReviewsPaginated(userIDUint, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"items":       items,
		"total":       total,
		"page":        page,
		"per_page":    limit,
		"total_pages": int((total + int64(limit) - 1) / int64(limit)),
	})
}

func (h *OrderHandler) GetBuyerNotifications(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)

	items, err := h.orderService.GetBuyerNotifications(userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *OrderHandler) GetFarmerWeeklySummary(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)

	summary, err := h.orderService.GetFarmerPeriodSummary(userIDUint, "weekly")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"summary": summary})
}

func (h *OrderHandler) GetFarmerMonthlySummary(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)

	summary, err := h.orderService.GetFarmerPeriodSummary(userIDUint, "monthly")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"summary": summary})
}

func (h *OrderHandler) ExportFarmerReport(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userIDUint := userID.(uint)
	reportType := c.Query("type")
	if reportType == "" {
		reportType = "orders"
	}

	csvContent, err := h.orderService.BuildFarmerCSVReport(userIDUint, reportType)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	filename := service.BuildFarmerReportFilename(reportType)
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=\""+filename+"\"")
	c.String(http.StatusOK, csvContent)
}
