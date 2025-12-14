// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";

// ===== Страницы =====
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Apartments from "./pages/Apartments";
import Services from "./pages/Services";
import Meters from "./pages/Meters";
import EPDs from "./pages/EPDs";
import Debts from "./pages/Debts";
import Profile from "./pages/Profile";
import Requests from "./pages/Requests";
// import Employees from "./pages/Employees";  
import NotFound from "./pages/NotFound";
import Reports from "./pages/Reports";

import type { JSX } from "react";

// ===== Компонент проверки роли =====
function RoleRoute({ children, roles }: { children: JSX.Element; roles: string[] }) {
  const { token, role } = useAuth();

  if (!token) return <Navigate to="/login" replace />;

  if (!roles.includes(role || ""))
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <h2>⛔ Доступ запрещён</h2>
        <p>У вас недостаточно прав для просмотра этой страницы.</p>
      </div>
    );

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* === Авторизация === */}
          <Route path="/login" element={<Login />} />

          {/* === Главная === */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ============================================
              ADMIN — может управлять сотрудниками
          ============================================ */}
          {/* <Route
            path="/employees"
            element={
              <RoleRoute roles={["admin"]}>
                <Employees />
              </RoleRoute>
            }
          /> */}
          <Route
            path="/reports"
            element={
              <RoleRoute roles={["admin"]}>
                <Reports />
              </RoleRoute>
            }
          />

          {/* ============================================
              ADMIN + EMPLOYEE
          ============================================ */}
          <Route
            path="/services"
            element={
              <RoleRoute roles={["admin", "employee"]}>
                <Services />
              </RoleRoute>
            }
          />

          <Route
            path="/clients"
            element={
              <RoleRoute roles={["admin", "employee"]}>
                <Clients />
              </RoleRoute>
            }
          />

          <Route
            path="/apartments"
            element={
              <RoleRoute roles={["admin", "employee"]}>
                <Apartments />
              </RoleRoute>
            }
          />

          <Route
            path="/epds"
            element={
              <RoleRoute roles={["admin", "employee"]}>
                <EPDs />
              </RoleRoute>
            }
          />

          <Route
            path="/debts"
            element={
              <RoleRoute roles={["admin", "employee"]}>
                <Debts />
              </RoleRoute>
            }
          />

          {/* ============================================
              EMPLOYEE ONLY
          ============================================ */}
          <Route
            path="/meters"
            element={
              <RoleRoute roles={["employee"]}>
                <Meters />
              </RoleRoute>
            }
          />

          {/* ============================================
              CLIENT ONLY
          ============================================ */}
          <Route
            path="/profile"
            element={
              <RoleRoute roles={["client"]}>
                <Profile />
              </RoleRoute>
            }
          />

          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <Requests />
              </ProtectedRoute>
            }
          />

          {/* === 404 === */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
