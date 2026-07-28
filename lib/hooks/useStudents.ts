"use client";

/**
 * Listener ke `students/{nisn}` (Jalur A, realtime) -- daftar siswa
 * terdaftar. Pola sama persis dengan hook realtime lain di project ini
 * (useEffect + onValue + cleanup di return).
 */
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { getFirebaseDb } from "@/lib/firebase";
import type { StudentRecord, StudentsNode } from "@/types/firebase-schema";

interface UseStudentsResult {
  students: StudentRecord[];
  loading: boolean;
  error: string | null;
}

export function useStudents(): UseStudentsResult {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirebaseDb();
    const studentsRef = ref(db, "students");

    const unsubscribe = onValue(
      studentsRef,
      (snapshot) => {
        const data: StudentsNode | null = snapshot.val();
        const list = data ? Object.values(data) : [];
        list.sort((a, b) => a.name.localeCompare(b.name));
        setStudents(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { students, loading, error };
}
