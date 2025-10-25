package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"server/models"

	"github.com/gin-gonic/gin"
)

func GetDebts(c *gin.Context, db *sql.DB) {
	rows, err := db.Query("SELECT Номер, Адрес, Сумма, Срок_выплаты FROM Задолженность")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var debts []models.Debt
	for rows.Next() {
		var (
			id      int
			address string
			amount  float64
			dueDate sql.NullTime // используем специальный тип
		)
		if err := rows.Scan(&id, &address, &amount, &dueDate); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var formattedDate string
		if dueDate.Valid {
			formattedDate = dueDate.Time.Format("2006-01-02") // ← формат “YYYY-MM-DD”
		} else {
			formattedDate = ""
		}

		debts = append(debts, models.Debt{
			ID:      id,
			Address: address,
			Amount:  amount,
			DueDate: formattedDate,
		})
	}

	c.JSON(http.StatusOK, debts)
}

func CreateDebt(c *gin.Context, db *sql.DB) {
	var d models.Debt
	if err := c.BindJSON(&d); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err := db.Exec("INSERT INTO Задолженность (Адрес, Сумма, Срок_выплаты) VALUES (@p1, @p2, @p3)",
		d.Address, d.Amount, d.DueDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Debt created"})
}

func UpdateDebt(c *gin.Context, db *sql.DB) {
	id, _ := strconv.Atoi(c.Param("id"))
	var d models.Debt
	if err := c.BindJSON(&d); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err := db.Exec("UPDATE Задолженность SET Адрес=@p1, Сумма=@p2, Срок_выплаты=@p3 WHERE Номер=@p4",
		d.Address, d.Amount, d.DueDate, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Debt updated"})
}

func DeleteDebt(c *gin.Context, db *sql.DB) {
	id, _ := strconv.Atoi(c.Param("id"))

	_, err := db.Exec("DELETE FROM Задолженность WHERE Номер=@p1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Debt deleted"})
}
