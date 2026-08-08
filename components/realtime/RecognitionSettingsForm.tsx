"use client";

/**
 * Form untuk settings/recognition (match_threshold).
 * Pola: komponen luar urus loading/error dari hook, lalu BARU mount
 * <Fields> setelah data pertama datang -- <Fields> pakai useState biasa
 * (initial value dari props) tanpa perlu useEffect untuk sinkronisasi.
 */
import { useState } from "react";
import { ScanFace } from "lucide-react";
import { useFirebaseSetting } from "@/lib/hooks/useFirebaseSetting";
import type { RecognitionSettings } from "@/types/firebase-schema";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const DEFAULT: RecognitionSettings = { match_threshold: 0.61 };

export default function RecognitionSettingsForm() {
  const { value, loading, error, saving, saveError, save } =
    useFirebaseSetting<RecognitionSettings>("settings/recognition");

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-ink-muted">Memuat pengaturan pengenalan wajah…</p>
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
  initial: RecognitionSettings;
  saving: boolean;
  saveError: string | null;
  onSave: (next: RecognitionSettings) => Promise<void>;
}) {
  const [threshold, setThreshold] = useState(initial.match_threshold);
  const [savedMsg, setSavedMsg] = useState(false);

  async function handleSave() {
    setSavedMsg(false);
    try {
      await onSave({ match_threshold: threshold });
      setSavedMsg(true);
    } catch {
      // saveError sudah ditangani hook
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <ScanFace size={18} className="text-forest-dark" />
        <h2 className="font-semibold">Pengenalan Wajah</h2>
      </div>

      <label className="block space-y-1">
        <span className="flex items-center justify-between text-sm text-ink-muted">
          <span>Rentang akurasi pengenalan wajah</span>
          <span className="font-mono text-ink">{threshold.toFixed(2)}</span>
        </span>
        <input
          type="range"
          min={0.1}
          max={0.9}
          step={0.01}
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          className="w-full accent-forest"
        />
        <span className="flex justify-between text-xs text-ink-muted">
          <span>0.1 (longgar)</span>
          <span>0.9 (ketat)</span>
        </span>
      </label>
      <p className="text-xs text-ink-muted">
       Atur tingkat kemiripan wajah yang diperlukan agar sistem dapat mengenali seseorang.
      </p>
      <p className="text-xs text-ink-muted">
        Default Nilai: 0.6
      </p>

      {saveError && <p className="text-sm text-brick">Gagal menyimpan: {saveError}</p>}
      {savedMsg && !saveError && <p className="text-sm text-forest-dark">Tersimpan.</p>}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Menyimpan…" : "Simpan"}
      </Button>
    </Card>
  );
}
