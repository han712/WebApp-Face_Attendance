/**
 * Inisialisasi Firebase Authentication -- dipisah dari lib/firebase.ts
 * (Realtime DB) karena beda concern, tapi pakai app Firebase yang sama
 * (getFirebaseApp() dari lib/firebase.ts, no duplikasi config).
 *
 * Dipakai untuk DUA hal berbeda:
 * 1. Admin: Email/Password sign-in (lib/hooks/useAuth.ts, app/login).
 * 2. Parent Portal: Anonymous sign-in (app/parent/[token]) -- silent,
 *    tanpa form, cuma supaya Security Rules punya `auth.uid` untuk
 *    dicek. TIDAK ada UI/interaksi untuk anonymous sign-in ini.
 */
import { getAuth, type Auth } from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase";

let auth: Auth;

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}
