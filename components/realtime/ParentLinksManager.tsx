"use client";

import { useState, type FormEvent } from "react";
import { UserRound, Copy, MessageCircle, Trash2, Check } from "lucide-react";
import { useStudents } from "@/lib/hooks/useStudents";
import { useParentLinks } from "@/lib/hooks/useParentLinks";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

export default function ParentLinksManager() {
  const { students, loading: studentsLoading } = useStudents();
  const { links, loading, error, createLink, deleteLink } = useParentLinks();

  const [nisn, setNisn] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const student = students.find((s) => s.nisn === nisn);
    if (!student) {
      setFormError("Pilih siswa dulu.");
      return;
    }
    if (!parentName.trim() || !parentPhone.trim()) {
      setFormError("Nama & nomor WA orang tua wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      await createLink({
        nisn: student.nisn,
        studentName: student.name,
        studentClass: student.class,
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
      });
      setNisn("");
      setParentName("");
      setParentPhone("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal membuat link.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <UserRound size={18} className="text-forest-dark" />
          <h2 className="font-semibold">Buat Link Portal Orang Tua</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-sm text-ink-muted">Siswa</span>
            <select
              value={nisn}
              onChange={(e) => setNisn(e.target.value)}
              className="field"
              disabled={studentsLoading}
            >
              <option value="">{studentsLoading ? "Memuat…" : "Pilih siswa"}</option>
              {students.map((s) => (
                <option key={s.nisn} value={s.nisn}>
                  {s.name} -- {s.class} ({s.nisn})
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-sm text-ink-muted">Nama orang tua</span>
            <input value={parentName} onChange={(e) => setParentName(e.target.value)} className="field" placeholder="Bambang" />
          </label>

          <label className="block space-y-1">
            <span className="text-sm text-ink-muted">Nomor WA</span>
            <input
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              className="field"
              placeholder="+62812xxxxxxx"
            />
          </label>

          {formError && <p className="text-sm text-brick sm:col-span-2">{formError}</p>}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Membuat…" : "Buat Link"}
            </Button>
          </div>
        </form>

        <style jsx>{`
          .field {
            width: 100%;
            border-radius: 0.5rem;
            border: 1px solid var(--color-border);
            background: var(--color-paper);
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            color: var(--color-ink);
          }
          .field:focus {
            outline: 2px solid var(--color-forest);
            outline-offset: 1px;
          }
        `}</style>
      </Card>

      <Card className="space-y-3 p-0 overflow-hidden">
        <h2 className="px-5 pt-4 font-semibold">Link yang Sudah Dibuat</h2>
        {error && <p className="px-5 text-sm text-brick">{error}</p>}
        {!loading && links.length === 0 ? (
          <EmptyState icon={UserRound} title="Belum ada link" description="Buat link portal orang tua lewat form di atas." />
        ) : (
          <ul className="divide-y divide-border">
            {links.map((link) => (
              <ParentLinkRow key={link.token} link={link} onDelete={() => deleteLink(link.token)} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function ParentLinkRow({
  link,
  onDelete,
}: {
  link: import("@/lib/hooks/useParentLinks").ParentLinkWithToken;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const portalUrl =
    typeof window !== "undefined" ? `${window.location.origin}/parent/${link.token}` : `/parent/${link.token}`;
  const waMessage = `Halo ${link.parent_name}, ini link portal absensi ${link.student_name} (${link.student_class}): ${portalUrl}`;
  const waUrl = `https://wa.me/${link.parent_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(waMessage)}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
      <div className="min-w-0">
        <p className="font-medium">
          {link.student_name} <span className="font-mono text-xs text-ink-muted">({link.nisn})</span>
        </p>
        <p className="text-xs text-ink-muted">
          {link.student_class} &middot; Orang tua: {link.parent_name} ({link.parent_phone})
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={handleCopy} aria-label="Salin link" className="rounded-md p-1.5 text-ink-muted hover:bg-ink/5">
          {copied ? <Check size={16} className="text-forest-dark" /> : <Copy size={16} />}
        </button>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Kirim via WhatsApp"
          className="rounded-md p-1.5 text-ink-muted hover:bg-forest/10 hover:text-forest-dark"
        >
          <MessageCircle size={16} />
        </a>
        {confirmingDelete ? (
          <>
            <button onClick={onDelete} className="rounded-md bg-brick px-2 py-1 text-xs text-white">
              Yakin?
            </button>
            <button onClick={() => setConfirmingDelete(false)} className="rounded-md bg-ink/10 px-2 py-1 text-xs">
              Batal
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            aria-label="Hapus link"
            className="rounded-md p-1.5 text-ink-muted hover:bg-brick/10 hover:text-brick"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </li>
  );
}
