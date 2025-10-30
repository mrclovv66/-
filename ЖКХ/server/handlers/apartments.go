package handlers

import (
	"database/sql"
	"net/http"

	"server/models"

	"github.com/gin-gonic/gin"
)

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
		ClientID  int    `json:"client_id"`
		OwnerName string `json:"owner_name"`
		Rooms     int    `json:"rooms"`
		Area      int    `json:"area"`
	}

	var apartments []ApartmentWithOwner
	for rows.Next() {
		var a ApartmentWithOwner
		if err := rows.Scan(&a.Address, &a.ClientID, &a.OwnerName, &a.Rooms, &a.Area); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		apartments = append(apartments, a)
	}

	c.JSON(http.StatusOK, apartments)
}

func CreateApartment(c *gin.Context, db *sql.DB) {
	var a models.Apartment
	if err := c.BindJSON(&a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON: " + err.Error()})
		return
	}
	_, err := db.Exec(
		"INSERT INTO Квартира (Адрес, Id_владельца, Количество_комнат, Площадь) VALUES (@p1, @p2, @p3, @p4)",
		a.Address, a.ClientID, a.Rooms, a.Area,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Apartment created"})
}

func UpdateApartment(c *gin.Context, db *sql.DB) {
	address := c.Param("id")
	var a models.Apartment
	if err := c.BindJSON(&a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON: " + err.Error()})
		return
	}
	_, err := db.Exec(
		"UPDATE Квартира SET Id_владельца=@p1, Количество_комнат=@p2, Площадь=@p3 WHERE Адрес=@p4",
		a.ClientID, a.Rooms, a.Area, address,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Apartment updated"})
}

func DeleteApartment(c *gin.Context, db *sql.DB) {
	address := c.Param("id")

	_, err := db.Exec("EXEC DeleteApartmentCascade @p1", address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при удалении квартиры: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Apartment deleted successfully"})
}
