import { useEffect, useState } from "react";
import api from "../api/api";
import NavBar from "../components/NavBar";

type Debt = {
  id: number;
  address: string;
  amount: number;
  deadline: string;
};

export default function Debts() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [search, setSearch] = useState("");

  const loadDebts = (term = "") => {
    api.get(`/debts?search=${term}`).then((res) => setDebts(res.data));
  };

  useEffect(() => {
    loadDebts();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => loadDebts(search), 300);
    return () => clearTimeout(delay);
  }, [search]);

  return (
    <div style={{ backgroundColor: "#f5f6fa", minHeight: "100vh" }}>
      <NavBar />

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "15px" }}>
          Задолженности
        </h2>

        {/* === Поиск === */}
        <div
          style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}
        >
          <input
            type="text"
            placeholder="Поиск по номеру или адресу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "8px 12px",
              width: "300px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        {/* === Таблица === */}
        <table
          border={1}
          cellPadding={6}
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "white",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <thead style={{ backgroundColor: "#007bff", color: "white" }}>
            <tr>
              <th>Номер</th>
              <th>Адрес</th>
              <th>Сумма</th>
              <th>Срок выплаты</th>
            </tr>
          </thead>

          <tbody>
            {debts.map((d) => (
              <tr key={d.id} style={{ textAlign: "center" }}>
                <td>{d.id}</td>
                <td>{d.address}</td>
                <td>{d.amount} ₽</td>
                <td>{d.deadline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
