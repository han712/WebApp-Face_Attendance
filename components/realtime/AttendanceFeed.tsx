"use client";

/**
 * Feed absensi hari ini, realtime.
 * Listener ke Firebase `attendance/{today}` (Jalur A) -- TIDAK ada
 * fetch REST di sini sama sekali, sesuai kontrak: data yang berubah
 * sendiri wajib lewat listener, bukan polling.
 *
 * (Logic listener TIDAK berubah dari versi sebelumnya -- hanya lapisan
 * tampilan yang di-redesign, pakai Card/Badge/EmptyState dari ui/.)
 */
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { AnimatePresence, motion } from "framer-motion";
import { UsersRound } from "lucide-react";
import { getFirebaseDb } from "@/lib/firebase";
import { getTodayDateJakarta } from "@/lib/date";
import type {
  AttendanceByDateNode,
  AttendanceCheckoutByDateNode,
  AttendanceRecord,
} from "@/types/firebase-schema";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

type ConnectionState = "connecting" | "live" | "error";

// Union tipis supaya list gabungan datang+pulang tetap type-safe -- record
// pulang tidak punya "status" asli (Hadir/Terlambat), tapi backend sudah
// menulis "status": "Pulang" di dalamnya (lihat catatan di
// attendance_service.py::_record_checkout), jadi cukup pakai AttendanceRecord
// sebagai bentuk gabungan.
type FeedItem = AttendanceRecord & { kind: "datang" | "pulang" };

export default function AttendanceFeed() {
  const [arrivalRecords, setArrivalRecords] = useState<AttendanceRecord[]>([]);
  const [checkoutRecords, setCheckoutRecords] = useState<AttendanceRecord[]>([]);
  const [state, setState] = useState<ConnectionState>("connecting");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [today, setToday] = useState(getTodayDateJakarta);

  // Kalau halaman ini dibiarkan terbuka lewat tengah malam (mis. dipakai
  // sebagai layar kiosk/TV di sekolah), listener harus pindah ke node
  // tanggal baru otomatis -- cek tiap 1 menit, cukup sering tanpa boros.
  useEffect(() => {
    const id = setInterval(() => {
      const current = getTodayDateJakarta();
      setToday((prev) => (prev === current ? prev : current));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // Dua listener terpisah -- sumbernya memang dua node berbeda
  // (attendance vs attendance_pulang, lihat catatan struktur di
  // types/firebase-schema.ts). "live"/"error" digabung dari kedua
  // listener supaya badge status koneksi tetap merepresentasikan
  // keduanya, bukan cuma salah satu.
  useEffect(() => {
    const db = getFirebaseDb();
    const attendanceRef = ref(db, `attendance/${today}`);
    const checkoutRef = ref(db, `attendance_pulang/${today}`);

    let arrivalReady = false;
    let checkoutReady = false;
    const markLiveIfReady = () => {
      if (arrivalReady && checkoutReady) setState("live");
    };

    const unsubArrival = onValue(
      attendanceRef,
      (snapshot) => {
        const data: AttendanceByDateNode | null = snapshot.val();
        setArrivalRecords(data ? Object.values(data) : []);
        arrivalReady = true;
        markLiveIfReady();
      },
      (err) => {
        setState("error");
        setErrorMsg(err.message);
      }
    );

    const unsubCheckout = onValue(
      checkoutRef,
      (snapshot) => {
        const data: AttendanceCheckoutByDateNode | null = snapshot.val();
        // Record pulang tidak punya field "status" asli seperti
        // AttendanceRecord (Hadir/Terlambat) -- tapi backend sudah
        // mengisi "status": "Pulang" di setiap record (lihat
        // attendance_service.py::_record_checkout), jadi cast ini aman.
        setCheckoutRecords(data ? (Object.values(data) as unknown as AttendanceRecord[]) : []);
        checkoutReady = true;
        markLiveIfReady();
      },
      (err) => {
        setState("error");
        setErrorMsg(err.message);
      }
    );

    return () => {
      unsubArrival();
      unsubCheckout();
    };
  }, [today]);

  const records: FeedItem[] = [
    ...arrivalRecords.map((r) => ({ ...r, kind: "datang" as const })),
    ...checkoutRecords.map((r) => ({ ...r, kind: "pulang" as const })),
  ].sort((a, b) => b.time.localeCompare(a.time));

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="font-semibold">Absensi Hari Ini</h2>
          <p className="text-xs text-ink-muted">{today}</p>
        </div>
        {state === "live" && <Badge variant="success" pulse>Live</Badge>}
        {state === "connecting" && <Badge variant="neutral">Menghubungkan…</Badge>}
        {state === "error" && <Badge variant="danger">Terputus</Badge>}
      </div>

      {errorMsg && <p className="px-5 py-3 text-sm text-brick">Gagal terhubung ke Firebase: {errorMsg}</p>}

      {state === "live" && records.length === 0 && (
        <EmptyState
          icon={UsersRound}
          title="Belum ada yang absen"
          description="Siswa yang absen hari ini akan muncul di sini secara otomatis."
        />
      )}

      <ul>
        <AnimatePresence initial={false}>
          {records.map((r) => (
            <motion.li
              key={`${r.kind}-${r.nisn}`}
              layout
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0"
            >
              {r.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- sumber gambar dinamis dari Firebase Storage
                <img
                  src={r.photo_url}
                  alt={r.name}
                  className="h-10 w-10 rounded-full object-cover bg-ink/5"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-ink/5" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{r.name}</p>
                <p className="text-xs text-ink-muted">
                  {r.class} &middot; <span className="font-mono">{r.nisn}</span>
                </p>
              </div>
              <div className="text-right">
                <Badge
                  variant={r.kind === "pulang" ? "info" : r.status === "Terlambat" ? "warning" : "success"}
                >
                  {r.status}
                </Badge>
                <p className="mt-1 font-mono text-xs text-ink-muted">{r.time}</p>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Card>
  );
}