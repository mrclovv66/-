package handlers

import (
	"database/sql"
	"net/http"

	"server/models"

	"github.com/gin-gonic/gin"
)

func GetEPDs(c *gin.Context, db *sql.DB) {
	rows, err := db.Query("SELECT Номер_документа, Адрес, Расчётный_месяц, Сумма FROM ЕПД")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var epds []models.EPD
	for rows.Next() {
		var e models.EPD
		rows.Scan(&e.DocNumber, &e.Address, &e.BillingMonth, &e.TotalAmount)
		epds = append(epds, e)
	}

	c.JSON(http.StatusOK, epds)
}

func CreateEPD(c *gin.Context, db *sql.DB) {
	var e models.EPD
	if err := c.BindJSON(&e); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err := db.Exec("INSERT INTO ЕПД (Номер_документа, Адрес, Расчётный_месяц, Сумма) VALUES (@p1, @p2, @p3, @p4)",
		e.DocNumber, e.Address, e.BillingMonth, e.TotalAmount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "EPD created"})
}

func UpdateEPD(c *gin.Context, db *sql.DB) {
	docNumber := c.Param("id")
	var e models.EPD
	if err := c.BindJSON(&e); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err := db.Exec("UPDATE ЕПД SET Адрес=@p1, Расчётный_месяц=@p2, Сумма=@p3 WHERE Номер_документа=@p4",
		e.Address, e.BillingMonth, e.TotalAmount, docNumber)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "EPD updated"})
}

func DeleteEPD(c *gin.Context, db *sql.DB) {
	docNumber := c.Param("id")

	_, err := db.Exec("DELETE FROM ЕПД WHERE Номер_документа=@p1", docNumber)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "EPD deleted"})
}
