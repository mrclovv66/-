import { useEffect, useState } from "react";
import api from "../api/api";
import NavBar from "../components/NavBar";

type EPD = {
  docNumber: string;
  address: string;
  billingMonth: string;
  totalAmount: number;
};

export default function EPDs() {
  const [epds, setEpds] = useState<EPD[]>([]);
  const [search, setSearch] = useState("");

  const loadEPDs = (term: string = "") => {
    api
      .get(`/epds?search=${term}`)
      .then((res) => setEpds(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadEPDs();
  }, []);

  // 🔹 При изменении строки поиска сразу перезапрашиваем с сервера
  useEffect(() => {
    const delay = setTimeout(() => loadEPDs(search), 300);
    return () => clearTimeout(delay);
  }, [search]);

  return (
    <div>
      <NavBar />
      <h2>Единые платёжные документы (ЕПД)</h2>

      <input
        type="text"
        placeholder="Поиск по номеру, адресу или месяцу..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: "6px 10px",
          marginBottom: "10px",
          width: "300px",
          borderRadius: "6px",
        }}
      />

      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Номер документа</th>
            <th>Адрес</th>
            <th>Месяц</th>
            <th>Сумма</th>
          </tr>
        </thead>
        <tbody>
          {epds?.map((e, index) => (
            <tr key={index}>
              <td>{e.docNumber}</td>
              <td>{e.address}</td>
              <td>{e.billingMonth}</td>
              <td>{e.totalAmount} ₽</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
