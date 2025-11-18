// src/components/NavBar.tsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function NavBar() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  // функция выхода
  const handleLogout = () => {
    logout(); // очищаем токен и роль
    navigate("/login"); // возвращаем на страницу входа
  };

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 20px",
        background: "#eee",
        borderBottom: "1px solid #ccc",
      }}
    >
      <Link to="/dashboard">🏠 Главная</Link>

      {/* Меню по ролям */}
      {role === "admin" && (
        <>
          <Link to="/clients">Сотрудники</Link>
          <Link to="/apartments">Квартиры</Link>
          <Link to="/services">Услуги</Link>
          <Link to="/epds">ЕПД</Link>
          <Link to="/debts">Задолженности</Link>
        </>
      )}

      {role === "employee" && (
        <>
          <Link to="/clients">Клиенты</Link>
          <Link to="/apartments">Квартиры</Link>
          <Link to="/services">Услуги</Link>
          <Link to="/meters">Показания</Link>
          <Link to="/epds">ЕПД</Link>
          <Link to="/debts">Задолженности</Link>
          <Link to="/requests">Заявки</Link>
        </>
      )}

      {role === "client" && (
        <>
          <Link to="/profile">Личный кабинет</Link>
          <Link to="/requests">Заявки</Link>
        </>
      )}

      {/* Кнопка выхода */}
      <button
        onClick={handleLogout}
        style={{
          marginLeft: "auto",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "6px 12px",
          cursor: "pointer",
        }}
      >
        Выйти
      </button>
    </nav>
  );
}
