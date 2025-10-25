package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Request struct {
	ID          int    `json:"id"`
	ClientID    int    `json:"client_id"`
	RequestType string `json:"request_type"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
	Status      string `json:"status"`
}

// ===== Получение списка заявок =====
func GetRequests(c *gin.Context, db *sql.DB) {
	role, _ := c.Get("role")
	clientID, _ := c.Get("client_id")

	var rows *sql.Rows
	var err error

	// 🔹 Клиент видит только свои заявки
	if role == "client" {
		rows, err = db.Query(`
			SELECT [ID_заявки], [ID_клиента], [Тип_заявки], [Описание], [Дата_создания], [Статус]
			FROM [Заявки]
			WHERE [ID_клиента] = @p1
			ORDER BY [Дата_создания] DESC`, clientID)
	} else {
		// 🔹 Сотрудник / админ видит все заявки
		rows, err = db.Query(`
			SELECT [ID_заявки], [ID_клиента], [Тип_заявки], [Описание], [Дата_создания], [Статус]
			FROM [Заявки]
			ORDER BY [Дата_создания] DESC`)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var requests []Request
	for rows.Next() {
		var r Request
		rows.Scan(&r.ID, &r.ClientID, &r.RequestType, &r.Description, &r.CreatedAt, &r.Status)
		requests = append(requests, r)
	}

	c.JSON(http.StatusOK, requests)
}

// ===== Создание заявки (для клиента) =====
func CreateRequest(c *gin.Context, db *sql.DB) {
	clientID, exists := c.Get("client_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		RequestType string `json:"request_type"`
		Description string `json:"description"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err := db.Exec(`
		INSERT INTO [Заявки] ([ID_клиента], [Тип_заявки], [Описание])
		VALUES (@p1, @p2, @p3)`, clientID, req.RequestType, req.Description)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Request created"})
}

// ===== Обновление статуса заявки (для сотрудника/админа) =====
func UpdateRequestStatus(c *gin.Context, db *sql.DB) {
	role, _ := c.Get("role")
	if role == "client" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Недостаточно прав"})
		return
	}

	id, _ := strconv.Atoi(c.Param("id"))
	var req struct {
		Status string `json:"status"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err := db.Exec("UPDATE [Заявки] SET [Статус] = @p1 WHERE [ID_заявки] = @p2", req.Status, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Request status updated"})
}
