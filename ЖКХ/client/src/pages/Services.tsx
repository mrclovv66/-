import { useEffect, useState } from "react";
import api from "../api/api";
import NavBar from "../components/NavBar";
import { useAuth } from "../hooks/useAuth";

type Service = {
  name: string;
  category: string;
  price: number;
  status: string; // "active" | "archive"
};

export default function Services() {
  const { role } = useAuth();

  // данные
  const [services, setServices] = useState<Service[]>([]);
  const [viewMode, setViewMode] = useState<"active" | "archive">("active");

  // формы
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [addService, setAddService] = useState({
    name: "",
    category: "",
    price: 0,
  });

  const [editService, setEditService] = useState({
    name: "",
    category: "",
    price: 0,
  });

  // ===== API =====
  const loadServices = async () => {
    try {
      const res = await api.get("/services");
      const all = Array.isArray(res.data) ? res.data : [];
      setServices(all.filter((s) => s.status === viewMode));
    } catch (err) {
      console.error("Ошибка загрузки услуг:", err);
      setServices([]);
    }
  };

  useEffect(() => {
    loadServices();
  }, [viewMode]);

  // ===== Добавление =====
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/services", addService);
      setAddService({ name: "", category: "", price: 0 });
      setShowAddForm(false);
      loadServices();
    } catch (err: any) {
      alert("Ошибка добавления: " + (err.response?.data?.error || err.message));
    }
  };

  // ===== Редактирование =====
  const startEdit = (s: Service) => {
    setEditingService(s);
    setEditService({
      name: s.name,
      category: s.category,
      price: s.price,
    });
  };

  const cancelEdit = () => {
    setEditingService(null);
    setEditService({ name: "", category: "", price: 0 });
  };

  const handleEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      await api.put(`/services/${editingService.name}`, editService);
      cancelEdit();
      loadServices();
    } catch (err: any) {
      alert("Ошибка редактирования: " + (err.response?.data?.error || err.message));
    }
  };

  // ===== Архивирование =====
  const handleArchive = async (name: string) => {
    if (!confirm("Отправить услугу в архив?")) return;
    try {
      await api.put(`/services/${name}/archive`);
      loadServices();
    } catch (err: any) {
      alert("Ошибка архивации: " + (err.response?.data?.error || err.message));
    }
  };

  // ===== Восстановление =====
  const handleRestore = async (name: string) => {
    if (!confirm("Восстановить услугу?")) return;
    try {
      await api.put(`/services/${name}/restore`);
      loadServices();
    } catch (err: any) {
      alert("Ошибка восстановления: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <NavBar />
      <h2>
        {role === "admin"
          ? "Управление услугами и тарифами"
          : "Управление услугами"}
      </h2>

      {/* вкладки */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setViewMode("active")}
          style={{
            padding: "8px 16px",
            background: viewMode === "active" ? "#007bff" : "#ccc",
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

      {/* кнопка добавить (ТОЛЬКО ДЛЯ ADMIN) */}
      {viewMode === "active" && role === "admin" && (
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
            {showAddForm ? "Отмена" : "Добавить услугу"}
          </button>
        </div>
      )}

      {/* Форма добавления (только admin) */}
      {showAddForm && role === "admin" && (
        <form
          onSubmit={handleAddService}
          style={{
            marginBottom: 20,
            padding: 16,
            maxWidth: 420,
            border: "1px solid #ddd",
            borderRadius: 8,
            background: "#fff",
          }}
        >
          <h3>Добавить услугу</h3>

          {/* Наименование */}
          <div style={{ marginBottom: 10 }}>
            <label>Наименование:</label>
            <input
              value={addService.name}
              onChange={(e) =>
                setAddService({ ...addService, name: e.target.value })
              }
              required
              style={{ marginLeft: 10, padding: 6, width: 260 }}
            />
          </div>

          {/* Категория */}
          <div style={{ marginBottom: 10 }}>
            <label>Категория:</label>
            <input
              value={addService.category}
              onChange={(e) =>
                setAddService({ ...addService, category: e.target.value })
              }
              required
              style={{ marginLeft: 10, padding: 6, width: 260 }}
            />
          </div>

          {/* Стоимость */}
          <div style={{ marginBottom: 10 }}>
            <label>Стоимость:</label>
            <input
              type="number"
              value={addService.price}
              onChange={(e) =>
                setAddService({ ...addService, price: Number(e.target.value) })
              }
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
      {editingService && viewMode === "active" && (
        <form
          onSubmit={handleEditService}
          style={{
            marginBottom: 20,
            padding: 16,
            maxWidth: 420,
            border: "1px solid #ddd",
            borderRadius: 8,
            background: "#fff",
          }}
        >
          <h3>Редактировать услугу</h3>

          {/* Категория */}
          <div style={{ marginBottom: 10 }}>
            <label>Категория:</label>
            <input
              value={editService.category}
              onChange={(e) =>
                setEditService({ ...editService, category: e.target.value })
              }
              required
              style={{ marginLeft: 10, padding: 6, width: 260 }}
            />
          </div>

          {/* Стоимость (admin может, employee — нет) */}
          <div style={{ marginBottom: 10 }}>
            <label>Стоимость:</label>

            <input
              type="number"
              value={editService.price}
              disabled={role === "employee"}
              onChange={(e) =>
                setEditService({
                  ...editService,
                  price: Number(e.target.value),
                })
              }
              required
              style={{
                marginLeft: 10,
                padding: 6,
                width: 260,
                background: role === "employee" ? "#eee" : "white",
                cursor: role === "employee" ? "not-allowed" : "text",
              }}
            />

            {role === "employee" && (
              <p style={{ color: "#a00", fontSize: 13, marginTop: 4 }}>
                Только администратор может изменять тариф услуги
              </p>
            )}
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
      {services.length === 0 ? (
        <p style={{ color: "#666" }}>
          {viewMode === "archive" ? "Архив пуст" : "Нет активных услуг"}
        </p>
      ) : (
        <table
          border={1}
          cellPadding={6}
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead style={{ background: "#007bff", color: "white" }}>
            <tr>
              <th>Наименование</th>
              <th>Категория</th>
              <th>Стоимость</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>

          <tbody>
            {services.map((s) => (
              <tr key={s.name}>
                <td>{s.name}</td>
                <td>{s.category}</td>
                <td>{s.price}</td>
                <td>{s.status}</td>
                <td>
                  {viewMode === "active" ? (
                    <>
                      <button
                        onClick={() => startEdit(s)}
                        style={{
                          padding: "5px 10px",
                          background: "#ffc107",
                          border: "none",
                          borderRadius: 4,
                          marginRight: 6,
                          cursor: "pointer",
                        }}
                      >
                        Редактировать
                      </button>

                      <button
                        onClick={() => handleArchive(s.name)}
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
                      onClick={() => handleRestore(s.name)}
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
