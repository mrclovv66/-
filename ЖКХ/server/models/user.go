package models

// Пользователи системы (админ / сотрудник / клиент)
type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Password string `json:"password"`
	Role     string `json:"role"`
}
