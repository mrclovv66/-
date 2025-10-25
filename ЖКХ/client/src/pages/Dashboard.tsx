// src/pages/Dashboard.tsx
import NavBar from "../components/NavBar";
import { useAuth } from "../hooks/useAuth";

export default function Dashboard() {
  const { role } = useAuth();

  return (
    <div>
      <NavBar />
      <h2>Панель ЖКХ</h2>
      <p>Ваша роль: <b>{role}</b></p>
      {/* Можно добавить здесь сводку статистики */}
      {role === "admin" && <p>Доступ: полное управление данными</p>}
      {role === "employee" && <p>Доступ: учёт показаний, ЕПД, задолженностей</p>}
      {role === "client" && <p>Доступ: просмотр своих данных и передача показаний</p>}
    </div>
  );
}
