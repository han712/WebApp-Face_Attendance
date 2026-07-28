"use client";

/**
 * Listener + write untuk node BARU `classes/{class_id}` (webapp-only,
 * lihat catatan di types/firebase-schema.ts). Polanya mirip
 * useFirebaseSetting.ts (listen + tulis), tapi ini list bukan objek
 * tunggal, jadi ditulis terpisah supaya jelas.
 */
import { useCallback, useEffect, useState } from "react";
import { ref, onValue, set as firebaseSet, remove } from "firebase/database";
import { getFirebaseDb } from "@/lib/firebase";
import { isValidClassId } from "@/lib/validation";
import type { ClassesNode } from "@/types/firebase-schema";

interface UseClassesResult {
  classIds: string[];
  loading: boolean;
  error: string | null;
  /** Balikin pesan error (string) kalau gagal, null kalau sukses */
  addClass: (classId: string) => Promise<string | null>;
  deleteClass: (classId: string) => Promise<void>;
}

export function useClasses(): UseClassesResult {
  const [classIds, setClassIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirebaseDb();
    const classesRef = ref(db, "classes");
    const unsubscribe = onValue(
      classesRef,
      (snapshot) => {
        const data: ClassesNode | null = snapshot.val();
        const ids = data ? Object.keys(data) : [];
        ids.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        setClassIds(ids);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const addClass = useCallback(async (classId: string) => {
    const trimmed = classId.trim();
    if (!isValidClassId(trimmed)) {
      return 'Format kelas harus "tingkat-nomor", mis. 9-1, 9-9, 7-12.';
    }
    try {
      const db = getFirebaseDb();
      await firebaseSet(ref(db, `classes/${trimmed}`), { created_at: new Date().toISOString() });
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Gagal menambah kelas.";
    }
  }, []);

  const deleteClass = useCallback(async (classId: string) => {
    const db = getFirebaseDb();
    await remove(ref(db, `classes/${classId}`));
  }, []);

  return { classIds, loading, error, addClass, deleteClass };
}
