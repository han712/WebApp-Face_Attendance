/**
 * Sumber data rekap laporan: LANGSUNG dari Firebase Realtime Database
 * (Jalur A) -- BUKAN lagi lewat backend REST (Jalur B). Tujuannya
 * supaya halaman "Riwayat & Laporan" tetap bisa dibaca (dan sekarang
 * bisa dihapus) walau backend Python sedang mati/restart, karena kedua
 * sumber data yang dipakai di sini (`/students`, `/attendance_by_student`)
 * memang ditulis backend ke Firebase, bukan dibaca on-demand dari backend.
 *
 * Strategi baca:
 * - `/students`                    -> daftar siswa, difilter by kelas kalau diisi.
 * - `/attendance_by_student/{nisn}` -> index riwayat per siswa yang backend
 *   sudah sediakan (lihat types/firebase-schema.ts) -- dipilih dibanding
 *   scan `/attendance/{date}` per tanggal karena jumlah siswa biasanya
 *   lebih kecil/stabil dibanding jumlah hari pada rentang laporan panjang.
 *
 * Perhitungan "Alpa" (keputusan produk, lihat percakapan sesi ini):
 * - SEMUA hari dalam rentang query dihitung (termasuk weekend, tidak ada
 *   pengecualian hari libur).
 * - Tanggal SEBELUM siswa terdaftar (`registered_at`) dilewati sama sekali
 *   (tidak dihitung Hadir/Terlambat/Alpa) -- siswa belum ada di sistem.
 * - Tanggal DI MASA DEPAN (belum terjadi, dibanding "hari ini" WIB) juga
 *   dilewati -- tidak adil menghitung siswa "Alpa" untuk hari yang belum
 *   berlangsung.
 * - Selain dua pengecualian di atas: ada entry di attendance_by_student
 *   -> Hadir/Terlambat sesuai status; tidak ada entry -> Alpa.
 *
 * Fetch di sini pakai `get()` (one-time read), BUKAN listener `onValue`
 * permanen -- sengaja, supaya konsisten dengan UX lama (tombol
 * "Tampilkan" men-trigger satu kali fetch), bukan long-lived subscription
 * ke puluhan/ratusan path sekaligus.
 */
import { get, ref, remove, update } from "firebase/database";
import { getFirebaseDb } from "@/lib/firebase";
import { getTodayDateJakarta } from "@/lib/date";
import type {
  AttendanceByDateNode,
  AttendanceByStudentNode,
  AttendanceCheckoutByStudentNode,
  StudentsNode,
} from "@/types/firebase-schema";
import type { RecapResponse, ReportQuery, StudentReportEntry } from "@/types/report";

function enumerateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];

  // PENTING: sebelumnya pakai `new Date(\`${startDate}T00:00:00\`)` lalu
  // `.toISOString()` -- itu bug. String tanpa suffix "Z" di-parse browser
  // sebagai jam 00:00 WAKTU LOKAL, lalu toISOString() convert balik ke UTC.
  // Untuk timezone yang lebih maju dari UTC (mis. WIB/Asia-Jakarta,
  // UTC+7), itu menggeser tanggal MUNDUR satu hari (00:00 WIB 31 Juli =
  // 17:00 UTC 30 Juli), sehingga query salah cari tanggal ke Firebase dan
  // record yang sebenarnya ADA (mis. "Terlambat") dianggap Alpa.
  //
  // Fix: jangan pernah lewat local-time parsing sama sekali. "YYYY-MM-DD"
  // di sini murni tanggal kalender (bukan titik waktu), jadi diproses full
  // di ruang UTC dari awal sampai akhir -- konsisten di timezone browser
  // manapun, sama seperti key tanggal yang ditulis backend (WIB).
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const cursor = new Date(Date.UTC(sy, sm - 1, sd));
  const last = new Date(Date.UTC(ey, em - 1, ed));

  // Guard: rentang terbalik/tidak valid -> balikin kosong, bukan infinite loop.
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(last.getTime()) || cursor > last) {
    return dates;
  }

  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1); // increment di ruang UTC juga, bukan setDate() lokal
  }
  return dates;
}

/**
 * Ambil & hitung rekap laporan langsung dari Firebase. Bentuk hasil
 * (RecapResponse) sengaja identik dengan bentuk lama dari backend REST,
 * supaya ReportTable dkk tidak perlu tahu soal perubahan sumber data.
 */
