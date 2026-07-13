"use client";

import { motion } from "framer-motion";
import { BarChart3, Flag, Dice5, Trophy, ShieldAlert } from "lucide-react";
import type { Analysis, Lang, RiskLevel } from "@/types";
import { LANGS, tr } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const RISK_META: Record<RiskLevel, { key: string; className: string }> = {
  safe: { key: "riskSafe", className: "bg-racing-500/15 text-racing-400 border-racing-500/30" },
  balanced: { key: "riskBalanced", className: "bg-gold-500/15 text-gold-400 border-gold-500/30" },
  risky: { key: "riskRisky", className: "bg-red-500/15 text-red-400 border-red-500/30" },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const card = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 26 } },
};

function Chip({ n }: { n: number }) {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-lg border border-gold-500/30 bg-ink-900 font-semibold text-gold-400">
      {n}
    </span>
  );
}

function Card({
  icon,
  title,
  children,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  accent?: "gold" | "racing";
}) {
  return (
    <motion.section
      variants={card}
      className={cn(
        "rounded-2xl border border-white/10 bg-ink-800/60 p-5 shadow-panel backdrop-blur",
        accent === "gold" && "border-gold-500/20",
        accent === "racing" && "border-racing-500/20",
      )}
    >
      <header className="mb-4 flex items-center gap-2.5">
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-xl",
            accent === "racing" ? "bg-racing-500/15 text-racing-400" : "bg-gold-500/15 text-gold-400",
          )}
        >
          {icon}
        </span>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </header>
      {children}
    </motion.section>
  );
}

export function AnalysisPanel({ analysis, lang }: { analysis: Analysis; lang: Lang }) {
  const dir = LANGS[lang].dir;
  const risk = RISK_META[analysis.finalPrognosis.risk];

  return (
    <motion.div
      dir={dir}
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 md:grid-cols-2"
    >
      {/* a) Digital Logic */}
      <Card icon={<BarChart3 className="h-5 w-5" />} title={analysis.digitalLogic.title}>
        <p className="mb-4 text-sm leading-relaxed text-white/70">{analysis.digitalLogic.summary}</p>
        <ul className="space-y-2">
          {analysis.digitalLogic.picks.map((p) => (
            <li key={p.number} className="flex items-center gap-3">
              <Chip n={p.number} />
              <div className="min-w-0">
                <span className="block truncate font-medium text-white">{p.name}</span>
                <span className="block truncate text-sm text-white/50">{p.note}</span>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* b) Race Conditions */}
      <Card icon={<Flag className="h-5 w-5" />} title={analysis.raceConditions.title} accent="racing">
        <p className="mb-4 text-sm leading-relaxed text-white/70">{analysis.raceConditions.summary}</p>
        <dl className="grid grid-cols-2 gap-2">
          {analysis.raceConditions.factors.map((f) => (
            <div key={f.label} className="rounded-lg border border-white/5 bg-ink-900/60 px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-white/40">{f.label}</dt>
              <dd className="font-medium text-white">{f.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {/* c) Coup de Poker */}
      <Card icon={<Dice5 className="h-5 w-5" />} title={analysis.coupDePoker.title}>
        <p className="mb-4 text-sm leading-relaxed text-white/70">{analysis.coupDePoker.summary}</p>
        <ul className="space-y-2">
          {analysis.coupDePoker.outsiders.map((o) => (
            <li
              key={o.number}
              className="flex items-center gap-3 rounded-lg border border-gold-500/20 bg-gold-500/5 p-2.5"
            >
              <Chip n={o.number} />
              <div className="min-w-0">
                <span className="block truncate font-medium text-gold-200">{o.name}</span>
                <span className="block truncate text-sm text-white/50">{o.reason}</span>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* d) Final Prognosis */}
      <Card icon={<Trophy className="h-5 w-5" />} title={analysis.finalPrognosis.title} accent="gold">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-white/50">Base</span>
          <span
            className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", risk.className)}
          >
            {tr(risk.key, lang)}
          </span>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {analysis.finalPrognosis.base.map((n) => (
            <Chip key={n} n={n} />
          ))}
        </div>
        <RankRow label="Top 5" nums={analysis.finalPrognosis.top5} />
        <RankRow label="Top 8" nums={analysis.finalPrognosis.top8} />
        <p className="mt-4 text-sm leading-relaxed text-white/70">
          {analysis.finalPrognosis.commentary}
        </p>
      </Card>

      {/* Disclaimer */}
      <div className="md:col-span-2">
        <p className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-ink-900/40 px-4 py-2.5 text-center text-xs text-white/40">
          <ShieldAlert className="h-4 w-4" />
          {analysis.disclaimer}
        </p>
      </div>
    </motion.div>
  );
}

function RankRow({ label, nums }: { label: string; nums: number[] }) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <span className="w-12 shrink-0 text-sm text-white/50">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {nums.map((n) => (
          <span
            key={n}
            className="grid h-7 w-7 place-items-center rounded-md bg-ink-900 text-sm font-medium text-white/80"
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
