package handlers

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	// PDF
	excelize "github.com/xuri/excelize/v2" // Excel
)

//////////////////////////////////////////////////////////
// 📌 A — Отчёт по начислениям и платежам
//////////////////////////////////////////////////////////

// ===== Начисления и платежи =====

//////////////////////////////////////////////////////////
// 📌 A — Отчёт по начислениям и платежам
//////////////////////////////////////////////////////////

type PaymentsReportRow struct {
	DocNumber string  `json:"docNumber"`
	Address   string  `json:"address"`
	Month     string  `json:"month"`
	Service   string  `json:"service"`
	Accrued   float64 `json:"accrued"`
	Paid      float64 `json:"paid"`
	Debt      float64 `json:"debt"`
}

type PaymentsReport struct {
	Rows   []PaymentsReportRow `json:"rows"`
	Totals struct {
		Accrued float64 `json:"accrued"`
		Paid    float64 `json:"paid"`
		Debt    float64 `json:"debt"`
	} `json:"totals"`
}

func GetPaymentsReport(c *gin.Context, db *sql.DB) {
	from := c.Query("from")
	to := c.Query("to")
	service := c.Query("service")

	if from == "" || to == "" {
		c.JSON(400, gin.H{"error": "from/to required"})
		return
	}

	// Общая часть SQL
	baseQuery := `
SELECT 
	rows.Номер_документа,
	rows.Адрес,
	rows.Месяц,
	rows.Услуга,
	rows.Начислено,
	rows.Оплачено,
	rows.Долг,
	totals.AccruedTotal,
	totals.PaidTotal,
	totals.DebtTotal
FROM
(
	SELECT 
		e.Номер_документа,
		e.Адрес,
		FORMAT(e.Расчётный_месяц, 'yyyy-MM') AS Месяц,
		d.Наименование_услуги AS Услуга,
		d.Сумма AS Начислено,
		CASE WHEN e.Оплачен = 1 THEN d.Сумма ELSE 0 END AS Оплачено,
		CASE WHEN e.Оплачен = 1 THEN 0 ELSE d.Сумма END AS Долг
	FROM ЕПД e
	JOIN Данные_об_услуге d 
	    ON e.Номер_документа = d.Номер_ЕПД
	WHERE e.Расчётный_месяц BETWEEN @p1 AND @p2
) rows
CROSS JOIN
(
	SELECT 
		SUM(d.Сумма) AS AccruedTotal,
		SUM(CASE WHEN e.Оплачен = 1 THEN d.Сумма ELSE 0 END) AS PaidTotal,
		SUM(CASE WHEN e.Оплачен = 1 THEN 0 ELSE d.Сумма END) AS DebtTotal
	FROM ЕПД e
	JOIN Данные_об_услуге d 
	    ON e.Номер_документа = d.Номер_ЕПД
	WHERE e.Расчётный_месяц BETWEEN @p1 AND @p2
) totals
`

	// Фильтр по услуге
	if service != "" {
		baseQuery += " WHERE rows.Услуга = @p3"
	}

	var rowsSQL *sql.Rows
	var err error

	if service == "" {
		rowsSQL, err = db.Query(baseQuery, from+"-01", to+"-28")
	} else {
		rowsSQL, err = db.Query(baseQuery, from+"-01", to+"-28", service)
	}

	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	defer rowsSQL.Close()

	report := PaymentsReport{}

	for rowsSQL.Next() {
		var r PaymentsReportRow
		var totAcc, totPaid, totDebt float64

		err := rowsSQL.Scan(
			&r.DocNumber, &r.Address, &r.Month, &r.Service,
			&r.Accrued, &r.Paid, &r.Debt,
			&totAcc, &totPaid, &totDebt,
		)
		if err != nil {
			continue
		}

		report.Rows = append(report.Rows, r)

		// Итоги одинаковые во всех строках — берём из любой
		report.Totals.Accrued = totAcc
		report.Totals.Paid = totPaid
		report.Totals.Debt = totDebt
	}

	// Если данных нет — возвращаем пустой отчёт
	if len(report.Rows) == 0 {
		report.Totals.Accrued = 0
		report.Totals.Paid = 0
		report.Totals.Debt = 0
	}

	c.JSON(200, report)
}