export async function fetchRecapFromFirebase(query: ReportQuery): Promise<RecapResponse> {
  const db = getFirebaseDb();

  const studentsSnapshot = await get(ref(db, "students"));
  const studentsData: StudentsNode = studentsSnapshot.val() ?? {};

  const filteredStudents = Object.entries(studentsData).filter(([, student]) =>
    query.className ? student.class === query.className : true
  );

  const today = getTodayDateJakarta();
  const dateList = enumerateDates(query.startDate, query.endDate).filter((date) => date <= today);

  const students: Record<string, StudentReportEntry> = {};
  let totalHadir = 0;
  let totalTerlambat = 0;
  let totalAlpa = 0;
  let totalSudahPulang = 0;

  await Promise.all(
    filteredStudents.map(async ([nisn, student]) => {
      // Dibaca paralel: /attendance_by_student (datang) dan
      // /attendance_pulang_by_student (pulang) -- dua node terpisah,
      // lihat catatan kontrak di types/firebase-schema.ts.
      const [historySnapshot, checkoutSnapshot] = await Promise.all([
        get(ref(db, `attendance_by_student/${nisn}`)),
        get(ref(db, `attendance_pulang_by_student/${nisn}`)),
      ]);
      const history: AttendanceByStudentNode = historySnapshot.val() ?? {};
      const checkoutHistory: AttendanceCheckoutByStudentNode = checkoutSnapshot.val() ?? {};

      const registeredDate = student.registered_at ? student.registered_at.slice(0, 10) : null;

      const days: StudentReportEntry["days"] = {};
      const pulang: StudentReportEntry["pulang"] = {};
      let hadir = 0;
      let terlambat = 0;
      let alpa = 0;
      let sudahPulang = 0;

      for (const date of dateList) {
        if (registeredDate && date < registeredDate) continue; // belum terdaftar di tanggal ini

        const entry = history[date];
        if (entry) {
          days[date] = entry.status;
          if (entry.status === "Terlambat") terlambat++;
          else hadir++;
        } else {
          days[date] = "Alpa";
          alpa++;
        }

        const checkoutEntry = checkoutHistory[date];
        if (checkoutEntry) {
          pulang[date] = checkoutEntry.time;
          sudahPulang++;
        }
      }

      students[nisn] = {
        name: student.name,
        class: student.class,
        hadir,
        terlambat,
        alpa,
        sudah_pulang: sudahPulang,
        days,
        pulang,
      };
      totalHadir += hadir;
      totalTerlambat += terlambat;
      totalAlpa += alpa;
      totalSudahPulang += sudahPulang;
    })
  );

  return {
    period: { start: query.startDate, end: query.endDate, class: query.className ?? null },
    students,
    totals: { hadir: totalHadir, terlambat: totalTerlambat, alpa: totalAlpa, sudah_pulang: totalSudahPulang },
  };
}

// ---------------------------------------------------------------------
// Delete riwayat absensi.
//
// PENTING -- ini jalur tulis BARU ke node `/attendance` &
// `/attendance_by_student` dari webapp (sebelumnya node ini murni
// ditulis backend Python, webapp cuma baca -- lihat catatan di
// types/firebase-schema.ts). Firebase Security Rules WAJIB diupdate
// supaya akun admin (`admins/{uid}` == true) diizinkan `.write` ke dua
// path ini, kalau belum. Tanpa itu, panggilan di bawah akan gagal
// dengan PERMISSION_DENIED walau tombolnya sudah tampil di UI.
//
// Kedua fungsi selalu menghapus dari DUA tempat sekaligus (multi-path
// update, atomic) supaya `/attendance/{date}/{nisn}` dan
// `/attendance_by_student/{nisn}/{date}` tetap konsisten satu sama
// lain -- kalau cuma salah satu yang dihapus, rekap laporan (yang baca
// dari attendance_by_student) & feed harian (yang baca dari
// attendance/{date}) bisa saling beda data.
// ---------------------------------------------------------------------

/** Hapus 1 record absensi: 1 siswa di 1 tanggal tertentu. */
export async function deleteAttendanceRecord(date: string, nisn: string): Promise<void> {
  const db = getFirebaseDb();
  await update(ref(db), {
    [`attendance/${date}/${nisn}`]: null,
    [`attendance_by_student/${nisn}/${date}`]: null,
  });
}

/**
 * Hapus 1 record absen PULANG: 1 siswa di 1 tanggal tertentu.
 * Pola identik deleteAttendanceRecord, tapi ke node terpisah
 * `/attendance_pulang` & `/attendance_pulang_by_student` -- lihat
 * catatan kontrak di types/firebase-schema.ts.
 */
export async function deleteCheckoutRecord(date: string, nisn: string): Promise<void> {
  const db = getFirebaseDb();
  await update(ref(db), {
    [`attendance_pulang/${date}/${nisn}`]: null,
    [`attendance_pulang_by_student/${nisn}/${date}`]: null,
  });
}

/** Hapus SEMUA record absensi pada 1 tanggal sekaligus (semua siswa). */
export async function deleteAttendanceDay(date: string): Promise<void> {
  const db = getFirebaseDb();

  // Perlu tahu dulu nisn siapa saja yang absen di tanggal ini, supaya
  // index attendance_by_student/{nisn}/{date} ikut dibersihkan -- kalau
  // cuma `remove(attendance/{date})`, index per-siswa akan jadi data usang.
  const daySnapshot = await get(ref(db, `attendance/${date}`));
  const dayData: AttendanceByDateNode | null = daySnapshot.val();
  const nisnList = dayData ? Object.keys(dayData) : [];

  if (nisnList.length === 0) {
    // Tetap coba hapus node tanggalnya (jaga-jaga ada node kosong nyasar),
    // tapi tidak ada index per-siswa yang perlu dibersihkan.
    await remove(ref(db, `attendance/${date}`));
    return;
  }

  const updates: Record<string, null> = { [`attendance/${date}`]: null };
  for (const nisn of nisnList) {
    updates[`attendance_by_student/${nisn}/${date}`] = null;
  }
  await update(ref(db), updates);
}