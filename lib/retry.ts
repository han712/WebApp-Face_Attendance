/**
 * Retry generic dengan exponential backoff. Dipakai untuk operasi yang
 * gagal karena kondisi jaringan sementara (WiFi sekolah putus-nyambung),
 * BUKAN untuk menutupi error yang memang valid (mis. validasi 422 --
 * retry tidak akan membantu, cuma buang waktu & bikin UI kelihatan macet).
 */

export interface RetryOptions {
  /** Jumlah percobaan ULANG setelah percobaan pertama gagal (total percobaan = retries + 1) */
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Balikin true kalau error ini layak di-retry. Default: retry semua error. */
  shouldRetry?: (err: unknown) => boolean;
  /** Dipanggil tiap kali mau retry, berguna untuk UI ("mencoba lagi 2/3...") */
  onRetry?: (attempt: number, err: unknown) => void;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { retries = 3, baseDelayMs = 1000, maxDelayMs = 8000, shouldRetry, onRetry } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const eligible = shouldRetry ? shouldRetry(err) : true;
      if (!eligible || attempt === retries) {
        throw err;
      }
      onRetry?.(attempt + 1, err);
      const delay = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  // Tidak pernah sampai sini (loop selalu return atau throw), TypeScript butuh ini
  throw lastError;
}
