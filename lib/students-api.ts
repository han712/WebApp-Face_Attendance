/**
 * Panggilan REST khusus manajemen siswa.
 *
 * PENTING (API_DOCUMENTATION_v3.md bagian 3): hapus siswa WAJIB lewat
 * endpoint ini (DELETE /register/{nisn}), JANGAN pernah hapus node
 * `students/{nisn}` langsung ke Firebase dari webapp -- kalau langsung
 * ke Firebase, node `faces/{nisn}` (embedding) jadi orphan di backend
 * dan siswa yang "sudah dihapus" tetap dikenali kamera sampai backend
 * di-restart. Endpoint ini yang urus reload index recognizer otomatis.
 */
import { apiDelete } from "@/lib/api";

export interface DeleteStudentResponse {
  deleted: true;
  nisn: string;
  students_remaining: number;
}

export async function deleteStudent(nisn: string): Promise<DeleteStudentResponse> {
  return apiDelete<DeleteStudentResponse>(`/register/${encodeURIComponent(nisn)}`);
}
