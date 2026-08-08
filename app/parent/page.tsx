"use client";

/**
 * Parent Portal -- route TERPISAH TOTAL dari grup (admin), tidak ada
 * Sidebar/AdminGuard di sini. Tidak ada form login. Alur: orang tua
 * ketik nama anak -> pilih dari hasil (kalau lebih dari 1 nama sama,
 * dibedakan lewat kelas) -> lihat status hari ini + riwayat (bisa
 * difilter rentang tanggal).
 *
 * Lihat catatan desain & trade-off privasi lengkap di
 * lib/hooks/useStudentNameSearch.ts.
 */
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, HelpCircle, School, Search, ArrowLeft, AlertTriangle, LogOut } from "lucide-react";
import { useStudentNameSearch, type StudentSearchResult } from "@/lib/hooks/useStudentNameSearch";
import { useStudentAttendance } from "@/lib/hooks/useStudentAttendance";
import { useStudentCheckout } from "@/lib/hooks/useStudentCheckout";
import { useFirebaseSetting } from "@/lib/hooks/useFirebaseSetting";
import type { AttendanceCheckoutSettings } from "@/types/firebase-schema";
import Card from "@/components/ui/Card";

const STATUS_CONFIG = {
  Hadir: { color: "bg-forest text-white", icon: CheckCircle2, label: "Hadir" },
  Terlambat: { color: "bg-marigold text-white", icon: Clock, label: "Terlambat" },
  "Belum Absen": { color: "bg-ink/10 text-ink-muted", icon: HelpCircle, label: "Belum Absen" },
} as const;

