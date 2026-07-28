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
 * sendiri (lihat app/parent/[token]/page.tsx), sengaja tidak lewat
 * context ini supaya dua alur auth (admin vs parent) tidak saling
 * campur/reset satu sama lain.
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
