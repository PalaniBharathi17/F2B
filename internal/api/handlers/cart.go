package handlers

import (
	"net/http"
	"strconv"

	"github.com/f2b-portal/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type CartHandler struct {
	cartService *service.CartService
}

func NewCartHandler(cartService *service.CartService) *CartHandler {
	return &CartHandler{cartService: cartService}
}

func (h *CartHandler) GetCart(c *gin.Context) {
	userID, _ := c.Get("user_id")
	items, err := h.cartService.GetCartItems(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load cart"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *CartHandler) AddToCart(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req service.AddToCartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.cartService.AddToCart(userID.(uint), req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Item added to cart"})
}

func (h *CartHandler) UpdateItem(c *gin.Context) {
	userID, _ := c.Get("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cart item ID"})
		return
	}
	var req struct {
		Quantity float64 `json:"quantity" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.cartService.UpdateQuantity(userID.(uint), uint(id), req.Quantity); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Cart item updated"})
}

func (h *CartHandler) RemoveItem(c *gin.Context) {
	userID, _ := c.Get("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cart item ID"})
		return
	}
	if err := h.cartService.RemoveItem(userID.(uint), uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Cart item removed"})
}

func (h *CartHandler) Checkout(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req struct {
		DeliveryAddress string `json:"delivery_address"`
	}
	_ = c.ShouldBindJSON(&req)

	orders, err := h.cartService.Checkout(userID.(uint), req.DeliveryAddress)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"message": "Checkout successful",
		"orders":  orders,
	})
}
