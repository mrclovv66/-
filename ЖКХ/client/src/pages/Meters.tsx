// src/pages/Meters.tsx
import { useEffect, useState } from "react";
import api from "../api/api";
import NavBar from "../components/NavBar";

type MeterReading = {
  id: number;
  doc_number: string;
  address: string;
  billingMonth: string;
  hotWater: number;
  coldWater: number;
};

export default function Meters() {
  const [meters, setMeters] = useState<MeterReading[]>([]);

  useEffect(() => {
    api.get("/meters").then((res) => setMeters(res.data)).catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <NavBar />
      <h2>Показания счётчиков</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>ID</th>
            <th>ЕПД</th>
            <th>Адрес</th>
            <th>Месяц</th>
            <th>Горячая</th>
            <th>Холодная</th>
          </tr>
        </thead>
        <tbody>
          {meters?.map((m) => (
            <tr key={m.id}>
              <td>{m.id}</td>
              <td>{m.doc_number}</td>
              <td>{m.address}</td>
              <td>{m.billingMonth}</td>
              <td>{m.hotWater}</td>
              <td>{m.coldWater}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
