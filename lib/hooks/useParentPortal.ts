"use client";

/**
 * Logic Parent Portal -- TIDAK ada form login. Alurnya:
 * 1. Sign-in anonymous ke Firebase (invisible, tanpa UI) supaya ada
 *    `auth.uid` yang bisa dicek Security Rules.
 * 2. Baca `parent_links/{token}` SEKALI (get, bukan listen) untuk
 *    validasi token & ambil nisn.
 * 3. Tulis (update atomik 2 path): `parent_links/{token}/uid` = uid, dan
 *    `parent_uid_index/{uid}` = token -- ini yang membuat Security Rules
 *    bisa mengizinkan baca `attendance_by_student/{nisn}` HANYA untuk
 *    uid yang sudah "membuktikan" tahu token ini (lihat draft rules).
 *    Ditulis ULANG tiap kunjungan (tidak dikunci ke device pertama) --
 *    lihat catatan trade-off di respons chat.
 * 4. Listen realtime `attendance_by_student/{nisn}` untuk status hari
 *    ini + riwayat/recap.
 */
import { useEffect, useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { ref, get, update, onValue } from "firebase/database";
import { getFirebaseAuth } from "@/lib/firebase-auth";
import { getFirebaseDb } from "@/lib/firebase";
import { getTodayDateJakarta } from "@/lib/date";
import type { AttendanceByStudentNode, ParentLink } from "@/types/firebase-schema";

type PortalStatus = "loading" | "invalid" | "ready" | "error";

interface UseParentPortalResult {
  status: PortalStatus;
  link: ParentLink | null;
  history: AttendanceByStudentNode; // { [date]: {status, time} }
  todayStatus: "Hadir" | "Terlambat" | "Belum Absen";
  errorMsg: string | null;
}

export function useParentPortal(token: string): UseParentPortalResult {
  const [status, setStatus] = useState<PortalStatus>("loading");
  const [link, setLink] = useState<ParentLink | null>(null);
  const [history, setHistory] = useState<AttendanceByStudentNode>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeHistory: (() => void) | undefined;
    let unsubscribeLink: (() => void) | undefined;
    let cancelled = false;

    async function bindAndListen() {
      try {
        const auth = getFirebaseAuth();
        const cred = await signInAnonymously(auth);
        const uid = cred.user.uid;

        const db = getFirebaseDb();
        const linkRef = ref(db, `parent_links/${token}`);
        const snapshot = await get(linkRef);

        if (!snapshot.exists()) {
          if (!cancelled) setStatus("invalid");
          return;
        }

        const linkData = snapshot.val() as ParentLink;

        // Update atomik 2 path sekaligus -- lihat penjelasan di komentar atas.
        await update(ref(db), {
          [`parent_links/${token}/uid`]: uid,
          [`parent_uid_index/${uid}`]: token,
        });

        if (cancelled) return;

        unsubscribeLink = onValue(linkRef, (snap) => {
          if (!cancelled) setLink(snap.val());
        });

        const historyRef = ref(db, `attendance_by_student/${linkData.nisn}`);
        unsubscribeHistory = onValue(
          historyRef,
          (snap) => {
            if (!cancelled) {
              setHistory(snap.val() ?? {});
              setStatus("ready");
            }
          },
          (err) => {
            if (!cancelled) {
              setErrorMsg(err.message);
              setStatus("error");
            }
          }
        );
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : String(err));
          setStatus("error");
        }
      }
    }

    bindAndListen();

    return () => {
      cancelled = true;
      unsubscribeHistory?.();
      unsubscribeLink?.();
    };
  }, [token]);

  const today = getTodayDateJakarta();
  const todayEntry = history[today];
  const todayStatus = todayEntry ? todayEntry.status : "Belum Absen";

  return { status, link, history, todayStatus, errorMsg };
}
