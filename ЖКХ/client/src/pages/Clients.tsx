import { useEffect, useState } from "react";
import api from "../api/api";
import NavBar from "../components/NavBar";
import { useAuth } from "../hooks/useAuth";

type Client = {
  id: number;
  fullName: string;
  phone: string;
  password?: string;
};

export default function Clients() {
  const { role } = useAuth();

  // данные
  const [clients, setClients] = useState<Client[]>([]);
  const [viewMode, setViewMode] = useState<"client" | "archive">("client"); // текущие / архив
  const [searchTerm, setSearchTerm] = useState("");                         // строка поиска

  // формы
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({ fullName: "", phone: "", password: "" });

  // ===== API =====
  const loadClients = () => {
    api
      .get(`/clients?type=${viewMode}&search=${encodeURIComponent(searchTerm)}`)
      .then((res) => setClients(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        console.error("Ошибка при загрузке клиентов:", err);
        setClients([]);
      });
  };

  // первичная загрузка и переключение вкладки
  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // debounce-поиск по серверу
  useEffect(() => {
    const t = setTimeout(loadClients, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // ===== Обработчики =====
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/clients", newClient);
      setNewClient({ fullName: "", phone: "", password: "" });
      setShowAddForm(false);
      loadClients();
    } catch (error: any) {
      alert("Ошибка при добавлении клиента: " + (error.response?.data?.error || error.message));
    }
  };

  const startEdit = (client: Client) => {
    setEditingClient(client);
    setNewClient({
      fullName: client.fullName,
      phone: client.phone,
      password: client.password || "",
    });
  };

  const cancelEdit = () => {
    setEditingClient(null);
    setNewClient({ fullName: "", phone: "", password: "" });
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      await api.put(`/clients/${editingClient.id}`, newClient);
      cancelEdit();
      loadClients();
    } catch (error: any) {
      alert("Ошибка при редактировании клиента: " + (error.response?.data?.error || error.message));
    }
  };

  const handleArchiveClient = async (id: number) => {
    if (!confirm("Отправить клиента в архив?")) return;
    try {
      await api.put(`/clients/${id}/archive`);
      loadClients();
    } catch (error: any) {
      alert("Ошибка при архивации клиента: " + (error.response?.data?.error || error.message));
    }
  };

  const handleRestoreClient = async (id: number) => {
    if (!confirm("Восстановить этого клиента?")) return;
    try {
      await api.put(`/clients/${id}/restore`);
      loadClients();
    } catch (error: any) {
      alert("Ошибка при восстановлении клиента: " + (error.response?.data?.error || error.message));
    }
  };

  // ===== UI =====
  return (
    <div style={{ padding: 20 }}>
      <NavBar />
      <h2>Клиенты</h2>

      {/* Переключатель текущие / архив */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setViewMode("client")}
          style={{
            padding: "8px 16px",
            background: viewMode === "client" ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: 4,
            marginRight: 8,
            cursor: "pointer",
          }}
        >
          Текущие
        </button>
        <button
          onClick={() => setViewMode("archive")}
          style={{
            padding: "8px 16px",
            background: viewMode === "archive" ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Архив
        </button>
      </div>

      {/* Поиск (серверный) */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Поиск по ФИО или телефону..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: 8, width: 320 }}
        />
      </div>

      {/* Кнопка добавить — только в 'Текущие' и для employee/admin */}
      {viewMode === "client" && (role === "employee" || role === "admin") && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            style={{
              padding: "10px 20px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {showAddForm ? "Отмена" : "Добавить клиента"}
          </button>
        </div>
      )}

      {/* Форма добавления */}
      {showAddForm && (
        <form
          onSubmit={handleAddClient}
          style={{
            marginBottom: 20,
            padding: 16,
            maxWidth: 420,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <h3>Добавить клиента</h3>
          <div style={{ marginBottom: 10 }}>
            <label>ФИО:</label>
            <input
              value={newClient.fullName}
              onChange={(e) => setNewClient({ ...newClient, fullName: e.target.value })}
              required
              style={{ marginLeft: 10, padding: 6, width: 260 }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Телефон:</label>
            <input
              value={newClient.phone}
              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              required
              style={{ marginLeft: 10, padding: 6, width: 260 }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Пароль:</label>
            <input
              type="password"
              value={newClient.password}
              onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
              required
              style={{ marginLeft: 10, padding: 6, width: 260 }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "10px 16px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Добавить
          </button>
        </form>
      )}

      {/* Форма редактирования */}
      {editingClient && viewMode === "client" && (
        <form
          onSubmit={handleEditClient}
          style={{
            marginBottom: 20,
            padding: 16,
            maxWidth: 420,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <h3>Редактировать клиента</h3>
          <div style={{ marginBottom: 10 }}>
            <label>ФИО:</label>
            <input
              value={newClient.fullName}
              onChange={(e) => setNewClient({ ...newClient, fullName: e.target.value })}
              required
              style={{ marginLeft: 10, padding: 6, width: 260 }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Телефон:</label>
            <input
              value={newClient.phone}
              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              required
              style={{ marginLeft: 10, padding: 6, width: 260 }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              style={{
                padding: "10px 16px",
                background: "#ffc107",
                color: "black",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              style={{
                padding: "10px 16px",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* Таблица */}
      {clients.length === 0 ? (
        <p style={{ color: "#666" }}>
          {viewMode === "archive" ? "Архив пуст" : "Нет клиентов для отображения"}
        </p>
      ) : (
        <table border={1} cellPadding={6} style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>ID</th>
              <th style={{ textAlign: "left" }}>ФИО</th>
              <th style={{ textAlign: "left" }}>Телефон</th>
              {(role === "employee" || role === "admin") && <th>Действия</th>}
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.fullName}</td>
                <td>{c.phone}</td>
                {(role === "employee" || role === "admin") && (
                  <td>
                    {viewMode === "client" ? (
                      <>
                        <button
                          onClick={() => startEdit(c)}
                          style={{
                            padding: "5px 10px",
                            background: "#ffc107",
                            color: "black",
                            border: "none",
                            borderRadius: 4,
                            marginRight: 6,
                            cursor: "pointer",
                          }}
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleArchiveClient(c.id)}
                          style={{
                            padding: "5px 10px",
                            background: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          В архив
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleRestoreClient(c.id)}
                        style={{
                          padding: "5px 10px",
                          background: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      >
                        Восстановить
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
