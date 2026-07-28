"use client";

/**
 * Notifikasi kecil (toast) tiap kali auto-recovery pipeline terpicu --
 * supaya siapa pun yang buka webapp tahu ada kejadian ini, bukan
 * berjalan diam-diam tanpa jejak.
 */
import { useEffect, useState } from "react";
import { usePipelineAutoRecovery, type RecoveryEvent } from "@/lib/hooks/usePipelineAutoRecovery";

export default function PipelineAutoRecoveryWatcher() {
  const event = usePipelineAutoRecovery();
  if (!event) return null;
  // `key` bikin komponen ini remount tiap ada event baru -- timer
  // auto-dismiss di dalamnya otomatis reset per kejadian.
  return <Toast key={event.timestamp} event={event} />;
}

function Toast({ event }: { event: RecoveryEvent }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border p-3 text-sm shadow-lg ${
        event.success
          ? "border-green-800 bg-green-950 text-green-200"
          : "border-red-800 bg-red-950 text-red-200"
      }`}
    >
      {event.message}
    </div>
  );
}
