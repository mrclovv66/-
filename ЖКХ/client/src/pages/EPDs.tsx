// src/pages/EPDs.tsx
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

  useEffect(() => {
    api.get("/epds").then((res) => setEpds(res.data)).catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <NavBar />
      <h2>Единые платёжные документы (ЕПД)</h2>
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