//////////////////////////////////////////////////////////
// 📄 Excel: A — начисления/платежи
//////////////////////////////////////////////////////////

func DownloadPaymentsExcel(c *gin.Context, db *sql.DB) {
	from := c.Query("from")
	to := c.Query("to")
	service := c.Query("service")

	if from == "" || to == "" {
		c.JSON(400, gin.H{"error": "from/to required"})
		return
	}

	// SQL тот же что и в JSON
	query := `
SELECT 
	rows.Номер_документа,
	rows.Адрес,
	rows.Месяц,
	rows.Услуга,
	rows.Начислено,
	rows.Оплачено,
	rows.Долг,
	totals.AccruedTotal,
	totals.PaidTotal,
	totals.DebtTotal
FROM
(
	SELECT 
		e.Номер_документа,
		e.Адрес,
		FORMAT(e.Расчётный_месяц, 'yyyy-MM') AS Месяц,
		d.Наименование_услуги AS Услуга,
		d.Сумма AS Начислено,
		CASE WHEN e.Оплачен = 1 THEN d.Сумма ELSE 0 END AS Оплачено,
		CASE WHEN e.Оплачен = 1 THEN 0 ELSE d.Сумма END AS Долг
	FROM ЕПД e
	JOIN Данные_об_услуге d 
	    ON e.Номер_документа = d.Номер_ЕПД
	WHERE e.Расчётный_месяц BETWEEN @p1 AND @p2
) rows
CROSS JOIN
(
	SELECT 
		SUM(d.Сумма) AS AccruedTotal,
		SUM(CASE WHEN e.Оплачен = 1 THEN d.Сумма ELSE 0 END) AS PaidTotal,
		SUM(CASE WHEN e.Оплачен = 1 THEN 0 ELSE d.Сумма END) AS DebtTotal
	FROM ЕПД e
	JOIN Данные_об_услуге d 
	    ON e.Номер_документа = d.Номер_ЕПД
	WHERE e.Расчётный_месяц BETWEEN @p1 AND @p2
) totals
`

	if service != "" {
		query += " WHERE rows.Услуга = @p3"
	}

	var rowsSQL *sql.Rows
	var err error

	if service == "" {
		rowsSQL, err = db.Query(query, from+"-01", to+"-28")
	} else {
		rowsSQL, err = db.Query(query, from+"-01", to+"-28", service)
	}

	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	defer rowsSQL.Close()

	type Row struct {
		Doc, Addr, Month, Serv   string
		Accrued, Paid, Debt      float64
		TotAcc, TotPaid, TotDebt float64
	}

	var rows []Row

	for rowsSQL.Next() {
		var r Row
		rowsSQL.Scan(
			&r.Doc, &r.Addr, &r.Month, &r.Serv,
			&r.Accrued, &r.Paid, &r.Debt,
			&r.TotAcc, &r.TotPaid, &r.TotDebt,
		)
		rows = append(rows, r)
	}

	if len(rows) == 0 {
		c.JSON(400, gin.H{"error": "no data"})
		return
	}

	// == EXCEL ==
	f := excelize.NewFile()
	sheet := "Report"
	f.NewSheet(sheet)

	// Заголовки
	headers := []string{"Документ", "Адрес", "Месяц", "Услуга", "Начислено", "Оплачено", "Долг"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
	}

	rowIndex := 2
	for _, r := range rows {
		f.SetCellValue(sheet, fmt.Sprintf("A%d", rowIndex), r.Doc)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", rowIndex), r.Addr)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", rowIndex), r.Month)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", rowIndex), r.Serv)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", rowIndex), r.Accrued)
		f.SetCellValue(sheet, fmt.Sprintf("F%d", rowIndex), r.Paid)
		f.SetCellValue(sheet, fmt.Sprintf("G%d", rowIndex), r.Debt)
		rowIndex++
	}

	// Итоги
	f.SetCellValue(sheet, fmt.Sprintf("D%d", rowIndex+1), "ИТОГО:")
	f.SetCellValue(sheet, fmt.Sprintf("E%d", rowIndex+1), rows[0].TotAcc)
	f.SetCellValue(sheet, fmt.Sprintf("F%d", rowIndex+1), rows[0].TotPaid)
	f.SetCellValue(sheet, fmt.Sprintf("G%d", rowIndex+1), rows[0].TotDebt)

	// Удаляем Sheet1
	if idx, err := f.GetSheetIndex("Sheet1"); err == nil && idx != -1 {
		f.DeleteSheet("Sheet1")
	}

	buf, _ := f.WriteToBuffer()

	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", "attachment; filename=payments_report.xlsx")
	c.Data(200, "application/octet-stream", buf.Bytes())
}

