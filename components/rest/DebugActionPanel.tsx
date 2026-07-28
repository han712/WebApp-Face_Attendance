"use client";

/**
 * Panel generic: tombol "Jalankan" -> panggil satu fungsi REST -> tampil
 * hasil sebagai raw JSON. (Logic TIDAK berubah -- hanya tampilan.)
 */
import { useState } from "react";
import { ApiError } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface Props {
  title: string;
  description?: string;
  run: () => Promise<unknown>;
  buttonLabel?: string;
  destructive?: boolean;
}

export default function DebugActionPanel({
  title,
  description,
  run,
  buttonLabel = "Jalankan",
  destructive = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await run();
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? `HTTP ${err.status}: ${err.message}` : "Gagal menghubungi backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-2">
      <div>
        <h3 className="font-medium">{title}</h3>
        {description && <p className="text-xs text-ink-muted">{description}</p>}
      </div>

      <Button variant={destructive ? "destructive" : "primary"} onClick={handleClick} disabled={loading}>
        {loading ? "Memproses…" : buttonLabel}
      </Button>

      {error && <p className="text-sm text-brick">{error}</p>}
      {result !== null && (
        <pre className="max-h-64 overflow-auto rounded-lg bg-ink/5 p-2 font-mono text-xs text-ink">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </Card>
  );
}
