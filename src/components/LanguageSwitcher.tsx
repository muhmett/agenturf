"use client";

import { motion } from "framer-motion";
import { LANGS, LANG_ORDER } from "@/lib/i18n";
import type { Lang } from "@/types";
import { cn } from "@/lib/cn";

export function LanguageSwitcher({
  value,
  onChange,
}: {
  value: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <div className="relative inline-flex items-center gap-1 rounded-full border border-white/10 bg-ink-800/60 p-1 backdrop-blur">
      {LANG_ORDER.map((code) => {
        const active = value === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onChange(code)}
            className={cn(
              "relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "text-ink-950" : "text-white/60 hover:text-white",
            )}
            aria-pressed={active}
          >
            {active && (
              <motion.span
                layoutId="lang-pill"
                className="absolute inset-0 -z-10 rounded-full bg-gold-sheen bg-[length:200%_auto]"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span aria-hidden>{LANGS[code].flag}</span>
            <span>{LANGS[code].label}</span>
          </button>
        );
      })}
    </div>
  );
}
