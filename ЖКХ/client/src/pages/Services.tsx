// src/pages/Services.tsx
import { useEffect, useState } from "react";
import api from "../api/api";
import NavBar from "../components/NavBar";

type Service = {
  name: string;
  category: string;
  price: number;
};

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    api.get("/services").then((res) => setServices(res.data)).catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <NavBar />
      <h2>Услуги и тарифы</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Наименование</th>
            <th>Категория</th>
            <th>Стоимость</th>
          </tr>
        </thead>
        <tbody>
          {services?.map((s, index) => (
            <tr key={index}>
              <td>{s.name}</td>
              <td>{s.category}</td>
              <td>{s.price} ₽</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
