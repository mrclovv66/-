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
	Rooms   int    `json:"rooms"`
	Area    int    `json:"area"`
}

type ServiceInfo struct {
	Name  string  `json:"name"`
	Price float64 `json:"price"`
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
	Address   string  `json:"address"`
	Month     string  `json:"month"`
	Total     float64 `json:"total"`
	Paid      bool    `json:"paid"`
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var profile ProfileData
	profile.Apartments = make([]Apartment, 0)

	// Клиент
	err := db.QueryRow(`
		SELECT [ФИО], [Номер_телефона]
		FROM [Клиент]
		WHERE [Id_клиента] = @p1
	`, clientID).Scan(&profile.FullName, &profile.Phone)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Квартиры (ПОЛНЫЕ ДАННЫЕ)
	rows, err := db.Query(`
		SELECT [Адрес], [Количество_комнат], [Площадь]
		FROM [Квартира]
		WHERE [Id_владельца] = @p1
	`, clientID)

	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var a Apartment
			if err := rows.Scan(&a.Address, &a.Rooms, &a.Area); err == nil {
				profile.Apartments = append(profile.Apartments, a)
			}
		}
	}

	c.JSON(http.StatusOK, profile)
}

// ===== Показания счётчиков клиента =====
func GetProfileMeters(c *gin.Context, db *sql.DB) {
	clientID, exists := c.Get("client_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	rows, err := db.Query(`
		SELECT 
		    ps.[Номер], 
		    ps.[Адрес], 
		    ps.[Расчётный_месяц], 
		    ps.[Горячая_вода], 
		    ps.[Холодная_вода]
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

	meters := []Meter{}

	for rows.Next() {
		var m Meter
		var rawMonth time.Time

		if err := rows.Scan(&m.ID, &m.Address, &rawMonth, &m.Hot, &m.Cold); err != nil {
			continue
		}

		m.Month = rawMonth.Format("2006-01")
		meters = append(meters, m)
	}

	c.JSON(http.StatusOK, meters)
}

// ===== ЕПД клиента (исправленный, добавлен Address + Paid) =====
func GetProfileEPD(c *gin.Context, db *sql.DB) {
	clientID, exists := c.Get("client_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	rows, err := db.Query(`
		SELECT 
			e.[Номер_документа],
			e.[Адрес],
			e.[Расчётный_месяц],
			e.[Сумма],
			e.[Оплачен]
		FROM [ЕПД] e
		JOIN [Квартира] k ON e.[Адрес] = k.[Адрес]
		WHERE k.[Id_владельца] = @p1
		ORDER BY e.[Расчётный_месяц] DESC
	`, clientID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	epds := []EPD{}
	id := 1

	for rows.Next() {
		var e EPD
		var rawMonth sql.NullTime

		if err := rows.Scan(
			&e.DocNumber,
			&e.Address,
			&rawMonth,
			&e.Total,
			&e.Paid,
		); err != nil {
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

// ===== Задолженности клиента =====
func GetProfileDebts(c *gin.Context, db *sql.DB) {
	clientID, exists := c.Get("client_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	rows, err := db.Query(`
		SELECT 
		    z.[Номер],
		    z.[Адрес],
		    z.[Сумма]
		FROM [Задолженность] z
		JOIN [Квартира] k ON z.[Адрес] = k.[Адрес]
		WHERE k.[Id_владельца] = @p1
		ORDER BY z.[Номер] DESC
	`, clientID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	debts := []Debt{}

	for rows.Next() {
		var d Debt
		if err := rows.Scan(&d.ID, &d.Address, &d.Amount); err == nil {
			debts = append(debts, d)
		}
	}

	c.JSON(http.StatusOK, debts)
}

func GetProfileServices(c *gin.Context, db *sql.DB) {
	rows, err := db.Query(`
		SELECT [Наименование], [Стоимость]
		FROM [Услуга]
		WHERE [Статус] = 'active'
		ORDER BY [Наименование]
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	services := []ServiceInfo{}

	for rows.Next() {
		var s ServiceInfo
		if err := rows.Scan(&s.Name, &s.Price); err == nil {
			services = append(services, s)
		}
	}

	c.JSON(http.StatusOK, services)
}
