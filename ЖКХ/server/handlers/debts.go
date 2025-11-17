package handlers

import (
	"database/sql"
	"net/http"

	"server/models"

	"github.com/gin-gonic/gin"
)

// =================== GET /debts ===================
// список задолженностей
func GetDebts(c *gin.Context, db *sql.DB) {
	search := c.Query("search")

	var rows *sql.Rows
	var err error

	baseQuery := `
		SELECT 
			Номер,
			Адрес,
			Сумма,
			FORMAT(Срок_выплаты, 'yyyy-MM-dd')
		FROM Задолженность
	`

	if search != "" {
		baseQuery += `
			WHERE 
				CAST(Номер AS VARCHAR) LIKE '%' + @p1 + '%' OR
				Адрес LIKE '%' + @p1 + '%' 
		`
		rows, err = db.Query(baseQuery, search)
	} else {
		rows, err = db.Query(baseQuery)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	debts := []models.Debt{}

	for rows.Next() {
		var d models.Debt
		if err := rows.Scan(&d.ID, &d.Address, &d.Amount, &d.Deadline); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		debts = append(debts, d)
	}

	c.JSON(http.StatusOK, debts)
}
