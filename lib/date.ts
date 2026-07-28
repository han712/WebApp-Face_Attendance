/**
 * Backend menyimpan tanggal absensi sebagai key "YYYY-MM-DD" berbasis
 * waktu sekolah (WIB / Asia/Jakarta). Kalau webapp dibuka dari browser
 * dengan timezone berbeda (atau device yang timezone-nya salah set),
 * `new Date().toISOString()` bisa keliru mundur/maju satu hari karena
 * ikut UTC. Fungsi ini SELALU hitung "hari ini" berdasarkan WIB,
 * supaya konsisten dengan key yang backend tulis ke Firebase.
 */
export function getTodayDateJakarta(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}
