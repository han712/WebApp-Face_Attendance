"use client";

/**
 * Health-check berkala ke backend REST -- pakai /camera/status karena
 * didokumentasikan sebagai endpoint paling ringan (<50ms tipikal),
 * aman dipoll terus-menerus (lihat API_DOCUMENTATION.md bagian 5).
 * Tujuannya BUKAN status kamera itu sendiri (itu tugas
 * CameraStatusIndicator), tapi cuma proxy "backend hidup & terjangkau
 * dari webapp atau tidak", dipakai global lewat ConnectionStatusBanner.
 */
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

const CHECK_INTERVAL_MS = 10_000;

export function useBackendHealth(): boolean {
  const [reachable, setReachable] = useState(true); // asumsikan sehat sampai terbukti tidak

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        // apiGet sudah bawa retry internal ringan -- di sini kita pakai
        // hasil akhirnya saja, tidak perlu retry lapis kedua.
        await apiGet("/camera/status");
        if (!cancelled) setReachable(true);
      } catch {
        if (!cancelled) setReachable(false);
      }
    }

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return reachable;
}
