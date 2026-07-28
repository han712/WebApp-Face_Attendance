import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Figtree, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/hooks/useAuth";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Absensi Wajah",
  description: "Dashboard absensi siswa berbasis face recognition",
};

/**
 * Root layout ini SENGAJA minimal (font, metadata, AuthProvider saja) --
 * TIDAK ada Sidebar/banner di sini. Alasan: root layout berlaku untuk
 * SEMUA route termasuk /login dan /parent/[token], yang keduanya TIDAK
 * boleh menampilkan shell admin (Sidebar, kontrol pipeline, dst).
 * Shell admin dipindah ke app/(admin)/layout.tsx, cuma berlaku untuk
 * route di dalam grup (admin).
 *
 * AuthProvider tetap dipasang di sini (bukan cuma di grup (admin))
 * supaya app/login bisa panggil useAuth().signIn() dari context yang
 * sama persis dengan yang dipakai AdminGuard di (admin)/layout.tsx.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${figtree.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper text-ink">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
