package models

// Единый платёжный документ (ЕПД)
type EPD struct {
	DocNumber    string  `json:"docNumber"`
	Address      string  `json:"address"`
	BillingMonth string  `json:"billingMonth"`
	TotalAmount  float64 `json:"totalAmount"`
	Paid         bool    `json:"paid"`
}
