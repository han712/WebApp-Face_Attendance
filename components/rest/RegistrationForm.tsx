"use client";

/**
 * UI form registrasi siswa. Komponen ini SENGAJA tidak berisi logic
 * validasi atau bentuk request -- itu semua di lib/validation.ts dan
 * lib/registration-api.ts. Komponen cuma: kumpulkan input, panggil
 * fungsi lib, dan laporkan hasil (session_id) ke parent lewat prop
 * `onStarted`.
 */
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Camera, Upload } from "lucide-react";
import { validateRegistrationInput, type RegistrationInput } from "@/lib/validation";
import { startLiveCapture, startManualUpload } from "@/lib/registration-api";
import { useClasses } from "@/lib/hooks/useClasses";
import { ApiError } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export type Mode = "live-capture" | "manual-upload";

interface Props {
  onStarted: (sessionId: string, mode: Mode) => void;
}

export default function RegistrationForm({ onStarted }: Props) {
  const [mode, setMode] = useState<Mode>("live-capture");
  const [nisn, setNisn] = useState("");
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { classIds, loading: classesLoading } = useClasses();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const input: RegistrationInput = { nisn, name, className };
    const validationError = validateRegistrationInput(input);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    if (mode === "manual-upload" && files.length === 0) {
      setFormError("Pilih minimal 1 foto untuk upload manual.");
      return;
    }

    setSubmitting(true);
    try {
      const res =
        mode === "live-capture" ? await startLiveCapture(input) : await startManualUpload(input, files);
      onStarted(res.session_id, mode);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Gagal menghubungi server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <ModeButton
            active={mode === "live-capture"}
            onClick={() => setMode("live-capture")}
            icon={Camera}
            label="Live Capture"
          />
          <ModeButton
            active={mode === "manual-upload"}
            onClick={() => setMode("manual-upload")}
            icon={Upload}
            label="Upload Manual"
          />
        </div>

        <Field label="NISN (10 digit)">
          <input
            value={nisn}
            onChange={(e) => setNisn(e.target.value)}
            maxLength={10}
            inputMode="numeric"
            placeholder="1234567890"
            className="input font-mono"
          />
        </Field>

        <Field label="Nama">
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </Field>

        <Field label="Kelas">
          {classIds.length === 0 && !classesLoading ? (
            <p className="text-xs text-brick">
              Belum ada kelas terdaftar -- tambahkan dulu di halaman{" "}
              <a href="/admin/students" className="underline">
                Kelola Siswa
              </a>
              .
            </p>
          ) : (
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="input"
              disabled={classesLoading}
            >
              <option value="">{classesLoading ? "Memuat…" : "Pilih kelas"}</option>
              {classIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          )}
        </Field>

        {mode === "manual-upload" && (
          <Field label="Foto (bisa pilih beberapa)">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="text-sm text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-forest/10 file:px-3 file:py-1.5 file:text-forest-dark"
            />
          </Field>
        )}

        {formError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-brick"
          >
            {formError}
          </motion.p>
        )}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Memulai…" : "Mulai Registrasi"}
        </Button>

        <style jsx>{`
          .input {
            width: 100%;
            background: var(--color-paper);
            border: 1px solid var(--color-border);
            border-radius: 0.5rem;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            color: var(--color-ink);
          }
          .input:focus {
            outline: 2px solid var(--color-forest);
            outline-offset: 1px;
          }
        `}</style>
      </form>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Camera;
  label: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
        active ? "bg-forest text-white" : "bg-ink/5 text-ink-muted hover:bg-ink/10"
      }`}
    >
      <Icon size={14} />
      {label}
    </motion.button>
  );
}
