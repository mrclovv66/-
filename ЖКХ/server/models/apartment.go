package models

// Квартира
type Apartment struct {
	Address  string `json:"address"`
	ClientID *int   `json:"client_id"`
	Rooms    int    `json:"rooms"`
	Area     int    `json:"area"`
}
