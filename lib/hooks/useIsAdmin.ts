"use client";

/**
 * Cek apakah uid yang sedang login ada di allowlist `admins/{uid}`.
 * Ini LAPISAN KEDUA setelah Firebase Auth berhasil login -- akun Auth
 * bisa saja valid (email/password benar) tapi belum di-approve jadi
 * admin (belum ditambahkan manual ke node ini lewat Firebase Console).
 * Security Rules yang jadi penegak sesungguhnya; ini cuma untuk UX
 * (pesan jelas ke user, bukan gagal diam-diam di tiap query data).
 */
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { getFirebaseDb } from "@/lib/firebase";

interface UseIsAdminResult {
  isAdmin: boolean;
  loading: boolean;
}

export function useIsAdmin(uid: string | null): UseIsAdminResult {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    function start(currentUid: string) {
      setLoading(true);
      const db = getFirebaseDb();
      const adminRef = ref(db, `admins/${currentUid}`);
      unsubscribe = onValue(
        adminRef,
        (snapshot) => {
          setIsAdmin(snapshot.val() === true);
          setLoading(false);
        },
        () => {
          // Kalau rule menolak baca (bukan admin), anggap saja bukan admin --
          // ini kondisi yang DIHARAPKAN untuk akun non-admin, bukan error.
          setIsAdmin(false);
          setLoading(false);
        }
      );
    }

    function resetToNotAdmin() {
      setIsAdmin(false);
      setLoading(false);
    }

    if (uid) {
      start(uid);
    } else {
      resetToNotAdmin();
    }

    return () => unsubscribe?.();
  }, [uid]);

  return { isAdmin, loading };
}
