// ЖКХ/server/handlers/clients.go
package handlers

import (
	"database/sql"
	"net/http"
	"server/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ===== Получить клиентов (текущие или архив) =====
func GetClients(c *gin.Context, db *sql.DB) {
	viewType := c.DefaultQuery("type", "client") // client или archive
	search := c.Query("search")                  // текст из строки поиска

	query := `
		SELECT Id_клиента, ФИО, Номер_телефона
		FROM Клиент
		WHERE Роль = @p1
	`

	args := []interface{}{viewType}

	// если введён текст для поиска — добавляем фильтр
	if search != "" {
		query += " AND (ФИО LIKE '%' + @p2 + '%' OR Номер_телефона LIKE '%' + @p2 + '%')"
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

// ===== Архивировать клиента =====
func ArchiveClient(c *gin.Context, db *sql.DB) {
	id, _ := strconv.Atoi(c.Param("id"))

	// Вызываем хранимую процедуру ArchiveClient
	_, err := db.Exec("EXEC ArchiveClient @Id_клиента = @p1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Клиент успешно архивирован"})
}

// ===== Разархивировать клиента =====
func RestoreClient(c *gin.Context, db *sql.DB) {
	id, _ := strconv.Atoi(c.Param("id"))

	_, err := db.Exec("EXEC RestoreClient @p1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Клиент успешно восстановлен"})
}
