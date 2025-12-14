import { useEffect, useState, useRef } from "react";
import api from "../api/api";
import NavBar from "../components/NavBar";
import { useAuth } from "../hooks/useAuth";

type Apartment = {
  address: string;
  rooms: number;
  area: number;
};

type Meter = {
  id: number;
  address: string;
  month: string;
  hot: number;
  cold: number;
};

type EPD = {
  docNumber: string;
  month: string;
  total: number;
  paid: boolean;
  address: string;
};

type Debt = {
  id: number;
  address: string;
  amount: number;
};

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

  // ===== скачать квитанцию епд  =====
  const downloadEPD = async (docNumber: string) => {
    try {
      const response = await api.get(`/epds/${docNumber}/download`, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `EPD-${docNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Ошибка скачивания PDF");
      console.error(err);
    }
  };

  // ===== форма передачи показаний =====
  const [selectedAddress, setSelectedAddress] = useState("");
  const [billingMonth, setBillingMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [hotWater, setHotWater] = useState("");
  const [coldWater, setColdWater] = useState("");
  const [editingMeter, setEditingMeter] = useState<Meter | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);

  const scrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const sortEpdsDesc = (list: EPD[]) =>
    [...list].sort((a, b) => (a.month < b.month ? 1 : -1));

  // ===== Загрузка профиля =====
  useEffect(() => {
    if (!token) return;

    Promise.all([
      api.get("/profile"),
      api.get("/profile/meters"),
      api.get("/profile/epd"),
      api.get("/profile/debts"),
    ])
      .then(([profileRes, metersRes, epdsRes, debtsRes]) => {
        setData(profileRes.data);
        setMeters(metersRes.data);
        setEpds(sortEpdsDesc(epdsRes.data));
        setDebts(debtsRes.data);

        if (profileRes.data.apartments.length > 0) {
          setSelectedAddress(profileRes.data.apartments[0].address);
        }
      })
      .catch(console.error);
  }, [token]);

  // ===== Передача/обновление показаний =====
  const handleSubmitMeters = async (e: React.FormEvent) => {
    e.preventDefault();

    const hot = Number(hotWater);
    const cold = Number(coldWater);

    if (!selectedAddress) {
      alert("Выберите квартиру");
      return;
    }
    if (hot <= 0 || cold <= 0) {
      alert("Показания должны быть больше нуля");
      return;
    }

    try {
      const payload = {
        address: selectedAddress,
        billingMonth,
        hotWater: hot,
        coldWater: cold,
      };

      if (editingMeter) {
        await api.put(`/meters/${editingMeter.id}`, payload);
        alert("Показания обновлены");
        setEditingMeter(null);
      } else {
        await api.post("/meters", payload);
        alert("Показания переданы");
      }

      setHotWater("");
      setColdWater("");
      setBillingMonth(new Date().toISOString().slice(0, 7));

      await reloadMetersAndEPDs();
    } catch (error: any) {
      alert(error.response?.data?.error || "Ошибка передачи показаний");
    }
  };

  const reloadMetersAndEPDs = async () => {
    try {
      const [metersRes, epdsRes] = await Promise.all([
        api.get("/profile/meters"),
        api.get("/profile/epd"),
      ]);
      setMeters(metersRes.data);
      setEpds(sortEpdsDesc(epdsRes.data));
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (m: Meter) => {
    setEditingMeter(m);
    setSelectedAddress(m.address);
    setBillingMonth(m.month);
    setHotWater(m.hot.toString());
    setColdWater(m.cold.toString());
    scrollToForm();
  };

  const cancelEdit = () => {
    setEditingMeter(null);
    setHotWater("");
    setColdWater("");
    setBillingMonth(new Date().toISOString().slice(0, 7));
  };

  // ===== Оплата одного ЕПД =====
  const payEPD = async (docNumber: string) => {
    if (!window.confirm("Оплатить этот ЕПД?")) return;

    try {
      await api.put(`/epds/${docNumber}/pay`);
      alert("ЕПД оплачен");

      const [epdsRes, debtsRes] = await Promise.all([
        api.get("/profile/epd"),
        api.get("/profile/debts"),
      ]);
      setEpds(sortEpdsDesc(epdsRes.data));
      setDebts(debtsRes.data);
    } catch (e: any) {
      alert(e.response?.data?.error || "Ошибка при оплате");
    }
  };

  return (
    <div>
      <NavBar />
      <h2>Личный кабинет</h2>

      {/* ===== ПРОФИЛЬ ===== */}
      {!data ? (
        <p>Загрузка...</p>
      ) : (
        <div>
          <p>
            <b>ФИО:</b> {data.fullName}
          </p>
          <p>
            <b>Телефон:</b> {data.phone}
          </p>

          <h4>Мои квартиры:</h4>
          <ul>
            {data.apartments.map((a, i) => (
              <li key={i}>
                <b>{a.address}</b><br />
                Комнат: {a.rooms}, Площадь: {a.area} м²
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ===== Показания ===== */}
      <section>
        <h3>Показания счётчиков</h3>

        <form
          ref={formRef}
          onSubmit={handleSubmitMeters}
          style={{
            border: "1px solid #ccc",
            padding: 20,
            marginBottom: 20,
            borderRadius: 10,
            maxWidth: 450,
          }}
        >
          <h4>{editingMeter ? "Редактирование" : "Передача показаний"}</h4>

          <div style={{ marginBottom: 10 }}>
            <label>Квартира:</label>
            <select
              value={selectedAddress}
              onChange={(e) => setSelectedAddress(e.target.value)}
              style={{ marginLeft: 10 }}
            >
              {data?.apartments.map((a) => (
                <option key={a.address} value={a.address}>
                  {a.address}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>Месяц:</label>
            <input
              type="month"
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              style={{ marginLeft: 10 }}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>Горячая:</label>
            <input
              type="number"
              min={1}
              value={hotWater}
              onChange={(e) => setHotWater(e.target.value)}
              style={{ marginLeft: 10 }}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>Холодная:</label>
            <input
              type="number"
              min={1}
              value={coldWater}
              onChange={(e) => setColdWater(e.target.value)}
              style={{ marginLeft: 10 }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "8px 12px",
              background: "#2a9d8f",
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
              style={{ marginLeft: 10 }}
            >
              Отмена
            </button>
          )}
        </form>

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
            <div
              key={address}
              style={{
                background: "#f7f7f7",
                padding: 10,
                marginBottom: 25,
                borderRadius: 10,
              }}
            >
              <h4>{address}</h4>
              <table border={1} cellPadding={6} style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Месяц</th>
                    <th>Горячая</th>
                    <th>Холодная</th>
                    {/* <th></th> */}
                  </tr>
                </thead>
                <tbody>
                  {list.map((m) => (
                    <tr key={m.id}>
                      <td>{m.month}</td>
                      <td>{m.hot}</td>
                      <td>{m.cold}</td>
                      {/* <td>
                        <button onClick={() => startEdit(m)}>✏</button>
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </section>

      {/* ===== ЕПД ===== */}
      <section>
        <h3>Платёжные документы (ЕПД)</h3>

        {epds.length === 0 ? (
          <p>Нет ЕПД</p>
        ) : (
          <table border={1} cellPadding={6} style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Номер</th>
                <th>Адрес</th>
                <th>Месяц</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Квитанция</th>
              </tr>
            </thead>
            <tbody>
              {epds.map((e) => (
                <tr key={e.docNumber}>
                  <td>{e.docNumber}</td>
                  <td>{e.address}</td>
                  <td>{e.month}</td>
                  <td>{e.total} ₽</td>
                  <td>
                    {e.paid ? (
                      <span style={{ color: "green", fontWeight: 600 }}>
                        Оплачено
                      </span>
                    ) : (
                      <button
                        onClick={() => payEPD(e.docNumber)}
                        style={{
                          padding: "5px 10px",
                          background: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      >
                        Оплатить
                      </button>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => downloadEPD(e.docNumber)}
                      style={{
                        padding: "5px 10px",
                        background: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      Скачать
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ===== ЗАДОЛЖЕННОСТИ (без кнопки!) ===== */}
      <section>
        <h3>Задолженности</h3>

        {debts.length === 0 ? (
          <p>Задолженностей нет</p>
        ) : (
          <table border={1} cellPadding={6} style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Адрес</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((d) => (
                <tr key={d.id}>
                  <td>{d.address}</td>
                  <td>{d.amount} ₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

    </div>
  );
}