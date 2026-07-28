"use client";

/**
 * Daftar siswa terdaftar -- listener realtime ke `students/{nisn}`
 * (lib/hooks/useStudents.ts). Search & filter kelas murni state lokal
 * UI (tidak butuh query server -- data sudah semuanya di-listen).
 *
 * Filter kelas diturunkan dari field string `class` yang sudah ada di
 * tiap siswa (BUKAN dari node/koleksi kelas terpisah -- itu sengaja
 * belum diimplementasikan, menunggu keputusan skema terpisah).
 */
import { useMemo, useState } from "react";
import { Search, UsersRound } from "lucide-react";
import { useStudents } from "@/lib/hooks/useStudents";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import DeleteStudentButton from "@/components/rest/DeleteStudentButton";

export default function StudentsList() {
  const { students, loading, error } = useStudents();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const classes = useMemo(
  () =>
    Array.from(
      new Set(
        students
          .map((s) => s.class)
          .filter((c): c is string => Boolean(c && c.trim()))
      )
    ).sort(),
  [students]
);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.nisn.includes(q);
      const matchesClass = !classFilter || s.class === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [students, search, classFilter]);

  if (error) {
    return (
      <Card>
        <p className="text-sm text-brick">Gagal memuat daftar siswa: {error}</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-0 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau NISN…"
            className="w-full rounded-lg border border-border bg-paper py-2 pl-9 pr-3 text-sm focus:outline-forest"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink"
        >
          <option value="">Semua kelas</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="text-xs text-ink-muted">{filtered.length} siswa</span>
      </div>

      {loading ? (
        <p className="px-5 py-6 text-sm text-ink-muted">Memuat daftar siswa…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title={students.length === 0 ? "Belum ada siswa terdaftar" : "Tidak ada hasil"}
          description={
            students.length === 0
              ? "Registrasi siswa baru lewat halaman Registrasi."
              : "Coba ubah kata kunci pencarian atau filter kelas."
          }
        />
      ) : (
        <div className="overflow-x-auto px-1 pb-1">
          <table className="w-full text-sm">
            <thead className="text-left text-ink-muted">
              <tr>
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">NISN</th>
                <th className="px-4 py-2">Kelas</th>
                <th className="px-4 py-2">Terdaftar</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.nisn}>
                  <td className="px-4 py-2">
                    {s.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- sumber gambar dinamis dari Firebase Storage
                      <img src={s.photo_url} alt={s.name} className="h-8 w-8 rounded-full object-cover bg-ink/5" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-ink/5" />
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium">{s.name}</td>
                  <td className="px-4 py-2 font-mono text-ink-muted">{s.nisn}</td>
                  <td className="px-4 py-2 text-ink-muted">{s.class}</td>
                  <td className="px-4 py-2 text-ink-muted">
                    {s.registered_at ? new Date(s.registered_at).toLocaleDateString("id-ID") : "-"}
                  </td>
                  <td className="px-4 py-2">
                    <DeleteStudentButton nisn={s.nisn} name={s.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
