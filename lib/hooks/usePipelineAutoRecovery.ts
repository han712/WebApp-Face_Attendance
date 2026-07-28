"use client";

/**
 * Auto-recovery SISI KLIEN untuk pipeline recognition yang macet.
 * PENTING: ini TIDAK memperbaiki bug di backend Python -- backend tetap
 * backend yang sama. Yang dilakukan hook ini murni: deteksi kondisi
 * "enabled tapi thread_alive: false" lewat endpoint yang SUDAH ADA
 * (GET /attendance/pipeline/status), lalu panggil endpoint yang SUDAH
 * ADA juga (POST /device/pipeline/start) untuk coba nyalakan ulang.
 *
 * Cooldown 60 detik antar-percobaan supaya kalau memang backend rusak
 * beneran (bukan cuma macet sesaat), webapp tidak spam request restart
 * terus-menerus.
 */
import { useEffect, useRef, useState } from "react";
import { getPipelineStatus, startDevicePipeline } from "@/lib/debug-api";

const POLL_INTERVAL_MS = 20_000;
const COOLDOWN_MS = 60_000;

export interface RecoveryEvent {
  timestamp: number;
  success: boolean;
  message: string;
}

export function usePipelineAutoRecovery(enabled: boolean = true): RecoveryEvent | null {
  const [lastEvent, setLastEvent] = useState<RecoveryEvent | null>(null);
  const lastAttemptRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function checkAndRecover() {
      let status;
      try {
        status = await getPipelineStatus();
      } catch {
        // Backend tidak terjangkau -- ConnectionStatusBanner yang urus notifikasinya, di sini diam saja.
        return;
      }
      if (cancelled) return;

      if (!(status.enabled && !status.thread_alive)) {
        return; // sehat, tidak perlu apa-apa
      }

      const now = Date.now();
      if (now - lastAttemptRef.current < COOLDOWN_MS) {
        return; // masih cooldown dari percobaan sebelumnya
      }
      lastAttemptRef.current = now;

      try {
        await startDevicePipeline();
        if (!cancelled) {
          setLastEvent({
            timestamp: Date.now(),
            success: true,
            message: "Pipeline recognition macet terdeteksi -- berhasil di-restart otomatis.",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setLastEvent({
            timestamp: Date.now(),
            success: false,
            message: `Pipeline macet terdeteksi, auto-restart gagal: ${
              err instanceof Error ? err.message : String(err)
            }. Coba restart manual dari halaman Admin.`,
          });
        }
      }
    }

    checkAndRecover();
    const id = setInterval(checkAndRecover, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled]);

  return lastEvent;
}
