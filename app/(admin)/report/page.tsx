"use client";

import { useEffect, useState } from "react";
import { FileBarChart2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ReportFilters from "@/components/realtime/ReportFilters";
import ReportTable from "@/components/realtime/ReportTable";
import DeleteAttendanceDayPanel from "@/components/realtime/DeleteAttendanceDayPanel";
import { useRecapReport } from "@/lib/hooks/useRecapReport";
import type { ReportQuery } from "@/types/report";
import { getTodayDateJakarta } from "@/lib/date";

function getDefaultQuery(): ReportQuery {
  const endDate = getTodayDateJakarta();
  const start = new Date(`${endDate}T00:00:00`);
  start.setDate(start.getDate() - 29);
  const startDate = start.toISOString().slice(0, 10);
  return { startDate, endDate };
}

export default function ReportPage() {
  const [defaultQuery] = useState(getDefaultQuery);
  const [lastQuery, setLastQuery] = useState<ReportQuery>(defaultQuery);
  const { data, loading, error, run, refresh } = useRecapReport();

  useEffect(() => {
    run(defaultQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(query: ReportQuery) {
    setLastQuery(query);
    run(query);
  }

  return (
    <main className="mx-auto max-w-4xl space-y-5 p-6 sm:p-8">
      <PageHeader
        icon={FileBarChart2}
        title="Riwayat & Laporan"
        subtitle="Rekap absensi per rentang tanggal & kelas"
      />

      <ReportFilters initial={defaultQuery} loading={loading} onSubmit={handleSubmit} />

      {error && <p className="text-sm text-brick">{error}</p>}
      {loading && !data && <p className="text-sm text-ink-muted">Memuat rekap dari Firebase…</p>}
      {data && <ReportTable data={data} query={lastQuery} onChanged={refresh} />}

      <DeleteAttendanceDayPanel onDeleted={refresh} />
    </main>
  );
}
