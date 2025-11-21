import { useState } from "react";
import {
  ReportsAPI,
  type DebtorRow,
  downloadBlobFile,
} from "../../api/reports";

export default function ReportDebtors() {
  const [month, setMonth] = useState("");
  const [rows, setRows] = useState<DebtorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [status, setStatus] = useState<
    "" | "NO_DATA" | "ERROR" | "ERROR_DOWNLOAD"
  >("");

  // ===============================
  // ЗАГРУЗКА ОТЧЁТА
  // ===============================
  const loadData = async () => {
    if (!month) {
      setStatus("ERROR");
      return;
    }

    try {
      setLoading(true);
      setStatus("");

      const data = await ReportsAPI.getDebtors(month);
      setRows(data);

      if (data.length === 0) {
        setStatus("NO_DATA");
      }
    } catch (e) {
      console.error(e);
      setStatus("ERROR");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // СКАЧИВАНИЕ EXCEL
  // ===============================
  const downloadExcel = async () => {
    if (!month) {
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

      const blob = await ReportsAPI.downloadDebtorsExcel(month);
      downloadBlobFile(blob, `debtors_${month}.xlsx`);
    } catch (e) {
      console.error(e);
      setStatus("ERROR_DOWNLOAD");
    } finally {
      setDownloading(false);
    }
  };

  // ===============================
  // БЛОК «НЕТ ДАННЫХ»
  // ===============================
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
        За выбранный месяц должников не найдено.
      </p>
    </div>
  );

  return (
    <div>
      <h2>Отчёт по должникам</h2>

      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <label>
          Расчётный месяц:
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ marginLeft: "10px" }}
          />
        </label>

        <button onClick={loadData} disabled={loading}>
          {loading ? "Загрузка..." : "Показать отчёт"}
        </button>

        <button onClick={downloadExcel} disabled={downloading}>
          {downloading ? "Формируется..." : "Скачать Excel"}
        </button>
      </div>

      {/* Сообщения */}
      {status === "NO_DATA" && noDataBlock}
      {status === "ERROR" && (
        <p style={{ color: "red" }}>Не удалось загрузить отчёт</p>
      )}
      {status === "ERROR_DOWNLOAD" && (
        <p style={{ color: "red" }}>Нет данных для формирования Excel</p>
      )}

      {rows.length > 0 && status === "" && (
        <table>
          <thead>
            <tr>
              <th>Адрес</th>
              <th>ФИО</th>
              <th>Телефон</th>
              <th>Долг</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.address}</td>
                <td>{r.fullName}</td>
                <td>{r.phone}</td>
                <td>{r.debt.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
