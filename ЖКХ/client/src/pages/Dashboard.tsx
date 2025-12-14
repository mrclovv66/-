import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import { useAuth } from "../hooks/useAuth";
import api from "../api/api";

type Service = {
  name: string;
  price: number;
};

export default function Dashboard() {
  const { role } = useAuth();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    if (role === "client") {
      api.get("/profile/services").then((res) => setServices(res.data));
    }
  }, [role]);

  return (
    <div>
      <NavBar />
      <h2>Панель ЖКХ</h2>

      {role === "admin" && <p>Доступ: полное управление данными</p>}
      {role === "employee" && <p>Доступ: учёт показаний, ЕПД, задолженностей</p>}

      {role === "client" && (
        <>
          <p>Доступ: просмотр своих данных и передача показаний</p>

          <h3 style={{ marginTop: 30, marginBottom: 10 }}>
            Справочник услуг
          </h3>

          <div
            style={{
              background: "#f5f6fa",
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "20px 30px",
              marginTop: "10px",
              marginBottom: "30px",
            }}
          >
            {services.length === 0 ? (
              <p>Нет доступных услуг</p>
            ) : (
              <table
                style={{
                  width: "`80%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid #ccc" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "10px 10px",
                        color: "#f7f7f7",
                        fontWeight: 600,
                      }}
                    >
                      Услуга
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "10px 10px",
                        color: "#f7f7f7",
                        fontWeight: 600,
                      }}
                    >
                      Стоимость
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {services.map((s, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "1px solid #e0e0e0",
                      }}
                    >
                      <td style={{ padding: "12px 10px" }}>
                        {s.name}
                      </td>
                      <td
                        style={{
                          padding: "12px 10px",
                          textAlign: "right",
                          fontWeight: 500,
                          color: "#007bff",
                        }}
                      >
                        {s.price} ₽
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
