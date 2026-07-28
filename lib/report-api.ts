/**
 * Panggilan REST khusus fitur laporan. Terpisah dari lib/api.ts (generic
 * client) supaya bentuk query param terpusat di satu tempat.
 */
import { apiGet, apiFileUrl } from "@/lib/api";
import type { RecapResponse } from "@/types/report";

export interface ReportQuery {
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  className?: string; // opsional, kosong = semua kelas
}

function toParams(query: ReportQuery): Record<string, string | undefined> {
  return {
    start_date: query.startDate,
    end_date: query.endDate,
    class: query.className || undefined,
  };
}

export async function fetchRecap(query: ReportQuery): Promise<RecapResponse> {
  return apiGet<RecapResponse>("/report/recap", toParams(query));
}

/** URL absolut untuk dipakai langsung di <a href> -- browser yang handle download */
export function recapExcelUrl(query: ReportQuery): string {
  return apiFileUrl("/report/recap/excel", toParams(query));
}

/** URL absolut untuk dipakai langsung di <a href> -- browser yang handle download */
export function recapPdfUrl(query: ReportQuery): string {
  return apiFileUrl("/report/recap/pdf", toParams(query));
}
