"use client";

/**
 * Form untuk settings/attendance_checkout (enabled, pulang_start,
 * cooldown_seconds). Pola sama seperti AttendanceSettingsForm, tapi untuk
 * absen PULANG -- lihat catatan kontrak di types/firebase-schema.ts
 * (AttendanceCheckoutSettings) untuk mekanisme jendela waktu yang dipakai
 * backend.
 */
import { useState } from "react";
import { LogOut } from "lucide-react";
import { useFirebaseSetting } from "@/lib/hooks/useFirebaseSetting";
import type { AttendanceCheckoutSettings } from "@/types/firebase-schema";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const DEFAULT: AttendanceCheckoutSettings = {
  enabled: true,
  pulang_start: "15:00",
  cooldown_seconds: 15,
};

export default function AttendanceCheckoutSettingsForm() {
  const { value, loading, error, saving, saveError, save } =
    useFirebaseSetting<AttendanceCheckoutSettings>("settings/attendance_checkout");

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-ink-muted">Memuat pengaturan absen pulang…</p>
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
  initial: AttendanceCheckoutSettings;
  saving: boolean;
  saveError: string | null;
  onSave: (next: AttendanceCheckoutSettings) => Promise<void>;
}) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [pulangStart, setPulangStart] = useState(initial.pulang_start);
  const [cooldown, setCooldown] = useState(initial.cooldown_seconds);
  const [savedMsg, setSavedMsg] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSave() {
    setSavedMsg(false);
    setFormError(null);
    if (!/^\d{2}:\d{2}$/.test(pulangStart)) {
      setFormError("Jam mulai pulang tidak valid.");
      return;
    }
    try {
      await onSave({ enabled, pulang_start: pulangStart, cooldown_seconds: cooldown });
      setSavedMsg(true);
    } catch {
      // saveError sudah ditangani hook
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <LogOut size={18} className="text-forest-dark" />
        <h2 className="font-semibold">Absen Pulang</h2>
      </div>

      {/* <label className="flex items-center justify-between gap-2">
        <span className="text-sm text-ink-muted">Aktifkan absen pulang</span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            enabled ? "bg-forest" : "bg-ink/15"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-[22px]" : "translate-x-0.5"
            }`}
          />
        </button>
      </label> */}

      <label className="block space-y-1">
        <span className="text-sm text-ink-muted">Mulai jam pulang</span>
        <input
          type="time"
          value={pulangStart}
          onChange={(e) => setPulangStart(e.target.value)}
          className="field"
        />
        <span className="text-xs text-ink-muted">
          Mulai jam ini, wajah yang dikenali dicatat sebagai absen pulang (bukan absen datang).
        </span>
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-ink-muted">Cooldown pulang (detik)</span>
        <input
          type="number"
          min={0}
          value={cooldown}
          onChange={(e) => setCooldown(Number(e.target.value))}
          className="field"
        />
        <span className="text-xs text-ink-muted">
          Jeda minimum sebelum siswa yang sama bisa terekam absen pulang lagi.
        </span>
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
        .field:disabled {
          opacity: 0.5;
        }
      `}</style>
    </Card>
  );
}