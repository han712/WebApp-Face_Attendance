"use client";

/**
 * Form untuk settings/attendance (cooldown_seconds, school_start,
 * late_threshold). Pola sama seperti RecognitionSettingsForm.
 */
import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { useFirebaseSetting } from "@/lib/hooks/useFirebaseSetting";
import type { AttendanceSettings } from "@/types/firebase-schema";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const DEFAULT: AttendanceSettings = {
  cooldown_seconds: 15,
  school_start: "07:00",
  late_threshold: "07:15",
};

export default function AttendanceSettingsForm() {
  const { value, loading, error, saving, saveError, save } =
    useFirebaseSetting<AttendanceSettings>("settings/attendance");

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-ink-muted">Memuat pengaturan absensi…</p>
      </Card>
    );
  }
  if (error) {
    return (
      <Card>
        <p className="text-sm text-brick">Gagal memuat: {error}</p>
      </Card>
    );
  }

  return <Fields initial={value ?? DEFAULT} saving={saving} saveError={saveError} onSave={save} />;
}

function Fields({
  initial,
  saving,
  saveError,
  onSave,
}: {
  initial: AttendanceSettings;
  saving: boolean;
  saveError: string | null;
  onSave: (next: AttendanceSettings) => Promise<void>;
}) {
  const [cooldown, setCooldown] = useState(initial.cooldown_seconds);
  const [schoolStart, setSchoolStart] = useState(initial.school_start);
  const [lateThreshold, setLateThreshold] = useState(initial.late_threshold);
  const [savedMsg, setSavedMsg] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSave() {
    setSavedMsg(false);
    setFormError(null);
    if (lateThreshold < schoolStart) {
      setFormError("late_threshold tidak boleh lebih awal dari school_start.");
      return;
    }
    try {
      await onSave({ cooldown_seconds: cooldown, school_start: schoolStart, late_threshold: lateThreshold });
      setSavedMsg(true);
    } catch {
      // saveError sudah ditangani hook
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarClock size={18} className="text-forest-dark" />
        <h2 className="font-semibold">Absensi</h2>
      </div>

      <label className="block space-y-1">
        <span className="text-sm text-ink-muted">Cooldown (detik)</span>
        <input
          type="number"
          min={0}
          value={cooldown}
          onChange={(e) => setCooldown(Number(e.target.value))}
          className="field"
        />
        <span className="text-xs text-ink-muted">
          Jeda minimum sebelum siswa yang sama bisa terekam absen lagi.
        </span>
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-ink-muted">Jam mulai sekolah</span>
        <input type="time" value={schoolStart} onChange={(e) => setSchoolStart(e.target.value)} className="field" />
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-ink-muted">Batas waktu tidak terlambat</span>
        <input
          type="time"
          value={lateThreshold}
          onChange={(e) => setLateThreshold(e.target.value)}
          className="field"
        />
        <span className="text-xs text-ink-muted">Lewat jam ini, status otomatis &quot;Terlambat&quot;.</span>
      </label>

      {formError && <p className="text-sm text-brick">{formError}</p>}
      {saveError && <p className="text-sm text-brick">Gagal menyimpan: {saveError}</p>}
      {savedMsg && !saveError && <p className="text-sm text-forest-dark">Tersimpan.</p>}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Menyimpan…" : "Simpan"}
      </Button>

      <style jsx>{`
        .field {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--color-border);
          background: var(--color-paper);
          padding: 0.375rem 0.5rem;
          font-size: 0.875rem;
          color: var(--color-ink);
        }
        .field:focus {
          outline: 2px solid var(--color-forest);
          outline-offset: 1px;
        }
      `}</style>
    </Card>
  );
}
