"use client";

/**
 * Logic fetch-on-demand untuk rekap laporan (bukan realtime, murni REST).
 * Dipisah dari komponen UI supaya state loading/error/data terpusat dan
 * bisa dipakai ulang kalau nanti ada UI lain yang butuh data sama.
 */
import { useCallback, useState } from "react";
import { fetchRecap, type ReportQuery } from "@/lib/report-api";
import { ApiError } from "@/lib/api";
import type { RecapResponse } from "@/types/report";

interface UseRecapReportResult {
  data: RecapResponse | null;
  loading: boolean;
  error: string | null;
  run: (query: ReportQuery) => void;
}

export function useRecapReport(): UseRecapReportResult {
  const [data, setData] = useState<RecapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback((query: ReportQuery) => {
    setLoading(true);
    setError(null);
    fetchRecap(query)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Gagal mengambil data rekap.");
        setLoading(false);
      });
  }, []);

  return { data, loading, error, run };
}
