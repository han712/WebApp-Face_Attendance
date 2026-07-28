"use client";

/**
 * KOMPONEN SEMENTARA untuk verifikasi koneksi REST ke backend Python.
 * Panggil GET /camera/status dan tampilkan hasilnya MENTAH (raw JSON)
 * dulu, sesuai permintaan di prompt sesi. HAPUS setelah verifikasi
 * sukses (lihat app/page.tsx).
 */
import { useEffect, useState } from "react";
import { apiGet, ApiError } from "@/lib/api";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface CameraStatus {
  is_live: boolean;
  last_frame_at: number | null;
  ever_got_frame: boolean;
  consecutive_failures: number;
  last_error: string | null;
}

export default function ApiConnectionTest() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [data, setData] = useState<CameraStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    apiGet<CameraStatus>("/camera/status")
      .then((res) => {
        setData(res);
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        if (err instanceof ApiError) {
          setErrorMsg(`HTTP ${err.status}: ${err.message}`);
        } else {
          setErrorMsg(
            err instanceof Error
              ? `${err.message} -- kemungkinan besar NEXT_PUBLIC_API_URL salah/tidak bisa dijangkau, BUKAN masalah CORS (backend sudah allow semua origin).`
              : String(err)
          );
        }
      });
  }, []);

  return (
    <Card className="space-y-2">
      <h3 className="font-semibold">Tes Koneksi REST API (GET /camera/status)</h3>
      <Badge variant={status === "success" ? "success" : status === "error" ? "danger" : "warning"}>
        {status}
      </Badge>
      {data && (
        <pre className="rounded-lg bg-ink/5 p-2 font-mono text-xs text-ink overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
      {errorMsg && <p className="text-sm text-brick">{errorMsg}</p>}
    </Card>
  );
}
