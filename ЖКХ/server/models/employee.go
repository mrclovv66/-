package models

type Employee struct {
	ID       int    `json:"id"`
	FullName string `json:"fullName"`
	Phone    string `json:"phone"`
	Role     string `json:"role"`
}

// Для создания
type EmployeeCreate struct {
	FullName string `json:"fullName"`
	Phone    string `json:"phone"`
	Password string `json:"password"`
}

// Для обновления
type EmployeeUpdate struct {
	FullName string  `json:"fullName"`
	Phone    string  `json:"phone"`
	Password *string `json:"password"` // nil — не менять
	Archived bool    `json:"archived"` // true → archive
}
