"use client";

import { PlugZap } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import FirebaseConnectionTest from "@/components/realtime/FirebaseConnectionTest";
import ApiConnectionTest from "@/components/rest/ApiConnectionTest";

export default function TestConnectionPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-5 p-6 sm:p-8">
      <PageHeader
        icon={PlugZap}
        title="Diagnosa Koneksi"
        subtitle="Cek cepat kalau Dashboard tidak menampilkan data -- pastikan .env.local sudah benar"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FirebaseConnectionTest />
        <ApiConnectionTest />
      </div>
    </main>
  );
}
