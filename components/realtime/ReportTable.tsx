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
 * PERUBAHAN sesi ini -- perbaikan usability:
 * - Kotak cari (nama/NISN) supaya tidak perlu scroll manual di tabel
 *   yang panjang.
 * - Kolom header bisa diklik untuk sort (nama, hadir, terlambat, alpa,
 *   pulang) -- state sort murni lokal, tidak mengubah query Firebase.
 * - Kolom ringkasan "Pulang" ditambahkan di tabel utama (jumlah hari
 *   tercatat pulang), dihitung dari entry.checkoutTimes yang sudah ada.
 * - Tabel rincian per tanggal sekarang punya header kolom yang jelas
 *   (sebelumnya tidak berlabel sama sekali).
 * - Baris zebra + highlight baris yang sedang expand, supaya lebih
 *   gampang dibaca untuk daftar siswa panjang.
 *
 * `onChanged` dipanggil setelah delete record sukses supaya parent
 * (report/page.tsx) refresh data lewat hook.
 */
import { Fragment, useMemo, useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  ClipboardList,
  Search,
  X,
} from "lucide-react";
import type { RecapResponse, ReportQuery, StudentReportEntry } from "@/types/report";
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

type SortKey = "name" | "hadir" | "terlambat" | "alpa" | "pulang";
type SortDir = "asc" | "desc";

type Row = [nisn: string, entry: StudentReportEntry];

