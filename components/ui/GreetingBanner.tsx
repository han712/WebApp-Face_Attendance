"use client";

import { motion } from "framer-motion";
import { getGreeting } from "@/lib/greeting";

export default function GreetingBanner() {
  const { text, emoji, dateLabel } = getGreeting();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-forest to-forest-dark px-6 py-5 text-white"
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-4 text-7xl opacity-20"
        animate={{ rotate: [0, 8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {emoji}
      </motion.span>
      <p className="text-xl font-bold">
        {text}! {emoji}
      </p>
      <p className="text-sm text-white/80">{dateLabel}</p>
    </motion.div>
  );
}
