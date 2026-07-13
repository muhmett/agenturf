"use client";

import { motion } from "framer-motion";
import { Coins, Crown, Play } from "lucide-react";
import type { CreditState, Lang } from "@/types";
import { tr } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export function CreditMeter({
  credits,
  lang,
  onWatchAd,
  onUpgrade,
}: {
  credits: CreditState;
  lang: Lang;
  onWatchAd: () => void;
  onUpgrade: () => void;
}) {
  if (credits.premium) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 text-sm font-medium text-gold-300">
        <Crown className="h-4 w-4" /> Premium
      </div>
    );
  }

  const out = credits.remaining <= 0;

  return (
    <div className="inline-flex items-center gap-2">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-ink-800/60 px-3 py-1.5 text-sm">
        <Coins className={cn("h-4 w-4", out ? "text-red-400" : "text-gold-400")} />
        <span className="text-white/60">{tr("creditsLeft", lang)}:</span>
        <span className={cn("font-semibold", out ? "text-red-400" : "text-white")}>
          {credits.remaining}/{credits.limit}
        </span>
      </div>

      {out && (
        <>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onWatchAd}
            className="inline-flex items-center gap-1.5 rounded-full border border-racing-500/40 bg-racing-500/15 px-3 py-1.5 text-sm font-medium text-racing-400 hover:bg-racing-500/25"
          >
            <Play className="h-3.5 w-3.5" /> {tr("watchAd", lang)}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onUpgrade}
            className="inline-flex items-center gap-1.5 rounded-full bg-gold-sheen bg-[length:200%_auto] px-3 py-1.5 text-sm font-semibold text-ink-950 hover:animate-sheen"
          >
            <Crown className="h-3.5 w-3.5" /> {tr("upgrade", lang)}
          </motion.button>
        </>
      )}
    </div>
  );
}
