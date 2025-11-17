package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"server/models"

	"github.com/gin-gonic/gin"
)

// ====== Получить все показания (с поиском) ======
func GetMeters(c *gin.Context, db *sql.DB) {
	search := strings.TrimSpace(c.Query("search"))

	var (
		rows *sql.Rows
		err  error
	)

	// Базовый запрос
	query := `
		SELECT 
			Номер, 
			Номер_документа, 
			Адрес, 
			FORMAT(Расчётный_месяц, 'yyyy-MM') AS Расчётный_месяц,
			Горячая_вода, 
			Холодная_вода
		FROM Показание_счётчиков
	`

	// Если есть строка поиска — добавляем WHERE
	if search != "" {
		query += `
			WHERE 
				Номер_документа LIKE '%' + @p1 + '%' OR
				Адрес LIKE '%' + @p1 + '%' OR
				FORMAT(Расчётный_месяц, 'yyyy-MM') LIKE '%' + @p1 + '%'
		`
	}

	// Сортировка по месяцу (от нового к старому)
	query += `
		ORDER BY Расчётный_месяц DESC
	`

	// Выполняем запрос
	if search != "" {
		rows, err = db.Query(query, search)
	} else {
		rows, err = db.Query(query)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	// ВАЖНО: инициализируем как пустой слайс, а не nil → в JSON будет [] а не null
	meters := []models.Meter{}

	for rows.Next() {
		var (
			m        models.Meter
			rawMonth sql.NullString
		)

		if err := rows.Scan(
			&m.ID,
			&m.DocNumber,
			&m.Address,
			&rawMonth,
			&m.HotWater,
			&m.ColdWater,
		); err != nil {
			continue
		}

		if rawMonth.Valid {
			m.BillingMonth = rawMonth.String // уже "YYYY-MM"
		}

		meters = append(meters, m)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, meters)
}

// ====== Добавить новое показание ======
func CreateMeter(c *gin.Context, db *sql.DB) {
	var m models.Meter
	if err := c.BindJSON(&m); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный формат данных"})
		return
	}

	// 🔹 Преобразуем "YYYY-MM" → "YYYY-MM-01"
	m.BillingMonth = normalizeMonth(m.BillingMonth)

	if m.HotWater <= 0 || m.ColdWater <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Показания должны быть больше нуля"})
		return
	}

	// 🔹 Проверяем, есть ли такой ЕПД
	var exists int
	err := db.QueryRow(`SELECT COUNT(*) FROM ЕПД WHERE Номер_документа = @p1`, m.DocNumber).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка проверки ЕПД"})
		return
	}

	// 🔹 Если ЕПД нет — создаём новый (без пересчётов, триггеры всё сделают)
	if exists == 0 {
		_, err = db.Exec(`
			INSERT INTO ЕПД (Номер_документа, Адрес, Расчётный_месяц, Сумма, Оплачен)
			VALUES (@p1, @p2, @p3, 0, 0)
		`, m.DocNumber, m.Address, m.BillingMonth)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания ЕПД: " + err.Error()})
			return
		}
	}

	// 🔹 Вставляем показания
	_, err = db.Exec(`
		INSERT INTO Показание_счётчиков 
		(Номер_документа, Адрес, Расчётный_месяц, Горячая_вода, Холодная_вода)
		VALUES (@p1, @p2, @p3, @p4, @p5)
	`, m.DocNumber, m.Address, m.BillingMonth, m.HotWater, m.ColdWater)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка добавления показаний: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Показания успешно переданы"})
}

// ====== Обновить показания ======
func UpdateMeter(c *gin.Context, db *sql.DB) {
	id, _ := strconv.Atoi(c.Param("id"))
	var m models.Meter
	if err := c.BindJSON(&m); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный формат данных"})
		return
	}

	m.BillingMonth = normalizeMonth(m.BillingMonth)

	var docNumber string
	err := db.QueryRow(`
		SELECT Номер_документа FROM Показание_счётчиков WHERE Номер = @p1
	`, id).Scan(&docNumber)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Показание не найдено"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка поиска показания: " + err.Error()})
		return
	}

	_, err = db.Exec(`
		UPDATE Показание_счётчиков
		SET Расчётный_месяц=@p1, Горячая_вода=@p2, Холодная_вода=@p3
		WHERE Номер=@p4
	`, m.BillingMonth, m.HotWater, m.ColdWater, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обновления показаний: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Показания обновлены"})
}

// ====== Удалить показание ======
func DeleteMeter(c *gin.Context, db *sql.DB) {
	id, _ := strconv.Atoi(c.Param("id"))
	_, err := db.Exec(`DELETE FROM Показание_счётчиков WHERE Номер=@p1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Показание удалено"})
}

// ====== Вспомогательная функция ======
func normalizeMonth(value string) string {
	value = strings.TrimSpace(value)
	if len(value) == 7 { // "YYYY-MM"
		return value + "-01"
	}
	return value
}

// ===== Получить список адресов =====
func GetMeterAddresses(c *gin.Context, db *sql.DB) {
	rows, err := db.Query(`
		SELECT Адрес
		FROM Квартира
		ORDER BY Адрес
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	// тоже инициализируем как пустой слайс
	addresses := []string{}

	for rows.Next() {
		var a string
		if err := rows.Scan(&a); err == nil {
			addresses = append(addresses, a)
		}
	}

	c.JSON(http.StatusOK, addresses)
}
