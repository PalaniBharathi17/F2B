package middleware

import (
	"strings"

	"github.com/f2b-portal/backend/pkg/config"
	"github.com/gin-gonic/gin"
)

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := strings.TrimSpace(c.Request.Header.Get("Origin"))
		normalizedOrigin := strings.TrimRight(origin, "/")
		frontendURL := config.AppConfig.FrontendURL
		normalizedFrontendURL := strings.TrimRight(strings.TrimSpace(frontendURL), "/")

		allowedOrigins := map[string]bool{
			normalizedFrontendURL:    true,
			"http://localhost:5173":  true,
			"http://127.0.0.1:5173":  true,
			"https://localhost:5173": true,
			"https://127.0.0.1:5173": true,
		}
		allowAll := strings.TrimSpace(frontendURL) == "*"

		// In local development, always echo browser origin to prevent localhost/127 mismatch issues.
		if normalizedOrigin != "" && (allowAll || allowedOrigins[normalizedOrigin] ||
			strings.Contains(normalizedOrigin, "://127.0.0.1:") ||
			strings.Contains(normalizedOrigin, "://localhost:")) {
			c.Writer.Header().Set("Access-Control-Allow-Origin", normalizedOrigin)
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
