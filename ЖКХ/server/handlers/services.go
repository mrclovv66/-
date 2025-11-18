package handlers

import (
	"database/sql"
	"net/http"
	"server/models"

	"github.com/gin-gonic/gin"
)

// === Получить все услуги ===
func GetServices(c *gin.Context, db *sql.DB) {
	rows, err := db.Query("SELECT Наименование, Категория, Стоимость, Статус FROM Услуга")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var services []models.Service
	for rows.Next() {
		var s models.Service
		rows.Scan(&s.Name, &s.Category, &s.Price, &s.Status)
		services = append(services, s)
	}

	c.JSON(http.StatusOK, services)
}

func GetActiveServices(c *gin.Context, db *sql.DB) {
	rows, err := db.Query(`
        SELECT Наименование, Категория, Стоимость, Статус 
        FROM Услуга 
        WHERE Статус = 'active'
    `)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var services []models.Service
	for rows.Next() {
		var s models.Service
		rows.Scan(&s.Name, &s.Category, &s.Price, &s.Status)
		services = append(services, s)
	}

	c.JSON(http.StatusOK, services)
}

// === Добавить услугу ===
func CreateService(c *gin.Context, db *sql.DB) {
	var s models.Service
	if err := c.BindJSON(&s); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err := db.Exec(`INSERT INTO Услуга (Наименование, Категория, Стоимость, Статус)
					   VALUES (@p1, @p2, @p3, 'active')`,
		s.Name, s.Category, s.Price)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Service created"})
}

// === Обновить услугу ===
func UpdateService(c *gin.Context, db *sql.DB) {
	name := c.Param("id")

	role := c.GetString("role")

	var s models.Service
	if err := c.BindJSON(&s); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// === Если employee — ему запрещено менять цену ===
	if role == "employee" {
		_, err := db.Exec(`
			UPDATE Услуга 
			SET Категория = @p1 
			WHERE Наименование = @p2
		`, s.Category, name)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Service category updated (price change restricted for employees)",
		})
		return
	}

	// === Если admin — может менять всё ===
	if role == "admin" {
		_, err := db.Exec(`
			UPDATE Услуга 
			SET Категория=@p1, Стоимость=@p2 
			WHERE Наименование=@p3
		`, s.Category, s.Price, name)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Service updated successfully"})
	}
}

// === Архивировать услугу (вместо DELETE) ===
func ArchiveService(c *gin.Context, db *sql.DB) {
	name := c.Param("id")

	_, err := db.Exec(`UPDATE Услуга SET Статус='archive' WHERE Наименование=@p1`, name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Service archived"})
}

// === Восстановить услугу из архива ===
func RestoreService(c *gin.Context, db *sql.DB) {
	name := c.Param("id")

	_, err := db.Exec(`UPDATE Услуга SET Статус='active' WHERE Наименование=@p1`, name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Service restored"})
}
