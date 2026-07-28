"use client";

/**
 * Tombol hapus siswa -- REST-only (panggil DELETE /register/{nisn}).
 * Dipisah dari StudentsList (realtime) supaya konsisten dengan pola
 * project ini: komponen rest/ untuk aksi, realtime/ untuk data.
 *
 * Setelah sukses, TIDAK perlu manual update state list -- backend
 * menghapus node `students/{nisn}` juga, jadi listener realtime di
 * StudentsList otomatis membuat baris ini hilang dari daftar.
 */
import { useState } from "react";
import { Trash2, Check, X } from "lucide-react";
import { deleteStudent } from "@/lib/students-api";
import { ApiError } from "@/lib/api";

interface Props {
  nisn: string;
  name: string;
}

export default function DeleteStudentButton({ nisn, name }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setDeleting(true);
    setError(null);
    try {
      await deleteStudent(nisn);
      // Tidak perlu setState "berhasil" -- baris ini akan hilang sendiri
      // begitu listener Firebase di parent menerima node yang terhapus.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus siswa.");
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <span className="text-xs text-ink-muted">Hapus {name}?</span>
        <button
          onClick={handleConfirm}
          disabled={deleting}
          aria-label={`Konfirmasi hapus ${name}`}
          className="rounded-md bg-brick p-1.5 text-white disabled:opacity-50"
        >
          <Check size={14} />
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          aria-label="Batal"
          className="rounded-md bg-ink/10 p-1.5 text-ink-muted disabled:opacity-50"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => setConfirming(true)}
        aria-label={`Hapus ${name}`}
        className="rounded-md p-1.5 text-ink-muted hover:bg-brick/10 hover:text-brick"
      >
        <Trash2 size={16} />
      </button>
      {error && <span className="text-xs text-brick">{error}</span>}
    </div>
  );
}
