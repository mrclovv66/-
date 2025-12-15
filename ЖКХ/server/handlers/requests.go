package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type Request struct {
	ID          int    `json:"id"`
	FullName    string `json:"full_name"`
	Address     string `json:"address"`
	RequestType string `json:"request_type"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
	Status      string `json:"status"`
	Comment     string `json:"comment"`
}

type UpdateStatusRequest struct {
	Status  string `json:"status"`
	Comment string `json:"comment"`
}

// //////////////////////////////////////////////////////////////////
// GET /requests — список заявок
// //////////////////////////////////////////////////////////////////
func GetRequests(c *gin.Context, db *sql.DB) {
	role, _ := c.Get("role")
	clientID, _ := c.Get("client_id")
	search := strings.TrimSpace(c.Query("search"))

	var rows *sql.Rows
	var err error

	// ===== КЛИЕНТ =====
	if role == "client" {
		rows, err = db.Query(`
			SELECT 
				z.ID_заявки,
				'' AS ФИО,
				z.Адрес_квартиры,
				z.Тип_заявки,
				z.Описание,
				z.Дата_создания,
				z.Статус,
				ISNULL(z.Комментарий, '')
			FROM Заявки z
			JOIN Квартира k ON z.Адрес_квартиры = k.Адрес
			WHERE k.Id_владельца = @p1
			ORDER BY z.Дата_создания DESC
		`, clientID)
	} else {
		// ===== СОТРУДНИК / АДМИН =====
		if search == "" {
			rows, err = db.Query(`
				SELECT 
					z.ID_заявки,
					c.ФИО,
					z.Адрес_квартиры,
					z.Тип_заявки,
					z.Описание,
					z.Дата_создания,
					z.Статус,
					ISNULL(z.Комментарий, '')
				FROM Заявки z
				JOIN Квартира k ON z.Адрес_квартиры = k.Адрес
				JOIN Клиент c ON k.Id_владельца = c.Id_клиента
				ORDER BY z.Дата_создания DESC
			`)
		} else {
			rows, err = db.Query(`
				SELECT 
					z.ID_заявки,
					c.ФИО,
					z.Адрес_квартиры,
					z.Тип_заявки,
					z.Описание,
					z.Дата_создания,
					z.Статус,
					ISNULL(z.Комментарий, '')
				FROM Заявки z
				JOIN Квартира k ON z.Адрес_квартиры = k.Адрес
				JOIN Клиент c ON k.Id_владельца = c.Id_клиента
				WHERE 
					c.ФИО LIKE '%' + @p1 + '%' OR
					z.Адрес_квартиры LIKE '%' + @p1 + '%' OR
					z.Тип_заявки LIKE '%' + @p1 + '%' OR
					z.Статус LIKE '%' + @p1 + '%'
				ORDER BY z.Дата_создания DESC
			`, search)
		}
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var requests []Request

	for rows.Next() {
		var r Request
		var rawDate sql.NullTime

		err := rows.Scan(
			&r.ID,
			&r.FullName,
			&r.Address,
			&r.RequestType,
			&r.Description,
			&rawDate,
			&r.Status,
			&r.Comment,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if rawDate.Valid {
			r.CreatedAt = rawDate.Time.Format("2006-01-02")
		}

		requests = append(requests, r)
	}

	c.JSON(http.StatusOK, requests)
}

// //////////////////////////////////////////////////////////////////
// POST /requests — создание заявки (клиент)
// //////////////////////////////////////////////////////////////////
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

	// проверка владения квартирой
	var ok int
	err := db.QueryRow(`
		SELECT 1
		FROM Квартира
		WHERE Адрес = @p1 AND Id_владельца = @p2
	`, req.Address, clientID).Scan(&ok)

	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Эта квартира вам не принадлежит"})
		return
	}

	_, err = db.Exec(`
		INSERT INTO Заявки
		(Адрес_квартиры, Тип_заявки, Описание, Дата_создания, Статус)
		VALUES (@p1, @p2, @p3, CAST(GETDATE() AS DATE), 'новая')
	`, req.Address, req.RequestType, req.Description)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Заявка успешно создана"})
}

// //////////////////////////////////////////////////////////////////
// PUT /requests/:id/status — статус + комментарий
// //////////////////////////////////////////////////////////////////
func UpdateRequestStatus(c *gin.Context, db *sql.DB) {
	role, _ := c.Get("role")
	if role == "client" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Недостаточно прав"})
		return
	}

	id, _ := strconv.Atoi(c.Param("id"))

	var req UpdateStatusRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректные данные"})
		return
	}

	_, err := db.Exec(`
		UPDATE Заявки
		SET 
			Статус = @p1,
			Комментарий = CASE
				WHEN @p1 IN ('выполнена','отклонена') THEN @p2
				ELSE Комментарий
			END
		WHERE ID_заявки = @p3
	`, req.Status, strings.TrimSpace(req.Comment), id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Статус обновлён"})
}

// //////////////////////////////////////////////////////////////////
// DELETE /requests/:id — удаление заявки (клиент)
// //////////////////////////////////////////////////////////////////
func DeleteRequest(c *gin.Context, db *sql.DB) {
	role, _ := c.Get("role")
	clientID, _ := c.Get("client_id")

	if role != "client" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Недостаточно прав"})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный ID"})
		return
	}

	res, err := db.Exec(`
		DELETE z
		FROM Заявки z
		JOIN Квартира k ON z.Адрес_квартиры = k.Адрес
		WHERE z.ID_заявки = @p1 AND k.Id_владельца = @p2
	`, id, clientID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if rows, _ := res.RowsAffected(); rows == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Нет прав на удаление"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Заявка удалена"})
}
