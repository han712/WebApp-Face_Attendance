"use client";

import Link from "next/link";
import { Users, UserPlus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import StudentsList from "@/components/realtime/StudentsList";
import ClassManager from "@/components/realtime/ClassManager";

export default function StudentsPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-5 p-6 sm:p-8">
      <PageHeader
        icon={Users}
        title="Kelola Siswa"
        subtitle="Daftar siswa terdaftar -- realtime dari Firebase"
        action={
          <Link href="/register">
            <Button className="flex items-center gap-1.5">
              <UserPlus size={16} /> Registrasi Siswa Baru
            </Button>
          </Link>
        }
      />
      <ClassManager />
      <StudentsList />
    </main>
  );
}
