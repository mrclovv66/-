package models

type Debt struct {
	ID       int    `json:"id"`       // Номер
	Address  string `json:"address"`  // Адрес
	Amount   int    `json:"amount"`   // Сумма
	Deadline string `json:"deadline"` // Срок выплаты
}
