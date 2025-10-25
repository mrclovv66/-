// src/pages/Apartments.tsx
import { useEffect, useState } from "react";
import api from "../api/api";
import NavBar from "../components/NavBar";

type Apartment = {
  address: string;
  client_id: number;
  rooms: number;
  area: number;
};

export default function Apartments() {
  const [apartments, setApartments] = useState<Apartment[]>([]);

  useEffect(() => {
    api.get("/apartments").then((res) => setApartments(res.data)).catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <NavBar />
      <h2>Квартиры</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Адрес</th>
            <th>Клиент</th>
            <th>Комнат</th>
            <th>Площадь</th>
          </tr>
        </thead>
        <tbody>
          {apartments?.map((a, index) => (
            <tr key={index}>
              <td>{a.address}</td>
              <td>{a.client_id}</td>
              <td>{a.rooms}</td>
              <td>{a.area}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
