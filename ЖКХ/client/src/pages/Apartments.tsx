import { useEffect, useState, useRef } from "react";
import api from "../api/api";
import NavBar from "../components/NavBar";

type Apartment = {
  address: string;
  client_id: number;
  owner_name?: string;
  rooms: number;
  area: number;
};

type Client = {
  id: number;
  fullName: string;
};

export default function Apartments() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<Apartment>({
    address: "",
    client_id: 0,
    rooms: 1,
    area: 10,
  });
  const [editing, setEditing] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  // === Получение квартир ===
  const loadApartments = () => {
    api
      .get("/apartments")
      .then((res) => setApartments(res.data))
      .catch((err) => console.error(err));
  };

  // === Получение клиентов ===
  const loadClients = () => {
    api
      .get("/clients")
      .then((res) => setClients(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadApartments();
    loadClients();
  }, []);

  // === Обработка полей ===
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numberFields = ["client_id", "rooms", "area"];
    setForm((prev) => ({
      ...prev,
      [name]: numberFields.includes(name) ? Number(value) : value,
    }));
  };

  const handleAdd = async () => {
    if (!form.address || !form.client_id) {
      alert("Укажите адрес и владельца!");
      return;
    }
    try {
      await api.post("/apartments", form);
      setForm({ address: "", client_id: 0, rooms: 1, area: 10 });
      loadApartments();
    } catch (err) {
      console.error(err);
      alert("Ошибка при добавлении квартиры");
    }
  };

  const handleEdit = (a: Apartment) => {
    setForm(a);
    setEditing(a.address);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/apartments/${encodeURIComponent(editing!)}`, form);
      setEditing(null);
      setForm({ address: "", client_id: 0, rooms: 1, area: 10 });
      loadApartments();
    } catch (err) {
      console.error(err);
      alert("Ошибка при обновлении квартиры");
    }
  };

  const handleDelete = async (address: string) => {
    if (!window.confirm("Удалить квартиру?")) return;
    try {
      await api.delete(`/apartments/${encodeURIComponent(address)}`);
      loadApartments();
    } catch (err) {
      console.error(err);
      alert("Ошибка при удалении квартиры");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <NavBar />
      <h2>🏠 Квартиры</h2>

      {/* === Форма добавления / редактирования === */}
      <div
        ref={formRef}
        style={{
          marginBottom: "20px",
          border: "1px solid #ccc",
          padding: "10px",
          borderRadius: "8px",
          width: "420px",
        }}
      >
        <h3>{editing ? "Редактировать квартиру" : "Добавить квартиру"}</h3>

        <div style={{ marginBottom: "8px" }}>
          <label>Адрес:</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            disabled={!!editing}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: "8px" }}>
          <label>Владелец:</label>
          <select
            name="client_id"
            value={form.client_id}
            onChange={handleChange}
            style={{ width: "100%" }}
          >
            <option value={0}>Выберите владельца...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "8px" }}>
          <label>Комнат:</label>
          <input
            name="rooms"
            value={form.rooms}
            onChange={handleChange}
            type="number"
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: "8px" }}>
          <label>Площадь (м²):</label>
          <input
            name="area"
            value={form.area}
            onChange={handleChange}
            type="number"
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginTop: "10px" }}>
          {editing ? (
            <>
              <button onClick={handleUpdate}>💾 Сохранить</button>
              <button onClick={() => setEditing(null)}>Отмена</button>
            </>
          ) : (
            <button onClick={handleAdd}>➕ Добавить</button>
          )}
        </div>
      </div>

      {/* === Таблица квартир === */}
      <table border={1} cellPadding={6} style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Адрес</th>
            <th>Владелец</th>
            <th>Комнат</th>
            <th>Площадь</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {apartments?.map((a, index) => (
            <tr key={index}>
              <td>{a.address}</td>
              <td>{a.owner_name || "—"}</td>
              <td>{a.rooms}</td>
              <td>{a.area}</td>
              <td>
                <button onClick={() => handleEdit(a)} style={{ marginRight: "8px" }}>
                  ✏️
                </button>
                <button onClick={() => handleDelete(a.address)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
