package handlers

import (
	"database/sql"
	"net/http"

	"server/models"

	"github.com/gin-gonic/gin"
)

func GetServices(c *gin.Context, db *sql.DB) {
	rows, err := db.Query("SELECT Наименование, Категория, Стоимость FROM Услуга")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var services []models.Service
	for rows.Next() {
		var s models.Service
		rows.Scan(&s.Name, &s.Category, &s.Price)
		services = append(services, s)
	}

	c.JSON(http.StatusOK, services)
}

func CreateService(c *gin.Context, db *sql.DB) {
	var s models.Service
	if err := c.BindJSON(&s); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err := db.Exec("INSERT INTO Услуга (Наименование, Категория, Стоимость) VALUES (@p1, @p2, @p3)",
		s.Name, s.Category, s.Price)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Service created"})
}

func UpdateService(c *gin.Context, db *sql.DB) {
	name := c.Param("id")
	var s models.Service
	if err := c.BindJSON(&s); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err := db.Exec("UPDATE Услуга SET Категория=@p1, Стоимость=@p2 WHERE Наименование=@p3",
		s.Category, s.Price, name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Service updated"})
}

func DeleteService(c *gin.Context, db *sql.DB) {
	name := c.Param("id")

	_, err := db.Exec("DELETE FROM Услуга WHERE Наименование=@p1", name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Service deleted"})
}
