/**
 * Tipe TypeScript yang MERUPAKAN CERMINAN PERSIS dari skema Firebase
 * Realtime Database yang didefinisikan backend Python (lihat
 * docs/FIREBASE_SCHEMA.md di repo backend).
 *
 * ATURAN PENTING:
 * - File ini HANYA representasi tipe, backend Python adalah "source of
 *   truth" skema sesungguhnya. Kalau backend berubah, file ini yang
 *   menyesuaikan, BUKAN sebaliknya.
 * - Node `/faces/{nisn}` SENGAJA TIDAK didefinisikan di sini -- webapp
 *   dilarang membaca node itu sama sekali (payload embedding besar,
 *   khusus dipakai backend Python/InsightFace).
 * - Node `/command` didefinisikan read-only untuk webapp (boleh
 *   ditampilkan sebagai mirror LCD di dashboard admin, TAPI JANGAN
 *   PERNAH ditulis dari webapp -- itu kontrak backend -> ESP32).
 */

// ---------------------------------------------------------------------
// /students/{nisn}
// ---------------------------------------------------------------------
export interface StudentRecord {
  nisn: string; // persis 10 digit angka, jadi juga dipakai sebagai key node
  name: string;
  class: string;
  photo_url: string; // URL Firebase Storage, resolusi asli
  registered_at: string; // ISO8601
}

/** Bentuk node /students -> { [nisn]: StudentRecord } */
export type StudentsNode = Record<string, StudentRecord>;

// ---------------------------------------------------------------------
// /attendance/{date}/{nisn}   -- date format "YYYY-MM-DD"
// ---------------------------------------------------------------------
export type AttendanceStatus = "Hadir" | "Terlambat";

export interface AttendanceRecord {
  nisn: string;
  name: string;
  class: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM:SS"
  status: AttendanceStatus;
  photo_url: string; // foto bukti absen saat itu
  recorded_at: string; // ISO8601
}

/** Bentuk node /attendance/{date} -> { [nisn]: AttendanceRecord } */
export type AttendanceByDateNode = Record<string, AttendanceRecord>;

// ---------------------------------------------------------------------
// /attendance_by_student/{nisn}/{date}
// Index tambahan (data terduplikasi sedikit dari /attendance) supaya
// query "riwayat 1 siswa" tidak perlu scan seluruh /attendance/*.
// ---------------------------------------------------------------------
export interface AttendanceByStudentEntry {
  status: AttendanceStatus;
  time: string; // "HH:MM:SS"
}

/** Bentuk node /attendance_by_student/{nisn} -> { [date]: AttendanceByStudentEntry } */
export type AttendanceByStudentNode = Record<string, AttendanceByStudentEntry>;

// ---------------------------------------------------------------------
// /attendance_pulang/{date}/{nisn}   -- date format "YYYY-MM-DD". NODE
// BARU, cermin struktur /attendance tapi untuk absen PULANG. Ditulis
// backend Python saat wajah dikenali setelah settings/attendance_checkout
// .pulang_start terlampaui (lihat AttendanceCheckoutSettings di atas).
// Sengaja dipisah dari /attendance (bukan field tambahan di record yang
// sama) supaya siswa yang belum pulang tidak butuh "placeholder" record.
// ---------------------------------------------------------------------
export interface AttendanceCheckoutRecord {
  nisn: string;
  name: string;
  class: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM:SS" -- jam wajah dikenali saat pulang
  photo_url: string; // foto bukti absen pulang saat itu
  recorded_at: string; // ISO8601
}

/** Bentuk node /attendance_pulang/{date} -> { [nisn]: AttendanceCheckoutRecord } */
export type AttendanceCheckoutByDateNode = Record<string, AttendanceCheckoutRecord>;

// ---------------------------------------------------------------------
// /attendance_pulang_by_student/{nisn}/{date}   -- NODE BARU, index sama
// polanya dengan /attendance_by_student, supaya "riwayat pulang 1 siswa"
// (dipakai parent portal) tidak perlu scan seluruh /attendance_pulang/*.
// ---------------------------------------------------------------------
export interface AttendanceCheckoutByStudentEntry {
  time: string; // "HH:MM:SS"
}

