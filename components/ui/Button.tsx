"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "destructive" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-forest text-white hover:bg-forest-dark",
  secondary: "bg-ink/5 text-ink hover:bg-ink/10",
  destructive: "bg-brick text-white hover:bg-[#b8493e]",
  ghost: "bg-transparent text-ink-muted hover:bg-ink/5",
};

interface Props extends Omit<HTMLMotionProps<"button">, "className"> {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

export default function Button({ variant = "primary", children, className = "", disabled, ...rest }: Props) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.97 }}
      disabled={disabled}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
