"use client";

import type { ReactNode } from "react";

type Variant = "success" | "warning" | "danger" | "info" | "neutral";

const VARIANT_CLASSES: Record<Variant, string> = {
  success: "bg-forest/10 text-forest-dark",
  warning: "bg-marigold/20 text-[#8a5a1c]",
  danger: "bg-brick/10 text-brick",
  info: "bg-sky/10 text-sky",
  neutral: "bg-ink/5 text-ink-muted",
};

const DOT_CLASSES: Record<Variant, string> = {
  success: "bg-forest",
  warning: "bg-marigold",
  danger: "bg-brick",
  info: "bg-sky",
  neutral: "bg-ink-muted",
};

interface Props {
  variant?: Variant;
  children: ReactNode;
  /** Titik kecil berdenyut -- dipakai untuk status "live"/realtime */
  pulse?: boolean;
  className?: string;
}

export default function Badge({ variant = "neutral", children, pulse = false, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${VARIANT_CLASSES[variant]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[variant]} ${pulse ? "animate-pulse" : ""}`} />
      {children}
    </span>
  );
}
