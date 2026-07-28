"use client";

/**
 * UI progress registrasi. Semua logic listener ada di
 * lib/hooks/useRegistrationSession.ts -- komponen ini murni render.
 */
import { motion } from "framer-motion";
import { useRegistrationSession } from "@/lib/hooks/useRegistrationSession";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import type { Mode } from "@/components/rest/RegistrationForm";
import CaptureCameraPreview from "@/components/rest/CaptureCameraPreview";

interface Props {
  sessionId: string;
  mode: Mode;             
  onDone: () => void;
}


const STATUS_LABEL: Record<string, string> = {
  capturing: "Mengambil foto dari kamera…",
  uploading: "Mengunggah & memproses…",
  done: "Selesai",
  error: "Gagal",
};

export default function RegistrationProgress({ sessionId, mode, onDone }: Props) {

  const { session, loading, listenerError } = useRegistrationSession(sessionId);

  if (listenerError) {
    return (
      <Card>
        <p className="text-sm text-brick">Gagal memantau progres: {listenerError}</p>
      </Card>
    );
  }

  if (loading || !session) {
    return (
      <Card>
        <p className="text-sm text-ink-muted">Menghubungkan ke sesi registrasi…</p>
      </Card>
    );
  }

  const percent = session.target > 0 ? Math.min(100, (session.captured / session.target) * 100) : 0;

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-medium">
          {session.name} <span className="font-mono text-ink-muted">({session.nisn})</span>
        </p>
        <Badge variant={session.status === "error" ? "danger" : session.status === "done" ? "success" : "info"} pulse={session.status !== "done" && session.status !== "error"}>
          {STATUS_LABEL[session.status] ?? session.status}
        </Badge>
      </div>
      {mode === "live-capture" && session.status === "capturing" && <CaptureCameraPreview />}
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className={`h-full rounded-full ${session.status === "error" ? "bg-brick" : "bg-forest"}`}
        />
      </div>
      <p className="text-xs text-ink-muted">
        {session.captured} / {session.target} foto
      </p>

      {session.status === "error" && session.error && <p className="text-sm text-brick">{session.error}</p>}

      {(session.status === "done" || session.status === "error") && (
        <Button variant="secondary" onClick={onDone} className="w-full">
          {session.status === "done" ? "Registrasi siswa lain" : "Coba lagi"}
        </Button>
      )}
    </Card>
  );
}
