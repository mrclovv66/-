import { useEffect, useRef, useState } from "react";
import api from "../api/api";
import NavBar from "../components/NavBar";

type MeterReading = {
  id: number;
  doc_number: string;
  address: string;
  billingMonth: string;
  hotWater: number;
  coldWater: number;
};

export default function Meters() {
  const [meters, setMeters] = useState<MeterReading[]>([]);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const formRef = useRef<HTMLDivElement | null>(null);

  // Текущий месяц в формате YYYY-MM
  const getCurrentMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const [form, setForm] = useState({
    doc_number: "",
    address: "",
    billingMonth: getCurrentMonth(),
    hotWater: 1,
    coldWater: 1,
  });

  // ===== Загрузка данных =====
  const loadMeters = () => {
    api
      .get("/meters", { params: { search } })
      .then((res) => {
        setMeters(Array.isArray(res.data) ? res.data : []);
      })
      .catch(console.error);
  };

  const loadAddresses = () => {
    api
      .get("/meters/addresses")
      .then((res) => {
        setAddresses(Array.isArray(res.data) ? res.data : []);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadAddresses();
    loadMeters();
  }, []);

  useEffect(() => {
    loadMeters();
  }, [search]);

  const scrollToForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  // ===== Отправка формы =====
  const handleSubmit = async () => {
    try {
      if (editingId) {
        await api.put(`/meters/${editingId}`, form);
      } else {
        await api.post("/meters", form);
      }

      setForm({
        doc_number: "",
        address: "",
        billingMonth: getCurrentMonth(),
        hotWater: 1,
        coldWater: 1,
      });

      setEditingId(null);
      setShowForm(false);
      loadMeters();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Ошибка");
    }
  };

  // ===== Удаление =====
  const handleDelete = async (id: number) => {
    if (!window.confirm("Удалить показание?")) return;
    await api.delete(`/meters/${id}`);
    loadMeters();
  };

  // ===== Редактирование =====
  const startEdit = (m: MeterReading) => {
    setEditingId(m.id);
    setForm({
      doc_number: m.doc_number,
      address: m.address,
      billingMonth: m.billingMonth,
      hotWater: m.hotWater,
      coldWater: m.coldWater,
    });
    setShowForm(true);
    scrollToForm();
  };

  return (
    <div>
      <NavBar />

      <h2>Показания счётчиков</h2>

      {/* Поиск */}
      <div style={{ marginBottom: 10 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по номеру ЕПД, адресу, месяцу"
          style={{
            padding: "8px",
            width: "280px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      {/* Кнопка "Добавить показания" */}
      {!showForm && (
        <button
          onClick={() => {
            setShowForm(true);
            setForm({
              doc_number: "",
              address: "",
              billingMonth: getCurrentMonth(),
              hotWater: 1,
              coldWater: 1,
            });
            scrollToForm();
          }}
          style={{
            marginBottom: 25,
            background: "#28a745",
            color: "white",
            padding: "10px 18px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Добавить показания
        </button>
      )}

      {/* Форма добавления / редактирования */}
      {showForm && (
        <div
          ref={formRef}
          style={{
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "25px",
            background: "#f8f9fa",
            maxWidth: "520px",
            marginBottom: "20px",
            marginLeft: "auto",
            marginRight: "auto", // по центру
          }}
        >
          <button
            onClick={() => {
              setShowForm(false);
              setEditingId(null);
              setForm({
                doc_number: "",
                address: "",
                billingMonth: getCurrentMonth(),
                hotWater: 1,
                coldWater: 1,
              });
            }}
            style={{
              marginBottom: 15,
              background: "#007bff",
              color: "white",
              padding: "8px 14px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Отмена
          </button>

          <h3 style={{ marginBottom: "20px" }}>
            {editingId ? "Редактировать показания" : "Добавить показания"}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Номер ЕПД */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ fontWeight: 500 }}>Номер ЕПД:</label>
              <input
                value={form.doc_number}
                onChange={(e) =>
                  setForm({ ...form, doc_number: e.target.value })
                }
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            {/* Адрес */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ fontWeight: 500 }}>Адрес:</label>
              <select
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">Выберите адрес</option>
                {addresses.map((addr) => (
                  <option key={addr} value={addr}>
                    {addr}
                  </option>
                ))}
              </select>
            </div>

            {/* Месяц */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ fontWeight: 500 }}>Месяц:</label>
              <input
                type="month"
                value={form.billingMonth}
                onChange={(e) =>
                  setForm({ ...form, billingMonth: e.target.value })
                }
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            {/* Горячая вода */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ fontWeight: 500 }}>Горячая вода:</label>
              <input
                type="number"
                value={form.hotWater}
                min={0}
                onChange={(e) =>
                  setForm({ ...form, hotWater: Number(e.target.value) })
                }
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            {/* Холодная вода */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ fontWeight: 500 }}>Холодная вода:</label>
              <input
                type="number"
                value={form.coldWater}
                min={0}
                onChange={(e) =>
                  setForm({ ...form, coldWater: Number(e.target.value) })
                }
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            {/* Кнопка добавить / сохранить */}
            <button
              onClick={handleSubmit}
              style={{
                width: "150px",
                background: "#28a745",
                color: "white",
                padding: "10px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                marginTop: "10px",
              }}
            >
              {editingId ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </div>
      )}

      {/* Таблица показаний */}
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>ID</th>
            <th>ЕПД</th>
            <th>Адрес</th>
            <th>Месяц</th>
            <th>Горячая</th>
            <th>Холодная</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {meters.map((m) => (
            <tr key={m.id}>
              <td>{m.id}</td>
              <td>{m.doc_number}</td>
              <td>{m.address}</td>
              <td>{m.billingMonth}</td>
              <td>{m.hotWater}</td>
              <td>{m.coldWater}</td>
              <td>
                <button onClick={() => startEdit(m)}>✏</button>
                <button onClick={() => handleDelete(m.id)}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
