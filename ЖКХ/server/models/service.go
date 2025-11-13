package models

// Услуга
type Service struct {
	ID       int     `json:"id"`
	Name     string  `json:"name"`
	Category string  `json:"category"`
	Price    float64 `json:"price"`
	Status   string  `json:"status"` // "active" или "archive"
}
