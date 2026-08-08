"use client";

/**
 * Tabel rekap laporan.
 *
 * PERUBAHAN vs versi lama (components/rest/ReportTable.tsx, sudah
 * dihapus):
 * - Data `data` sekarang datang dari Firebase (lib/report-firebase.ts
 *   lewat lib/hooks/useRecapReport.ts), bukan REST -- tapi bentuk
 *   props (RecapResponse) TIDAK berubah, jadi sebagian besar render
 *   di bawah ini sama seperti sebelumnya.
 * - Download Excel/PDF sekarang generate DI BROWSER dari `data` yang
 *   sudah ada di state (lib/report-export.ts), bukan lagi <a href>
 *   ke endpoint backend -- supaya tidak butuh backend menyala.
 * - Baris siswa bisa di-expand (chevron) untuk lihat rincian per
 *   tanggal + hapus record per-baris (1 siswa, 1 tanggal).
 *
 * `onChanged` dipanggil setelah delete record sukses supaya parent
 * (report/page.tsx) refresh data lewat hook.
 */
import { Fragment, useState } from "react";
import { FileSpreadsheet, FileText, ChevronDown, ChevronRight, ClipboardList } from "lucide-react";
import type { RecapResponse, ReportQuery } from "@/types/report";
import { exportRecapToExcel, exportRecapToPdf } from "@/lib/report-export";
import DeleteAttendanceRecordButton from "@/components/realtime/DeleteAttendanceRecordButton";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

interface Props {
  data: RecapResponse;
  query: ReportQuery;
  onChanged: () => void;
}

export default function ReportTable({ data, onChanged }: Props) {
  const rows = Object.entries(data.students);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleExport(kind: "excel" | "pdf") {
    setExporting(kind);
    setExportError(null);
    try {
      if (kind === "excel") await exportRecapToExcel(data);
      else await exportRecapToPdf(data);
    } catch (err) {
      setExportError(
        err instanceof Error
          ? `Gagal membuat file: ${err.message}`
          : "Gagal membuat file. Pastikan dependensi 'xlsx' / 'jspdf' sudah terinstall."
      );
    } finally {
      setExporting(null);
    }
  }

  return (
    <Card className="space-y-4 p-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <p className="text-sm text-ink-muted">
          Periode {data.period.start} s/d {data.period.end}
          {data.period.class ? ` · Kelas ${data.period.class}` : ""}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("excel")}
            disabled={exporting !== null}
            className="flex items-center gap-1.5 rounded-lg bg-forest px-3 py-1.5 text-xs font-medium text-white hover:bg-forest-dark disabled:opacity-50"
          >
            <FileSpreadsheet size={14} /> {exporting === "excel" ? "Membuat…" : "Excel"}
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={exporting !== null}
            className="flex items-center gap-1.5 rounded-lg bg-brick px-3 py-1.5 text-xs font-medium text-white hover:bg-[#b8493e] disabled:opacity-50"
          >
            <FileText size={14} /> {exporting === "pdf" ? "Membuat…" : "PDF"}
          </button>
        </div>
      </div>

      {exportError && <p className="px-5 text-sm text-brick">{exportError}</p>}

      {rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Tidak ada data" description="Tidak ada data absensi pada periode ini." />
      ) : (
        <div className="overflow-x-auto px-1 pb-1">
          <table className="w-full text-sm">
            <thead className="text-left text-ink-muted">
              <tr>
                <th className="w-6 px-2 py-2"></th>
                <th className="px-4 py-2">NISN</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Kelas</th>
                <th className="px-4 py-2 text-right">Hadir</th>
                <th className="px-4 py-2 text-right">Terlambat</th>
                <th className="px-4 py-2 text-right">Alpa</th>
                <th className="px-4 py-2 text-right">Pulang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(([nisn, entry]) => {
                const isOpen = expanded === nisn;
                const dayEntries = Object.entries(entry.days).sort(([a], [b]) => b.localeCompare(a));

                return (
                  <Fragment key={nisn}>
                    <tr
                      className="cursor-pointer hover:bg-ink/[0.02]"
                      onClick={() => setExpanded(isOpen ? null : nisn)}
                    >
                      <td className="px-2 py-2 text-ink-muted">
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </td>
                      <td className="px-4 py-2 font-mono text-ink-muted">{nisn}</td>
                      <td className="px-4 py-2">{entry.name}</td>
                      <td className="px-4 py-2 text-ink-muted">{entry.class}</td>
                      <td className="px-4 py-2 text-right text-forest-dark">{entry.hadir}</td>
                      <td className="px-4 py-2 text-right text-[#8a5a1c]">{entry.terlambat}</td>
                      <td className="px-4 py-2 text-right text-brick">{entry.alpa}</td>
                      <td className="px-4 py-2 text-right text-forest-dark">{entry.sudah_pulang}</td>
                    </tr>
                    {isOpen && (
                      <tr key={`${nisn}-detail`}>
                        <td colSpan={8} className="bg-ink/[0.02] px-4 py-3">
                          {dayEntries.length === 0 ? (
                            <p className="text-xs text-ink-muted">Tidak ada rincian tanggal.</p>
                          ) : (
                            <table className="w-full text-xs">
                              <tbody className="divide-y divide-border/60">
                                {dayEntries.map(([date, status]) => (
                                  <tr key={date}>
                                    <td className="w-32 py-1.5 pl-6 font-mono text-ink-muted">{date}</td>
                                    <td className="py-1.5">
                                      <Badge
                                        variant={
                                          status === "Hadir" ? "success" : status === "Terlambat" ? "warning" : "danger"
                                        }
                                      >
                                        {status}
                                      </Badge>
                                    </td>
                                    <td className="py-1.5 pl-3 font-mono text-ink-muted">
                                      {entry.pulang[date] ? `Pulang ${entry.pulang[date]}` : "Belum pulang"}
                                    </td>
                                    <td className="py-1.5 text-right pr-2">
                                      <div className="flex items-center justify-end gap-1">
                                        {status !== "Alpa" && (
                                          <DeleteAttendanceRecordButton
                                            date={date}
                                            nisn={nisn}
                                            studentName={entry.name}
                                            onDeleted={onChanged}
                                            kind="datang"
                                          />
                                        )}
                                        {entry.pulang[date] && (
                                          <DeleteAttendanceRecordButton
                                            date={date}
                                            nisn={nisn}
                                            studentName={entry.name}
                                            onDeleted={onChanged}
                                            kind="pulang"
                                          />
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot className="bg-ink/5 font-medium">
              <tr>
                <td className="px-4 py-2" colSpan={4}>
                  Total
                </td>
                <td className="px-4 py-2 text-right text-forest-dark">{data.totals.hadir}</td>
                <td className="px-4 py-2 text-right text-[#8a5a1c]">{data.totals.terlambat}</td>
                <td className="px-4 py-2 text-right text-brick">{data.totals.alpa}</td>
                <td className="px-4 py-2 text-right text-forest-dark">{data.totals.sudah_pulang}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}