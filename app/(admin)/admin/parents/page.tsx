"use client";

import { UserRound } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ParentLinksManager from "@/components/realtime/ParentLinksManager";

export default function ParentPortalAdminPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-5 p-6 sm:p-8">
      <PageHeader
        icon={UserRound}
        title="Portal Orang Tua"
        subtitle="Buat link privat per siswa untuk dibagikan ke orang tua lewat WhatsApp -- tanpa perlu login"
      />
      <ParentLinksManager />
    </main>
  );
}
