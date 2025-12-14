package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var JwtSecret = []byte("super-secret-key") // ✅ теперь это переменная, доступная извне

type Claims struct {
	ClientID int    `json:"client_id"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// ======== Авторизация ========
func LoginHandler(c *gin.Context, db *sql.DB) {
	var creds struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&creds); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат запроса"})
		return
	}

	// ============================================
	// 1. РУКОВОДИТЕЛЬ (общая учётка)
	// ============================================
	if creds.Username == "admin" && creds.Password == "adm123" {
		token := generateToken(0, "admin")
		c.JSON(http.StatusOK, gin.H{
			"token": token,
			"role":  "admin",
		})
		return
	}

	// ============================================
	// 2. СОТРУДНИК (общая учётка)
	// ============================================
	if creds.Username == "employee" && creds.Password == "emp123" {
		token := generateToken(0, "employee")
		c.JSON(http.StatusOK, gin.H{
			"token": token,
			"role":  "employee",
		})
		return
	}

	// ============================================
	// 3. КЛИЕНТ (из БД)
	// ============================================
	var clientID int
	var dbPassword string

	err := db.QueryRow(`
		SELECT Id_клиента, Пароль
		FROM Клиент
		WHERE Номер_телефона = @p1
	`, creds.Username).Scan(&clientID, &dbPassword)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не найден"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка БД"})
		return
	}

	if creds.Password != dbPassword {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный пароль"})
		return
	}

	token := generateToken(clientID, "client")

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"role":  "client",
	})
}

// ============================================
// Вспомогательная функция генерации JWT
// ============================================
func generateToken(clientID int, role string) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, &Claims{
		ClientID: clientID,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	})

	tokenString, _ := token.SignedString(JwtSecret)
	return tokenString
}

// ======== Профиль ========
func ProfileHandler(c *gin.Context, db *sql.DB) {
	clientID, exists := c.Get("client_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var fullName, phone string
	rows := []gin.H{}

	err := db.QueryRow(`SELECT [ФИО], [Номер_телефона] FROM [Клиент] WHERE [Id_клиента] = @p1`, clientID).
		Scan(&fullName, &phone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка загрузки профиля"})
		return
	}

	apRows, err := db.Query(`SELECT [Адрес] FROM [Квартира] WHERE [Id_владельца] = @p1`, clientID)
	if err == nil {
		defer apRows.Close()
		for apRows.Next() {
			var addr string
			apRows.Scan(&addr)
			rows = append(rows, gin.H{"address": addr})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"fullName":   fullName,
		"phone":      phone,
		"apartments": rows,
	})
}