function pulangCount(entry: StudentReportEntry): number {
  return Object.keys(entry.checkoutTimes).length;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function ReportTable({ data, onChanged }: Props) {
  const allRows = useMemo(() => Object.entries(data.students) as Row[], [data.students]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Default arah masuk akal per kolom: nama A-Z dulu, angka besar-ke-kecil dulu
      // (guru biasanya mau lihat siswa paling sering Alpa/Terlambat duluan).
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? allRows.filter(
          ([nisn, entry]) => entry.name.toLowerCase().includes(q) || nisn.toLowerCase().includes(q)
        )
      : allRows;

    const sorted = [...filtered].sort(([nisnA, a], [nisnB, b]) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "hadir") cmp = a.hadir - b.hadir;
      else if (sortKey === "terlambat") cmp = a.terlambat - b.terlambat;
      else if (sortKey === "alpa") cmp = a.alpa - b.alpa;
      else cmp = pulangCount(a) - pulangCount(b);

      if (cmp === 0) cmp = nisnA.localeCompare(nisnB); // tie-breaker stabil
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [allRows, search, sortKey, sortDir]);

  function SortHeader({
    label,
    sortKeyName,
    align = "right",
  }: {
    label: string;
    sortKeyName: SortKey;
    align?: "left" | "right";
  }) {
    const active = sortKey === sortKeyName;
    return (
      <th className={`px-4 py-2 ${align === "right" ? "text-right" : "text-left"}`}>
        <button
          onClick={() => handleSort(sortKeyName)}
          className={`inline-flex items-center gap-1 hover:text-ink ${active ? "text-ink font-medium" : ""} ${
            align === "right" ? "flex-row-reverse" : ""
          }`}
        >
          {label}
          {active ? (
            sortDir === "asc" ? (
              <ChevronUp size={13} />
            ) : (
              <ChevronDown size={13} />
            )
          ) : (
            <ChevronsUpDown size={13} className="opacity-40" />
          )}
        </button>
      </th>
    );
  }

  return (
    <Card className="space-y-4 p-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <p className="text-sm text-ink-muted">
          Periode {data.period.start} s/d {data.period.end}
          {data.period.class ? ` · Kelas ${data.period.class}` : ""}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / NISN…"
              className="w-44 rounded-lg border border-border bg-paper py-1.5 pl-8 pr-7 text-xs focus:outline-none focus:ring-2 focus:ring-forest/40 sm:w-56"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Hapus pencarian"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              >
                <X size={13} />
              </button>
            )}
          </div>
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

      {allRows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Tidak ada data" description="Tidak ada data absensi pada periode ini." />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Tidak ditemukan"
          description={`Tidak ada siswa yang cocok dengan "${search}".`}
        />
      ) : (
        <div className="overflow-x-auto px-1 pb-1">
          <p className="px-4 pb-2 text-xs text-ink-muted">
            Menampilkan {rows.length} dari {allRows.length} siswa
          </p>
          <table className="w-full text-sm">
            <thead className="text-left text-ink-muted">
              <tr>
                <th className="w-6 px-2 py-2"></th>
                <th className="px-4 py-2">NISN</th>
                <SortHeader label="Nama" sortKeyName="name" align="left" />
                <th className="px-4 py-2">Kelas</th>
                <SortHeader label="Hadir" sortKeyName="hadir" />
                <SortHeader label="Terlambat" sortKeyName="terlambat" />
                <SortHeader label="Alpa" sortKeyName="alpa" />
                <SortHeader label="Pulang" sortKeyName="pulang" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(([nisn, entry], idx) => {
                const isOpen = expanded === nisn;
                const dayEntries = Object.entries(entry.days).sort(([a], [b]) => b.localeCompare(a));
                const pulang = pulangCount(entry);

                return (
                  <Fragment key={nisn}>
                    <tr
                      className={`cursor-pointer transition-colors ${
                        isOpen ? "bg-forest/[0.05]" : idx % 2 === 1 ? "bg-ink/[0.015]" : ""
                      } hover:bg-ink/[0.04]`}
                      onClick={() => setExpanded(isOpen ? null : nisn)}
                    >
                      <td className="px-2 py-2 text-ink-muted">
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </td>
                      <td className="px-4 py-2 font-mono text-ink-muted">{nisn}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest/10 text-[10px] font-semibold text-forest-dark">
                            {initials(entry.name)}
                          </span>
                          <span className="truncate">{entry.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-ink-muted">{entry.class}</td>
                      <td className="px-4 py-2 text-right text-forest-dark">{entry.hadir}</td>
                      <td className="px-4 py-2 text-right text-[#8a5a1c]">{entry.terlambat}</td>
                      <td className="px-4 py-2 text-right text-brick">{entry.alpa}</td>
                      <td className="px-4 py-2 text-right text-sky">{pulang || "-"}</td>
                    </tr>
                    {isOpen && (
                      <tr key={`${nisn}-detail`}>
                        <td colSpan={8} className="bg-ink/[0.02] px-4 py-3">
                          {dayEntries.length === 0 ? (
                            <p className="text-xs text-ink-muted">Tidak ada rincian tanggal.</p>
                          ) : (
                            <table className="w-full text-xs">
                              <thead className="text-left text-ink-muted/80">
                                <tr>
                                  <th className="w-32 py-1.5 pl-6 font-medium">Tanggal</th>
                                  <th className="py-1.5 font-medium">Absen Datang</th>
                                  <th className="py-1.5 pr-2 font-medium">Absen Pulang</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/60">
                                {dayEntries.map(([date, status]) => {
                                  const checkoutTime = entry.checkoutTimes[date];
                                  return (
                                    <tr key={date} className="group hover:bg-ink/[0.03]">
                                      <td className="py-1.5 pl-6 font-mono text-ink-muted">{date}</td>
                                      <td className="py-1.5">
                                        <div className="flex items-center gap-1">
                                          <Badge
                                            variant={
                                              status === "Hadir" ? "success" : status === "Terlambat" ? "warning" : "danger"
                                            }
                                          >
                                            {status}
                                          </Badge>
                                          {status !== "Alpa" && (
                                            <DeleteAttendanceRecordButton
                                              date={date}
                                              nisn={nisn}
                                              studentName={entry.name}
                                              onDeleted={onChanged}
                                            />
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-1.5 pr-2">
                                        {checkoutTime ? (
                                          <div className="flex items-center gap-1.5">
                                            <Badge variant="info">Pulang</Badge>
                                            <span className="font-mono text-ink-muted">{checkoutTime}</span>
                                            <DeleteAttendanceRecordButton
                                              date={date}
                                              nisn={nisn}
                                              studentName={entry.name}
                                              onDeleted={onChanged}
                                              kind="pulang"
                                            />
                                          </div>
                                        ) : (
                                          <span className="text-ink-muted/60">—</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
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
                  Total{search ? ` (${rows.length} siswa cocok)` : ""}
                </td>
                <td className="px-4 py-2 text-right text-forest-dark">{data.totals.hadir}</td>
                <td className="px-4 py-2 text-right text-[#8a5a1c]">{data.totals.terlambat}</td>
                <td className="px-4 py-2 text-right text-brick">{data.totals.alpa}</td>
                <td className="px-4 py-2 text-right text-sky">
                  {rows.reduce((sum, [, entry]) => sum + pulangCount(entry), 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}