//////////////////////////////////////////////////////////
// 📌 B — Потребление ресурсов
//////////////////////////////////////////////////////////
//
// ==============================
//    СТРУКТУРЫ ОТЧЁТОВ
// ==============================
//

type ConsumptionRow struct {
	DocNumber string  `json:"docNumber"`
	Address   string  `json:"address"`
	Month     string  `json:"month"`
	Hot       float64 `json:"hotWater"`
	Cold      float64 `json:"coldWater"`
	Total     float64 `json:"total"`
}

type ConsumptionReport struct {
	Rows   []ConsumptionRow `json:"rows"`
	Totals struct {
		Hot   float64 `json:"hot"`
		Cold  float64 `json:"cold"`
		Total float64 `json:"total"`
	} `json:"totals"`
}

//
// ==============================
//   ОТЧЁТ ПО ПОТРЕБЛЕНИЮ
//   (JSON для фронта)
// ==============================
//

func GetConsumptionReport(c *gin.Context, db *sql.DB) {
	from := c.Query("from")
	to := c.Query("to")

	if from == "" || to == "" {
		c.JSON(400, gin.H{"error": "from/to required"})
		return
	}

	query := `
SELECT 
	rows.Номер_документа,
	rows.Адрес,
	rows.Месяц,
	rows.Горячая_вода,
	rows.Холодная_вода,
	rows.Сумма,
	totals.HotTotal,
	totals.ColdTotal,
	totals.TotalRub
FROM
(
	SELECT 
		e.Номер_документа,
		e.Адрес,
		FORMAT(e.Расчётный_месяц, 'yyyy-MM') AS Месяц,
		p.Горячая_вода,
		p.Холодная_вода,
		e.Сумма
	FROM ЕПД e
	JOIN Показание_счётчиков p
		ON e.Номер_документа = p.Номер_документа
	WHERE e.Расчётный_месяц BETWEEN @p1 AND @p2
) rows
CROSS JOIN
(
	SELECT 
		SUM(p.Горячая_вода) AS HotTotal,
		SUM(p.Холодная_вода) AS ColdTotal,
		SUM(e.Сумма) AS TotalRub
	FROM ЕПД e
	JOIN Показание_счётчиков p
		ON e.Номер_документа = p.Номер_документа
	WHERE e.Расчётный_месяц BETWEEN @p1 AND @p2
) totals;
`

	rowsSQL, err := db.Query(query, from+"-01", to+"-28")
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	defer rowsSQL.Close()

	report := ConsumptionReport{}

	for rowsSQL.Next() {
		var r ConsumptionRow
		var hotTotal, coldTotal, totalAmount float64

		err := rowsSQL.Scan(
			&r.DocNumber,
			&r.Address,
			&r.Month,
			&r.Hot,
			&r.Cold,
			&r.Total,
			&hotTotal,
			&coldTotal,
			&totalAmount,
		)

		if err != nil {
			continue
		}

		report.Rows = append(report.Rows, r)
		report.Totals.Hot = hotTotal
		report.Totals.Cold = coldTotal
		report.Totals.Total = totalAmount
	}

	c.JSON(200, report)
}

