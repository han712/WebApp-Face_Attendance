/**
 * Inisialisasi Firebase Client SDK.
 *
 * SEMUA nilai config diambil dari environment variable (.env.local),
 * TIDAK PERNAH di-hardcode di source code -- sesuai aturan di prompt sesi.
 *
 * Dipakai HANYA oleh komponen/hook di jalur REALTIME (listener ke
 * attendance/*, registration_sessions/*, devices/*, dan MENULIS ke
 * settings/*). Komponen jalur REST tidak butuh file ini -- lihat
 * lib/api.ts untuk itu.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function assertConfigPresent() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Konfigurasi Firebase belum lengkap di .env.local. Variabel yang hilang: ${missing
        .map((k) => `NEXT_PUBLIC_FIREBASE_${k.replace(/[A-Z]/g, (c) => "_" + c).toUpperCase()}`)
        .join(", ")}. ` +
        `Lihat .env.local.example untuk daftar lengkap & cara mengambil value-nya dari Firebase Console.`
    );
  }
}

// Guard supaya tidak re-init app saat Next.js hot-reload (App Router
// bisa re-run module ini beberapa kali di dev mode).
let app: FirebaseApp;
let db: Database;

export function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    assertConfigPresent();
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  return app;
}

export function getFirebaseDb(): Database {
  if (!db) {
    db = getDatabase(getFirebaseApp());
  }
  return db;
}
