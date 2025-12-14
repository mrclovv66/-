// ЖКХ/server/handlers/clients.go
package handlers

import (
	"database/sql"
	"net/http"
	"server/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ===== Получить всех клиентов =====
func GetClients(c *gin.Context, db *sql.DB) {
	search := c.Query("search")

	query := `
		SELECT Id_клиента, ФИО, Номер_телефона
		FROM Клиент
	`
	args := []interface{}{}

	if search != "" {
		query += `
			WHERE ФИО LIKE '%' + @p1 + '%'
			   OR Номер_телефона LIKE '%' + @p1 + '%'
		`
		args = append(args, search)
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var clients []models.Client
	for rows.Next() {
		var client models.Client
		if err := rows.Scan(&client.ID, &client.FullName, &client.Phone); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		clients = append(clients, client)
	}

	c.JSON(http.StatusOK, clients)
}

// ===== Создать клиента =====
func CreateClient(c *gin.Context, db *sql.DB) {
	var client models.Client
	if err := c.BindJSON(&client); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if client.Password == "" {
		client.Password = "1234"
	}

	_, err := db.Exec("EXEC AddClient @p1, @p2, @p3",
		client.FullName, client.Phone, client.Password)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Клиент успешно добавлен"})
}

// ===== Обновить клиента =====
func UpdateClient(c *gin.Context, db *sql.DB) {
	id, _ := strconv.Atoi(c.Param("id"))
	var client models.Client
	if err := c.BindJSON(&client); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err := db.Exec(`
		UPDATE Клиент 
		SET ФИО = @p1, Номер_телефона = @p2 
		WHERE Id_клиента = @p3
	`, client.FullName, client.Phone, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Client updated"})
}
