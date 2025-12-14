import { useEffect, useState } from "react";
import api from "../api/api";
import NavBar from "../components/NavBar";

type EPD = {
  docNumber: string;
  address: string;
  billingMonth: string;
  totalAmount: number;
  paid: boolean;
};

type Service = {
  name: string;
  category: string;
  cost: number;
};

type Apartment = {
  address: string;
};

export default function EPDs() {
  const [epds, setEpds] = useState<EPD[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [addresses, setAddresses] = useState<Apartment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [form, setForm] = useState({
    docNumber: "",
    address: "",
    billingMonth: "",
  });

  // === Получение данных ===
  const loadEPDs = (term: string = "") => {
    api.get(`/epds?search=${term}`).then((res) => setEpds(res.data));
  };

  useEffect(() => {
    loadEPDs();
    api.get("/apartments").then((res) => setAddresses(res.data));
    api.get("/services/active").then((res) => setServices(res.data));
  }, []);

  // Поиск с задержкой
  useEffect(() => {
    const delay = setTimeout(() => loadEPDs(search), 300);
    return () => clearTimeout(delay);
  }, [search]);

  const toggleForm = () => setShowForm((prev) => !prev);

  const toggleService = (name: string) => {
    setSelectedServices((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  // === Создание ЕПД ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.docNumber || !form.address || !form.billingMonth || selectedServices.length === 0) {
      alert("Заполните все поля и выберите хотя бы одну услугу!");
      return;
    }

    await api
      .post("/epds", {
        docNumber: form.docNumber,
        address: form.address,
        billingMonth: form.billingMonth,
        services: selectedServices,
      })
      .then(() => {
        alert("ЕПД успешно добавлен!");
        setShowForm(false);
        setSelectedServices([]);
        setForm({ docNumber: "", address: "", billingMonth: "" });
        loadEPDs();
      })
      .catch((err) => alert(err.response?.data?.error || err.message));
  };

  // === Оплата ЕПД ===
  const handlePay = async (docNumber: string) => {
    if (!window.confirm("Отметить этот ЕПД как оплаченный?")) return;

    await api
      .put(`/epds/${docNumber}/pay`)
      .then(() => {
        alert("ЕПД отмечен как оплаченный!");
        loadEPDs();
      })
      .catch((err) => alert(err.response?.data?.error || err.message));
  };

  // === Удаление ЕПД ===
  const handleDelete = async (docNumber: string) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот ЕПД?")) return;

    await api
      .delete(`/epds/${docNumber}`)
      .then(() => {
        alert("ЕПД успешно удалён");
        loadEPDs();
      })
      .catch((err) => alert(err.response?.data?.error || err.message));
  };

  return (
    <div style={{ backgroundColor: "#f5f6fa", minHeight: "100vh" }}>
      <NavBar />
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "15px" }}>
          Единые платёжные документы (ЕПД)
        </h2>

        {/* === Поиск + кнопка Добавить === */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Поиск по номеру, адресу или месяцу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "8px 12px",
              width: "300px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              marginRight: "10px",
            }}
          />
          <button
            onClick={toggleForm}
            style={{
              backgroundColor: showForm ? "#888" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "8px 15px",
              cursor: "pointer",
            }}
          >
            {showForm ? "Скрыть форму" : "Добавить ЕПД"}
          </button>
        </div>

        {/* === Форма добавления === */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "20px 30px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              width: "720px",
              margin: "0 auto 25px",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            <label>Номер ЕПД:</label>
            <input
              type="text"
              value={form.docNumber}
              onChange={(e) => setForm({ ...form, docNumber: e.target.value })}
              style={{
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />

            <label>Адрес:</label>
            <select
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              style={{
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            >
              <option value="">Выберите адрес</option>
              {addresses.map((a, i) => (
                <option key={i} value={a.address}>
                  {a.address}
                </option>
              ))}
            </select>

            <label>Расчётный месяц:</label>
            <input
              type="month"
              value={form.billingMonth.replace("-01", "")}
              onChange={(e) => setForm({ ...form, billingMonth: e.target.value + "-01" })}
              style={{
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />

            {/* === Услуги === */}
            <div>
              <h4>Выберите услуги:</h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px 30px",
                  maxHeight: "220px",
                  overflowY: "auto",
                  paddingRight: "6px",
                }}
              >
                {services.map((s) => (
                  <label
                    key={s.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(s.name)}
                      onChange={() => toggleService(s.name)}
                    />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "10px",
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              Добавить
            </button>
          </form>
        )}

        {/* === Таблица ЕПД === */}
        <table
          border={1}
          cellPadding={6}
          style={{
            marginTop: "20px",
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "white",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <thead style={{ backgroundColor: "#007bff", color: "white" }}>
            <tr>
              <th>Номер документа</th>
              <th>Адрес</th>
              <th>Месяц</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>

          <tbody>
            {(epds || []).map((e, i) => (
              <tr key={i} style={{ textAlign: "center" }}>
                <td>{e.docNumber}</td>
                <td>{e.address}</td>
                <td>{e.billingMonth}</td>
                <td>{e.totalAmount} ₽</td>
                <td style={{ fontWeight: "bold" }}>
                  {e.paid ? "Оплачено" : "Не оплачено"}
                </td>

                <td style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                  {!e.paid && (
                    <button
                      onClick={() => handlePay(e.docNumber)}
                      style={{
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        cursor: "pointer",
                      }}
                    >
                      Оплатить
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(e.docNumber)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
