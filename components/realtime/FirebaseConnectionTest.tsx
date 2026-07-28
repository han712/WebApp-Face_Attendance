"use client";

/**
 * KOMPONEN SEMENTARA untuk verifikasi koneksi Firebase.
 * Tulis ke node `_connection_test` (bukan bagian dari skema resmi),
 * lalu listen balik nilainya. Kalau berhasil round-trip, SDK+config
 * sudah benar. HAPUS komponen ini setelah verifikasi sukses (lihat
 * app/page.tsx -- tinggal hapus import & pemakaiannya).
 */
import { useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { getFirebaseDb } from "@/lib/firebase";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function FirebaseConnectionTest() {
  const [status, setStatus] = useState<"idle" | "writing" | "connected" | "error">("idle");
  const [value, setValue] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    function start() {
      let db;
      try {
        db = getFirebaseDb();
      } catch (err) {
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : String(err));
        return;
      }

      const testRef = ref(db, "_connection_test");

      // 1. Listen dulu (jalur A style)
      unsubscribe = onValue(
        testRef,
        (snapshot) => {
          setValue(snapshot.val());
          setStatus("connected");
        },
        (err) => {
          setStatus("error");
          setErrorMsg(err.message);
        }
      );

      // 2. Tulis satu nilai tes (membuktikan permission write juga jalan)
      setStatus("writing");
      set(testRef, `webapp connected at ${new Date().toISOString()}`).catch((err) => {
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : String(err));
      });
    }

    start();

    return () => unsubscribe?.();
  }, []);

  return (
    <Card className="space-y-2">
      <h3 className="font-semibold">Tes Koneksi Firebase (Realtime DB)</h3>
      <Badge variant={status === "connected" ? "success" : status === "error" ? "danger" : "warning"}>
        {status}
      </Badge>
      {value && <p className="text-sm text-ink-muted">Nilai dari node _connection_test: {value}</p>}
      {errorMsg && <p className="text-sm text-brick">Error: {errorMsg}</p>}
    </Card>
  );
}
