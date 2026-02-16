package middleware

import (
	"net/http"
	"strings"

	"github.com/f2b-portal/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		token := parts[1]
		claims, err := utils.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Set user info in context
		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("user_type", claims.UserType)

		c.Next()
	}
}

func FarmerOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		userType, exists := c.Get("user_type")
		if !exists || userType != "farmer" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Only farmers can access this resource"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func BuyerOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		userType, exists := c.Get("user_type")
		if !exists || userType != "buyer" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Only buyers can access this resource"})
			c.Abort()
			return
		}
		c.Next()
	}
}
