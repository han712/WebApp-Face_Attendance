"use client";

/**
 * Preview kamera SELAMA proses live-capture registrasi berlangsung.
 * Pakai GET /debug/camera/stream (backend relay, MJPEG + bounding box)
 * -- BUKAN Opsi C (direct-to-phone) yang dipakai di halaman Admin,
 * karena di sini admin justru perlu lihat apakah backend BERHASIL
 * mendeteksi wajah (bounding box), bukan cuma video mentah.
 */
import { useState } from "react";
import { Camera } from "lucide-react";
import { apiFileUrl } from "@/lib/api";

export default function CaptureCameraPreview() {
  const [errored, setErrored] = useState(false);
  const streamUrl = apiFileUrl("/debug/camera/stream");

  return (
    <div className="space-y-2 rounded-lg border border-border bg-paper p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
        <Camera size={14} /> Preview kamera (live)
      </div>

      {errored ? (
        <div className="flex aspect-video items-center justify-center rounded-md bg-ink/5 text-xs text-brick">
          Gagal memuat preview kamera dari backend.
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- MJPEG stream, bukan gambar statis
        <img
          src={streamUrl}
          alt="Preview kamera selama capture wajah"
          className="w-full rounded-md bg-ink/5"
          onError={() => setErrored(true)}
        />
      )}
      <p className="text-xs text-ink-muted">
        Pastikan kotak deteksi (bounding box) muncul di sekitar wajah siswa selama proses berlangsung.
      </p>
    </div>
  );
}