"use client";

/**
 * Preview kamera LANGSUNG ke stream bawaan aplikasi IP Webcam di HP
 * (Opsi C) -- TIDAK lewat backend Python sama sekali.
 * (Logic TIDAK berubah dari sebelumnya -- hanya lapisan tampilan.)
 */
import { useState } from "react";
import { Camera, RotateCw } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function DirectCameraPreview() {
  const url = process.env.NEXT_PUBLIC_IP_WEBCAM_URL;
  const [reloadKey, setReloadKey] = useState(0);
  const [errored, setErrored] = useState(false);

  if (!url) {
    return (
      <Card className="border-marigold/40 bg-marigold/10 text-sm">
        <p className="font-medium text-[#8a5a1c]">NEXT_PUBLIC_IP_WEBCAM_URL belum diset.</p>
        <p className="mt-1 text-[#8a5a1c]/80">
          Tambahkan di .env.local, contoh: <code>http://192.168.1.20:8080/video</code> -- harus
          persis sama dengan URL yang dipakai backend Python untuk fetch frame kamera.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-forest-dark" />
          <h3 className="font-medium">Live Camera (Direct, tanpa backend)</h3>
        </div>
        <span className="text-xs text-ink-muted">Tanpa bounding box</span>
      </div>

      {errored ? (
        <div className="flex aspect-video items-center justify-center rounded-lg bg-ink/5 text-sm text-brick">
          Gagal memuat stream dari {url}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- MJPEG stream, bukan gambar statis
        <img
          key={reloadKey}
          src={url}
          alt="Live camera langsung dari HP"
          className="w-full rounded-lg bg-ink/5"
          onError={() => setErrored(true)}
        />
      )}

      <Button
        variant="secondary"
        onClick={() => {
          setErrored(false);
          setReloadKey((k) => k + 1);
        }}
        className="flex items-center gap-1.5"
      >
        <RotateCw size={14} /> Sambungkan Ulang
      </Button>
    </Card>
  );
}
