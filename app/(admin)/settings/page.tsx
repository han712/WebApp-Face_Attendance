"use client";

import { Settings as SettingsIcon } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import RecognitionSettingsForm from "@/components/realtime/RecognitionSettingsForm";
import AttendanceSettingsForm from "@/components/realtime/AttendanceSettingsForm";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-5 p-6 sm:p-8">
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        subtitle="Perubahan di sini langsung ditulis ke Firebase -- backend baca ulang tiap ~5 detik"
      />
      <div className="grid gap-4">
        <RecognitionSettingsForm />
        <AttendanceSettingsForm />
      </div>
    </main>
  );
}
