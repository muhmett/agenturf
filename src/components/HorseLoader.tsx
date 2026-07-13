"use client";

// Custom loading animation for the "analyzing" state.
// Combines a galloping horse glyph with a pulsing radar sweep.
import { motion } from "framer-motion";

export function HorseLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-14">
      <div className="relative h-28 w-28">
        {/* Pulsing radar rings */}
        {[0, 0.5, 1].map((delay) => (
          <motion.span
            key={delay}
            className="absolute inset-0 rounded-full border border-gold-500/40"
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay }}
          />
        ))}
        {/* Galloping horse */}
        <motion.div
          className="absolute inset-0 grid place-items-center text-5xl"
          animate={{ y: [0, -4, 0], rotate: [0, -3, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          🐎
        </motion.div>
      </div>
      <motion.p
        className="bg-gold-sheen bg-[length:200%_auto] bg-clip-text text-sm font-medium tracking-wide text-transparent"
        animate={{ backgroundPosition: ["200% center", "-200% center"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        {label ?? "Chibani AI is reading the race…"}
      </motion.p>
    </div>
  );
}
