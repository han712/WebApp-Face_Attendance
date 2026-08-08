"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { getFirebaseDb } from "@/lib/firebase";
import { getTodayDateJakarta } from "@/lib/date";
import type { AttendanceByStudentNode } from "@/types/firebase-schema";

type AttendanceStatusView = "Hadir" | "Terlambat" | "Belum Absen";

interface UseStudentAttendanceResult {
  loading: boolean;
  errorMsg: string | null;
  history: AttendanceByStudentNode;
  todayStatus: AttendanceStatusView;
}

export function useStudentAttendance(nisn: string | null): UseStudentAttendanceResult {
  // State untuk menyimpan NISN mana yang sedang diproses/di-fetch
  const [fetchingNisn, setFetchingNisn] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<AttendanceByStudentNode>({});

  useEffect(() => {
    if (!nisn) return;

    const db = getFirebaseDb();
    const historyRef = ref(db, `attendance_by_student/${nisn}`);

    // Panggilan listener Firebase bersifat asinkron
    const unsubscribe = onValue(
      historyRef,
      (snap) => {
        setHistory(snap.val() ?? {});
        setFetchingNisn(nisn); // Tandai bahwa data NISN ini sudah selesai dimuat
        setErrorMsg(null);
      },
      (err) => {
        setErrorMsg(err.message);
        setFetchingNisn(nisn); // Tetap tandai selesai meski error
      }
    );

    return () => unsubscribe();
  }, [nisn]);

  // DERIVED STATE:
  // Loading bernilai true jika NISN ada, TAPI belum cocok dengan fetchingNisn yang selesai dimuat
  const isLoading = Boolean(nisn) && fetchingNisn !== nisn;

  const activeHistory = nisn ? history : {};
  const activeError = nisn ? errorMsg : null;

  const today = getTodayDateJakarta();
  const todayEntry = activeHistory[today];
  const todayStatus: AttendanceStatusView = todayEntry ? todayEntry.status : "Belum Absen";

  return {
    loading: isLoading,
    errorMsg: activeError,
    history: activeHistory,
    todayStatus,
  };
}