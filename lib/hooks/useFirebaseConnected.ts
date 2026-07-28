"use client";

/**
 * Firebase Realtime Database punya node spesial bawaan `.info/connected`
 * -- SDK otomatis update nilainya (true/false) sesuai status koneksi
 * client ke server Firebase, tanpa perlu bikin heartbeat sendiri.
 * Ini cara paling akurat & murah untuk tahu "webapp masih tersambung
 * Firebase atau tidak" dibanding menebak dari error listener lain.
 */
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { getFirebaseDb } from "@/lib/firebase";

export function useFirebaseConnected(): boolean {
  const [connected, setConnected] = useState(true); // asumsikan sehat sampai terbukti tidak, supaya tidak flash banner saat awal render

  useEffect(() => {
    const db = getFirebaseDb();
    const connectedRef = ref(db, ".info/connected");
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      setConnected(snapshot.val() === true);
    });
    return () => unsubscribe();
  }, []);

  return connected;
}