//
// ==============================
//   EXCEL ПО ПОТРЕБЛЕНИЮ
//   (с итоговой строкой)
// ==============================
//

func DownloadConsumptionExcel(c *gin.Context, db *sql.DB) {
	from := c.Query("from")
	to := c.Query("to")

	if from == "" || to == "" {
		c.JSON(400, gin.H{"error": "from/to required"})
		return
	}

	// получаем структуру отчёта через SQL
	query := `
SELECT 
	rows.Номер_документа,
	rows.Адрес,
	rows.Месяц,
	rows.Горячая_вода,
	rows.Холодная_вода,
	rows.Сумма,
	totals.HotTotal,
	totals.ColdTotal,
	totals.TotalRub
FROM
(
	SELECT 
		e.Номер_документа,
		e.Адрес,
		FORMAT(e.Расчётный_месяц, 'yyyy-MM') AS Месяц,
		p.Горячая_вода,
		p.Холодная_вода,
		e.Сумма
	FROM ЕПД e
	JOIN Показание_счётчиков p
		ON e.Номер_документа = p.Номер_документа
	WHERE e.Расчётный_месяц BETWEEN @p1 AND @p2
) rows
CROSS JOIN
(
	SELECT 
		SUM(p.Горячая_вода) AS HotTotal,
		SUM(p.Холодная_вода) AS ColdTotal,
		SUM(e.Сумма) AS TotalRub
	FROM ЕПД e
	JOIN Показание_счётчиков p
		ON e.Номер_документа = p.Номер_документа
	WHERE e.Расчётный_месяц BETWEEN @p1 AND @p2
) totals;
`

	rowsSQL, err := db.Query(query, from+"-01", to+"-28")
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	defer rowsSQL.Close()

	var rows []ConsumptionRow
	var totalsHot, totalsCold, totalsTotal float64

	for rowsSQL.Next() {
		var r ConsumptionRow
		err := rowsSQL.Scan(
			&r.DocNumber,
			&r.Address,
			&r.Month,
			&r.Hot,
			&r.Cold,
			&r.Total,
			&totalsHot,
			&totalsCold,
			&totalsTotal,
		)

		if err != nil {
			continue
		}
		rows = append(rows, r)
	}

	if len(rows) == 0 {
		c.JSON(400, gin.H{"error": "no data"})
		return
	}

	//
	// ===== EXCEL =====
	//

	f := excelize.NewFile()
	sheet := "Report"
	f.NewSheet(sheet)

	// Заголовки
	headers := []string{"Документ", "Адрес", "Месяц", "Горячая", "Холодная", "Сумма"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
	}

	// Заполняем строки
	rowIndex := 2
	for _, r := range rows {
		f.SetCellValue(sheet, fmt.Sprintf("A%d", rowIndex), r.DocNumber)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", rowIndex), r.Address)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", rowIndex), r.Month)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", rowIndex), r.Hot)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", rowIndex), r.Cold)
		f.SetCellValue(sheet, fmt.Sprintf("F%d", rowIndex), r.Total)
		rowIndex++
	}

	// Итоги
	f.SetCellValue(sheet, fmt.Sprintf("C%d", rowIndex+1), "ИТОГО:")
	f.SetCellValue(sheet, fmt.Sprintf("D%d", rowIndex+1), totalsHot)
	f.SetCellValue(sheet, fmt.Sprintf("E%d", rowIndex+1), totalsCold)
	f.SetCellValue(sheet, fmt.Sprintf("F%d", rowIndex+1), totalsTotal)

	// Убираем Sheet1, если он существует
	if idx, err := f.GetSheetIndex("Sheet1"); err == nil && idx != -1 {
		f.DeleteSheet("Sheet1")
	}

	// Формируем буфер Excel файла
	buf, err := f.WriteToBuffer()
	if err != nil {
		c.String(http.StatusInternalServerError, "Ошибка формирования файла")
		return
	}

	// Отдаём файл пользователю
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", "attachment; filename=report.xlsx")
	c.Header("File-Name", "report.xlsx")

	c.Data(http.StatusOK, "application/octet-stream", buf.Bytes())

}

