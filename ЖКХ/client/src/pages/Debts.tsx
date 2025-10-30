// src/pages/Debts.tsx
import { useEffect, useState } from "react";
import api from "../api/api";
import NavBar from "../components/NavBar";

type Debt = {
  id: number;
  address: string;
  amount: number;
  dueDate: string;
};

export default function Debts() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [search, setSearch] = useState("");

  // === Загрузка данных ===
  const loadDebts = async () => {
    try {
      const res = await api.get("/debts");
      setDebts(res.data);
    } catch (err) {
      console.error("Ошибка загрузки задолженностей:", err);
    }
  };

  useEffect(() => {
    loadDebts();
  }, []);

  // === Добавление или обновление ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !amount) {
      alert("Заполните адрес и сумму!");
      return;
    }

    const data = { address, amount: parseFloat(amount), dueDate };

    try {
      if (editingDebt) {
        await api.put(`/debts/${editingDebt.id}`, data);
        alert("Задолженность обновлена!");
      } else {
        await api.post("/debts", data);
        alert("Задолженность добавлена!");
      }
      setAddress("");
      setAmount("");
      setDueDate("");
      setEditingDebt(null);
      loadDebts();
    } catch (err: any) {
      alert("Ошибка: " + (err.response?.data?.error || err.message));
    }
  };

  // === Удаление ===
  const deleteDebt = async (id: number) => {
    if (!window.confirm("Удалить запись?")) return;
    try {
      await api.delete(`/debts/${id}`);
      alert("Удалено!");
      loadDebts();
    } catch (err: any) {
      alert("Ошибка удаления: " + (err.response?.data?.error || err.message));
    }
  };

  // === Начало редактирования ===
  const startEdit = (d: Debt) => {
    setEditingDebt(d);
    setAddress(d.address);
    setAmount(d.amount.toString());
    setDueDate(d.dueDate ? d.dueDate.split("T")[0] : "");
  };

  // === Сброс редактирования ===
  const cancelEdit = () => {
    setEditingDebt(null);
    setAddress("");
    setAmount("");
    setDueDate("");
  };

  // === Фильтрация по адресу ===
  const filteredDebts = debts.filter((d) =>
    d.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <NavBar />
      <h2>Задолженности</h2>

      {/* 🔍 Поиск */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Поиск по адресу..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: 4,
            border: "1px solid #ccc",
            width: "300px",
            marginRight: 10,
          }}
        />
        <button
          onClick={loadDebts}
          style={{
            padding: "6px 12px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: 4,
          }}
        >
          Обновить
        </button>
      </div>

      {/* 🧾 Форма */}
      <form
        onSubmit={handleSubmit}
        style={{
          marginBottom: 30,
          padding: 20,
          border: "1px solid #ccc",
          borderRadius: 8,
          background: "#f9f9f9",
          width: "420px",
        }}
      >
        <h3>{editingDebt ? "Редактировать долг" : "Добавить долг"}</h3>

        <div style={{ marginBottom: 10 }}>
          <label>Адрес:</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            style={{ marginLeft: 10, padding: 5, width: "250px" }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Сумма (₽):</label>
          <input
            type="number"
            value={amount}
            min="1"
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{ marginLeft: 10, padding: 5, width: "120px" }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Срок выплаты:</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{ marginLeft: 10, padding: 5 }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: "8px 16px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: 4,
          }}
        >
          {editingDebt ? "Сохранить" : "Добавить"}
        </button>

        {editingDebt && (
          <button
            type="button"
            onClick={cancelEdit}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: 4,
              marginLeft: 10,
            }}
          >
            Отмена
          </button>
        )}
      </form>

      {/* 📊 Таблица */}
      <table border={1} cellPadding={6} style={{ width: "100%", background: "#fff" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Адрес</th>
            <th>Сумма</th>
            <th>Срок выплаты</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {filteredDebts.length === 0 ? (
            <tr>
              <td colSpan={5}>Нет данных</td>
            </tr>
          ) : (
            filteredDebts.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.address}</td>
                <td>{d.amount} ₽</td>
                <td>{d.dueDate ? d.dueDate.split("T")[0] : "—"}</td>
                <td>
                  <button
                    onClick={() => startEdit(d)}
                    style={{
                      padding: "5px 10px",
                      backgroundColor: "#ffc107",
                      border: "none",
                      borderRadius: 4,
                      marginRight: 5,
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteDebt(d.id)}
                    style={{
                      padding: "5px 10px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                    }}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
