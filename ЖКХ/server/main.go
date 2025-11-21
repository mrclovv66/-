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

	// ============================
	// CORS middleware
	// ============================
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

	// ============================
	// Маршруты
	// ============================
	RegisterRoutes(r)

	r.Run(":8082")
}

func RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		// ============================================
		// AUTH
		// ============================================
		api.POST("/login", func(c *gin.Context) { handlers.LoginHandler(c, db) })

		// ============================================
		// CLIENT PROFILE (роль client)
		// ============================================
		api.GET("/profile", middleware.RequireAuth(),
			func(c *gin.Context) { handlers.GetProfile(c, db) })

		api.GET("/profile/meters", middleware.RequireAuth(),
			func(c *gin.Context) { handlers.GetProfileMeters(c, db) })

		api.GET("/profile/epd", middleware.RequireAuth(),
			func(c *gin.Context) { handlers.GetProfileEPD(c, db) })

		api.GET("/profile/debts", middleware.RequireAuth(),
			func(c *gin.Context) { handlers.GetProfileDebts(c, db) })

		api.GET("/epds/:doc/download", middleware.RequireAuth(),
			func(c *gin.Context) { handlers.DownloadEPD(c, db) })

		// ============================================
		// EMPLOYEES (admin)
		// ============================================
		api.GET("/employees", middleware.RequireAuth(), middleware.RequireRole("admin"),
			func(c *gin.Context) { handlers.GetEmployees(c, db) })

		api.POST("/employees", middleware.RequireAuth(), middleware.RequireRole("admin"),
			func(c *gin.Context) { handlers.CreateEmployee(c, db) })

		api.PUT("/employees/:id", middleware.RequireAuth(), middleware.RequireRole("admin"),
			func(c *gin.Context) { handlers.UpdateEmployee(c, db) })

		api.DELETE("/employees/:id", middleware.RequireAuth(), middleware.RequireRole("admin"),
			func(c *gin.Context) { handlers.ArchiveEmployee(c, db) })

		api.PUT("/employees/:id/restore", middleware.RequireAuth(), middleware.RequireRole("admin"),
			func(c *gin.Context) { handlers.RestoreEmployee(c, db) })

		// ============================================
		// CLIENTS (admin + employee)
		// ============================================
		api.GET("/clients", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.GetClients(c, db) })

		api.POST("/clients", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.CreateClient(c, db) })

		api.PUT("/clients/:id", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.UpdateClient(c, db) })

		api.PUT("/clients/:id/archive", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.ArchiveClient(c, db) })

		api.PUT("/clients/:id/restore", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.RestoreClient(c, db) })

		// ============================================
		// APARTMENTS (admin + employee)
		// ============================================
		api.GET("/apartments", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.GetApartments(c, db) })

		api.POST("/apartments", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.CreateApartment(c, db) })

		api.PUT("/apartments/:id", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.UpdateApartment(c, db) })

		// ============================================
		// METERS (employee)
		// ============================================
		api.GET("/meters", middleware.RequireAuth(), middleware.RequireRole("employee"),
			func(c *gin.Context) { handlers.GetMeters(c, db) })

		api.POST("/meters", middleware.RequireAuth(), middleware.RequireRole("employee"),
			func(c *gin.Context) { handlers.CreateMeter(c, db) })

		api.PUT("/meters/:id", middleware.RequireAuth(), middleware.RequireRole("employee"),
			func(c *gin.Context) { handlers.UpdateMeter(c, db) })

		api.DELETE("/meters/:id", middleware.RequireAuth(), middleware.RequireRole("employee"),
			func(c *gin.Context) { handlers.DeleteMeter(c, db) })

		api.GET("/meters/addresses", middleware.RequireAuth(), middleware.RequireRole("employee"),
			func(c *gin.Context) { handlers.GetMeterAddresses(c, db) })

		// ============================================
		// SERVICES (admin + employee)
		// ============================================
		api.GET("/services", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.GetServices(c, db) })

		api.POST("/services", middleware.RequireAuth(), middleware.RequireRole("admin"),
			func(c *gin.Context) { handlers.CreateService(c, db) })

		api.PUT("/services/:id", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.UpdateService(c, db) })

		api.PUT("/services/:id/archive", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.ArchiveService(c, db) })

		api.PUT("/services/:id/restore", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.RestoreService(c, db) })

		api.GET("/services/active", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.GetActiveServices(c, db) })

		// ============================================
		// EPDS (admin + employee)
		// ============================================
		api.GET("/epds", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.GetEPDs(c, db) })

		api.POST("/epds", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.CreateEPD(c, db) })

		api.PUT("/epds/:id/pay", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.PayEPD(c, db) })

		api.DELETE("/epds/:id", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.DeleteEPD(c, db) })

		// ============================================
		// DEBTS (admin + employee)
		// ============================================
		api.GET("/debts", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.GetDebts(c, db) })

		// ============================================
		// REQUESTS
		// ============================================
		api.GET("/requests", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.GetRequests(c, db) })

		api.POST("/requests", middleware.RequireAuth(), middleware.RequireRole("client"),
			func(c *gin.Context) { handlers.CreateRequest(c, db) })

		api.PUT("/requests/:id/status", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.UpdateRequestStatus(c, db) })

		api.DELETE("/requests/:id", middleware.RequireAuth(), middleware.RequireRole("admin", "employee"),
			func(c *gin.Context) { handlers.DeleteRequest(c, db) })

		// ============================================
		// REPORTS (admin) — 🔥 НОВЫЙ БЛОК 🔥
		// ============================================

		api.GET("/reports/payments", middleware.RequireAuth(), middleware.RequireRole("admin"),
			func(c *gin.Context) { handlers.GetPaymentsReport(c, db) })

		api.GET("/reports/payments/excel", middleware.RequireAuth(), middleware.RequireRole("admin"),
			func(c *gin.Context) { handlers.DownloadPaymentsExcel(c, db) })

		api.GET("/reports/consumption", middleware.RequireAuth(), middleware.RequireRole("admin"),
			func(c *gin.Context) { handlers.GetConsumptionReport(c, db) })

		api.GET("/reports/consumption/excel", middleware.RequireAuth(), middleware.RequireRole("admin"),
			func(c *gin.Context) { handlers.DownloadConsumptionExcel(c, db) })

		api.GET("/reports/debtors", middleware.RequireAuth(), middleware.RequireRole("admin"),
			func(c *gin.Context) { handlers.GetDebtors(c, db) })

		api.GET("/reports/debtors/excel", middleware.RequireAuth(), middleware.RequireRole("admin"),
			func(c *gin.Context) { handlers.DownloadDebtorsExcel(c, db) })

		api.GET("/reports/history", middleware.RequireAuth(), middleware.RequireRole("admin"),
			func(c *gin.Context) { handlers.GetPaymentHistory(c, db) })

		api.GET("/reports/history/excel", middleware.RequireAuth(), middleware.RequireRole("admin"),
			func(c *gin.Context) { handlers.DownloadHistoryExcel(c, db) })

		api.GET("/addresses", middleware.RequireAuth(), middleware.RequireRole("admin"),
			func(c *gin.Context) { handlers.GetAllAddresses(c, db) })

	}
}
