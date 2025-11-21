// src/pages/Reports.tsx
import NavBar from "../components/NavBar";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";


import ReportPayments from "../components/reports/ReportPayments";
import ReportConsumption from "../components/reports/ReportConsumption";
import ReportDebtors from "../components/reports/ReportDebtors";
import ReportHistory from "../components/reports/ReportHistory";

import "../index.css"; // если у тебя там общие стили

type Tab = "payments" | "consumption" | "debtors" | "history";

export default function Reports() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("payments");

  // На всякий случай: только администратор
  if (role !== "Администратор" && role !== "admin") {
    return (
      <>
        <NavBar />
        <div className="page">
          <h1>Отчёты</h1>
          <p>У вас нет прав для просмотра этой страницы.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="page">
        <h1>Формирование отчётов</h1>

        {/* Переключатель вкладок (4 раздела) */}
        <div className="tabs">
          <button
            className={activeTab === "payments" ? "tab active" : "tab"}
            onClick={() => setActiveTab("payments")}
          >
            Начисления и платежи
          </button>

          <button
            className={activeTab === "consumption" ? "tab active" : "tab"}
            onClick={() => setActiveTab("consumption")}
          >
            Потребление ресурсов
          </button>

          <button
            className={activeTab === "debtors" ? "tab active" : "tab"}
            onClick={() => setActiveTab("debtors")}
          >
            Должники
          </button>

          <button
            className={activeTab === "history" ? "tab active" : "tab"}
            onClick={() => setActiveTab("history")}
          >
            История платежей
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "payments" && <ReportPayments />}
          {activeTab === "consumption" && <ReportConsumption />}
          {activeTab === "debtors" && <ReportDebtors />}
          {activeTab === "history" && <ReportHistory />}
        </div>
      </div>
    </>
  );
}
