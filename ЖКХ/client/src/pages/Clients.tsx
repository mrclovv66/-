// src/pages/Clients.tsx
import { useEffect, useState } from "react";
import api from "../api/api";
import NavBar from "../components/NavBar";
import { useAuth } from "../hooks/useAuth";

type Client = {
  id: number;
  fullName: string;
  phone: string;
};

export default function Clients() {
  const { role } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({ fullName: "", phone: "" });

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    // Фильтрация клиентов по поисковому запросу
    const filtered = clients.filter(client =>
      client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const loadClients = () => {
    api.get("/clients").then((res) => {
      setClients(res.data);
    }).catch((err) => console.error(err));
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/clients", newClient);
      setNewClient({ fullName: "", phone: "" });
      setShowAddForm(false);
      loadClients();
    } catch (error: any) {
      alert("Ошибка при добавлении клиента: " + (error.response?.data?.error || error.message));
    }
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      await api.put(`/clients/${editingClient.id}`, newClient);
      setEditingClient(null);
      setNewClient({ fullName: "", phone: "" });
      loadClients();
    } catch (error: any) {
      alert("Ошибка при редактировании клиента: " + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteClient = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этого клиента?")) return;
    try {
      await api.delete(`/clients/${id}`);
      loadClients();
    } catch (error: any) {
      alert("Ошибка при удалении клиента: " + (error.response?.data?.error || error.message));
    }
  };

  const startEdit = (client: Client) => {
    setEditingClient(client);
    setNewClient({ fullName: client.fullName, phone: client.phone });
  };

  const cancelEdit = () => {
    setEditingClient(null);
    setNewClient({ fullName: "", phone: "" });
  };

  return (
    <div>
      <NavBar />
      <h2>Клиенты</h2>

      {/* Поиск */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Поиск по ФИО или телефону..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: 8, width: 300 }}
        />
      </div>

      {/* Кнопка добавления для employee и admin */}
      {(role === "employee" || role === "admin") && (
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: 4 }}
          >
            {showAddForm ? "Отмена" : "Добавить клиента"}
          </button>
        </div>
      )}

      {/* Форма добавления */}
      {showAddForm && (
        <form onSubmit={handleAddClient} style={{ marginBottom: 20, padding: 20, border: "1px solid #ccc", borderRadius: 8 }}>
          <h3>Добавить клиента</h3>
          <div style={{ marginBottom: 10 }}>
            <label>ФИО:</label>
            <input
              type="text"
              value={newClient.fullName}
              onChange={(e) => setNewClient({ ...newClient, fullName: e.target.value })}
              required
              style={{ marginLeft: 10, padding: 5, width: 250 }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Телефон:</label>
            <input
              type="text"
              value={newClient.phone}
              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              required
              style={{ marginLeft: 10, padding: 5, width: 250 }}
            />
          </div>
          <button type="submit" style={{ padding: "10px 20px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: 4 }}>
            Добавить
          </button>
        </form>
      )}

      {/* Форма редактирования */}
      {editingClient && (
        <form onSubmit={handleEditClient} style={{ marginBottom: 20, padding: 20, border: "1px solid #ccc", borderRadius: 8 }}>
          <h3>Редактировать клиента</h3>
          <div style={{ marginBottom: 10 }}>
            <label>ФИО:</label>
            <input
              type="text"
              value={newClient.fullName}
              onChange={(e) => setNewClient({ ...newClient, fullName: e.target.value })}
              required
              style={{ marginLeft: 10, padding: 5, width: 250 }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Телефон:</label>
            <input
              type="text"
              value={newClient.phone}
              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              required
              style={{ marginLeft: 10, padding: 5, width: 250 }}
            />
          </div>
          <button type="submit" style={{ padding: "10px 20px", backgroundColor: "#ffc107", color: "black", border: "none", borderRadius: 4, marginRight: 10 }}>
            Сохранить
          </button>
          <button type="button" onClick={cancelEdit} style={{ padding: "10px 20px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: 4 }}>
            Отмена
          </button>
        </form>
      )}

      {/* Таблица клиентов */}
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>ID</th>
            <th>ФИО</th>
            <th>Телефон</th>
            {(role === "employee" || role === "admin") && <th>Действия</th>}
          </tr>
        </thead>
        <tbody>
          {filteredClients.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.fullName}</td>
              <td>{c.phone}</td>
              {(role === "employee" || role === "admin") && (
                <td>
                  <button
                    onClick={() => startEdit(c)}
                    style={{ padding: "5px 10px", backgroundColor: "#ffc107", color: "black", border: "none", borderRadius: 4, marginRight: 5 }}
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDeleteClient(c.id)}
                    style={{ padding: "5px 10px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: 4 }}
                  >
                    Удалить
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
