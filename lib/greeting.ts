/**
 * Logic murni (tanpa React) untuk sapaan berdasarkan jam WIB saat ini.
 * Dipisah dari komponen UI-nya (components/ui/GreetingBanner.tsx) supaya
 * aturan "jam segini = sapaan apa" bisa diubah tanpa menyentuh JSX.
 */
import { getTodayDateJakarta } from "@/lib/date";

export interface Greeting {
  text: string;
  emoji: string;
  dateLabel: string; // "Senin, 21 Juli 2026"
}

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function getGreeting(): Greeting {
  const hourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    hour12: false,
  }).format(new Date());
  const hour = parseInt(hourStr, 10);

  let text: string;
  let emoji: string;
  if (hour >= 4 && hour < 11) {
    text = "Selamat pagi";
    emoji = "☀️";
  } else if (hour >= 11 && hour < 15) {
    text = "Selamat siang";
    emoji = "🌤️";
  } else if (hour >= 15 && hour < 18) {
    text = "Selamat sore";
    emoji = "🌇";
  } else {
    text = "Selamat malam";
    emoji = "🌙";
  }

  const [year, month, day] = getTodayDateJakarta().split("-").map(Number);
  const dayName = DAY_NAMES[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  const dateLabel = `${dayName}, ${day} ${MONTH_NAMES[month - 1]} ${year}`;

  return { text, emoji, dateLabel };
}
