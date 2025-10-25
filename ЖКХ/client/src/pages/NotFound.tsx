// src/pages/NotFound.tsx
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", marginTop: 80 }}>
      <h2>404 — страница не найдена</h2>
      <Link to="/dashboard">Вернуться на главную</Link>
    </div>
  );
}
