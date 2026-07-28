/**
 * Validasi murni (tanpa React/UI) -- dipakai komponen form sebagai
 * first line of defense di client. Backend TETAP validator otoritatif
 * (menolak dengan 422 kalau NISN invalid), aturan ini cuma mencegah
 * request yang sudah pasti gagal terkirim dulu.
 */

const NISN_REGEX = /^\d{10}$/;
const CLASS_ID_REGEX = /^\d{1,2}-\d{1,2}$/; // mis. "9-1", "7-12" -- tingkat(1-2 digit)-nomor(1-2 digit)

export function isValidNisn(value: string): boolean {
  return NISN_REGEX.test(value);
}

/** Format kelas dibatasi: "<tingkat>-<nomor>", mis. "9-1", "9-9", "7-12". */
export function isValidClassId(value: string): boolean {
  return CLASS_ID_REGEX.test(value.trim());
}

export interface RegistrationInput {
  nisn: string;
  name: string;
  className: string;
}

/** Balikin pesan error (string) kalau ada masalah, atau null kalau valid. */
export function validateRegistrationInput(input: RegistrationInput): string | null {
  if (!isValidNisn(input.nisn)) {
    return "NISN harus persis 10 digit angka.";
  }
  if (input.name.trim().length < 2) {
    return "Nama minimal 2 karakter.";
  }
  if (input.className.trim().length === 0) {
    return "Kelas wajib diisi.";
  }
  return null;
}
