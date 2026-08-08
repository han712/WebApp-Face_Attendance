"use client";

/**
 * Hook realtime untuk riwayat absen PULANG 1 siswa, dibaca dari
 * /attendance_pulang_by_student/{nisn} -- pola identik dengan
 * useStudentAttendance.ts (data datang), sengaja dipisah karena node
 * sumbernya juga terpisah (lihat catatan di types/firebase-schema.ts).
 */
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { getFirebaseDb } from "@/lib/firebase";
import { getTodayDateJakarta } from "@/lib/date";
import type { AttendanceCheckoutByStudentNode } from "@/types/firebase-schema";

interface UseStudentCheckoutResult {
  loading: boolean;
  errorMsg: string | null;
  history: AttendanceCheckoutByStudentNode;
  hasCheckedOutToday: boolean;
  todayTime: string | null;
}

export function useStudentCheckout(nisn: string | null): UseStudentCheckoutResult {
  const [fetchingNisn, setFetchingNisn] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<AttendanceCheckoutByStudentNode>({});

  useEffect(() => {
    if (!nisn) return;

    const db = getFirebaseDb();
    const historyRef = ref(db, `attendance_pulang_by_student/${nisn}`);

    const unsubscribe = onValue(
      historyRef,
      (snap) => {
        setHistory(snap.val() ?? {});
        setFetchingNisn(nisn);
        setErrorMsg(null);
      },
      (err) => {
        setErrorMsg(err.message);
        setFetchingNisn(nisn);
      }
    );

    return () => unsubscribe();
  }, [nisn]);

  const isLoading = Boolean(nisn) && fetchingNisn !== nisn;
  const activeHistory = nisn ? history : {};
  const activeError = nisn ? errorMsg : null;

  const today = getTodayDateJakarta();
  const todayEntry = activeHistory[today];

  return {
    loading: isLoading,
    errorMsg: activeError,
    history: activeHistory,
    hasCheckedOutToday: Boolean(todayEntry),
    todayTime: todayEntry ? todayEntry.time : null,
  };
}