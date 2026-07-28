"use client";

/**
 * Banner global (dipasang di layout, tampil di semua halaman) yang
 * menunjukkan masalah koneksi -- Firebase dan/atau backend REST.
 * Sengaja TIDAK tampil apa pun kalau semua sehat, supaya tidak
 * mengganggu tampilan normal.
 */
import { useFirebaseConnected } from "@/lib/hooks/useFirebaseConnected";
import { useBackendHealth } from "@/lib/hooks/useBackendHealth";

export default function ConnectionStatusBanner() {
  const firebaseConnected = useFirebaseConnected();
  const backendReachable = useBackendHealth();

  if (firebaseConnected && backendReachable) {
    return null;
  }

  const problems: string[] = [];
  if (!firebaseConnected) problems.push("Firebase Realtime Database");
  if (!backendReachable) problems.push("Backend server (REST API)");

  return (
    <div className="bg-red-900/80 px-8 py-2 text-center text-sm text-red-100">
      Koneksi terputus ke: {problems.join(" & ")}. Mencoba menyambung ulang secara otomatis…
    </div>
  );
}
