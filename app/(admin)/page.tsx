"use client";

import { Home } from "lucide-react";
import GreetingBanner from "@/components/ui/GreetingBanner";
import PageHeader from "@/components/ui/PageHeader";
import AttendanceFeed from "@/components/realtime/AttendanceFeed";
import CameraStatusIndicator from "@/components/rest/CameraStatusIndicator";
import DeviceStatusIndicator from "@/components/realtime/DeviceStatusIndicator";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-5 p-6 sm:p-8">
      <GreetingBanner />

      <PageHeader
        icon={Home}
        title="Dashboard Absensi"
        subtitle="Pantauan realtime absensi hari ini"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <CameraStatusIndicator />
            <DeviceStatusIndicator />
          </div>
        }
      />

      <AttendanceFeed />
    </main>
  );
}