/** Bentuk node /attendance_pulang_by_student/{nisn} -> { [date]: entry } */
export type AttendanceCheckoutByStudentNode = Record<string, AttendanceCheckoutByStudentEntry>;

// ---------------------------------------------------------------------
// /registration_sessions/{session_id}
// Dibuat backend setelah POST /register/live-capture atau
// /register/manual-upload. Bersifat transient/sementara.
// ---------------------------------------------------------------------
export type RegistrationStatus = "capturing" | "uploading" | "done" | "error";

export interface RegistrationSession {
  nisn: string;
  name: string;
  class: string;
  status: RegistrationStatus;
  captured: number; // progress saat ini, mis. 8
  target: number; // target total, mis. 15 -> dipakai untuk progress bar (captured/target)
  error: string | null; // terisi kalau status === "error"
  updated_at: string; // ISO8601
}

// ---------------------------------------------------------------------
// /command   -- SATU node tunggal (bukan per-device).
// READ-ONLY bagi webapp. Ini kontrak backend Python -> firmware ESP32,
// lihat docs/ESP32_COMMAND_PROTOCOL.md. Webapp boleh me-mirror tampilan
// ini di dashboard admin (mis. preview LCD virtual) tapi TIDAK PERNAH
// menulis ke node ini.
// ---------------------------------------------------------------------
export type LedColor = "red" | "yellow" | "green";
export type BuzzerSound = "none" | "success" | "fail";

export interface CommandNode {
  lcd_line1: string; // maks 16 karakter
  lcd_line2: string; // maks 16 karakter
  led: LedColor;
  buzzer: BuzzerSound;
  command_id: number; // increment naik terus, dipakai untuk dedup
  timestamp: string; // ISO8601
}

// ---------------------------------------------------------------------
// /devices/{device_id}/status   -- DITULIS OLEH ESP32 SENDIRI.
// Backend Python & webapp HANYA membaca node ini.
// ---------------------------------------------------------------------
export interface DeviceStatus {
  online: boolean;
  /**
   * Dulu didokumentasikan ISO8601 string, tapi API_DOCUMENTATION_v3.md
   * mengonfirmasi firmware ESP32 sebenarnya mengirim epoch MILLISECONDS
   * (number) -- ESP32 tidak punya RTC/NTP. `new Date(...)` di JS valid
   * untuk keduanya jadi runtime tidak crash, tapi type ini diperlebar
   * supaya jujur sesuai kontrak asli. (Ada bug terpisah di backend yang
   * meng-assume ISO string saat menghitung `online_computed` di REST
   * /device/status -- itu tidak memengaruhi node Firebase ini, hanya
   * response REST-nya. Lihat catatan di DeviceStatusIndicator.tsx.)
   */
  last_heartbeat: string | number;
  // Field lain bebas ditambah firmware (mis. rssi, uptime) -- pakai
  // index signature supaya field tambahan tidak menyebabkan type error.
  [extraField: string]: unknown;
}

// ---------------------------------------------------------------------
// /settings/recognition   -- WEBAPP MENULIS ke sini (halaman Settings).
// Backend membaca ulang node ini tiap ~5 detik (cache TTL), jadi
// perubahan dari webapp terasa tanpa restart backend.
// ---------------------------------------------------------------------
export interface RecognitionSettings {
  /**
   * COSINE SIMILARITY (0..1), BUKAN euclidean distance.
   * Makin BESAR nilainya -> makin KETAT/mirip syarat pengenalan wajah.
   * Range yang disarankan untuk slider UI: 0.2 (longgar) - 0.6 (ketat).
   * Default: 0.38
   */
  match_threshold: number;
}

// ---------------------------------------------------------------------
// /settings/attendance   -- WEBAPP MENULIS ke sini (halaman Settings).
// ---------------------------------------------------------------------
export interface AttendanceSettings {
  cooldown_seconds: number; // default 15 -- jeda minimum antar-absen orang yang sama
  school_start: string; // "HH:MM", mis. "07:00"
  late_threshold: string; // "HH:MM", mis. "07:15" -- lewat jam ini = "Terlambat"
}