//////////////////////////////////////////////////////////
// 📌 C — Должники
//////////////////////////////////////////////////////////

type DebtorRow struct {
	Address  string  `json:"address"`
	FullName string  `json:"fullName"`
	Phone    string  `json:"phone"`
	Debt     float64 `json:"debt"`
}

func GetDebtors(c *gin.Context, db *sql.DB) {
	month := c.Query("month")

	query := `
		SELECT
			e.Адрес,
			c.ФИО,
			c.Номер_телефона,
			SUM(d.Сумма) AS Долг
		FROM ЕПД e
		JOIN Данные_об_услуге d ON d.Номер_ЕПД = e.Номер_документа
		JOIN Квартира k ON k.Адрес = e.Адрес
		JOIN Клиент c ON c.Id_клиента = k.Id_владельца
		WHERE FORMAT(e.Расчётный_месяц, 'yyyy-MM') = @p1
		  AND e.Оплачен = 0
		GROUP BY e.Адрес, c.ФИО, c.Номер_телефона
		ORDER BY e.Адрес
	`

	rows, err := db.Query(query, month)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	result := []DebtorRow{}

	for rows.Next() {
		var r DebtorRow
		err := rows.Scan(&r.Address, &r.FullName, &r.Phone, &r.Debt)
		if err == nil {
			result = append(result, r)
		}
	}

	c.JSON(200, result)
}

//////////////////////////////////////////////////////////
// 🧾 Excel: должники
//////////////////////////////////////////////////////////

func DownloadDebtorsExcel(c *gin.Context, db *sql.DB) {
	month := c.Query("month")
	if month == "" {
		c.JSON(400, gin.H{"error": "month required"})
		return
	}

	// Загружаем данные
	query := `
		SELECT
			e.Адрес,
			c.ФИО,
			c.Номер_телефона,
			SUM(d.Сумма) AS Долг
		FROM ЕПД e
		JOIN Данные_об_услуге d ON d.Номер_ЕПД = e.Номер_документа
		JOIN Квартира k ON k.Адрес = e.Адрес
		JOIN Клиент c ON c.Id_клиента = k.Id_владельца
		WHERE FORMAT(e.Расчётный_месяц, 'yyyy-MM') = @p1 AND e.Оплачен = 0
		GROUP BY e.Адрес, c.ФИО, c.Номер_телефона
	`

	rows, err := db.Query(query, month)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	// Создаем Excel
	f := excelize.NewFile()
	sheet := "Debtors"
	f.NewSheet(sheet)

	// ================================
	//  📌 Записываем месяц в Excel
	// ================================

	f.SetCellValue(sheet, "A1", "Отчёт по должникам")
	f.SetCellValue(sheet, "A2", "Месяц:")
	f.SetCellValue(sheet, "B2", month)

	// Заголовки таблицы (начинаем с 4 строки)
	headers := []string{"Адрес", "ФИО", "Телефон", "Долг"}

	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 4)
		f.SetCellValue(sheet, cell, h)
	}

	// Заполняем таблицу
	rowIndex := 5

	for rows.Next() {
		var address, fio, phone string
		var debt float64

		rows.Scan(&address, &fio, &phone, &debt)

		f.SetCellValue(sheet, fmt.Sprintf("A%d", rowIndex), address)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", rowIndex), fio)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", rowIndex), phone)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", rowIndex), debt)
		rowIndex++
	}

	// Удаляем Sheet1
	if idx, _ := f.GetSheetIndex("Sheet1"); idx != -1 {
		f.DeleteSheet("Sheet1")
	}

	// Генерация файла
	buf, err := f.WriteToBuffer()
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", "attachment; filename=debtors_"+month+".xlsx")
	c.Data(200, "application/octet-stream", buf.Bytes())
}

