"use client";

/**
 * Hapus SEMUA record absensi pada 1 tanggal sekaligus (semua siswa).
 * Terpisah dari ReportTable (yang granularitasnya per-siswa) karena
 * aksi ini tidak terikat ke satu baris tertentu -- user pilih tanggal
 * sendiri lewat date input.
 */
import { useState, type FormEvent } from "react";
import { CalendarX2, AlertTriangle } from "lucide-react";
import { deleteAttendanceDay } from "@/lib/report-firebase";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface Props {
  onDeleted: () => void;
}

export default function DeleteAttendanceDayPanel({ onDeleted }: Props) {
  const [date, setDate] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!date) return;
    setConfirming(true);
    setSuccess(null);
    setError(null);
  }

  async function handleConfirm() {
    setDeleting(true);
    setError(null);
    try {
      await deleteAttendanceDay(date);
      setSuccess(`Semua data absensi tanggal ${date} sudah dihapus.`);
      setConfirming(false);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus data absensi hari ini.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarX2 size={18} className="text-brick" />
        <h2 className="font-semibold">Hapus Data 1 Hari</h2>
      </div>
      <p className="text-xs text-ink-muted">
        Menghapus SEMUA record absensi (semua siswa) pada tanggal yang dipilih. Tindakan ini tidak bisa
        dibatalkan.
      </p>

      {!confirming ? (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <label className="space-y-1">
            <span className="block text-xs text-ink-muted">Tanggal</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="rounded-lg border border-border bg-paper px-2 py-1.5 text-sm text-ink"
            />
          </label>
          <Button type="submit" variant="destructive" disabled={!date}>
            Hapus Tanggal Ini
          </Button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-brick/5 p-3">
          <AlertTriangle size={18} className="shrink-0 text-brick" />
          <p className="flex-1 text-sm text-ink">
            Yakin hapus SEMUA absensi tanggal <span className="font-medium">{date}</span>?
          </p>
          <div className="flex gap-2">
            <Button variant="destructive" disabled={deleting} onClick={handleConfirm}>
              {deleting ? "Menghapus…" : "Ya, Hapus"}
            </Button>
            <Button variant="secondary" disabled={deleting} onClick={() => setConfirming(false)}>
              Batal
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-brick">{error}</p>}
      {success && <p className="text-sm text-forest-dark">{success}</p>}
    </Card>
  );
}
