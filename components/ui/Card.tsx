"use client";

/**
 * components/ui/* -- LAPISAN DESAIN MURNI.
 * Tidak ada satu pun file di folder ini yang boleh import dari lib/hooks
 * atau lib/api.ts/firebase.ts. Kalau butuh data, terima lewat props dari
 * pemanggil (components/rest atau components/realtime). Pemisahan ini
 * disengaja supaya desain bisa diubah total tanpa risiko menyentuh logic
 * server/data, dan sebaliknya.
 */
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  /** Sedikit angkat & bayangan lebih tegas saat hover -- untuk card yang interaktif */
  hoverable?: boolean;
}

export default function Card({ children, className = "", hoverable = false }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      whileHover={hoverable ? { y: -2, boxShadow: "0 8px 24px rgba(43,42,40,0.08)" } : undefined}
      className={`rounded-2xl border border-border bg-surface p-4 shadow-sm ${className}`}
    >
      {children}
    </motion.div>
  );
}
