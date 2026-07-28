"use client";

/**
 * Hook generic untuk node Firebase yang webapp BACA (listener, live-sync
 * kalau admin lain buka halaman sama) sekaligus TULIS (mis. halaman
 * Settings). Dipakai untuk settings/recognition & settings/attendance --
 * dua-duanya punya pola identik: listen + overwrite penuh saat save.
 *
 * Backend Python membaca ulang node ini dengan cache TTL pendek (~5
 * detik), jadi perubahan lewat `save()` di sini terasa di backend tanpa
 * restart -- tidak perlu koordinasi REST tambahan.
 */
import { useCallback, useEffect, useState } from "react";
import { ref, onValue, set as firebaseSet } from "firebase/database";
import { getFirebaseDb } from "@/lib/firebase";
import { retryWithBackoff } from "@/lib/retry";

interface UseFirebaseSettingResult<T> {
  value: T | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveError: string | null;
  save: (next: T) => Promise<void>;
}

export function useFirebaseSetting<T>(path: string): UseFirebaseSettingResult<T> {
  const [value, setValue] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirebaseDb();
    const settingRef = ref(db, path);
    const unsubscribe = onValue(
      settingRef,
      (snapshot) => {
        setValue(snapshot.val());
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [path]);

  const save = useCallback(
    async (next: T) => {
      setSaving(true);
      setSaveError(null);
      try {
        const db = getFirebaseDb();
        // Retry backoff: WiFi sekolah kadang putus-nyambung sesaat --
        // daripada langsung tampil error ke admin yang lagi ubah setting,
        // coba dulu beberapa kali sebelum benar-benar gagal.
        await retryWithBackoff(() => firebaseSet(ref(db, path), next), {
          retries: 3,
          baseDelayMs: 1000,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setSaveError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [path]
  );

  return { value, loading, error, saving, saveError, save };
}
