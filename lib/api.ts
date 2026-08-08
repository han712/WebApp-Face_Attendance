/**
 * Client untuk jalur REST ke backend Python (FastAPI).
 *
 * Dipakai HANYA untuk: trigger aksi (mulai registrasi, kontrol pipeline)
 * dan query on-demand (status kamera, rekap laporan). BUKAN untuk data
 * realtime -- itu tugas lib/firebase.ts + listener.
 *
 * Base URL WAJIB dari env var FACE_RECOGNITION_API_URL
 * karena IP server backend di jaringan sekolah bisa berubah.
 */

import { retryWithBackoff } from "@/lib/retry";

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown) {
    // FastAPI validation errors (422) balikin detail sebagai array of
    // objects, bukan string -- handle keduanya supaya message tetap
    // manusiawi.
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
        ? detail.map((d: { msg?: string }) => d?.msg ?? JSON.stringify(d)).join("; ")
        : "Terjadi kesalahan pada server";
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function getBaseUrl(): string {
  const url = process.env.FACE_RECOGNITION_API_URL;
  if (!url) {
    throw new Error(
      "FACE_RECOGNITION_API_URL belum diset di .env.local. Contoh: http://192.168.1.50:8080"
    );
  }
  // Buang trailing slash supaya penggabungan path konsisten
  return url.replace(/\/+$/, "");
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail: unknown = res.statusText;
    try {
      const body = await res.json();
      detail = body?.detail ?? detail;
    } catch {
      // Response bukan JSON (jarang terjadi untuk endpoint FastAPI kita)
    }
    throw new ApiError(res.status, detail);
  }
  // Beberapa endpoint (mis. pipeline/enable) balikin body kecil,
  // tetap aman di-parse sebagai JSON karena semua respons non-file JSON.
  return res.json() as Promise<T>;
}

/**
 * GET biasa, query params opsional.
 * Retry otomatis (backoff) untuk kegagalan sementara -- network error atau
 * 5xx dari backend (mis. lagi restart). TIDAK retry untuk 4xx (validasi/
 * not-found dsb), karena mengulang request yang sama tidak akan mengubah
 * hasilnya.
 */
export async function apiGet<T>(
  path: string,
  params?: Record<string, string | undefined>
): Promise<T> {
  const url = new URL(getBaseUrl() + path);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, value);
    }
  }

  return retryWithBackoff(
    async () => {
      const res = await fetch(url.toString());
      return handleResponse<T>(res);
    },
    {
      // Retries dibuat ringan (2x, mulai 800ms) SENGAJA -- beberapa
      // pemanggil apiGet melakukan polling tiap beberapa detik (status
      // kamera, sesi liveness), jadi retry yang terlalu lama malah bikin
      // request menumpuk tumpang tindih dengan siklus polling berikutnya.
      // Untuk fetch sekali-jalan (laporan, aksi debug) 2x retry singkat
      // ini sudah cukup menutupi WiFi putus-nyambung sesaat.
      retries: 2,
      baseDelayMs: 800,
      maxDelayMs: 3000,
      shouldRetry: (err) => !(err instanceof ApiError) || err.status >= 500,
    }
  );
}

/** POST tanpa body (mis. /attendance/pipeline/enable) */
export async function apiPost<T>(path: string): Promise<T> {
  const res = await fetch(getBaseUrl() + path, { method: "POST" });
  return handleResponse<T>(res);
}

/** POST multipart/form-data (mis. /register/live-capture, /register/manual-upload) */
export async function apiPostForm<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(getBaseUrl() + path, {
    method: "POST",
    body: formData, // JANGAN set Content-Type manual -- browser yang set boundary multipart otomatis
  });
  return handleResponse<T>(res);
}

/**
 * DELETE (mis. /register/{nisn} -- hapus siswa + wajah di backend).
 * SENGAJA TIDAK auto-retry (sama seperti apiPost) -- ini aksi destruktif,
 * kalau request pertama sebenarnya sukses tapi responsnya gagal sampai,
 * retry otomatis bisa memicu 404 yang membingungkan alih-alih membantu.
 * Biarkan pemanggil (UI) yang tampilkan error dan minta user coba lagi
 * secara sadar.
 */
export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(getBaseUrl() + path, { method: "DELETE" });
  return handleResponse<T>(res);
}

/** Bangun URL absolut untuk endpoint download file / <img src> / <a href> langsung (tidak lewat fetch) */
export function apiFileUrl(path: string, params?: Record<string, string | undefined>): string {
  const url = new URL(getBaseUrl() + path);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, value);
    }
  }
  return url.toString();
}