export default function ParentPortalPage() {
  const [selected, setSelected] = useState<StudentSearchResult | null>(null);

  return (
    <main className="min-h-screen bg-paper px-4 py-8">
      <div className="mx-auto max-w-md space-y-5">
        <div className="flex items-center gap-2 justify-center">
          <School size={18} className="text-forest-dark" />
          <p className="text-sm font-medium text-ink-muted">Portal Absensi Orang Tua</p>
        </div>

        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <StudentSearchStep onSelect={setSelected} />
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AttendanceView student={selected} onBack={() => setSelected(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------
// Langkah 1: cari nama siswa
// ---------------------------------------------------------------------
function StudentSearchStep({ onSelect }: { onSelect: (s: StudentSearchResult) => void }) {
  const { status, errorMsg, search } = useStudentNameSearch();
  const [query, setQuery] = useState("");

  const results = useMemo(() => search(query), [search, query]);
  const hasSearched = query.trim().length > 0;

  return (
    <Card className="space-y-4">
      <div>
        <h1 className="font-semibold">Cari nama anak Anda</h1>
        <p className="text-sm text-ink-muted">Ketik nama lengkap atau sebagian nama siswa.</p>
      </div>

      {status === "error" ? (
        <p className="flex items-center gap-2 text-sm text-brick">
          <AlertTriangle size={16} /> Gagal memuat data: {errorMsg}
        </p>
      ) : (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Contoh: Ahmad Fauzi"
              disabled={status === "signing-in"}
              className="w-full rounded-lg border border-border bg-paper py-2 pl-9 pr-3 text-sm outline-none focus:border-forest"
              autoFocus
            />
          </div>

          {status === "signing-in" && <p className="text-sm text-ink-muted">Memuat data siswa…</p>}

          {status === "ready" && hasSearched && (
            <ul className="divide-y divide-border">
              {results.length === 0 && (
                <li className="py-3 text-sm text-ink-muted">Tidak ada siswa dengan nama tersebut.</li>
              )}
              {results.map((s) => (
                <li key={s.nisn}>
                  <button
                    onClick={() => onSelect(s)}
                    className="flex w-full items-center justify-between py-3 text-left text-sm hover:bg-ink/5 rounded-lg px-2 -mx-2"
                  >
                    <span>
                      <span className="font-medium">{s.name}</span>
                      <span className="ml-2 text-ink-muted">{s.class}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------
// Langkah 2: status hari ini + riwayat (dengan filter tanggal)
// ---------------------------------------------------------------------
function AttendanceView({ student, onBack }: { student: StudentSearchResult; onBack: () => void }) {
  const { loading, errorMsg, history, todayStatus } = useStudentAttendance(student.nisn);
  const { value: checkoutSettings } = useFirebaseSetting<AttendanceCheckoutSettings>("settings/attendance_checkout");
  const checkoutEnabled = checkoutSettings?.enabled ?? false;
  const {
    loading: checkoutLoading,
    history: checkoutHistory,
    hasCheckedOutToday,
    todayTime: checkoutTodayTime,
  } = useStudentCheckout(checkoutEnabled ? student.nisn : null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const allDates = useMemo(() => {
    const dates = new Set(Object.keys(history));
    if (checkoutEnabled) {
      Object.keys(checkoutHistory).forEach((d) => dates.add(d));
    }
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [history, checkoutHistory, checkoutEnabled]);

  const filteredDates = useMemo(() => {
    return allDates.filter((date) => {
      if (fromDate && date < fromDate) return false;
      if (toDate && date > toDate) return false;
      return true;
    });
  }, [allDates, fromDate, toDate]);

  const todayConfig = STATUS_CONFIG[todayStatus];
  const TodayIcon = todayConfig.icon;

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={15} /> Cari siswa lain
      </button>

      <div className="text-center">
        <h1 className="text-xl font-bold">{student.name}</h1>
        <p className="text-sm text-ink-muted">{student.class}</p>
      </div>

      {errorMsg ? (
        <p className="flex items-center gap-2 text-sm text-brick">
          <AlertTriangle size={16} /> Gagal memuat riwayat: {errorMsg}
        </p>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className={`rounded-2xl p-6 text-center ${todayConfig.color}`}
          >
            <TodayIcon size={36} className="mx-auto mb-2" />
            <p className="text-sm opacity-90">Status hari ini</p>
            <p className="text-2xl font-bold">{loading ? "…" : todayConfig.label}</p>
          </motion.div>

          {checkoutEnabled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className={`rounded-2xl p-6 text-center ${
                hasCheckedOutToday ? "bg-forest text-white" : "bg-ink/10 text-ink-muted"
              }`}
            >
              <LogOut size={36} className="mx-auto mb-2" />
              <p className="text-sm opacity-90">Status pulang</p>
              <p className="text-2xl font-bold">
                {checkoutLoading ? "…" : hasCheckedOutToday ? `Sudah Pulang (${checkoutTodayTime})` : "Belum Pulang"}
              </p>
            </motion.div>
          )}

          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Riwayat Absensi</h2>
              {(fromDate || toDate) && (
                <button
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  className="text-xs font-medium text-forest-dark"
                >
                  Reset filter
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-ink-muted">
                Dari tanggal
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-paper px-2 py-1.5 text-sm outline-none focus:border-forest"
                />
              </label>
              <label className="text-xs text-ink-muted">
                Sampai tanggal
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-paper px-2 py-1.5 text-sm outline-none focus:border-forest"
                />
              </label>
            </div>

            {loading ? (
              <p className="text-sm text-ink-muted">Memuat riwayat…</p>
            ) : filteredDates.length === 0 ? (
              <p className="text-sm text-ink-muted">
                {allDates.length === 0 ? "Belum ada riwayat absensi." : "Tidak ada absensi pada rentang tanggal ini."}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {filteredDates.map((date) => {
                  const entry = history[date];
                  const checkoutEntry = checkoutEnabled ? checkoutHistory[date] : undefined;
                  return (
                    <li key={date} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-ink-muted">{date}</span>
                      <span className="flex items-center gap-2">
                        {entry ? (
                          <>
                            <span className="font-mono text-xs text-ink-muted">{entry.time}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                STATUS_CONFIG[entry.status].color
                              }`}
                            >
                              {STATUS_CONFIG[entry.status].label}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-ink-muted">Tidak absen datang</span>
                        )}
                        {checkoutEnabled && (
                          <span className="flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-xs font-medium text-ink-muted">
                            <LogOut size={11} />
                            {checkoutEntry ? checkoutEntry.time : "-"}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}

      <p className="text-center text-xs text-ink-muted">Data ditampilkan realtime langsung dari sistem sekolah.</p>
    </div>
  );
}