package models

// Клиент (жильцы)
type Client struct {
	ID       int    `json:"id"`
	FullName string `json:"fullName"`
	Phone    string `json:"phone"`
	Password string `json:"password,omitempty"`
}
