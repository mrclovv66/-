// src/api/reports.ts

import api from "./api";

// ===== Типы данных =====

// A — Начисления и платежи
export interface PaymentsReportRow {
  docNumber: string;
  address: string;
  month: string;
  service: string;
  accrued: number;
  paid: number;
  debt: number;
}

export interface PaymentsReport {
  rows: PaymentsReportRow[];
  totals: {
    accrued: number;
    paid: number;
    debt: number;
  };
}

// B — Потребление ресурсов
export interface ConsumptionRow {
  docNumber: string;
  address: string;
  month: string;
  hotWater: number;
  coldWater: number;
  total: number;
}

export interface ConsumptionReport {
  rows: ConsumptionRow[];
  totals: {
    hot: number;
    cold: number;
    total: number;
  };
}

// C — Должники
export interface DebtorRow {
  address: string;
  fullName: string;
  phone: string;
  debt: number;
}

export interface DebtorsReport {
  rows: DebtorRow[];
  totals: {
    totalDebt: number;
    count: number;
  };
}


// E — История платежей
export interface PaymentHistoryRow {
  date: string;
  docNumber: string;
  address: string;
  amount: number;
}

// ответ от API
export interface HistoryReport {
  rows: PaymentHistoryRow[];
  totals: {
    totalAmount: number;
    count: number;
  };
}




// ===== Утилита скачивания файлов =====

export function downloadBlobFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

// ===== API =====

export const ReportsAPI = {
  // A — Начисления и платежи
  getPayments(from: string, to: string, service?: string) {
    return api
      .get<PaymentsReport>("/reports/payments", {
        params: { from, to, service },
      })
      .then((r) => r.data);
  },

  downloadPaymentsExcel(from: string, to: string, service?: string) {
    return api
      .get("/reports/payments/excel", {
        params: { from, to, service },
        responseType: "blob",
      })
      .then((r) => r.data);
  },

  // B — Потребление ресурсов
  getConsumptionReport(from: string, to: string) {
    return api
      .get<ConsumptionReport>("/reports/consumption", {
        params: { from, to },
      })
      .then((r) => r.data);
  },


  downloadConsumptionExcel(from: string, to: string) {
    return api
      .get("/reports/consumption/excel", {
        params: { from, to },
        responseType: "blob",
      })
      .then((r) => r.data);
  },

  // C — Должники
  getDebtors(month: string) {
    return api
      .get<DebtorRow[]>("/reports/debtors", { params: { month } })
      .then((r) => r.data);
  },

  downloadDebtorsExcel(month: string) {
    return api
      .get("/reports/debtors/excel", {
        params: { month },
        responseType: "blob",
      })
      .then((r) => r.data);
  },


  getPaymentHistory(from: string, to: string, address?: string) {
    return api
      .get<HistoryReport>("/reports/history", {
        params: { from, to, address },
      })
      .then((r) => r.data);
  },

  downloadHistoryExcel(from: string, to: string, address?: string) {
    return api
      .get("/reports/history/excel", {
        params: { from, to, address },
        responseType: "blob",
      })
      .then((r) => r.data);
  },

  getAddresses() {
    return api.get<string[]>("/addresses").then((r) => r.data);
  },


};
