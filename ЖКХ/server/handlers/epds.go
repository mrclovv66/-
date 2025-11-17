package handlers

import (
	"database/sql"
	"fmt"
	"net/http"

	"server/models"

	"github.com/gin-gonic/gin"
)

//////////////////////////////////////////////////////////////////////
// GET /epds — получить список ЕПД (оплаченные + неоплаченные)
//////////////////////////////////////////////////////////////////////

func GetEPDs(c *gin.Context, db *sql.DB) {
	search := c.Query("search")
	var rows *sql.Rows
	var err error

	if search != "" {
		query := `
			SELECT 
				Номер_документа,
				Адрес,
				FORMAT(Расчётный_месяц, 'yyyy-MM') AS Расчётный_месяц,
				Сумма,
				Оплачен
			FROM ЕПД
			WHERE 
				Номер_документа LIKE '%' + @p1 + '%' OR
				Адрес LIKE '%' + @p1 + '%' OR
				FORMAT(Расчётный_месяц, 'yyyy-MM') LIKE '%' + @p1 + '%'
			ORDER BY Расчётный_месяц DESC
		`
		rows, err = db.Query(query, search)
	} else {
		rows, err = db.Query(`
			SELECT 
				Номер_документа,
				Адрес,
				FORMAT(Расчётный_месяц, 'yyyy-MM') AS Расчётный_месяц,
				Сумма,
				Оплачен
			FROM ЕПД
			ORDER BY Расчётный_месяц DESC
		`)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var epds []models.EPD
	for rows.Next() {
		var e models.EPD
		if err := rows.Scan(&e.DocNumber, &e.Address, &e.BillingMonth, &e.TotalAmount, &e.Paid); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		epds = append(epds, e)
	}

	c.JSON(http.StatusOK, epds)
}

//////////////////////////////////////////////////////////////////////
// POST /epds — создать новый ЕПД
//////////////////////////////////////////////////////////////////////

func CreateEPD(c *gin.Context, db *sql.DB) {
	type RequestData struct {
		DocNumber    string   `json:"docNumber"`
		Address      string   `json:"address"`
		BillingMonth string   `json:"billingMonth"`
		Services     []string `json:"services"`
	}

	var data RequestData
	if err := c.BindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if len(data.Services) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No services selected"})
		return
	}

	// Формируем SQL IN (@p1, @p2...)
	placeholders := ""
	for i := range data.Services {
		if i > 0 {
			placeholders += ", "
		}
		placeholders += fmt.Sprintf("@p%d", i+1)
	}

	query := fmt.Sprintf(`
		SELECT Наименование, Стоимость
		FROM Услуга
		WHERE Наименование IN (%s)
	`, placeholders)

	args := make([]any, len(data.Services))
	for i, s := range data.Services {
		args[i] = s
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	total := 0
	servicePrices := map[string]int{}

	for rows.Next() {
		var name string
		var price int
		if err := rows.Scan(&name, &price); err == nil {
			total += price
			servicePrices[name] = price
		}
	}

	// Создание ЕПД
	_, err = db.Exec(`
		INSERT INTO ЕПД (Номер_документа, Адрес, Расчётный_месяц, Сумма)
		VALUES (@p1, @p2, @p3, @p4)
	`, data.DocNumber, data.Address, data.BillingMonth, total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Добавление услуг в Данные_об_услуге
	for name, price := range servicePrices {
		_, err := db.Exec(`
			INSERT INTO Данные_об_услуге (Наименование_услуги, Номер_ЕПД, Сумма)
			VALUES (@p1, @p2, @p3)
		`, name, data.DocNumber, price)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "EPD created successfully",
		"totalAmount": total,
	})
}

//////////////////////////////////////////////////////////////////////
// PUT /epds/:id/pay — отметить ЕПД как оплаченный
//////////////////////////////////////////////////////////////////////

func PayEPD(c *gin.Context, db *sql.DB) {
	docNumber := c.Param("id")

	_, err := db.Exec(`
		UPDATE ЕПД
		SET Оплачен = 1
		WHERE Номер_документа = @p1
	`, docNumber)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ЕПД отмечен как оплаченный"})
}

//////////////////////////////////////////////////////////////////////
// DELETE /epds/:id — удаление через процедуру DeleteEPDCascade
//////////////////////////////////////////////////////////////////////

func DeleteEPD(c *gin.Context, db *sql.DB) {
	docNumber := c.Param("id")

	_, err := db.Exec(`EXEC dbo.DeleteEPDCascade @p1`, docNumber)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ЕПД успешно удалён"})
}
