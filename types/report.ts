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
  days: Record<string, "Hadir" | "Terlambat" | "Alpa">; // key: "YYYY-MM-DD"
  // Jam absen pulang per tanggal, kalau ada (dari attendance_pulang_by_student).
  // Terpisah dari `days` sengaja -- pulang bukan bagian dari status
  // Hadir/Terlambat/Alpa, murni info tambahan "jam berapa pulang" kalau
  // tercatat. Tanggal yang tidak ada di sini = tidak ada record pulang
  // (bukan berarti Alpa, karena absen pulang memang opsional/fitur terpisah).
  checkoutTimes: Record<string, string>; // key: "YYYY-MM-DD" -> "HH:MM:SS"
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