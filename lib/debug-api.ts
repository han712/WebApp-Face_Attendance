/**
 * Panggilan REST untuk endpoint /debug/* dan kontrol pipeline
 * (/attendance/pipeline/*, /device/*). Endpoint-endpoint ini BELUM ada
 * rate-limiting/autentikasi di backend -- halaman yang memakai modul ini
 * ("/admin") TIDAK boleh dipasang di jaringan publik, cuma untuk
 * jaringan lokal sekolah (sesuai catatan di API_DOCUMENTATION.md 3.6).
 *
 * Banyak endpoint /debug/* tidak didokumentasikan bentuk JSON persisnya
 * (dokumen cuma bilang "cek konektivitas", dll) -- untuk itu tipe
 * responsnya `unknown` dan ditampilkan sebagai raw JSON di UI, bukan
 * di-parse ke field spesifik yang bisa salah tebak.
 */
import { apiGet, apiPost } from "@/lib/api";

// -- Pipeline recognition (routes/attendance.py) --
export interface PipelineStatus {
  enabled: boolean;
  thread_alive: boolean;
}
export const getPipelineStatus = () => apiGet<PipelineStatus>("/attendance/pipeline/status");
export const enablePipeline = () => apiPost<{ enabled: true }>("/attendance/pipeline/enable");
export const disablePipeline = () => apiPost<{ enabled: false }>("/attendance/pipeline/disable");

export interface LivenessSession {
  elapsed: number;
  frames: number;
}
export const getActiveLivenessSessions = () =>
  apiGet<Record<string, LivenessSession>>("/attendance/liveness/active-sessions");

// -- Device (routes/device.py) --
export const getDeviceStatus = () => apiGet<unknown>("/device/status");
export const startDevicePipeline = () => apiPost<{ status: "started" }>("/device/pipeline/start");
export const stopDevicePipeline = () => apiPost<{ status: "stopped" }>("/device/pipeline/stop");

// -- Debug (routes/debug.py) --
export const checkFirebaseConnection = () => apiGet<unknown>("/debug/firebase/check");
export const testCameraConnection = () => apiGet<unknown>("/debug/camera/test-connection");
export const analyzeCurrentFrame = () => apiGet<unknown>("/debug/recognition/analyze");
export const getRecognitionIndexInfo = () => apiGet<unknown>("/debug/recognition/index-info");
export const getAttendanceAccuracyStats = () => apiGet<unknown>("/debug/attendance/accuracy");

/** Cuma jalan kalau backend di-start dengan DEBUG=true */
export const triggerTestAttendance = () => apiPost<unknown>("/debug/attendance/test-trigger");
