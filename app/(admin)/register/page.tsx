"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import RegistrationForm, { type Mode } from "@/components/rest/RegistrationForm";
import RegistrationProgress from "@/components/realtime/RegistrationProgress";

export default function RegisterPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("live-capture");

  function handleStarted(newSessionId: string, newMode: Mode) {
    setSessionId(newSessionId);
    setMode(newMode);
  }

  return (
    <main className="mx-auto max-w-md space-y-5 p-6 sm:p-8">
      <PageHeader
        icon={UserPlus}
        title="Registrasi Siswa"
        subtitle="progres dilakukan secara realtime"
      />

      {sessionId ? (
        <RegistrationProgress sessionId={sessionId} mode={mode} onDone={() => setSessionId(null)} />
      ) : (
        <RegistrationForm onStarted={handleStarted} />
      )}
    </main>
  );
}