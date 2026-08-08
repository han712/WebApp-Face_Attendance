"use client";

/**
 * Pencarian siswa berdasarkan NAMA -- pengganti sistem token/link lama.
 *
 * CATATAN DESAIN (baca sebelum ubah):
 * - Ini murni CLIENT-SIDE: browser sign-in anonymous ke Firebase Auth,
 *   lalu baca LANGSUNG node `/students` (perlu Security Rules diubah
 *   supaya `.read` diizinkan untuk `auth != null`, lihat catatan di
 *   PANDUAN yang dikirim terpisah -- tidak ada perubahan rules yang
 *   dilakukan otomatis dari sini).
 * - KONSEKUENSI PRIVASI (disepakati bareng Han, bukan default diam-diam):
 *   siapapun yang tahu URL /parent bisa mengetik nama siswa manapun dan
 *   langsung lihat riwayat absensinya -- TIDAK ada verifikasi "ini benar
 *   orang tuanya". Ini beda dengan sistem token lama yang per-keluarga.
 * - Filter nama dilakukan di CLIENT setelah seluruh node /students
 *   ditarik satu kali (bukan query server-side) -- wajar untuk skala
 *   1 sekolah (~ratusan siswa), TIDAK direkomendasikan kalau skala jadi
 *   ribuan+ siswa lintas sekolah (pertimbangkan endpoint backend kalau
 *   itu terjadi).
 */
import { useCallback, useEffect, useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { ref, get } from "firebase/database";
import { getFirebaseAuth } from "@/lib/firebase-auth";
import { getFirebaseDb } from "@/lib/firebase";
import type { StudentsNode } from "@/types/firebase-schema";

export interface StudentSearchResult {
  nisn: string;
  name: string;
  class: string;
}

type SearchStatus = "idle" | "signing-in" | "ready" | "error";

interface UseStudentNameSearchResult {
  status: SearchStatus;
  errorMsg: string | null;
  search: (query: string) => StudentSearchResult[];
}

/**
 * Sign-in anonymous SEKALI saat hook pertama dipakai (bukan per-pencarian),
 * lalu simpan seluruh daftar siswa di memori supaya pencarian berikutnya
 * instan tanpa round-trip baru ke Firebase.
 */
export function useStudentNameSearch(): UseStudentNameSearchResult {
  const [status, setStatus] = useState<SearchStatus>("signing-in");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [allStudents, setAllStudents] = useState<StudentSearchResult[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const auth = getFirebaseAuth();
        await signInAnonymously(auth);

        const db = getFirebaseDb();
        const snapshot = await get(ref(db, "students"));
        const data: StudentsNode | null = snapshot.val();

        const list: StudentSearchResult[] = data
          ? Object.entries(data).map(([nisn, record]) => ({
              nisn,
              name: record.name,
              class: record.class,
            }))
          : [];

        if (!cancelled) {
          setAllStudents(list);
          setStatus("ready");
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : String(err));
          setStatus("error");
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const search = useCallback(
    (query: string): StudentSearchResult[] => {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      return allStudents
        .filter((s) => s.name.toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    [allStudents]
  );

  return { status, errorMsg, search };
}