// ---------------------------------------------------------------------
// /settings/attendance_checkout   -- WEBAPP MENULIS ke sini (halaman
// Settings, bagian "Absen Pulang"). NODE BARU -- BELUM ADA KONTRAK DI
// BACKEND, backend Python HARUS diupdate agar membaca node ini dan
// mengimplementasikan logikanya (lihat catatan kontrak terpisah).
//
// Mekanisme yang disepakati: BERBASIS JENDELA WAKTU, otomatis tanpa aksi
// tambahan dari siswa -- kapan pun wajah dikenali SETELAH `pulang_start`,
// backend menulis record ke /attendance_pulang/{date}/{nisn} alih-alih
// (atau selain) /attendance/{date}/{nisn}.
// ---------------------------------------------------------------------
export interface AttendanceCheckoutSettings {
  enabled: boolean; // matikan fitur kalau backend belum siap mendukung
  pulang_start: string; // "HH:MM", mis. "15:00" -- mulai jam ini, absen dianggap "pulang"
  cooldown_seconds: number; // jeda minimum antar-absen pulang orang yang sama (pola sama seperti cooldown datang)
}

// ---------------------------------------------------------------------
// /classes/{class_id}   -- NODE BARU (webapp-only, tidak menyentuh
// kontrak backend). class_id itu sendiri adalah label yang dipakai
// (mis. "9-1", "7-12") -- format divalidasi di lib/validation.ts.
//
// PENTING: field `class` di /students/{nisn} TETAP string bebas seperti
// sebelumnya (kontrak backend tidak berubah) -- node ini HANYA sumber
// daftar pilihan dropdown di webapp, supaya admin tidak mengetik ulang
// nama kelas beda-beda ejaan tiap registrasi. Kalau backend suatu saat
// perlu tahu daftar kelas resmi juga, itu perubahan terpisah yang perlu
// didiskusikan (lihat catatan di komponen ClassManager).
// ---------------------------------------------------------------------
export interface SchoolClass {
  class_id: string; // mis. "9-1" -- juga dipakai sebagai key node & sebagai value field `class` siswa
  created_at: string; // ISO8601
}

export type ClassesNode = Record<string, SchoolClass>;

// ---------------------------------------------------------------------
// /admins/{uid}   -- NODE BARU, allowlist akun admin (Firebase Auth
// Email/Password). Diisi MANUAL oleh Han lewat Firebase Console setelah
// akun Auth-nya dibuat -- webapp tidak punya UI untuk menambah admin
// baru (sengaja, supaya tidak ada jalur self-service jadi admin).
// ---------------------------------------------------------------------
export type AdminsNode = Record<string, true>;

// ---------------------------------------------------------------------
// Ringkasan seluruh root node yang BOLEH diakses webapp
// (tidak termasuk /faces -- sengaja dikecualikan, lihat catatan di atas)
// ---------------------------------------------------------------------
export interface FirebaseRootSchema {
  students: StudentsNode;
  attendance: Record<string, AttendanceByDateNode>; // { [date]: { [nisn]: AttendanceRecord } }
  attendance_by_student: Record<string, AttendanceByStudentNode>; // { [nisn]: { [date]: entry } }
  attendance_pulang: Record<string, AttendanceCheckoutByDateNode>; // { [date]: { [nisn]: AttendanceCheckoutRecord } }
  attendance_pulang_by_student: Record<string, AttendanceCheckoutByStudentNode>; // { [nisn]: { [date]: entry } }
  registration_sessions: Record<string, RegistrationSession>;
  command: CommandNode;
  devices: Record<string, { status: DeviceStatus }>;
  settings: {
    recognition: RecognitionSettings;
    attendance: AttendanceSettings;
    attendance_checkout: AttendanceCheckoutSettings;
  };
  classes: ClassesNode;
  admins: AdminsNode;
}