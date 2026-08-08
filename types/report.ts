/**
 * Bentuk data rekap laporan.
 *
 * CATATAN PERUBAHAN ARSITEKTUR: sebelumnya ini adalah bentuk balikan
 * endpoint REST /report/recap* (backend yang agregasi dari Firebase).
 * Sekarang agregasinya dipindah ke sisi webapp -- baca langsung dari
 * Firebase (/students + /attendance_by_student), lihat
 * lib/report-firebase.ts. Bentuk RecapResponse SENGAJA dipertahankan
 * sama persis supaya komponen UI (ReportTable dkk) tidak perlu berubah.
 */

export interface ReportQuery {
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  className?: string; // opsional, kosong = semua kelas
}

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
  sudah_pulang: number; // jumlah hari dalam rentang laporan yang tercatat absen pulang
  days: Record<string, "Hadir" | "Terlambat" | "Alpa">; // key: "YYYY-MM-DD"
  pulang: Record<string, string>; // key: "YYYY-MM-DD" -> jam pulang "HH:MM:SS", hanya ada kalau tercatat
}

export interface RecapResponse {
  period: ReportPeriod;
  students: Record<string, StudentReportEntry>; // key: nisn
  totals: {
    hadir: number;
    terlambat: number;
    alpa: number;
    sudah_pulang: number;
  };
}