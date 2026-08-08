/**
 * Generate file Excel & PDF LANGSUNG DI BROWSER dari data rekap yang
 * sudah ada di state (hasil lib/report-firebase.ts) -- menggantikan
 * endpoint backend `/report/recap/excel` & `/report/recap/pdf` (Jalur B).
 *
 * Sengaja tidak fetch apa pun lagi di sini -- data yang dipakai adalah
 * data yang SAMA PERSIS dengan yang sedang tampil di tabel preview,
 * supaya tidak ada request tambahan/berbeda hasil.
 *
 * Import library di-dynamic (bukan static import di atas file) supaya
 * 'xlsx' & 'jspdf' tidak ikut ke initial bundle halaman laporan --
 * baru di-load pas tombol download benar-benar diklik.
 *
 * DEPENDENSI BARU YANG PERLU DI-INSTALL (belum ada di project ini):
 *   npm install xlsx jspdf jspdf-autotable
 */
import type { RecapResponse } from "@/types/report";

interface StudentRow {
  nisn: string;
  name: string;
  class: string;
  hadir: number;
  terlambat: number;
  alpa: number;
}

function toRows(data: RecapResponse): StudentRow[] {
  return Object.entries(data.students)
    .map(([nisn, entry]) => ({
      nisn,
      name: entry.name,
      class: entry.class,
      hadir: entry.hadir,
      terlambat: entry.terlambat,
      alpa: entry.alpa,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function periodLabel(data: RecapResponse): string {
  const cls = data.period.class ? ` - Kelas ${data.period.class}` : "";
  return `${data.period.start} s.d. ${data.period.end}${cls}`;
}

function filenameSafePeriod(data: RecapResponse): string {
  const cls = data.period.class ? `_${data.period.class}` : "";
  return `${data.period.start}_${data.period.end}${cls}`.replace(/[^\w-]+/g, "");
}

/** Unduh rekap sebagai .xlsx -- sheet ringkasan + sheet detail harian per siswa. */
export async function exportRecapToExcel(data: RecapResponse): Promise<void> {
  const XLSX = await import("xlsx");
  const rows = toRows(data);

  const summarySheet = XLSX.utils.json_to_sheet(
    rows.map((r) => ({
      NISN: r.nisn,
      Nama: r.name,
      Kelas: r.class,
      Hadir: r.hadir,
      Terlambat: r.terlambat,
      Alpa: r.alpa,
    }))
  );

  // Baris detail harian (long format) -- 1 baris per (siswa, tanggal).
  const detailRows: Record<string, string>[] = [];
  for (const [nisn, entry] of Object.entries(data.students)) {
    for (const [date, status] of Object.entries(entry.days)) {
      detailRows.push({ NISN: nisn, Nama: entry.name, Kelas: entry.class, Tanggal: date, Status: status });
    }
  }
  const detailSheet = XLSX.utils.json_to_sheet(detailRows);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Rekap");
  XLSX.utils.book_append_sheet(workbook, detailSheet, "Detail Harian");

  XLSX.writeFile(workbook, `rekap-absensi_${filenameSafePeriod(data)}.xlsx`);
}

/** Unduh rekap sebagai .pdf -- tabel ringkasan per siswa + total. */
export async function exportRecapToPdf(data: RecapResponse): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const rows = toRows(data);

  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Rekap Absensi", 14, 16);
  doc.setFontSize(10);
  doc.text(`Periode: ${periodLabel(data)}`, 14, 23);

  autoTable(doc, {
    startY: 28,
    head: [["NISN", "Nama", "Kelas", "Hadir", "Terlambat", "Alpa"]],
    body: rows.map((r) => [r.nisn, r.name, r.class, r.hadir, r.terlambat, r.alpa]),
    foot: [["", "", "Total", data.totals.hadir, data.totals.terlambat, data.totals.alpa]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [45, 90, 61] }, // forest
    footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: "bold" },
  });

  doc.save(`rekap-absensi_${filenameSafePeriod(data)}.pdf`);
}
