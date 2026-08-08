"use client";

/**
 * Tombol hapus 1 record absensi (1 siswa, 1 tanggal) -- tulis langsung
 * ke Firebase (lib/report-firebase.ts), BUKAN REST. Pola konfirmasi
 * inline sama dengan components/rest/DeleteStudentButton.tsx supaya
 * UX konsisten se-project.
 *
 * Beda dengan DeleteStudentButton: di sini TIDAK ada listener realtime
 * di parent yang otomatis membuat baris hilang (ReportTable pakai
 * fetch-on-demand, bukan onValue), jadi setelah sukses hapus, parent
 * WAJIB dikasih tahu lewat onDeleted() supaya bisa refresh data.
 */
import { useState } from "react";
import { Trash2, Check, X } from "lucide-react";
import { deleteAttendanceRecord, deleteCheckoutRecord } from "@/lib/report-firebase";

interface Props {
  date: string;
  nisn: string;
  studentName: string;
  onDeleted: () => void;
  /** "datang" (default) hapus dari /attendance, "pulang" hapus dari /attendance_pulang. */
  kind?: "datang" | "pulang";
}

export default function DeleteAttendanceRecordButton({
  date,
  nisn,
  studentName,
  onDeleted,
  kind = "datang",
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kindLabel = kind === "pulang" ? "absen pulang" : "absen datang";

  async function handleConfirm() {
    setDeleting(true);
    setError(null);
    try {
      if (kind === "pulang") await deleteCheckoutRecord(date, nisn);
      else await deleteAttendanceRecord(date, nisn);
      setConfirming(false);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus record absensi.");
    } finally {
      setDeleting(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-ink-muted">Hapus {kindLabel}?</span>
        <button
          onClick={handleConfirm}
          disabled={deleting}
          aria-label={`Konfirmasi hapus ${kindLabel} ${studentName} tanggal ${date}`}
          className="rounded-md bg-brick p-1.5 text-white disabled:opacity-50"
        >
          <Check size={13} />
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          aria-label="Batal"
          className="rounded-md bg-ink/10 p-1.5 text-ink-muted disabled:opacity-50"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setConfirming(true)}
        title={`Hapus ${kindLabel}`}
        aria-label={`Hapus ${kindLabel} ${studentName} tanggal ${date}`}
        className="rounded-md p-1 text-ink-muted/70 opacity-0 transition-opacity hover:bg-brick/10 hover:text-brick group-hover:opacity-100"
      >
        <Trash2 size={12} />
      </button>
      {error && <span className="text-xs text-brick">{error}</span>}
    </div>
  );
}