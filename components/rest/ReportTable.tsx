"use client";

/**
 * Tabel preview rekap + tombol download. Murni render dari data yang
 * sudah didapat parent (lib/hooks/useRecapReport.ts) -- untuk download,
 * cukup <a href> langsung ke REST endpoint (browser handle file
 * attachment otomatis, sesuai rekomendasi API_DOCUMENTATION.md 3.5).
 */
import { FileSpreadsheet, FileText } from "lucide-react";
import type { RecapResponse } from "@/types/report";
import type { ReportQuery } from "@/lib/report-api";
import { recapExcelUrl, recapPdfUrl } from "@/lib/report-api";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { ClipboardList } from "lucide-react";

interface Props {
  data: RecapResponse;
  query: ReportQuery;
}

export default function ReportTable({ data, query }: Props) {
  const rows = Object.entries(data.students);

  return (
    <Card className="space-y-4 p-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <p className="text-sm text-ink-muted">
          Periode {data.period.start} s/d {data.period.end}
          {data.period.class ? ` · Kelas ${data.period.class}` : ""}
        </p>
        <div className="flex gap-2">
          <a
            href={recapExcelUrl(query)}
            className="flex items-center gap-1.5 rounded-lg bg-forest px-3 py-1.5 text-xs font-medium text-white hover:bg-forest-dark"
          >
            <FileSpreadsheet size={14} /> Excel
          </a>
          <a
            href={recapPdfUrl(query)}
            className="flex items-center gap-1.5 rounded-lg bg-brick px-3 py-1.5 text-xs font-medium text-white hover:bg-[#b8493e]"
          >
            <FileText size={14} /> PDF
          </a>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Tidak ada data" description="Tidak ada data absensi pada periode ini." />
      ) : (
        <div className="overflow-x-auto px-1 pb-1">
          <table className="w-full text-sm">
            <thead className="text-left text-ink-muted">
              <tr>
                <th className="px-4 py-2">NISN</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Kelas</th>
                <th className="px-4 py-2 text-right">Hadir</th>
                <th className="px-4 py-2 text-right">Terlambat</th>
                <th className="px-4 py-2 text-right">Alpa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(([nisn, entry]) => (
                <tr key={nisn}>
                  <td className="px-4 py-2 font-mono text-ink-muted">{nisn}</td>
                  <td className="px-4 py-2">{entry.name}</td>
                  <td className="px-4 py-2 text-ink-muted">{entry.class}</td>
                  <td className="px-4 py-2 text-right text-forest-dark">{entry.hadir}</td>
                  <td className="px-4 py-2 text-right text-[#8a5a1c]">{entry.terlambat}</td>
                  <td className="px-4 py-2 text-right text-brick">{entry.alpa}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-ink/5 font-medium">
              <tr>
                <td className="px-4 py-2" colSpan={3}>
                  Total
                </td>
                <td className="px-4 py-2 text-right text-forest-dark">{data.totals.hadir}</td>
                <td className="px-4 py-2 text-right text-[#8a5a1c]">{data.totals.terlambat}</td>
                <td className="px-4 py-2 text-right text-brick">{data.totals.alpa}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}
