// src/components/reports/ReportHistory.tsx
import { useEffect, useState } from "react";
import {
  ReportsAPI,
  type PaymentHistoryRow,
  downloadBlobFile,
} from "../../api/reports";

type Status = "" | "NO_DATA" | "ERROR" | "LOADING" | "ERROR_DOWNLOAD";

export default function ReportHistory() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [address, setAddress] = useState<string>("ALL");
  const [addresses, setAddresses] = useState<string[]>([]);

  const [rows, setRows] = useState<PaymentHistoryRow[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [status, setStatus] = useState<Status>("");

  const [downloading, setDownloading] = useState(false);

  // Загружаем список адресов
  useEffect(() => {
    (async () => {
      try {
        const data = await ReportsAPI.getAddresses();
        setAddresses(data);
      } catch (e) {
        console.error("Не удалось загрузить адреса", e);
      }
    })();
  }, []);

  // ==== Загрузка отчёта ====
  const loadData = async () => {
    if (!from || !to) {
      setStatus("ERROR");
      return;
    }

    try {
      setStatus("LOADING");

      const addrFilter = address === "ALL" ? undefined : address;
      const data = await ReportsAPI.getPaymentHistory(from, to, addrFilter);

      if (!data || !data.rows || data.rows.length === 0) {
        setRows([]);
        setTotalAmount(0);
        setStatus("NO_DATA");
      } else {
        setRows(data.rows);
        setTotalAmount(data.totals.totalAmount);
        setStatus("");
      }
    } catch (e) {
      console.error(e);
      setStatus("ERROR");
    }
  };

  // === Автоматическая перезагрузка при смене адреса ===
  useEffect(() => {
    if (!from || !to) return; // даты не выбраны — не грузим
    loadData();
  }, [address]);

  // ==== Скачивание Excel ====
  const downloadExcel = async () => {
    if (!from || !to) {
      setStatus("ERROR_DOWNLOAD");
      return;
    }
    if (rows.length === 0) {
      setStatus("NO_DATA");
      return;
    }

    try {
      setDownloading(true);
      setStatus("");

      const addrFilter = address === "ALL" ? undefined : address;
      const blob = await ReportsAPI.downloadHistoryExcel(from, to, addrFilter);

      downloadBlobFile(blob, `payment_history_${from}_${to}.xlsx`);
    } catch (e) {
      console.error(e);
      setStatus("ERROR_DOWNLOAD");
    } finally {
      setDownloading(false);
    }
  };

  // ==== Блок "Нет данных" ====
  const noDataBlock = (
    <div
      style={{
        marginTop: 20,
        padding: 25,
        background: "white",
        borderRadius: 12,
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
        style={{ width: 70, opacity: 0.7, marginBottom: 15 }}
      />
      <h3 style={{ color: "#444" }}>Нет данных</h3>
      <p style={{ color: "#666" }}>За выбранный период платежей не найдено.</p>
    </div>
  );

  return (
    <div>
      <h2>История платежей</h2>

      <div className="filters">
        <label>
          С даты:
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>

        <label>
          По дату:
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>

        <label>
          Адрес:
          <select value={address} onChange={(e) => setAddress(e.target.value)}>
            <option value="ALL">Все адреса</option>
            {addresses.map((addr) => (
              <option key={addr} value={addr}>
                {addr}
              </option>
            ))}
          </select>
        </label>

        <button onClick={loadData} disabled={status === "LOADING"}>
          {status === "LOADING" ? "Загрузка..." : "Показать отчёт"}
        </button>

        <button onClick={downloadExcel} disabled={downloading}>
          {downloading ? "Формирование..." : "Скачать Excel"}
        </button>
      </div>

      {status === "ERROR" && (
        <p style={{ color: "red", marginTop: 10 }}>Не удалось загрузить отчёт</p>
      )}
      {status === "ERROR_DOWNLOAD" && (
        <p style={{ color: "red", marginTop: 10 }}>
          Не удалось скачать файл
        </p>
      )}
      {status === "NO_DATA" && noDataBlock}

      {rows.length > 0 && (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Дата платежа</th>
                <th>Документ</th>
                <th>Адрес</th>
                <th>Сумма, руб</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.date}</td>
                  <td>{r.docNumber}</td>
                  <td>{r.address}</td>
                  <td>{r.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals">
            <strong>Итого оплачено: </strong>
            {totalAmount.toFixed(2)} руб.
          </div>
        </>
      )}
    </div>
  );
}
