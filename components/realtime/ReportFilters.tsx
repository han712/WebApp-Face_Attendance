"use client";

/**
 * UI form filter laporan. Murni presentasional -- tidak fetch apa pun
 * sendiri, cuma kumpulkan input dan lempar ke parent lewat onSubmit.
 */
import { useState, type FormEvent } from "react";
import type { ReportQuery } from "@/types/report";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface Props {
  initial: ReportQuery;
  loading: boolean;
  onSubmit: (query: ReportQuery) => void;
}

export default function ReportFilters({ initial, loading, onSubmit }: Props) {
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [className, setClassName] = useState(initial.className ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ startDate, endDate, className: className.trim() || undefined });
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <label className="space-y-1">
          <span className="block text-xs text-ink-muted">Dari tanggal</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="field" />
        </label>

        <label className="space-y-1">
          <span className="block text-xs text-ink-muted">Sampai tanggal</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="field" />
        </label>

        <label className="space-y-1">
          <span className="block text-xs text-ink-muted">Kelas (opsional)</span>
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="Semua kelas"
            className="field"
          />
        </label>

        <Button type="submit" disabled={loading}>
          {loading ? "Memuat…" : "Tampilkan"}
        </Button>

        <style jsx>{`
          .field {
            border-radius: 0.5rem;
            border: 1px solid var(--color-border);
            background: var(--color-paper);
            padding: 0.375rem 0.5rem;
            font-size: 0.875rem;
            color: var(--color-ink);
          }
          .field:focus {
            outline: 2px solid var(--color-forest);
            outline-offset: 1px;
          }
        `}</style>
      </form>
    </Card>
  );
}
