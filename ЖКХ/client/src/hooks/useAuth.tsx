// src/hooks/useAuth.tsx
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

type AuthContextType = {
  token: string | null;
  role: string | null;
  login: (token: string, role: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  role: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  // Загружаем сохранённые данные
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedRole = localStorage.getItem("auth_role");
    if (savedToken) setToken(savedToken);
    if (savedRole) setRole(savedRole);
  }, []);

  const login = (token: string, role: string) => {
    setToken(token);
    setRole(role);
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_role", role);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_role");
  };

  return (
    <AuthContext.Provider value={{ token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
