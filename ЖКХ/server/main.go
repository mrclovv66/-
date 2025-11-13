// ЖКХ/server/main.go
package main

import (
	"server/handlers"
	"server/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	InitDB() // подключаемся к SQL Server
	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Подключаем маршруты
	RegisterRoutes(r)

	r.Run(":8082")
}

func RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		api.POST("/login", func(c *gin.Context) { handlers.LoginHandler(c, db) })
		api.GET("/profile", middleware.RequireAuth(), func(c *gin.Context) { handlers.GetProfile(c, db) })

		// 🔹 Добавляем маршруты для клиента
		api.GET("/profile/meters", middleware.RequireAuth(), func(c *gin.Context) { handlers.GetProfileMeters(c, db) })
		api.GET("/profile/epd", middleware.RequireAuth(), func(c *gin.Context) { handlers.GetProfileEPD(c, db) })
		api.GET("/profile/debts", middleware.RequireAuth(), func(c *gin.Context) { handlers.GetProfileDebts(c, db) })

		// ===== Остальные маршруты =====

		// Clients
		api.GET("/clients", middleware.RequireAuth(), func(c *gin.Context) { handlers.GetClients(c, db) })
		api.POST("/clients", middleware.RequireAuth(), func(c *gin.Context) { handlers.CreateClient(c, db) })
		api.PUT("/clients/:id", middleware.RequireAuth(), func(c *gin.Context) { handlers.UpdateClient(c, db) })
		api.PUT("/clients/:id/archive", middleware.RequireAuth(), func(c *gin.Context) { handlers.ArchiveClient(c, db) })
		api.PUT("/clients/:id/restore", middleware.RequireAuth(), func(c *gin.Context) { handlers.RestoreClient(c, db) })

		// Apartments
		api.GET("/apartments", middleware.RequireAuth(), func(c *gin.Context) { handlers.GetApartments(c, db) })
		api.POST("/apartments", middleware.RequireAuth(), func(c *gin.Context) { handlers.CreateApartment(c, db) })
		api.PUT("/apartments/:id", middleware.RequireAuth(), func(c *gin.Context) { handlers.UpdateApartment(c, db) })

		// Meters
		api.GET("/meters", middleware.RequireAuth(), func(c *gin.Context) { handlers.GetMeters(c, db) })
		api.POST("/meters", middleware.RequireAuth(), func(c *gin.Context) { handlers.CreateMeter(c, db) })
		api.PUT("/meters/:id", middleware.RequireAuth(), func(c *gin.Context) { handlers.UpdateMeter(c, db) })
		api.DELETE("/meters/:id", middleware.RequireAuth(), func(c *gin.Context) { handlers.DeleteMeter(c, db) })

		// Services
		api.GET("/services", middleware.RequireAuth(), func(c *gin.Context) { handlers.GetServices(c, db) })
		api.POST("/services", middleware.RequireAuth(), func(c *gin.Context) { handlers.CreateService(c, db) })
		api.PUT("/services/:id", middleware.RequireAuth(), func(c *gin.Context) { handlers.UpdateService(c, db) })
		api.PUT("/services/:id/archive", middleware.RequireAuth(), func(c *gin.Context) { handlers.ArchiveService(c, db) })
		api.PUT("/services/:id/restore", middleware.RequireAuth(), func(c *gin.Context) { handlers.RestoreService(c, db) })

		// EPDs
		api.GET("/epds", middleware.RequireAuth(), func(c *gin.Context) { handlers.GetEPDs(c, db) })
		api.POST("/epds", middleware.RequireAuth(), func(c *gin.Context) { handlers.CreateEPD(c, db) })
		api.PUT("/epds/:id", middleware.RequireAuth(), func(c *gin.Context) { handlers.UpdateEPD(c, db) })
		api.DELETE("/epds/:id", middleware.RequireAuth(), func(c *gin.Context) { handlers.DeleteEPD(c, db) })

		// Debts
		api.GET("/debts", middleware.RequireAuth(), func(c *gin.Context) { handlers.GetDebts(c, db) })
		api.POST("/debts", middleware.RequireAuth(), func(c *gin.Context) { handlers.CreateDebt(c, db) })
		api.PUT("/debts/:id", middleware.RequireAuth(), func(c *gin.Context) { handlers.UpdateDebt(c, db) })
		api.DELETE("/debts/:id", middleware.RequireAuth(), func(c *gin.Context) { handlers.DeleteDebt(c, db) })

		// Requests
		api.GET("/requests", middleware.RequireAuth(), func(c *gin.Context) { handlers.GetRequests(c, db) })
		api.POST("/requests", middleware.RequireAuth(), func(c *gin.Context) { handlers.CreateRequest(c, db) })
		api.PUT("/requests/:id/status", middleware.RequireAuth(), func(c *gin.Context) { handlers.UpdateRequestStatus(c, db) })
		api.DELETE("/requests/:id", middleware.RequireAuth(), func(c *gin.Context) { handlers.DeleteRequest(c, db) })
	}
}
