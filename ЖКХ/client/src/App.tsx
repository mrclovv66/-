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
import NotFound from "./pages/NotFound";
import type { JSX } from "react";

// ===== Компонент проверки роли =====
function RoleRoute({ children, roles }: { children: JSX.Element; roles: string[] }) {
  const { token, role } = useAuth();

  // Если не авторизован — на /login
  if (!token) return <Navigate to="/login" replace />;

  // Если роль не разрешена — сообщение
  if (!roles.includes(role || ""))
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <h2>⛔ Доступ запрещён</h2>
        <p>Вам не хватает прав для просмотра этой страницы.</p>
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

          {/* === Общие страницы (вход в систему) === */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* === Только для ADMIN === */}
          <Route
            path="/services"
            element={
              <RoleRoute roles={["admin"]}>
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
            path="/meters"
            element={
              <RoleRoute roles={["employee"]}>
                <Meters />
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

          {/* === Только для CLIENT === */}
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

          {/* === Ошибка 404 === */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { AuthProvider, useAuth } from "./hooks/useAuth";
// import { ProtectedRoute } from "./components/ProtectedRoute";

// // ===== Страницы =====
// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";
// import Clients from "./pages/Clients";
// import Apartments from "./pages/Apartments";
// import Services from "./pages/Services";
// import Meters from "./pages/Meters";
// import EPDs from "./pages/EPDs";
// import Debts from "./pages/Debts";
// import Profile from "./pages/Profile";
// import NotFound from "./pages/NotFound";

// import type { JSX } from "react";

// // ===== Компонент проверки роли =====
// function RoleRoute({ children, roles }: { children: JSX.Element; roles: string[] }) {
//   const { token, role } = useAuth();

//   // Если пользователь не авторизован → редирект на логин
//   if (!token) return <Navigate to="/login" replace />;

//   // Если роль не разрешена → сообщение об ошибке
//   if (!roles.includes(role || ""))
//     return (
//       <div style={{ textAlign: "center", marginTop: 100 }}>
//         <h2>⛔ Доступ запрещён</h2>
//         <p>Вам не хватает прав для просмотра этой страницы.</p>
//       </div>
//     );

//   return children;
// }

// export default function App() {
//   return (
//     <AuthProvider>
//       <BrowserRouter>
//         <Routes>
//           {/* === Авторизация === */}
//           <Route path="/login" element={<Login />} />

//           {/* === Общая защищённая страница === */}
//           <Route
//             path="/dashboard"
//             element={
//               <ProtectedRoute>
//                 <Dashboard />
//               </ProtectedRoute>
//             }
//           />

//           {/* === Только для ADMIN === */}
//           <Route
//             path="/services"
//             element={
//               <RoleRoute roles={["admin"]}>
//                 <Services />
//               </RoleRoute>
//             }
//           />

//           {/* === ADMIN + EMPLOYEE === */}
//           <Route
//             path="/clients"
//             element={
//               <RoleRoute roles={["admin", "employee"]}>
//                 <Clients />
//               </RoleRoute>
//             }
//           />
//           <Route
//             path="/apartments"
//             element={
//               <RoleRoute roles={["admin", "employee"]}>
//                 <Apartments />
//               </RoleRoute>
//             }
//           />
//           <Route
//             path="/epd"
//             element={
//               <RoleRoute roles={["admin", "employee"]}>
//                 <EPDs />
//               </RoleRoute>
//             }
//           />
//           <Route
//             path="/debts"
//             element={
//               <RoleRoute roles={["admin", "employee"]}>
//                 <Debts />
//               </RoleRoute>
//             }
//           />

//           {/* === Только для EMPLOYEE === */}
//           <Route
//             path="/meters"
//             element={
//               <RoleRoute roles={["employee"]}>
//                 <Meters />
//               </RoleRoute>
//             }
//           />

//           {/* === Только для CLIENT === */}
//           <Route
//             path="/profile"
//             element={
//               <RoleRoute roles={["client"]}>
//                 <Profile />
//               </RoleRoute>
//             }
//           />

//           {/* === Главная страница (редирект на /login) === */}
//           <Route path="/" element={<Navigate to="/login" replace />} />

//           {/* === Ошибка 404 === */}
//           <Route path="*" element={<NotFound />} />
//         </Routes>
//       </BrowserRouter>
//     </AuthProvider>
//   );
// }
