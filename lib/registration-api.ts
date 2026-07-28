/**
 * Panggilan REST khusus fitur registrasi. Terpisah dari lib/api.ts
 * (generic client) supaya bentuk request tiap endpoint (multipart field
 * apa saja) terpusat di satu tempat, tidak tersebar di komponen UI.
 */
import { apiPostForm } from "@/lib/api";
import type { RegistrationInput } from "@/lib/validation";

export interface RegisterStartedResponse {
  session_id: string;
  status: "started";
}

export async function startLiveCapture(
  input: RegistrationInput
): Promise<RegisterStartedResponse> {
  const form = new FormData();
  form.set("nisn", input.nisn);
  form.set("name", input.name);
  form.set("class", input.className);
  return apiPostForm<RegisterStartedResponse>("/register/live-capture", form);
}

export async function startManualUpload(
  input: RegistrationInput,
  files: File[]
): Promise<RegisterStartedResponse> {
  const form = new FormData();
  form.set("nisn", input.nisn);
  form.set("name", input.name);
  form.set("class", input.className);
  for (const file of files) {
    form.append("files", file);
  }
  return apiPostForm<RegisterStartedResponse>("/register/manual-upload", form);
}
