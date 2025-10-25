import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as apiLogin } from "../api/auth";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const [phone, setPhone] = useState(""); // теперь вводим телефон
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Отправляем телефон и пароль
      const res = await apiLogin(phone, password);
      login(res.token, res.role);
      navigate("/dashboard");
    } catch (error: any) {
      setErr(error.response?.data?.error || "Ошибка входа");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto", textAlign: "center" }}>
      <h2>Вход в систему ЖКХ</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Номер телефона (например 89001112233)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        /><br />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br />
        <button type="submit">Войти</button>
      </form>
      {err && <p style={{ color: "red" }}>{err}</p>}
    </div>
  );
}
