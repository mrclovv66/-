// src/components/reports/ReportPayments.tsx
import { useState } from "react";
import {
  ReportsAPI,
  type PaymentsReportRow,
  type PaymentsReport,
  downloadBlobFile,
} from "../../api/reports";

export default function ReportPayments() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [service, setService] = useState("");

  const [rows, setRows] = useState<PaymentsReportRow[]>([]);
  const [totals, setTotals] = useState<PaymentsReport["totals"] | null>(null);

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [status, setStatus] = useState<"" | "NO_DATA" | "ERROR" | "ERROR_DOWNLOAD">("");

  // ============================
  //      ЗАГРУЗИТЬ ОТЧЁТ
  // ============================
  const handleLoad = async () => {
    if (!from || !to) {
      setStatus("ERROR");
      return;
    }

    setStatus("");
    setLoading(true);

    try {
      const report = await ReportsAPI.getPayments(from, to, service || undefined);
      // report: { rows, totals }
      setRows(report.rows || []);
      setTotals(report.totals || null);

      if (!report.rows || report.rows.length === 0) {
        setStatus("NO_DATA");
      } else {
        setStatus("");
      }
    } catch (err) {
      console.error(err);
      setStatus("ERROR");
      setRows([]);
      setTotals(null);
    } finally {
      setLoading(false);
    }
  };

  // ============================
  //     СКАЧАТЬ EXCEL
  // ============================
  const handleDownload = async () => {
    if (!from || !to) {
      setStatus("ERROR_DOWNLOAD");
      return;
    }

    if (rows.length === 0) {
      setStatus("ERROR_DOWNLOAD");
      return;
    }

    try {
      setDownloading(true);
      setStatus("");

      const blob = await ReportsAPI.downloadPaymentsExcel(
        from,
        to,
        service || undefined
      );

      downloadBlobFile(blob, `payments_${from}_${to}.xlsx`);
    } catch (e) {
      console.error(e);
      setStatus("ERROR_DOWNLOAD");
    } finally {
      setDownloading(false);
    }
  };

  // ============================
  //      БЛОК НЕТ ДАННЫХ
  // ============================
  const noDataBlock = (
    <div
      style={{
        marginTop: "20px",
        padding: "25px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
        textAlign: "center",
        width: "60%",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <img
        src="https://cdn-icons-png.flaticon.com/512/4076/4076508.png"
        alt="Нет данных"
        style={{ width: "75px", opacity: 0.7, marginBottom: "15px" }}
      />
      <h3 style={{ color: "#444", marginBottom: "10px" }}>Нет данных</h3>
      <p style={{ color: "#666", fontSize: "15px" }}>
        За выбранный период данные отсутствуют.
      </p>
    </div>
  );

  return (
    <div>
      {/* =========================== */}
      {/*         ФИЛЬТРЫ           */}
      {/* =========================== */}
      <div className="filters">
        <div>
          <label>С месяца:</label>
          <input
            type="month"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div>
          <label>По месяц:</label>
          <input
            type="month"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div>
          <label>Услуга:</label>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option value="">Все услуги</option>
            <option value="Содержание">Содержание</option>
            <option value="Отопление">Отопление</option>
            <option value="Газоснабжение">Газоснабжение</option>
            <option value="Вывоз мусора">Вывоз мусора</option>
          </select>
        </div>

        <button onClick={handleLoad} disabled={loading}>
          {loading ? "Загрузка..." : "Показать отчёт"}
        </button>

        <button onClick={handleDownload} disabled={downloading}>
          {downloading ? "Скачивание..." : "Скачать Excel"}
        </button>
      </div>

      {/* =========================== */}
      {/*     СООБЩЕНИЯ ОБ ОШИБКАХ   */}
      {/* =========================== */}
      {status === "ERROR" && (
        <p style={{ color: "red", marginTop: "20px" }}>
          Не удалось загрузить отчёт
        </p>
      )}

      {status === "ERROR_DOWNLOAD" && (
        <p style={{ color: "red", marginTop: "20px" }}>
          Нет данных для формирования Excel
        </p>
      )}

      {status === "NO_DATA" && noDataBlock}

      {/* =========================== */}
      {/*        ИТОГОВЫЙ БЛОК       */}
      {/* =========================== */}
      {totals && rows.length > 0 && status === "" && (
        <div
          style={{
            background: "#eef4ff",
            padding: "15px 20px",
            borderRadius: "10px",
            marginBottom: "20px",
            fontSize: "18px",
          }}
        >
          <strong>Итого за период:</strong>{" "}
          Начислено: <strong>{totals.accrued.toFixed(2)} руб.</strong> |{" "}
          Оплачено: <strong>{totals.paid.toFixed(2)} руб.</strong> | Долг:{" "}
          <strong>{totals.debt.toFixed(2)} руб.</strong> | Документов:{" "}
          <strong>{rows.length}</strong>
        </div>
      )}

      {/* =========================== */}
      {/*           ТАБЛИЦА          */}
      {/* =========================== */}
      {rows.length > 0 && status === "" && (
        <table className="report-table">
          <thead>
            <tr>
              <th>Документ</th>
              <th>Адрес</th>
              <th>Месяц</th>
              <th>Услуга</th>
              <th>Начислено</th>
              <th>Оплачено</th>
              <th>Долг</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.docNumber}</td>
                <td>{r.address}</td>
                <td>{r.month}</td>
                <td>{r.service}</td>
                <td>{Number(r.accrued ?? 0).toFixed(2)}</td>
                <td>{Number(r.paid ?? 0).toFixed(2)}</td>
                <td>{Number(r.debt ?? 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
