package models

// Задолженности
type Debt struct {
	ID      int     `json:"id"`
	Address string  `json:"address"`
	Amount  float64 `json:"amount"`
	DueDate string  `json:"dueDate"`
}
