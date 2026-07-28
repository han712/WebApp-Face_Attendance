/**
 * Bentuk data balikan endpoint REST /report/recap*.
 * Sengaja dipisah dari types/firebase-schema.ts karena sumber datanya
 * REST (backend meng-agregasi dari Firebase saat request), bukan
 * struktur node Firebase itu sendiri.
 */

export interface ReportPeriod {
  start: string; // "YYYY-MM-DD"
  end: string; // "YYYY-MM-DD"
  class: string | null;
}

export interface StudentReportEntry {
  name: string;
  class: string;
  hadir: number;
  terlambat: number;
  alpa: number;
  days: Record<string, "Hadir" | "Terlambat" | "Alpa">; // key: "YYYY-MM-DD"
}

export interface RecapResponse {
  period: ReportPeriod;
  students: Record<string, StudentReportEntry>; // key: nisn
  totals: {
    hadir: number;
    terlambat: number;
    alpa: number;
  };
}
