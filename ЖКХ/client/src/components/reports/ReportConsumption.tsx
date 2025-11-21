// src/components/reports/ReportConsumption.tsx

import { useState } from "react";
import {
  ReportsAPI,
  type ConsumptionRow,
  type ConsumptionReport,
  downloadBlobFile,
} from "../../api/reports";

export default function ReportConsumption() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<ConsumptionRow[]>([]);
  const [totals, setTotals] = useState<ConsumptionReport["totals"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(""); // "", "NO_DATA" или текст ошибки

  // ==========================
  // Загрузка отчёта
  // ==========================
  const loadData = async () => {
    if (!from || !to) {
      setError("Укажите период");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await ReportsAPI.getConsumptionReport(from, to);

      // если данных нет — показываем сообщение и очищаем таблицу/итоги
      if (!data.rows || data.rows.length === 0) {
        setRows([]);
        setTotals(null);
        setError("NO_DATA");
        return;
      }

      setRows(data.rows);
      setTotals(data.totals);
    } catch (e) {
      console.error(e);
      setError("Ошибка при загрузке отчёта");
      setRows([]);
      setTotals(null);
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // Выгрузка Excel
  // ==========================
  const downloadExcel = async () => {
    // если данных нет — сразу сообщение и выходим
    if (rows.length === 0) {
      setError("NO_DATA");
      return;
    }

    try {
      setDownloading(true);
      setError("");

      const file = await ReportsAPI.downloadConsumptionExcel(from, to);
      downloadBlobFile(file, `consumption_${from}_${to}.xlsx`);
    } catch (e) {
      console.error(e);
      setError("Ошибка при выгрузке файла");
    } finally {
      setDownloading(false);
    }
  };

  const hasNoData = error === "NO_DATA";

  return (
    <div>
      <h2>Потребление ресурсов</h2>

      {/* Форма выбора периода */}
      <div style={{ display: "flex", gap: "20px", marginBottom: 20 }}>
        <label>
          С месяца:
          <input
            type="month"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>

        <label>
          По месяц:
          <input
            type="month"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>

        <button onClick={loadData} disabled={loading}>
          {loading ? "Загрузка..." : "Показать отчёт"}
        </button>

        <button onClick={downloadExcel} disabled={downloading}>
          {downloading ? "Формирование..." : "Скачать Excel"}
        </button>
      </div>

      {/* Сообщения об ошибках / отсутствии данных */}
      {hasNoData && (
        <div
          style={{
            marginTop: 10,
            padding: "12px 18px",
            background: "#fff3cd",
            border: "1px solid #ffeeba",
            borderRadius: 8,
            color: "#856404",
            fontSize: 16,
            maxWidth: 600,
          }}
        >
          За выбранный период данные отсутствуют.
        </div>
      )}

      {error && !hasNoData && (
        <div
          style={{
            marginTop: 10,
            color: "red",
            fontSize: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* Итоговый блок — только если есть данные и нет ошибки */}
      {totals && rows.length > 0 && !error && (
        <div
          style={{
            marginTop: 20,
            padding: 15,
            background: "#eef4ff",
            borderRadius: 10,
          }}
        >
          <strong>ИТОГО:</strong>{" "}
          Горячая: {totals.hot.toFixed(2)} м³ | Холодная:{" "}
          {totals.cold.toFixed(2)} м³ | Стоимость:{" "}
          {totals.total.toFixed(2)} руб. | Записей: {rows.length}
        </div>
      )}

      {/* Таблица — только если есть данные и нет ошибки */}
      {rows.length > 0 && !error && (
        <table style={{ marginTop: 20 }}>
          <thead>
            <tr>
              <th>Документ</th>
              <th>Адрес</th>
              <th>Месяц</th>
              <th>Горячая</th>
              <th>Холодная</th>
              <th>Сумма</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.docNumber}</td>
                <td>{r.address}</td>
                <td>{r.month}</td>
                <td>{r.hotWater.toFixed(2)}</td>
                <td>{r.coldWater.toFixed(2)}</td>
                <td>{r.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