// =============================================
//  E — История платежей
// =============================================

type HistoryRow struct {
	Date      string  `json:"date"`
	DocNumber string  `json:"docNumber"`
	Address   string  `json:"address"`
	Amount    float64 `json:"amount"`
}

type HistoryReport struct {
	Rows   []HistoryRow `json:"rows"`
	Totals struct {
		TotalAmount float64 `json:"totalAmount"`
		Count       int     `json:"count"`
	} `json:"totals"`
}

// ---------- GET /api/reports/history ----------
func GetPaymentHistory(c *gin.Context, db *sql.DB) {
	from := c.Query("from")
	to := c.Query("to")
	address := c.Query("address")

	if from == "" || to == "" {
		c.JSON(400, gin.H{"error": "from/to required"})
		return
	}

	query := `
		SELECT 
			FORMAT(Дата_оплаты, 'yyyy-MM-dd'),
			Номер_документа,
			Адрес,
			Сумма
		FROM Платежи
		WHERE Дата_оплаты BETWEEN @p1 AND @p2
	`
	if address != "" {
		query += " AND Адрес = @p3"
	}

	var rows *sql.Rows
	var err error

	if address == "" {
		rows, err = db.Query(query, from, to)
	} else {
		rows, err = db.Query(query, from, to, address)
	}

	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	report := HistoryReport{}
	var total float64
	var count int

	for rows.Next() {
		var r HistoryRow
		if err := rows.Scan(&r.Date, &r.DocNumber, &r.Address, &r.Amount); err != nil {
			continue
		}
		report.Rows = append(report.Rows, r)
		total += r.Amount
		count++
	}

	report.Totals.TotalAmount = total
	report.Totals.Count = count

	c.JSON(200, report)
}

// ---------- GET /api/reports/history/excel ----------
func DownloadHistoryExcel(c *gin.Context, db *sql.DB) {
	from := c.Query("from")
	to := c.Query("to")
	address := c.Query("address")

	if from == "" || to == "" {
		c.JSON(400, gin.H{"error": "from/to required"})
		return
	}

	query := `
		SELECT 
			FORMAT(Дата_оплаты, 'yyyy-MM-dd'),
			Номер_документа,
			Адрес,
			Сумма
		FROM Платежи
		WHERE Дата_оплаты BETWEEN @p1 AND @p2
	`
	if address != "" {
		query += " AND Адрес = @p3"
	}

	var rows *sql.Rows
	var err error

	if address == "" {
		rows, err = db.Query(query, from, to)
	} else {
		rows, err = db.Query(query, from, to, address)
	}

	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	f := excelize.NewFile()
	sheet := "History"
	f.NewSheet(sheet)

	headers := []string{"Дата", "Документ", "Адрес", "Сумма"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
	}

	row := 2
	total := 0.0

	for rows.Next() {
		var date, doc, addr string
		var amount float64

		rows.Scan(&date, &doc, &addr, &amount)

		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), date)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), doc)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), addr)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), amount)

		total += amount
		row++
	}

	f.SetCellValue(sheet, fmt.Sprintf("C%d", row+1), "ИТОГО:")
	f.SetCellValue(sheet, fmt.Sprintf("D%d", row+1), total)

	if _, err := f.GetSheetIndex("Sheet1"); err == nil {
		f.DeleteSheet("Sheet1")
	}

	buf, _ := f.WriteToBuffer()

	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", "attachment; filename=history.xlsx")
	c.Data(200, "application/octet-stream", buf.Bytes())
}

// ---------- GET /api/addresses ----------
func GetAllAddresses(c *gin.Context, db *sql.DB) {
	rows, err := db.Query("SELECT Адрес FROM Квартира ORDER BY Адрес")
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	list := []string{}
	for rows.Next() {
		var addr string
		rows.Scan(&addr)
		list = append(list, addr)
	}

	c.JSON(200, list)
}
