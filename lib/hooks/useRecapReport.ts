"use client";

/**
 * Logic fetch-on-demand untuk rekap laporan. Sebelumnya panggil REST
 * backend (lib/report-api.ts, sudah dihapus); sekarang baca langsung
 * dari Firebase lewat lib/report-firebase.ts (Jalur A) -- supaya
 * halaman laporan tidak butuh backend Python menyala sama sekali.
 *
 * Tetap dipisah dari komponen UI (pola project ini) supaya state
 * loading/error/data terpusat & reusable.
 */
import { useCallback, useRef, useState } from "react";
import { fetchRecapFromFirebase } from "@/lib/report-firebase";
import type { RecapResponse, ReportQuery } from "@/types/report";

interface UseRecapReportResult {
  data: RecapResponse | null;
  loading: boolean;
  error: string | null;
  run: (query: ReportQuery) => void;
  /** Re-fetch pakai query terakhir yang dipanggil -- dipakai setelah delete berhasil. */
  refresh: () => void;
}

export function useRecapReport(): UseRecapReportResult {
  const [data, setData] = useState<RecapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastQueryRef = useRef<ReportQuery | null>(null);

  const run = useCallback((query: ReportQuery) => {
    lastQueryRef.current = query;
    setLoading(true);
    setError(null);
    fetchRecapFromFirebase(query)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Gagal mengambil data rekap dari Firebase.");
        setLoading(false);
      });
  }, []);

  const refresh = useCallback(() => {
    if (lastQueryRef.current) run(lastQueryRef.current);
  }, [run]);

  return { data, loading, error, run, refresh };
}
