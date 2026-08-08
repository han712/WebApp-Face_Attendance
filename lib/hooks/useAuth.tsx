"use client";

/**
 * Context + hook untuk sesi Admin (Email/Password). Ini LOGIC layer --
 * tidak ada styling/JSX visual di sini, cuma wiring Firebase Auth ke
 * React Context supaya bisa dibaca dari mana pun lewat useAuth().
 *
 * Dipasang sekali di root layout.tsx (bukan cuma di dalam grup route
 * (admin)) supaya app/login juga bisa pakai signIn() dari context yang
 * sama -- login page ada DI LUAR grup (admin) (tidak boleh ikut ke-guard).
 *
 * TIDAK dipakai oleh Parent Portal -- portal itu pakai Anonymous Auth
 * sendiri (lihat lib/hooks/useStudentNameSearch.ts, dipakai dari
 * app/parent/page.tsx), sengaja tidak lewat context ini supaya dua
 * alur auth (admin vs parent) tidak saling campur/reset satu sama lain
 * DI LEVEL REACT CONTEXT. CATATAN: Firebase Auth JS SDK tetap 1 instance
 * per browser (state auth dibagi lewat IndexedDB antar tab) -- kalau
 * admin login di satu tab lalu /parent dibuka di tab lain PADA BROWSER
 * YANG SAMA, anonymous sign-in bisa menggantikan sesi admin di semua
 * tab. Ini bukan hal baru dari perubahan Parent Portal terbaru --
 * sudah jadi karakteristik desain sejak awal (portal tanpa login).
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-auth";

interface AuthContextValue {
  user: User | null;
  /** true selagi menunggu status auth pertama kali dari Firebase */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const auth = getFirebaseAuth();
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signOut() {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() dipanggil di luar <AuthProvider> -- pastikan root layout membungkusnya.");
  }
  return ctx;
}