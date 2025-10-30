// ЖКХ/server/handlers/clients.go
package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"server/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetClients(c *gin.Context, db *sql.DB) {
	rows, err := db.Query("SELECT Id_клиента, ФИО, Номер_телефона FROM Клиент WHERE Роль = 'client'")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var clients []models.Client

	for rows.Next() {
		var client models.Client
		if err := rows.Scan(&client.ID, &client.FullName, &client.Phone); err != nil {
			fmt.Println("Ошибка при Scan:", err)
		}
		fmt.Printf("Клиент: ID=%d, ФИО=%q, Телефон=%q\n", client.ID, client.FullName, client.Phone)
		clients = append(clients, client)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, clients)
}

func CreateClient(c *gin.Context, db *sql.DB) {
	var client models.Client
	if err := c.BindJSON(&client); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Если пароль не передан — ставим значение по умолчанию
	if client.Password == "" {
		client.Password = "1234"
	}

	_, err := db.Exec(`
		INSERT INTO [Клиент] ([ФИО], [Номер_телефона], [Пароль], [Роль])
		VALUES (@p1, @p2, @p3, @p4)
	`, client.FullName, client.Phone, client.Password, "client")

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Client created"})
}

func UpdateClient(c *gin.Context, db *sql.DB) {
	id, _ := strconv.Atoi(c.Param("id"))
	var client models.Client
	if err := c.BindJSON(&client); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err := db.Exec("UPDATE [Клиент] SET [ФИО]=@p1, [Номер_телефона]=@p2 WHERE [Id_клиента]=@p3",
		client.FullName, client.Phone, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Client updated"})
}

func DeleteClient(c *gin.Context, db *sql.DB) {
	id, _ := strconv.Atoi(c.Param("id"))

	// Вызываем хранимую процедуру
	_, err := db.Exec("EXEC УдалитьКлиента @Id_клиента = @p1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Клиент и связанные данные успешно удалены"})
}
