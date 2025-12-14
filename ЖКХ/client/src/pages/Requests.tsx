import { useEffect, useState } from "react";
import api from "../api/api";
import NavBar from "../components/NavBar";
import { useAuth } from "../hooks/useAuth";

type Request = {
  id: number;
  client_id: number;
  full_name: string;
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
  const { role } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [requestType, setRequestType] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // 🔍 поиск

  // === загрузка заявок ===
  const loadRequests = async () => {
    try {
      setLoading(true);
      const url = searchTerm
        ? `/requests?search=${encodeURIComponent(searchTerm)}`
        : "/requests";
      const res = await api.get(url);
      setRequests(res.data || []);
    } catch (err: any) {
      setError("Ошибка загрузки заявок: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // === первичная загрузка ===
  useEffect(() => {
    loadRequests();
    if (role === "client") loadApartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // === debounce-поиск (только для employee/admin) ===
  useEffect(() => {
    if (role === "employee" || role === "admin") {
      const delay = setTimeout(loadRequests, 300);
      return () => clearTimeout(delay);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // === загрузка квартир (для клиента) ===
  const loadApartments = async () => {
    try {
      const res = await api.get("/profile");
      setApartments(res.data.apartments || []);
    } catch (err) {
      console.error("Ошибка загрузки квартир:", err);
    }
  };

  // === подача заявки (для клиента) ===
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

  // === обновление статуса заявки ===
  const updateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/requests/${id}/status`, { status });
      loadRequests();
    } catch (err: any) {
      alert("Ошибка изменения статуса: " + (err.response?.data?.error || err.message));
    }
  };

  // === удаление заявки ===
  const deleteRequest = async (id: number) => {
    if (!window.confirm(`Удалить заявку №${id}?`)) return;
    try {
      await api.delete(`/requests/${id}`);
      alert("Заявка удалена!");
      loadRequests();
    } catch (err: any) {
      alert("Ошибка удаления: " + (err.response?.data?.error || err.message));
    }
  };

  // === кнопки действий в зависимости от статуса ===
  const renderStatusButtons = (r: Request) => {
    if (role !== "employee" && role !== "admin") return null;

    const btnStyle: React.CSSProperties = {
      padding: "5px 10px",
      border: "none",
      borderRadius: 4,
      color: "white",
      cursor: "pointer",
    };

    switch (r.status) {
      case "новая":
        return (
          <button
            onClick={() => updateStatus(r.id, "в работе")}
            style={{ ...btnStyle, backgroundColor: "#007bff" }}
          >
            В работу
          </button>
        );
      case "в работе":
        return (
          <>
            <button
              onClick={() => updateStatus(r.id, "выполнена")}
              style={{ ...btnStyle, backgroundColor: "#28a745", marginRight: 8 }}
            >
              Выполнена
            </button>
            <button
              onClick={() => updateStatus(r.id, "отклонена")}
              style={{ ...btnStyle, backgroundColor: "#dc3545" }}
            >
              Отклонена
            </button>
          </>
        );
      case "выполнена":
      case "отклонена":
        return (
          <button
            onClick={() => deleteRequest(r.id)}
            style={{ ...btnStyle, backgroundColor: "#6c757d" }}
          >
            Удалить
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <NavBar />
      <h2>Заявки</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* === Поиск (только для сотрудника и админа) === */}
      {(role === "employee" || role === "admin") && (
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Поиск по ФИО, адресу, типу или статусу..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "6px 10px",
              width: "320px",
              marginRight: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
        </div>
      )}

      {/* === Клиент: форма подачи заявки === */}
      {role === "client" && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginBottom: 20,
            padding: 20,
            border: "1px solid #ccc",
            borderRadius: 8,
            backgroundColor: "#f9f9f9",
          }}
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
              placeholder="Опишите проблему"
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
      )}

      {/* === Таблица заявок === */}
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <table border={1} cellPadding={6} style={{ width: "100%", background: "#fdfdfd" }}>
          <thead>
            <tr>
              <th>ID</th>
              {(role === "employee" || role === "admin") && <th>Клиент</th>}
              <th>Адрес</th>
              <th>Тип</th>
              <th>Описание</th>
              <th>Дата</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={8}>Нет заявок</td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  {(role === "employee" || role === "admin") && <td>{r.full_name}</td>}
                  <td>{r.address}</td>
                  <td>{r.request_type}</td>
                  <td>{r.description}</td>
                  <td>{new Date(r.created_at).toLocaleDateString("ru-RU")}</td>
                  <td>{r.status}</td>
                  {(role === "employee" || role === "admin") && (
                    <td>{renderStatusButtons(r)}</td>
                  )}
                  {role === "client" && (
                  <td>
                    <button
                      onClick={() => deleteRequest(r.id)}
                      style={{
                        padding: "5px 10px",
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      Удалить
                    </button>
                  </td>
                )}

                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
