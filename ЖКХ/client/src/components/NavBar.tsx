// src/components/NavBar.tsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function NavBar() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 20px",
        background: "#eee",
        borderBottom: "1px solid #ccc",
      }}
    >
      <Link to="/dashboard">🏠 Главная</Link>

      {/* ===== ADMIN ===== */}
      {role === "admin" && (
        <>
          <Link to="/employees">Сотрудники</Link>
          {/* <Link to="/clients">Клиенты</Link> */}
          <Link to="/services">Услуги</Link>
          <Link to="/reports">Отчёты</Link>
          {/* <Link to="/apartments">Квартиры</Link>
          <Link to="/epds">ЕПД</Link>
          <Link to="/debts">Задолженности</Link>
          <Link to="/requests">Заявки</Link> */}
        </>
      )}

      {/* ===== EMPLOYEE ===== */}
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

      {/* ===== CLIENT ===== */}
      {role === "client" && (
        <>
          <Link to="/profile">Личный кабинет</Link>
          <Link to="/requests">Заявки</Link>
        </>
      )}

      {/* ===== LOGOUT ===== */}
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
