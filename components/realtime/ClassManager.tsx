"use client";

import { useState, type FormEvent } from "react";
import { X, Plus, LayoutGrid } from "lucide-react";
import { useClasses } from "@/lib/hooks/useClasses";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function ClassManager() {
  const { classIds, loading, error, addClass, deleteClass } = useClasses();
  const [input, setInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const err = await addClass(input);
    setSubmitting(false);
    if (err) {
      setFormError(err);
    } else {
      setInput("");
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <LayoutGrid size={18} className="text-forest-dark" />
        <h2 className="font-semibold">Kelola Kelas</h2>
      </div>

      {error && <p className="text-sm text-brick">{error}</p>}

      {loading ? (
        <p className="text-sm text-ink-muted">Memuat daftar kelas…</p>
      ) : classIds.length === 0 ? (
        <p className="text-sm text-ink-muted">Belum ada kelas. Tambahkan dulu di bawah.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {classIds.map((id) => (
            <span
              key={id}
              className="flex items-center gap-1 rounded-full bg-forest/10 px-3 py-1 text-sm font-medium text-forest-dark"
            >
              {id}
              <button
                onClick={() => deleteClass(id)}
                aria-label={`Hapus kelas ${id}`}
                className="text-forest-dark/60 hover:text-brick"
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="mis. 9-1"
          className="w-32 rounded-lg border border-border bg-paper px-3 py-1.5 text-sm focus:outline-forest"
        />
        <Button type="submit" disabled={submitting || !input} variant="secondary" className="flex items-center gap-1">
          <Plus size={14} /> Tambah
        </Button>
      </form>
      {formError && <p className="text-sm text-brick">{formError}</p>}
      <p className="text-xs text-ink-muted">
        Format: tingkat-nomor (mis. 9-1, 9-9, 7-12). Daftar ini jadi pilihan dropdown di form
        Registrasi -- tidak mengubah data siswa yang sudah ada.
      </p>
    </Card>
  );
}
