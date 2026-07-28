"use client";

/**
 * Login Admin (Email/Password). SENGAJA di luar grup route (admin) --
 * halaman ini sendiri tidak boleh kena AdminGuard (kalau kena, orang
 * yang belum login tidak akan pernah bisa MELIHAT halaman untuk login).
 * Redirect ke "/" setelah sukses -- (admin)/layout.tsx yang urus dari sana.
 */
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { School, LogIn } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      router.replace("/");
    } catch {
      // Firebase Auth error message default cukup teknis (mis.
      // "auth/invalid-credential") -- kita generalisasi supaya tidak
      // membocorkan apakah email terdaftar atau tidak (praktik aman).
      setError("Email atau password salah.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm"
      >
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest text-white">
            <School size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Absensi Wajah</h1>
            <p className="text-sm text-ink-muted">Login khusus Admin/Guru</p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1">
              <span className="text-sm text-ink-muted">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
                autoComplete="username"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-ink-muted">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
                autoComplete="current-password"
              />
            </label>

            {error && <p className="text-sm text-brick">{error}</p>}

            <Button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-1.5">
              <LogIn size={16} /> {submitting ? "Masuk…" : "Masuk"}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-xs text-ink-muted">
          Halaman ini untuk Admin/Guru. Orang tua siswa punya link portal terpisah dari sekolah.
        </p>

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
      </motion.div>
    </main>
  );
}
