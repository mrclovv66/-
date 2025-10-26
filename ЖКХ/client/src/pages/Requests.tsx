import { useEffect, useState } from "react";
import api from "../api/api";
import NavBar from "../components/NavBar";

type Request = {
  id: number;
  client_id: number;
  address: string;
  request_type: string;
  description: string;
  created_at: string;
  status: string;
};

type Apartment = {
  address: string;
};

export default function Requests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [requestType, setRequestType] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRequests();
    loadApartments();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/requests");
      setRequests(res.data || []);
    } catch (err: any) {
      setError("Ошибка загрузки заявок: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadApartments = async () => {
    try {
      const res = await api.get("/profile");
      setApartments(res.data.apartments || []);
    } catch (err) {
      console.error("Ошибка загрузки квартир:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddress) {
      alert("Выберите квартиру!");
      return;
    }
    try {
      await api.post("/requests", {
        address: selectedAddress,
        request_type: requestType,
        description,
      });
      alert("Заявка отправлена!");
      setRequestType("");
      setDescription("");
      setSelectedAddress("");
      loadRequests();
    } catch (err: any) {
      alert("Ошибка при отправке: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div>
      <NavBar />
      <h2>Заявки</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Форма подачи заявки */}
      <form
        onSubmit={handleSubmit}
        style={{ marginBottom: 20, padding: 20, border: "1px solid #ccc", borderRadius: 8 }}
      >
        <h3>Подать заявку</h3>

        <div style={{ marginBottom: 10 }}>
          <label>Квартира:</label>
          <select
            value={selectedAddress}
            onChange={(e) => setSelectedAddress(e.target.value)}
            required
            style={{ marginLeft: 10, padding: 5 }}
          >
            <option value="">Выберите квартиру</option>
            {apartments.map((a) => (
              <option key={a.address} value={a.address}>
                {a.address}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Тип заявки:</label>
          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            required
            style={{ marginLeft: 10, padding: 5 }}
          >
            <option value="">Выберите тип</option>
            <option value="ремонт">Ремонт</option>
            <option value="консультация">Консультация</option>
            <option value="жалоба">Жалоба</option>
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Описание:</label>
          <textarea
            placeholder="Опишите вашу проблему"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            style={{ width: "100%", marginTop: 5, padding: 5 }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: 4,
          }}
        >
          Отправить
        </button>
      </form>

      {/* Таблица заявок */}
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <table border={1} cellPadding={6}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Адрес</th>
              <th>Тип</th>
              <th>Описание</th>
              <th>Дата</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6}>Нет заявок</td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.address}</td>
                  <td>{r.request_type}</td>
                  <td>{r.description}</td>
                  <td>{new Date(r.created_at).toLocaleDateString("ru-RU")}</td>
                  <td>{r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
