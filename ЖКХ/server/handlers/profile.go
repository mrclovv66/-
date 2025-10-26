package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// ===== Структуры данных =====
type Apartment struct {
	Address string `json:"address"`
}

type ProfileData struct {
	FullName   string      `json:"fullName"`
	Phone      string      `json:"phone"`
	Apartments []Apartment `json:"apartments"`
}

type Meter struct {
	ID      int    `json:"id"`
	Address string `json:"address"`
	Month   string `json:"month"`
	Hot     int    `json:"hot"`
	Cold    int    `json:"cold"`
}

type EPD struct {
	ID        int     `json:"id"`
	DocNumber string  `json:"docNumber"`
	Month     string  `json:"month"`
	Total     float64 `json:"total"`
}

type Debt struct {
	ID      int     `json:"id"`
	Address string  `json:"address"`
	Amount  float64 `json:"amount"`
	DueDate string  `json:"dueDate"`
}

// ===== Основной профиль =====
func GetProfile(c *gin.Context, db *sql.DB) {
	clientID, exists := c.Get("client_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized - no client_id"})
		return
	}

	var profile ProfileData
	profile.Apartments = make([]Apartment, 0)

	err := db.QueryRow(`SELECT [ФИО], [Номер_телефона] FROM [Клиент] WHERE [Id_клиента] = @p1`, clientID).
		Scan(&profile.FullName, &profile.Phone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Клиент не найден: " + err.Error()})
		return
	}

	rows, err := db.Query(`SELECT [Адрес] FROM [Квартира] WHERE [Id_владельца] = @p1`, clientID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var a Apartment
			if scanErr := rows.Scan(&a.Address); scanErr == nil {
				profile.Apartments = append(profile.Apartments, a)
			}
		}
	}

	c.JSON(http.StatusOK, profile)
}

// ===== Показания счётчиков =====
func GetProfileMeters(c *gin.Context, db *sql.DB) {
	clientID, exists := c.Get("client_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	rows, err := db.Query(`
		SELECT ps.[Номер], ps.[Адрес], ps.[Расчётный_месяц], ps.[Горячая_вода], ps.[Холодная_вода]
		FROM [Показание_счётчиков] ps
		JOIN [Квартира] k ON ps.[Адрес] = k.[Адрес]
		WHERE k.[Id_владельца] = @p1
		ORDER BY ps.[Адрес], ps.[Расчётный_месяц] DESC
	`, clientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var meters []Meter
	for rows.Next() {
		var (
			m        Meter
			rawMonth time.Time
		)
		if err := rows.Scan(&m.ID, &m.Address, &rawMonth, &m.Hot, &m.Cold); err != nil {
			continue
		}
		m.Month = rawMonth.Format("2006-01")
		meters = append(meters, m)
	}
	c.JSON(http.StatusOK, meters)
}

// ===== ЕПД =====
func GetProfileEPD(c *gin.Context, db *sql.DB) {
	clientID, exists := c.Get("client_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	query := `
	SELECT e.[Номер_документа], e.[Расчётный_месяц], e.[Сумма]
	FROM [ЕПД] e
	JOIN [Квартира] k ON e.[Адрес] = k.[Адрес]
	WHERE k.[Id_владельца] = @p1
	ORDER BY e.[Расчётный_месяц] DESC`

	rows, err := db.Query(query, clientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var epds []EPD
	id := 1

	for rows.Next() {
		var (
			e        EPD
			rawMonth sql.NullTime
		)
		if err := rows.Scan(&e.DocNumber, &rawMonth, &e.Total); err != nil {
			continue
		}

		if rawMonth.Valid {
			e.Month = rawMonth.Time.Format("2006-01")
		} else {
			e.Month = ""
		}

		e.ID = id
		id++
		epds = append(epds, e)
	}

	c.JSON(http.StatusOK, epds)
}

// ===== Задолженности =====
func GetProfileDebts(c *gin.Context, db *sql.DB) {
	clientID, exists := c.Get("client_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	query := `
	SELECT z.[Номер], z.[Адрес], z.[Сумма], z.[Срок_выплаты]
	FROM [Задолженность] z
	JOIN [Квартира] k ON z.[Адрес] = k.[Адрес]
	WHERE k.[Id_владельца] = @p1
	ORDER BY z.[Номер] DESC`

	rows, err := db.Query(query, clientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	debts := make([]Debt, 0)
	for rows.Next() {
		var d Debt
		if scanErr := rows.Scan(&d.ID, &d.Address, &d.Amount, &d.DueDate); scanErr == nil {
			debts = append(debts, d)
		}
	}
	c.JSON(http.StatusOK, debts)
}
