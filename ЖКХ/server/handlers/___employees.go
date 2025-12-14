// ЖКХ/server/handlers/employees.go
package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"server/models"

	"github.com/gin-gonic/gin"
)

// ===== Получить сотрудников (текущие / архив) =====
func GetEmployees(c *gin.Context, db *sql.DB) {
	viewType := c.DefaultQuery("type", "employee") // employee | archive_employee
	search := c.Query("search")

	query := `
		SELECT Id_клиента, ФИО, Номер_телефона, Роль
		FROM Клиент
		WHERE Роль = @p1
	`
	args := []any{viewType}

	if search != "" {
		query += " AND (ФИО LIKE '%' + @p2 + '%' OR Номер_телефона LIKE '%' + @p2 + '%')"
		args = append(args, search)
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var list []models.Employee
	for rows.Next() {
		var e models.Employee
		if err := rows.Scan(&e.ID, &e.FullName, &e.Phone, &e.Role); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		list = append(list, e)
	}

	c.JSON(http.StatusOK, list)
}

// ===== Добавить сотрудника =====
func CreateEmployee(c *gin.Context, db *sql.DB) {
	var emp models.EmployeeCreate
	if err := c.BindJSON(&emp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
		return
	}

	if emp.FullName == "" || emp.Phone == "" || emp.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ФИО, телефон и пароль обязательны"})
		return
	}

	_, err := db.Exec(`
		INSERT INTO Клиент (ФИО, Номер_телефона, Пароль, Роль)
		VALUES (@p1, @p2, @p3, 'employee')
	`, emp.FullName, emp.Phone, emp.Password)

	if err != nil {

		// Проверка UNIQUE KEY (номер телефона уже существует)
		if strings.Contains(err.Error(), "UQ__Клиент") ||
			strings.Contains(err.Error(), "UNIQUE") {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Сотрудник с таким телефоном уже существует",
			})
			return
		}

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Сотрудник успешно добавлен"})
}

// ===== Обновить сотрудника (ФИО, телефон, пароль, архивность) =====
func UpdateEmployee(c *gin.Context, db *sql.DB) {
	id, _ := strconv.Atoi(c.Param("id"))

	var emp models.EmployeeUpdate
	if err := c.BindJSON(&emp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат JSON"})
		return
	}

	role := "employee"
	if emp.Archived {
		role = "archive_employee"
	}

	if emp.Password != nil && *emp.Password != "" {
		_, err := db.Exec(`
			UPDATE Клиент
			SET ФИО = @p1,
			    Номер_телефона = @p2,
			    Пароль = @p3,
			    Роль = @p4
			WHERE Id_клиента = @p5
		`, emp.FullName, emp.Phone, *emp.Password, role, id)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else {
		_, err := db.Exec(`
			UPDATE Клиент
			SET ФИО = @p1,
			    Номер_телефона = @p2,
			    Роль = @p3
			WHERE Id_клиента = @p4
		`, emp.FullName, emp.Phone, role, id)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Сотрудник обновлён"})
}

// ===== Архивировать сотрудника =====
func ArchiveEmployee(c *gin.Context, db *sql.DB) {
	id, _ := strconv.Atoi(c.Param("id"))

	_, err := db.Exec(`
		UPDATE Клиент
		SET Роль = 'archive_employee'
		WHERE Id_клиента = @p1 AND Роль = 'employee'
	`, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Сотрудник архивирован"})
}

// ===== Восстановить сотрудника (НЕ меняем ФИО/телефон) =====
func RestoreEmployee(c *gin.Context, db *sql.DB) {
	id, _ := strconv.Atoi(c.Param("id"))

	_, err := db.Exec(`
		UPDATE Клиент
		SET Роль = 'employee'
		WHERE Id_клиента = @p1 AND Роль = 'archive_employee'
	`, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Сотрудник восстановлен"})
}
