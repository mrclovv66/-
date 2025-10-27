package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type Request struct {
	ID          int    `json:"id"`
	ClientID    int    `json:"client_id"`
	FullName    string `json:"full_name"`
	Address     string `json:"address"`
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

	if role == "client" {
		rows, err = db.Query(`
			SELECT 
				z.[ID_заявки],
				z.[ID_клиента],
				k.[ФИО] AS [ФИО_клиента],
				z.[Адрес_квартиры],
				z.[Тип_заявки],
				z.[Описание],
				z.[Дата_создания],
				z.[Статус]
			FROM [Заявки] z
			JOIN [Клиент] k ON z.[ID_клиента] = k.[Id_клиента]
			WHERE z.[ID_клиента] = @p1
			ORDER BY z.[Дата_создания] DESC
		`, clientID)
	} else {
		rows, err = db.Query(`
			SELECT 
				z.[ID_заявки],
				z.[ID_клиента],
				k.[ФИО] AS [ФИО_клиента],
				z.[Адрес_квартиры],
				z.[Тип_заявки],
				z.[Описание],
				z.[Дата_создания],
				z.[Статус]
			FROM [Заявки] z
			JOIN [Клиент] k ON z.[ID_клиента] = k.[Id_клиента]
			ORDER BY z.[Дата_создания] DESC
		`)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var requests []Request
	for rows.Next() {
		var r Request
		err := rows.Scan(&r.ID, &r.ClientID, &r.FullName, &r.Address, &r.RequestType, &r.Description, &r.CreatedAt, &r.Status)
		if err == nil {
			requests = append(requests, r)
		}
	}

	c.JSON(http.StatusOK, requests)
}

// ===== Создание заявки (для клиента) =====
func CreateRequest(c *gin.Context, db *sql.DB) {
	clientID, exists := c.Get("client_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неавторизован"})
		return
	}

	var req struct {
		Address     string `json:"address"`
		RequestType string `json:"request_type"`
		Description string `json:"description"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректные данные"})
		return
	}

	// Добавляем запись с текущей датой
	_, err := db.Exec(`
		INSERT INTO [Заявки] ([ID_клиента], [Адрес_квартиры], [Тип_заявки], [Описание], [Дата_создания])
		VALUES (@p1, @p2, @p3, @p4, @p5)
	`, clientID, req.Address, req.RequestType, req.Description, time.Now().Format("2006-01-02"))

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Заявка успешно создана"})
}

// ===== Обновление статуса заявки (для сотрудников/админов) =====
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректные данные"})
		return
	}

	_, err := db.Exec(`
		UPDATE [Заявки] SET [Статус] = @p1 WHERE [ID_заявки] = @p2
	`, req.Status, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Статус обновлён"})
}

// ===== Удаление заявки =====
func DeleteRequest(c *gin.Context, db *sql.DB) {
	role, _ := c.Get("role")
	if role == "client" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Недостаточно прав"})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный ID"})
		return
	}

	_, err = db.Exec(`DELETE FROM [Заявки] WHERE [ID_заявки] = @p1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка удаления заявки: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Заявка удалена"})
}
