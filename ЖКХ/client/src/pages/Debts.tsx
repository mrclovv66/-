// src/pages/Debts.tsx
import { useEffect, useState } from "react";
import api from "../api/api";
import NavBar from "../components/NavBar";

type Debt = {
  id: number;
  address: string;
  amount: number;
  dueDate: string;
};

export default function Debts() {
  const [debts, setDebts] = useState<Debt[]>([]);

  useEffect(() => {
    api.get("/debts").then((res) => setDebts(res.data)).catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <NavBar />
      <h2>Задолженности</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Адрес</th>
            <th>Сумма</th>
            <th>Срок выплаты</th>
          </tr>
        </thead>
        <tbody>
          {debts?.map((d) => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{d.address}</td>
              <td>{d.amount} ₽</td>
              <td>{d.dueDate || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
