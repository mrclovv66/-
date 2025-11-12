package handlers

import (
	"database/sql"
	"net/http"
	"server/models"

	"github.com/gin-gonic/gin"
)

// ====== Получение всех квартир с владельцами ======
func GetApartments(c *gin.Context, db *sql.DB) {
	rows, err := db.Query(`
		SELECT 
			k.Адрес,
			k.Id_владельца,
			ISNULL(cl.ФИО, '') AS ФИО,
			k.Количество_комнат,
			k.Площадь
		FROM Квартира k
		LEFT JOIN Клиент cl ON k.Id_владельца = cl.Id_клиента
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	type ApartmentWithOwner struct {
		Address   string `json:"address"`
		ClientID  *int   `json:"client_id"`
		OwnerName string `json:"owner_name"`
		Rooms     int    `json:"rooms"`
		Area      int    `json:"area"`
	}

	var apartments []ApartmentWithOwner

	for rows.Next() {
		var (
			a      ApartmentWithOwner
			client sql.NullInt32
			owner  sql.NullString
		)
		if err := rows.Scan(&a.Address, &client, &owner, &a.Rooms, &a.Area); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if client.Valid {
			val := int(client.Int32)
			a.ClientID = &val
		}
		if owner.Valid {
			a.OwnerName = owner.String
		} else {
			a.OwnerName = "—"
		}

		apartments = append(apartments, a)
	}

	c.JSON(http.StatusOK, apartments)
}

// ====== Добавление ======
func CreateApartment(c *gin.Context, db *sql.DB) {
	var a models.Apartment
	if err := c.BindJSON(&a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON: " + err.Error()})
		return
	}

	_, err := db.Exec(
		`INSERT INTO Квартира (Адрес, Id_владельца, Количество_комнат, Площадь) 
		 VALUES (@p1, @p2, @p3, @p4)`,
		a.Address, a.ClientID, a.Rooms, a.Area,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Apartment created"})
}

// ====== Обновление (только владелец) ======
func UpdateApartment(c *gin.Context, db *sql.DB) {
	address := c.Param("id")
	var a models.Apartment

	if err := c.BindJSON(&a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON: " + err.Error()})
		return
	}

	_, err := db.Exec(
		`UPDATE Квартира 
		 SET Id_владельца = @p1 
		 WHERE Адрес = @p2`,
		a.ClientID, address,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Apartment owner updated"})
}
