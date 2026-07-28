"use client";

/**
 * Hook polling generic untuk endpoint REST GET -- dipakai untuk data
 * yang perlu auto-refresh selama testing (mis. sesi liveness aktif),
 * TANPA nge-hardcode logic fetch di komponen UI.
 */
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";

export function useApiPoll<T>(fetcher: () => Promise<T>, intervalMs: number, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetcher();
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Gagal mengambil data.");
        }
      }
    }

    poll();
    const id = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetcher sengaja tidak masuk deps, caller wajib pakai referensi stabil (mis. dari lib/debug-api.ts langsung)
  }, [intervalMs, enabled]);

  return { data, error };
}
