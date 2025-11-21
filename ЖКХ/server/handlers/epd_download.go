package handlers

import (
	"bytes"
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jung-kurt/gofpdf"
	qrcode "github.com/skip2/go-qrcode"
)

// Строка услуги для расшифровки
type ServiceItem struct {
	Name   string
	Amount int
}

// Показания счётчиков для ЕПД
type MeterItem struct {
	Hot   int
	Cold  int
	Month time.Time
}

func DownloadEPD(c *gin.Context, db *sql.DB) {
	doc := c.Param("doc")

	// client_id из JWT, как в профиле
	clientID, exists := c.Get("client_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// ===== 1. Забираем данные по ЕПД + клиенту =====
	var (
		address  string
		sum      int
		month    time.Time
		fullName string
	)

	err := db.QueryRow(`
		SELECT 
			e.[Адрес],
			e.[Сумма],
			e.[Расчётный_месяц],
			c.[ФИО]
		FROM [ЕПД] e
		JOIN [Квартира] k ON e.[Адрес] = k.[Адрес]
		JOIN [Клиент]  c ON k.[Id_владельца] = c.[Id_клиента]
		WHERE e.[Номер_документа] = @p1
		AND c.[Id_клиента]      = @p2
	`, doc, clientID).Scan(&address, &sum, &month, &fullName)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "ЕПД не найден или не принадлежит клиенту"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка чтения ЕПД: " + err.Error()})
		}
		return
	}

	// Лицевой счёт = Id клиента (по твоему ответу)
	accountNumber := fmt.Sprintf("%v", clientID)
	monthStr := month.Format("01.2006") // например: 03.2025
	printDate := time.Now().Format("02.01.2006")

	// ===== 2. Подтягиваем расшифровку услуг =====
	rows, err := db.Query(`
		SELECT [Наименование_услуги], [Сумма]
		FROM [Данные_об_услуге]
		WHERE [Номер_ЕПД] = @p1
	`, doc)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка чтения услуг: " + err.Error()})
		return
	}
	defer rows.Close()

	var services []ServiceItem
	for rows.Next() {
		var s ServiceItem
		if err := rows.Scan(&s.Name, &s.Amount); err == nil {
			services = append(services, s)
		}
	}

	// ===== 3. Показания счётчиков для этого ЕПД =====
	var meter MeterItem
	var hasMeter bool

	err = db.QueryRow(`
		SELECT [Горячая_вода], [Холодная_вода], [Расчётный_месяц]
		FROM [Показание_счётчиков]
		WHERE [Номер_документа] = @p1
	`, doc).Scan(&meter.Hot, &meter.Cold, &meter.Month)

	if err == nil {
		hasMeter = true
	} else if err != sql.ErrNoRows {
		// если ошибка какая-то другая — просто логически игнорируем таблицу
		hasMeter = false
	}

	// ===== 4. Генерируем QR-код =====
	// Строка для QR — как будто платёжка (можешь потом заменить форматом банка)
	payString := fmt.Sprintf("EPD|%s|%s|%s|%d|%s", doc, accountNumber, address, sum, monthStr)

	qrPng, err := qrcode.Encode(payString, qrcode.Medium, 260)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка генерации QR: " + err.Error()})
		return
	}

	// ===== 5. Создаём PDF =====
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(10, 10, 10)
	pdf.AddPage()

	// --- Подключаем UTF-8 шрифт (чтобы не было кракозябр) ---
	pdf.AddUTF8Font("dejavu", "", "assets/fonts/DejaVuSans.ttf")
	pdf.AddUTF8Font("dejavu", "B", "assets/fonts/DejaVuSans.ttf")

	// Логотип (если есть)
	pdf.ImageOptions(
		"assets/logo.png",
		9, 3, 25, 0,
		false,
		gofpdf.ImageOptions{ImageType: "PNG"},
		0, "",
	)

	// Заголовок
	pdf.SetFont("dejavu", "B", 14)
	pdf.SetXY(10, 10)
	pdf.CellFormat(0, 8, "ЕДИНЫЙ ПЛАТЁЖНЫЙ ДОКУМЕНТ", "", 1, "C", false, 0, "")

	pdf.Ln(4)

	// ===== 6. Верхний блок (слева и справа) =====
	pdf.SetFont("dejavu", "", 9)

	// Левая колонка
	xLeft := 10.0
	yTop := pdf.GetY()

	pdf.SetXY(xLeft, yTop)
	pdf.CellFormat(0, 5, fmt.Sprintf("Единый лицевой счёт: %s", accountNumber), "", 1, "L", false, 0, "")
	pdf.SetX(xLeft)
	pdf.CellFormat(0, 5, fmt.Sprintf("Ф.И.О.: %s", fullName), "", 1, "L", false, 0, "")
	pdf.SetX(xLeft)
	pdf.CellFormat(0, 5, fmt.Sprintf("Адрес: %s", address), "", 1, "L", false, 0, "")

	// Правая колонка
	xRight := 120.0
	pdf.SetXY(xRight, yTop)
	pdf.CellFormat(0, 5, fmt.Sprintf("Расчётный период: %s", monthStr), "", 1, "L", false, 0, "")
	pdf.SetX(xRight)
	pdf.CellFormat(0, 5, fmt.Sprintf("Дата выписки квитанции: %s", printDate), "", 1, "L", false, 0, "")
	pdf.SetX(xRight)
	pdf.CellFormat(0, 5, fmt.Sprintf("К оплате: %d руб.", sum), "", 1, "L", false, 0, "")

	pdf.Ln(6)

	// ===== 7. Таблица показаний счётчиков =====
	if hasMeter {
		pdf.SetFont("dejavu", "B", 10)
		pdf.CellFormat(0, 6, "Показания приборов учета", "", 1, "L", false, 0, "")
		pdf.SetFont("dejavu", "B", 9)

		col1 := 70.0
		col2 := 40.0
		col3 := 40.0
		rowH := 6.0

		pdf.CellFormat(col1, rowH, "Наименование услуги", "1", 0, "C", true, 0, "")
		pdf.CellFormat(col2, rowH, "Текущие показания", "1", 0, "C", true, 0, "")
		pdf.CellFormat(col3, rowH, "Месяц", "1", 0, "C", true, 0, "")
		pdf.Ln(-1)

		pdf.SetFont("dejavu", "", 9)

		// Горячая вода
		pdf.CellFormat(col1, rowH, "Горячая вода", "1", 0, "L", false, 0, "")
		pdf.CellFormat(col2, rowH, fmt.Sprintf("%d", meter.Hot), "1", 0, "C", false, 0, "")
		pdf.CellFormat(col3, rowH, meter.Month.Format("01.2006"), "1", 0, "C", false, 0, "")
		pdf.Ln(-1)

		// Холодная вода
		pdf.CellFormat(col1, rowH, "Холодная вода", "1", 0, "L", false, 0, "")
		pdf.CellFormat(col2, rowH, fmt.Sprintf("%d", meter.Cold), "1", 0, "C", false, 0, "")
		pdf.CellFormat(col3, rowH, meter.Month.Format("01.2006"), "1", 0, "C", false, 0, "")
		pdf.Ln(10)
	}

	// ===== 8. Таблица расшифровки услуг =====
	pdf.SetFont("dejavu", "B", 10)
	pdf.CellFormat(0, 6, "Расшифровка начислений", "", 1, "L", false, 0, "")

	pdf.SetFont("dejavu", "B", 9)
	colName := 120.0
	colAmount := 40.0
	rowH := 6.0

	pdf.CellFormat(colName, rowH, "Услуга", "1", 0, "C", true, 0, "")
	pdf.CellFormat(colAmount, rowH, "Сумма, руб.", "1", 0, "C", true, 0, "")
	pdf.Ln(-1)

	pdf.SetFont("dejavu", "", 9)

	if len(services) == 0 {
		pdf.CellFormat(colName, rowH, "Коммунальные услуги", "1", 0, "L", false, 0, "")
		pdf.CellFormat(colAmount, rowH, fmt.Sprintf("%d", sum), "1", 0, "R", false, 0, "")
		pdf.Ln(-1)
	} else {
		for _, s := range services {
			pdf.CellFormat(colName, rowH, s.Name, "1", 0, "L", false, 0, "")
			pdf.CellFormat(colAmount, rowH, fmt.Sprintf("%d", s.Amount), "1", 0, "R", false, 0, "")
			pdf.Ln(-1)
		}
	}

	// ИТОГО
	pdf.SetFont("dejavu", "B", 9)
	pdf.CellFormat(colName, rowH, "ИТОГО к оплате", "1", 0, "R", false, 0, "")
	pdf.CellFormat(colAmount, rowH, fmt.Sprintf("%d", sum), "1", 0, "R", false, 0, "")
	pdf.Ln(12)

	// ===== 9. Информация об исполнителе (упрощенная, фейковая) =====
	pdf.SetFont("dejavu", "B", 10)
	pdf.CellFormat(0, 6, "Сведения об исполнителе", "", 1, "L", false, 0, "")
	pdf.SetFont("dejavu", "", 8)
	pdf.MultiCell(0, 4,
		"ООО \"Управляющая компания ЖКХ\", ИНН 7730000000, КПП 773001001, р/с 40702810900000000001 в АО \"БАНК\", БИК 044525000.",
		"1", "L", false)

	pdf.Ln(4)

	// ===== 10. QR-код внизу справа =====
	imgOpts := gofpdf.ImageOptions{ImageType: "PNG"}
	pdf.RegisterImageOptionsReader("qrcode", imgOpts, bytes.NewReader(qrPng))

	// Пояснение к QR
	pdf.SetFont("dejavu", "", 8)
	pdf.SetXY(10, 250)
	pdf.MultiCell(120, 4,
		"Оплатить ЕПД вы можете по QR-коду через мобильное приложение банка, терминалы или в личном кабинете на сайте управляющей компании.",
		"", "L", false)

	// Сам QR
	pdf.ImageOptions("qrcode", 160, 235, 35, 0, false, imgOpts, 0, "")

	// ===== 11. Отдаём PDF =====
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", `attachment; filename="EPD-`+doc+`.pdf"`)

	if err := pdf.Output(c.Writer); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка генерации PDF: " + err.Error()})
		return
	}
}
