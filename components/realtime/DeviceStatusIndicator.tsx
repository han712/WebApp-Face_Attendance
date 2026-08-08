"use client";

/**
 * Indikator online/offline device ESP32.
 * Listener ke `devices/{device_id}/status` -- node ini DITULIS OLEH
 * ESP32 SENDIRI (heartbeat), backend Python & webapp cuma membaca.
 *
 * device_id diambil dari env var NEXT_PUBLIC_ESP32_DEVICE_ID karena
 * skema tidak fix satu ID -- sesuaikan dengan device_id yang dipakai
 * firmware Anda saat menulis heartbeat (per API_DOCUMENTATION_v3.md,
 * device_id yang dipakai backend adalah "esp32_main").
 *
 * CATATAN (API_DOCUMENTATION_v3.md 4.2): backend REST /device/status
 * punya field turunan `online_computed`/`heartbeat_stale` yang SAAT INI
 * BUGGY (parsing epoch-ms firmware sebagai ISO string, selalu salah).
 * Komponen ini TIDAK terpengaruh bug itu -- kita listen node Firebase
 * mentah (`online` + `last_heartbeat`) langsung dan hitung staleness
 * sendiri di sini, bukan pakai field computed dari REST. Tetap begini
 * sampai bug backend itu diperbaiki & dikonfirmasi.
 */
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { getFirebaseDb } from "@/lib/firebase";
import type { DeviceStatus } from "@/types/firebase-schema";
import Badge from "@/components/ui/Badge";

// Heartbeat firmware biasanya tiap beberapa detik -- kalau tidak ada
// update lebih dari ini, anggap "stale" walau field `online` masih true
// (mis. ESP32 mati mendadak tanpa sempat menulis online: false).
const STALE_THRESHOLD_MS = 30_000;

export default function DeviceStatusIndicator() {
  const deviceId = process.env.NEXT_PUBLIC_ESP32_DEVICE_ID;
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Tick tiap 5 detik supaya deteksi "stale" ter-update walau tidak
    // ada perubahan data baru dari Firebase.
    const tick = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    const db = getFirebaseDb();
    const statusRef = ref(db, `devices/${deviceId}/status`);
    const unsubscribe = onValue(statusRef, (snapshot) => {
      setStatus(snapshot.val());
      setLoaded(true);
    });
    return () => unsubscribe();
  }, [deviceId]);

  if (!deviceId) {
    return <Badge variant="warning">NEXT_PUBLIC_ESP32_DEVICE_ID belum diset</Badge>;
  }

  if (!loaded) {
    return <Badge variant="neutral">Memuat status device…</Badge>;
  }

  if (!status) {
    return <Badge variant="danger">Device &quot;{deviceId}&quot; belum pernah heartbeat</Badge>;
  }

  const lastHeartbeatMs = new Date(status.last_heartbeat).getTime();
  const isStale = Number.isFinite(lastHeartbeatMs) && now - lastHeartbeatMs > STALE_THRESHOLD_MS;

  if (status.online && !isStale) {
    return <Badge variant="success" pulse>ESP32 online</Badge>;
  }

  return <Badge variant="danger">{isStale ? "ESP32 offline" : "ESP32 offline"}</Badge>;
}
