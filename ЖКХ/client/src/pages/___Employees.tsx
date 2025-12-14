// src/pages/Employees.tsx
import { useEffect, useState } from "react";
import api from "../api/api";
import NavBar from "../components/NavBar";
import { useAuth } from "../hooks/useAuth";

type Employee = {
  id: number;
  fullName: string;
  phone: string;
  role: string;
};

export default function Employees() {
  const { role } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [viewMode, setViewMode] = useState<"employee" | "archive_employee">("employee");
  const [searchTerm, setSearchTerm] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    password: "",
  });

  // ===== Загрузка сотрудников =====
  const loadEmployees = () => {
    api
      .get(`/employees?type=${viewMode}&search=${encodeURIComponent(searchTerm)}`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setEmployees(res.data);
        } else {
          setEmployees([]);
        }
      })
      .catch((err) => {
        console.error("Ошибка загрузки сотрудников:", err);
        setEmployees([]);
      });
  };

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  useEffect(() => {
    const t = setTimeout(loadEmployees, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // ===== Добавление =====
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/employees", formData);
      setFormData({ fullName: "", phone: "", password: "" });
      setShowAddForm(false);
      loadEmployees();
    } catch (error: any) {
      alert("Ошибка при добавлении сотрудника: " + (error.response?.data?.error || error.message));
    }
  };

  // ===== Редактирование =====
  const startEdit = (emp: Employee) => {
    setEditing(emp);
    setFormData({
      fullName: emp.fullName,
      phone: emp.phone,
      password: "",
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setFormData({ fullName: "", phone: "", password: "" });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await api.put(`/employees/${editing.id}`, {
        fullName: formData.fullName,
        phone: formData.phone,
        password: formData.password || undefined,
        archived: viewMode === "archive_employee",
      });
      cancelEdit();
      loadEmployees();
    } catch (error: any) {
      alert("Ошибка при редактировании сотрудника: " + (error.response?.data?.error || error.message));
    }
  };

  // ===== Архивирование =====
  const handleArchive = async (id: number) => {
    if (!confirm("Отправить сотрудника в архив?")) return;
    try {
      await api.delete(`/employees/${id}`);
      loadEmployees();
    } catch (error: any) {
      alert("Ошибка при архивации: " + (error.response?.data?.error || error.message));
    }
  };

  // ===== Восстановление =====
  const handleRestore = async (id: number) => {
    if (!confirm("Восстановить сотрудника?")) return;
    try {
      await api.put(`/employees/${id}/restore`);
      loadEmployees();
    } catch (error: any) {
      alert("Ошибка при восстановлении: " + (error.response?.data?.error || error.message));
    }
  };

  // ===== UI =====
  return (
    <div style={{ padding: 20 }}>
      <NavBar />
      <h2>Сотрудники</h2>

      {/* Переключатель текущие / архив */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setViewMode("employee")}
          style={{
            padding: "8px 16px",
            background: viewMode === "employee" ? "#007bff" : "#ccc",
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
          onClick={() => setViewMode("archive_employee")}
          style={{
            padding: "8px 16px",
            background: viewMode === "archive_employee" ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Архив
        </button>
      </div>

      {/* Поиск */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Поиск по ФИО или телефону..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: 8, width: 320 }}
        />
      </div>

      {/* Кнопка Добавить */}
      {viewMode === "employee" && role === "admin" && (
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
            {showAddForm ? "Отмена" : "Добавить сотрудника"}
          </button>
        </div>
      )}

      {/* Форма добавления */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          style={{
            marginBottom: 20,
            padding: 16,
            maxWidth: 420,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <h3>Добавить сотрудника</h3>
          <div style={{ marginBottom: 10 }}>
            <label>ФИО: </label>
            <input
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              style={{ marginLeft: 10, padding: 6, width: 260 }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Телефон: </label>
            <input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              style={{ marginLeft: 10, padding: 6, width: 260 }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Пароль: </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

      {/* Таблица */}
      {employees.length === 0 ? (
        <p style={{ color: "#666" }}>
          {viewMode === "archive_employee" ? "Архив пуст" : "Нет сотрудников для отображения"}
        </p>
      ) : (
        <table border={1} cellPadding={6} style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>ID</th>
              <th style={{ textAlign: "left" }}>ФИО</th>
              <th style={{ textAlign: "left" }}>Телефон</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {(employees || []).map((emp) => (
              <tr key={emp.id}>
                <td>{emp.id}</td>
                <td>{emp.fullName}</td>
                <td>{emp.phone}</td>
                <td>
                  {viewMode === "employee" ? (
                    <>
                      <button
                        onClick={() => startEdit(emp)}
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
                        onClick={() => handleArchive(emp.id)}
                        style={{
                          padding: "5px 10px",
                          background: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      >
                        Архивировать
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleRestore(emp.id)}
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

      {/* Форма редактирования */}
      {editing && viewMode === "employee" && (
        <form
          onSubmit={handleEdit}
          style={{
            marginTop: 20,
            padding: 16,
            maxWidth: 420,
            border: "1px solid $ddd",
            borderRadius: 8,
          }}
        >
          <h3>Редактировать сотрудника</h3>
          <div style={{ marginBottom: 10 }}>
            <label>ФИО: </label>
            <input
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              style={{ marginLeft: 10, padding: 6, width: 260 }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Телефон: </label>
            <input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              style={{ marginLeft: 10, padding: 6, width: 260 }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Пароль (если нужно изменить): </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{ marginLeft: 10, padding: 6, width: 260 }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "10px 16px",
              background: "#ffc107",
              color: "black",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              marginRight: 8,
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
        </form>
      )}
    </div>
  );
}
