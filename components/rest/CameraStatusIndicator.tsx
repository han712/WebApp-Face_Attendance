"use client";

/**
 * Indikator status kamera HP.
 * Ini SATU-SATUNYA komponen yang sengaja polling REST API (bukan
 * Firebase listener) -- sesuai keputusan desain di API_DOCUMENTATION.md
 * bagian 3.2: status live kamera adalah state proses backend, bukan
 * data yang perlu persisten di Firebase.
 * Interval polling: 4 detik (di dalam rentang rekomendasi 3-5 detik).
 */
import { useEffect, useRef, useState } from "react";
import { apiGet } from "@/lib/api";
import Badge from "@/components/ui/Badge";

interface CameraStatus {
  is_live: boolean;
  last_frame_at: number | null; // epoch seconds
  ever_got_frame: boolean;
  consecutive_failures: number;
  last_error: string | null;
}

const POLL_INTERVAL_MS = 4000;

export default function CameraStatusIndicator() {
  const [status, setStatus] = useState<CameraStatus | null>(null);
  const [unreachable, setUnreachable] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await apiGet<CameraStatus>("/camera/status");
        if (!cancelled) {
          setStatus(res);
          setUnreachable(false);
        }
      } catch (err) {
        if (!cancelled) {
          setUnreachable(true);
          // ApiError (backend balas error) vs network error (backend tidak
          // terjangkau) keduanya berarti "tidak bisa ambil status" bagi UI
          // badge ini -- tidak perlu dibedakan tampilannya.
        }
      }
    }

    poll(); // langsung fetch pertama kali, tidak nunggu interval awal
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (unreachable) {
    return <Badge variant="danger">Backend tidak terjangkau</Badge>;
  }

  if (!status) {
    return <Badge variant="neutral">Memuat status kamera…</Badge>;
  }

  if (status.is_live) {
    return <Badge variant="success" pulse>Kamera online</Badge>;
  }

  if (!status.ever_got_frame) {
    return <Badge variant="warning">Kamera belum pernah terkoneksi</Badge>;
  }

  return (
    <Badge variant="danger">
      Kamera offline{status.consecutive_failures ? ` (${status.consecutive_failures}x gagal)` : ""}
    </Badge>
  );
}
