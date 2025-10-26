import { useEffect, useState, useRef } from "react";
import api from "../api/api";
import NavBar from "../components/NavBar";
import { useAuth } from "../hooks/useAuth";

type Apartment = { address: string };
type Meter = { id: number; month: string; hot: number; cold: number; address: string; docNumber?: string };
type EPD = { id: number; docNumber: string; month: string; total: number };
type Debt = { id: number; address: string; amount: number; dueDate: string };

type ProfileData = {
  fullName: string;
  phone: string;
  apartments: Apartment[];
};

export default function Profile() {
  const { token } = useAuth();
  const [data, setData] = useState<ProfileData | null>(null);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [epds, setEpds] = useState<EPD[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [hotWater, setHotWater] = useState("");
  const [coldWater, setColdWater] = useState("");
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7));
  const [editingMeter, setEditingMeter] = useState<Meter | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>("");

  // ссылка для прокрутки к форме
  const formRef = useRef<HTMLFormElement | null>(null);
  const scrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // сортировка ЕПД по дате (новые сверху)
  const sortEpdsDesc = (list: EPD[]) =>
    [...list].sort((a, b) => (a.month < b.month ? 1 : a.month > b.month ? -1 : 0));

  // загрузка профиля
  useEffect(() => {
    if (!token) return;

    Promise.all([
      api.get("/profile"),
      api.get("/profile/meters"),
      api.get("/profile/epd"),
      api.get("/profile/debts"),
    ])
      .then(([profileRes, metersRes, epdRes, debtsRes]) => {
        setData(profileRes.data);
        setMeters(metersRes.data);
        setEpds(sortEpdsDesc(epdRes.data));
        setDebts(debtsRes.data);

        // выбираем первую квартиру по умолчанию
        if (profileRes.data.apartments.length > 0) {
          setSelectedAddress(profileRes.data.apartments[0].address);
        }
      })
      .catch(console.error);
  }, [token]);

  // передача или обновление показаний
  const handleSubmitMeters = async (e: React.FormEvent) => {
    e.preventDefault();

    const hot = parseFloat(hotWater);
    const cold = parseFloat(coldWater);

    if (hot <= 0 || cold <= 0) {
      alert("Показания должны быть больше 0!");
      return;
    }

    try {
      const payload = JSON.parse(atob(token!.split(".")[1]));
      const clientId = payload.id || payload.client_id;
      const apartmentId = 1; // временно
      const [year, month] = billingMonth.split("-");
      const docNumber = `E${clientId}${apartmentId}${year}${month}`;
      const normalizedMonth = billingMonth.length === 7 ? `${billingMonth}-01` : billingMonth;

      const meterData = {
        DocNumber: docNumber,
        Address: selectedAddress,
        BillingMonth: normalizedMonth,
        HotWater: hot,
        ColdWater: cold,
      };

      if (editingMeter) {
        await api.put(`/meters/${editingMeter.id}`, meterData);
        alert("Показания обновлены!");
        setEditingMeter(null);
      } else {
        await api.post("/meters", meterData);
        alert("Показания переданы!");
      }

      setHotWater("");
      setColdWater("");
      await reloadData();
    } catch (error: any) {
      console.error(error);
      alert("Ошибка при передаче показаний: " + (error.response?.data?.error || error.message));
    }
  };

  // обновление данных
  const reloadData = async () => {
    try {
      const [metersRes, epdRes] = await Promise.all([
        api.get("/profile/meters"),
        api.get("/profile/epd"),
      ]);
      setMeters(metersRes.data);
      setEpds(sortEpdsDesc(epdRes.data));
    } catch (e) {
      console.error("Ошибка при обновлении данных:", e);
    }
  };

  // редактирование показаний
  const startEditMeter = (meter: Meter) => {
    setEditingMeter(meter);
    setHotWater(meter.hot.toString());
    setColdWater(meter.cold.toString());
    setBillingMonth(meter.month);
    setSelectedAddress(meter.address); // устанавливаем адрес выбранной квартиры
    scrollToForm();
  };

  const cancelEdit = () => {
    setEditingMeter(null);
    setHotWater("");
    setColdWater("");
    setBillingMonth(new Date().toISOString().slice(0, 7));
    if (data?.apartments.length) {
      setSelectedAddress(data.apartments[0].address);
    }
  };

  return (
    <div>
      <NavBar />
      <h2>Личный кабинет</h2>

      {!data ? (
        <p>Загрузка...</p>
      ) : (
        <div>
          <p><b>ФИО:</b> {data.fullName}</p>
          <p><b>Телефон:</b> {data.phone}</p>

          <h4>Квартиры:</h4>
          <ul>
            {data.apartments.length > 0
              ? data.apartments.map((a, i) => <li key={i}>{a.address}</li>)
              : <li>Нет квартир</li>}
          </ul>
        </div>
      )}

      {/* === Показания счётчиков === */}
      <section>
        <h3>Показания счётчиков</h3>

        <form
          ref={formRef}
          onSubmit={handleSubmitMeters}
          style={{ marginBottom: 20, padding: 20, border: "1px solid #ccc", borderRadius: 8 }}
        >
          <h4>{editingMeter ? "Редактировать показания" : "Передать показания"}</h4>

          {/* выбор адреса квартиры */}
          <div style={{ marginBottom: 10 }}>
            <label>Квартира:</label>
            <select
              value={selectedAddress}
              onChange={(e) => setSelectedAddress(e.target.value)}
              required
              style={{ marginLeft: 10, padding: 5 }}
            >
              {data?.apartments.map((a, i) => (
                <option key={i} value={a.address}>
                  {a.address}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>Расчетный месяц:</label>
            <input
              type="month"
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              required
              style={{ marginLeft: 10, padding: 5 }}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>Горячая вода:</label>
            <input
              type="number"
              min="1"
              value={hotWater}
              onChange={(e) => setHotWater(e.target.value)}
              required
              placeholder="Введите показания"
              style={{ marginLeft: 10, padding: 5 }}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>Холодная вода:</label>
            <input
              type="number"
              min="1"
              value={coldWater}
              onChange={(e) => setColdWater(e.target.value)}
              required
              placeholder="Введите показания"
              style={{ marginLeft: 10, padding: 5 }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: 4,
            }}
          >
            {editingMeter ? "Обновить" : "Передать"}
          </button>

          {editingMeter && (
            <button
              type="button"
              onClick={cancelEdit}
              style={{
                padding: "10px 20px",
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

        {/* Таблица показаний */}
        {meters.length === 0 ? (
          <p>Нет данных</p>
        ) : (
          Object.entries(
            meters.reduce((acc: Record<string, Meter[]>, m) => {
              if (!acc[m.address]) acc[m.address] = [];
              acc[m.address].push(m);
              return acc;
            }, {})
          ).map(([address, list]) => (
            <div key={address} style={{ marginBottom: 30, background: "#f9f9f9", padding: 15, borderRadius: 10 }}>
              <h4>🏠 {address}</h4>
              <table border={1} cellPadding={6} style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Месяц</th>
                    <th>Горячая вода</th>
                    <th>Холодная вода</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((m) => (
                    <tr key={m.id}>
                      <td>{m.month}</td>
                      <td>{m.hot}</td>
                      <td>{m.cold}</td>
                      <td>
                        <button
                          onClick={() => startEditMeter(m)}
                          style={{ padding: "5px 10px", backgroundColor: "#ffc107", border: "none", borderRadius: 4 }}
                        >
                          Редактировать
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </section>

      {/* === ЕПД === */}
      <section>
        <h3>Платёжные документы (ЕПД)</h3>
        {epds.length === 0 ? (
          <p>Нет документов</p>
        ) : (
          <table border={1} cellPadding={6}>
            <thead>
              <tr>
                <th>Номер документа</th>
                <th>Месяц</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {epds.map((e) => (
                <tr key={e.docNumber}>
                  <td>{e.docNumber}</td>
                  <td>{e.month}</td>
                  <td>{e.total} ₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* === Задолженности === */}
      <section>
        <h3>Задолженности</h3>
        {debts.length === 0 ? (
          <p>Нет задолженностей</p>
        ) : (
          <table border={1} cellPadding={6}>
            <thead>
              <tr>
                <th>Адрес</th>
                <th>Сумма</th>
                <th>Срок выплаты</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((d) => (
                <tr key={d.id}>
                  <td>{d.address}</td>
                  <td>{d.amount} ₽</td>
                  <td>{d.dueDate ? d.dueDate.split("T")[0] : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
