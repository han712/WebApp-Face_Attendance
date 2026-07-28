"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Home, UserPlus, FileBarChart2, Settings, Wrench, PlugZap, School, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

const ITEMS = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/register", label: "Registrasi", icon: UserPlus },
  { href: "/report", label: "Riwayat & Laporan", icon: FileBarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin & Testing", icon: Wrench },
  { href: "/test-connection", label: "Diagnosa Koneksi", icon: PlugZap },
];

function Brand() {
  return (
    <div className="flex items-center gap-2 px-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest text-white">
        <School size={18} />
      </div>
      <div>
        <p className="text-sm font-bold leading-tight">Absensi Wajah</p>
        <p className="text-xs text-ink-muted leading-tight">Dashboard Guru</p>
      </div>
    </div>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
          >
            {active && (
              <motion.span
                layoutId="sidebar-active-pill"
                className="absolute inset-0 rounded-lg bg-forest/10"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Icon size={18} className={`relative z-10 ${active ? "text-forest-dark" : "text-ink-muted"}`} />
            <span className={`relative z-10 ${active ? "text-forest-dark" : "text-ink-muted"}`}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function AccountFooter() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  return (
    <div className="mt-2 border-t border-border pt-3 px-2">
      <p className="truncate text-xs text-ink-muted">{user.email}</p>
      <button
        onClick={() => signOut()}
        className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brick"
      >
        <LogOut size={13} /> Keluar
      </button>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Rail desktop -- selalu tampil, md ke atas */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-surface px-3 py-5">
        <div className="mb-6">
          <Brand />
        </div>
        <NavLinks pathname={pathname} />
        <AccountFooter />
      </aside>

      {/* Top bar mobile -- di bawah md */}
      <div className="flex md:hidden items-center justify-between border-b border-border bg-surface px-4 py-3">
        <Brand />
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-ink-muted hover:bg-ink/5"
          aria-label="Buka menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Drawer mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-ink/40 md:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-surface px-3 py-5 md:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <Brand />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-ink-muted hover:bg-ink/5"
                  aria-label="Tutup menu"
                >
                  <X size={20} />
                </button>
              </div>
              <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              <AccountFooter />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
