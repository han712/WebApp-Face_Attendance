"use client";

/**
 * Auto-refresh tiap 2 detik. (Logic TIDAK berubah -- hanya tampilan.)
 */
import { Activity } from "lucide-react";
import { useApiPoll } from "@/lib/hooks/useApiPoll";
import { getActiveLivenessSessions } from "@/lib/debug-api";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

export default function LivenessSessionsPanel() {
  const { data, error } = useApiPoll(getActiveLivenessSessions, 2000);
  const entries = data ? Object.entries(data) : [];

  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Sesi Liveness Aktif</h3>
        <Badge variant="success" pulse>auto-refresh 2s</Badge>
      </div>

      {error && <p className="text-sm text-brick">{error}</p>}

      {entries.length === 0 ? (
        <EmptyState icon={Activity} title="Tidak ada sesi berjalan" description="Sesi liveness akan muncul di sini saat siswa sedang absen." />
      ) : (
        <ul className="space-y-1">
          {entries.map(([nisn, session]) => (
            <li key={nisn} className="flex justify-between text-sm">
              <span className="font-mono">{nisn}</span>
              <span className="text-ink-muted">
                {session.elapsed.toFixed(1)}s &middot; {session.frames} frame
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
