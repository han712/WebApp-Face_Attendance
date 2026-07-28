"use client";

/**
 * Hook logic murni untuk listen progress registrasi dari Firebase
 * `registration_sessions/{session_id}`. Sengaja dipisah dari komponen
 * UI (components/realtime/RegistrationProgress.tsx) supaya logic
 * listener bisa dipakai ulang/ditest terpisah dari tampilan.
 */
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { getFirebaseDb } from "@/lib/firebase";
import type { RegistrationSession } from "@/types/firebase-schema";

interface UseRegistrationSessionResult {
  session: RegistrationSession | null;
  /** true selagi menunggu data pertama kali dari Firebase */
  loading: boolean;
  /** pesan error kalau listener Firebase sendiri gagal (bukan error dari proses registrasi) */
  listenerError: string | null;
}

/**
 * sessionId WAJIB non-null -- caller (mis. RegistrationProgress) hanya
 * di-mount setelah sessionId didapat dari REST trigger. Kalau perlu
 * kondisional "belum ada sesi", handle itu di komponen parent dengan
 * tidak me-mount komponen yang pakai hook ini (lihat app/register/page.tsx).
 */
export function useRegistrationSession(sessionId: string): UseRegistrationSessionResult {
  const [session, setSession] = useState<RegistrationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [listenerError, setListenerError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirebaseDb();
    const sessionRef = ref(db, `registration_sessions/${sessionId}`);

    const unsubscribe = onValue(
      sessionRef,
      (snapshot) => {
        setSession(snapshot.val());
        setLoading(false);
      },
      (err) => {
        setListenerError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  return { session, loading, listenerError };
}
