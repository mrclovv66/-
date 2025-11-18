package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Проверка роли пользователя
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Role not found"})
			c.Abort()
			return
		}

		roleStr := userRole.(string)

		// Проверяем: есть ли текущая роль в списке разрешённых ролей
		for _, allowed := range roles {
			if allowed == roleStr {
				c.Next()
				return
			}
		}

		// если нет доступа:
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access denied: insufficient permissions",
		})
		c.Abort()
	}
}
