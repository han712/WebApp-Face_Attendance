"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import Sidebar from "@/components/Sidebar";
import ConnectionStatusBanner from "@/components/ConnectionStatusBanner";
import PipelineAutoRecoveryWatcher from "@/components/PipelineAutoRecoveryWatcher";

/**
 * Guard + shell untuk SEMUA halaman admin (Dashboard, Registrasi,
 * Laporan, Settings, Admin&Testing, Diagnosa Koneksi). Route di luar
 * grup (admin) -- /login dan /parent/[token] -- TIDAK kena ini sama
 * sekali (Next.js App Router: grup route dengan kurung tidak menumpuk
 * layout ke path di luar grupnya).
 *
 * Dua lapis pengecekan:
 * 1. useAuth() -- apakah ada sesi Firebase Auth sama sekali?
 * 2. useIsAdmin() -- apakah uid itu ada di allowlist `admins/{uid}`?
 * Keduanya cuma untuk UX (redirect & pesan jelas) -- penegakan
 * sesungguhnya tetap di Firebase Security Rules (lihat draft rules).
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: adminCheckLoading } = useIsAdmin(user?.uid ?? null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-sm text-ink-muted">
        Memeriksa sesi login…
      </div>
    );
  }

  if (adminCheckLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-sm text-ink-muted">
        Memeriksa akses admin…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-6 text-center">
        <p className="font-semibold text-ink">Akun ini belum diberi akses admin</p>
        <p className="max-w-sm text-sm text-ink-muted">
          Login dengan {user.email} berhasil, tapi akun ini belum ditambahkan ke daftar admin.
          Hubungi pengelola sistem untuk ditambahkan ke node <code>admins/</code> di Firebase Console.
        </p>
        <button
          onClick={() => signOut()}
          className="rounded-lg bg-ink/10 px-4 py-2 text-sm font-medium text-ink"
        >
          Keluar
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <ConnectionStatusBanner />
        {children}
      </div>
      <PipelineAutoRecoveryWatcher />
    </div>
  );
}
