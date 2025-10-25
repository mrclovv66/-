import { useEffect, useState } from "react";
import api from "../api/api";
import NavBar from "../components/NavBar";

type Request = {
  id: number;
  client_id: number;
  request_type: string;
  description: string;
  created_at: string;   
  status: string;
};

export default function Requests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [requestType, setRequestType] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    setLoading(true);
    setError("");
    api.get("/requests").then((res) => {
      setRequests(res.data || []);
      setLoading(false);
    }).catch((err) => {
      console.error("Error loading requests:", err);
      setError("Не удалось загрузить заявки: " + (err.response?.data?.error || err.message));
      setRequests([]);
      setLoading(false);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/requests", { request_type: requestType, description });
      setRequestType("");
      setDescription("");
      loadRequests();
      alert("Заявка отправлена!");
    } catch (error: any) {
      console.error("Error submitting request:", error);
      alert("Ошибка при отправке заявки: " + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div>
      <NavBar />
      <h2>Заявки</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Форма для подачи заявки */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 20, padding: 20, border: "1px solid #ccc", borderRadius: 8 }}>
        <h3>Подать заявку</h3>
        <div style={{ marginBottom: 10 }}>
          <label>Тип заявки:</label>
          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            required
            style={{ marginLeft: 10, padding: 5 }}
          >
            <option value="">Выберите тип заявки</option>
            <option value="ремонт">Ремонт</option>
            <option value="консультация">Консультация</option>
            <option value="жалоба">Жалоба</option>
          </select>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Описание проблемы:</label>
          <textarea
            placeholder="Опишите вашу проблему подробно"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            style={{ width: "100%", marginTop: 5, padding: 5 }}
          />
        </div>
        <button type="submit" style={{ padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: 4 }}>
          Отправить
        </button>
      </form>

      {/* Список заявок */}
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <table border={1} cellPadding={6}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Тип</th>
              <th>Описание</th>
              <th>Дата</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5}>Нет заявок</td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.request_type}</td>
                  <td>{r.description}</td>
                  <td>{new Date(r.created_at).toLocaleString('ru-RU')}</td>
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