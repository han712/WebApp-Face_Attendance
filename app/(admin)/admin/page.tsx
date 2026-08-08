"use client";

import { Wrench } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DirectCameraPreview from "@/components/rest/DirectCameraPreview";
import LivenessSessionsPanel from "@/components/rest/LivenessSessionsPanel";
import DebugActionPanel from "@/components/rest/DebugActionPanel";
import {
  getPipelineStatus,
  enablePipeline,
  disablePipeline,
  getDeviceStatus,
  startDevicePipeline,
  stopDevicePipeline,
  checkFirebaseConnection,
  testCameraConnection,
  analyzeCurrentFrame,
  getRecognitionIndexInfo,
  getAttendanceAccuracyStats,
  triggerTestAttendance,
} from "@/lib/debug-api";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6 sm:p-8">
      <PageHeader
        icon={Wrench}
        title="Admin & Testing"
        subtitle="Endpoint /debug/* belum ada autentikasi -- jangan expose ke internet publik, cukup jaringan lokal sekolah."
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Live Camera Preview</h2>
        <DirectCameraPreview />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Kontrol Pipeline &amp; Device</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <DebugActionPanel title="Status Pipeline Recognition" run={getPipelineStatus} buttonLabel="Cek status" />
          <DebugActionPanel title="Aktifkan Pipeline" run={enablePipeline} />
          <DebugActionPanel title="Matikan Pipeline (maintenance)" run={disablePipeline} destructive />
          <DebugActionPanel title="Status Device (backend + ESP32)" run={getDeviceStatus} buttonLabel="Cek status" />
          <DebugActionPanel title="Mulai Thread Kamera+Recognition" run={startDevicePipeline} />
          <DebugActionPanel title="Hentikan Thread Kamera+Recognition" run={stopDevicePipeline} destructive />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Testing Registrasi &amp; Absensi</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <LivenessSessionsPanel />
          <DebugActionPanel
            title="Trigger Absen Manual (testing)"
            description="Perlu backend jalan dengan DEBUG=true."
            run={triggerTestAttendance}
            buttonLabel="Trigger"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Diagnosa Recognition &amp; Koneksi</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <DebugActionPanel title="Cek Koneksi Firebase" run={checkFirebaseConnection} buttonLabel="Cek" />
          <DebugActionPanel title="Diagnosa Koneksi Kamera HP" run={testCameraConnection} buttonLabel="Cek" />
          <DebugActionPanel
            title="Analisis 1 Frame"
            description="bbox, det_score, similarity dari frame terkini."
            run={analyzeCurrentFrame}
            buttonLabel="Analisis"
          />
          <DebugActionPanel title="Info Index Recognizer" run={getRecognitionIndexInfo} buttonLabel="Cek" />
          <DebugActionPanel
            title="Statistik Akurasi Absensi"
            description="Confidence score historis dari data absen riil."
            run={getAttendanceAccuracyStats}
            buttonLabel="Cek"
          />
        </div>
      </section>
    </main>
  );
}