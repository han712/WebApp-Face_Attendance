"use client";

/**
 * Halaman Parent Portal -- route TERPISAH TOTAL dari grup (admin), tidak
 * ada Sidebar/AdminGuard di sini sama sekali. Tidak ada form login --
 * lihat lib/hooks/useParentPortal.ts untuk penjelasan lengkap alur
 * binding anonymous-auth di baliknya.
 */
import { use } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, HelpCircle, School, AlertTriangle } from "lucide-react";
import { useParentPortal } from "@/lib/hooks/useParentPortal";
import Card from "@/components/ui/Card";

const STATUS_CONFIG = {
  Hadir: { color: "bg-forest text-white", icon: CheckCircle2, label: "Hadir" },
  Terlambat: { color: "bg-marigold text-white", icon: Clock, label: "Terlambat" },
  "Belum Absen": { color: "bg-ink/10 text-ink-muted", icon: HelpCircle, label: "Belum Absen" },
} as const;

export default function ParentPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { status, link, history, todayStatus, errorMsg } = useParentPortal(token);

  if (status === "loading") {
    return <CenteredMessage text="Memuat…" />;
  }

  if (status === "invalid") {
    return (
      <CenteredMessage
        icon={AlertTriangle}
        text="Link tidak ditemukan"
        subtext="Link ini mungkin sudah tidak berlaku. Hubungi sekolah untuk link baru."
      />
    );
  }

  if (status === "error") {
    return <CenteredMessage icon={AlertTriangle} text="Terjadi kesalahan" subtext={errorMsg ?? undefined} />;
  }

  if (!link) return null;

  const todayConfig = STATUS_CONFIG[todayStatus];
  const TodayIcon = todayConfig.icon;

  const historyDates = Object.keys(history).sort((a, b) => b.localeCompare(a)).slice(0, 14);

  return (
    <main className="min-h-screen bg-paper px-4 py-8">
      <div className="mx-auto max-w-md space-y-5">
        <div className="flex items-center gap-2 justify-center">
          <School size={18} className="text-forest-dark" />
          <p className="text-sm font-medium text-ink-muted">Portal Absensi Orang Tua</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-xl font-bold">{link.student_name}</h1>
          <p className="text-sm text-ink-muted">{link.student_class}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className={`rounded-2xl p-6 text-center ${todayConfig.color}`}
        >
          <TodayIcon size={36} className="mx-auto mb-2" />
          <p className="text-sm opacity-90">Status hari ini</p>
          <p className="text-2xl font-bold">{todayConfig.label}</p>
        </motion.div>

        <Card className="space-y-3">
          <h2 className="font-semibold">Riwayat Absensi</h2>
          {historyDates.length === 0 ? (
            <p className="text-sm text-ink-muted">Belum ada riwayat absensi.</p>
          ) : (
            <ul className="divide-y divide-border">
              {historyDates.map((date) => {
                const entry = history[date];
                const cfg = STATUS_CONFIG[entry.status];
                return (
                  <li key={date} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-ink-muted">{date}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs text-ink-muted">{entry.time}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <p className="text-center text-xs text-ink-muted">
          Data ditampilkan realtime langsung dari sistem sekolah.
        </p>
      </div>
    </main>
  );
}

function CenteredMessage({
  icon: Icon = HelpCircle,
  text,
  subtext,
}: {
  icon?: typeof HelpCircle;
  text: string;
  subtext?: string;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-paper px-6 text-center">
      <Icon size={28} className="text-ink-muted" />
      <p className="font-medium">{text}</p>
      {subtext && <p className="max-w-xs text-sm text-ink-muted">{subtext}</p>}
    </main>
  );
}
