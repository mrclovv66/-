package models

// Показания счётчиков
type Meter struct {
	ID           int     `json:"id"`
	DocNumber    string  `json:"doc_number"`
	Address      string  `json:"address"`
	BillingMonth string  `json:"billingMonth"`
	HotWater     float64 `json:"hotWater"`
	ColdWater    float64 `json:"coldWater"`
}
