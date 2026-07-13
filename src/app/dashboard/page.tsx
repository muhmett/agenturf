"use client";

// ─────────────────────────────────────────────────────────────
// /dashboard — the main application surface.
//
// Owns: search state, selected race, language, credit state, and the
// analyze flow. Composes the universal SearchBar, LanguageSwitcher,
// CreditMeter, Ad placeholders, the running-horse loader, and the
// 4-method AnalysisPanel. Fully responsive + RTL-aware.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, History, Sparkles, AlertCircle } from "lucide-react";

import { SearchBar } from "@/components/SearchBar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CreditMeter } from "@/components/CreditMeter";
import { HorseLoader } from "@/components/HorseLoader";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { AdSlot } from "@/components/AdSlot";

import { LANGS, tr } from "@/lib/i18n";
import type { Analysis, CreditState, Lang, Race, SearchResult } from "@/types";

// A stable per-device id so the credit system tracks anonymous users.
function useDeviceId(): string {
  const [id, setId] = useState("anon");
  useEffect(() => {
    let v = localStorage.getItem("chibani-device-id");
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem("chibani-device-id", v);
    }
    setId(v);
  }, []);
  return id;
}

export default function DashboardPage() {
  const deviceId = useDeviceId();
  const [lang, setLang] = useState<Lang>("dar");
  const [race, setRace] = useState<Race | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<CreditState | null>(null);
  const [favorites, setFavorites] = useState<Race[]>([]);

  const dir = LANGS[lang].dir;

  // Load credit state once we have a device id.
  useEffect(() => {
    if (deviceId === "anon") return;
    fetch("/api/credits", { headers: { "x-user-id": deviceId } })
      .then((r) => r.json())
      .then((d) => setCredits(d.credits))
      .catch(() => {});
  }, [deviceId]);

  // Persist favorites locally (would sync to Supabase when authenticated).
  useEffect(() => {
    const raw = localStorage.getItem("chibani-favorites");
    if (raw) setFavorites(JSON.parse(raw));
  }, []);
  const toggleFavorite = (r: Race) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === r.id);
      const next = exists ? prev.filter((f) => f.id !== r.id) : [...prev, r];
      localStorage.setItem("chibani-favorites", JSON.stringify(next));
      return next;
    });
  };

  const runAnalysis = useCallback(
    async (target: Race, language: Lang) => {
      setStatus("analyzing");
      setError(null);
      setAnalysis(null);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "content-type": "application/json", "x-user-id": deviceId },
          body: JSON.stringify({ raceId: target.id, lang: language }),
        });
        const data = await res.json();

        if (res.status === 402) {
          setCredits(data.credits);
          setError(tr("noCredits", language));
          setStatus("error");
          return;
        }
        if (!res.ok) throw new Error(data.error ?? "Analysis failed");

        setAnalysis(data.analysis);
        if (data.credits) setCredits(data.credits);
        setStatus("idle");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
        setStatus("error");
      }
    },
    [deviceId],
  );

  const onSelect = (r: SearchResult) => {
    setRace(r.race);
    setAnalysis(null);
    setStatus("idle");
    runAnalysis(r.race, lang);
  };

  // Re-run analysis in the new language when the switcher changes.
  const onLangChange = (l: Lang) => {
    setLang(l);
    if (race) runAnalysis(race, l);
  };

  const watchAd = async () => {
    // In production: mount a rewarded ad unit; on completed view, POST reward.
    await fetch("/api/credits", {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": deviceId },
      body: JSON.stringify({ reward: true }),
    })
      .then((r) => r.json())
      .then((d) => setCredits(d.credits))
      .catch(() => {});
  };

  const upgrade = () => {
    // Route to a checkout / paywall in production.
    window.location.href = "/pricing";
  };

  const isFav = race ? favorites.some((f) => f.id === race.id) : false;

  return (
    <div dir={dir} className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-24 pt-6 md:px-6">
      {/* ── Header ── */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-sheen bg-[length:200%_auto] text-lg">
            🐎
          </span>
          <div>
            <h1 className="text-xl font-bold leading-none text-sheen">Chibani AI</h1>
            <p className="mt-1 text-xs text-white/40">{tr("appTagline", lang)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {credits && (
            <CreditMeter credits={credits} lang={lang} onWatchAd={watchAd} onUpgrade={upgrade} />
          )}
          <LanguageSwitcher value={lang} onChange={onLangChange} />
        </div>
      </header>

      {/* ── Top ad ── */}
      <div className="mt-6">
        <AdSlot placement="top" />
      </div>

      {/* ── Search ── */}
      <section className="mt-6">
        <SearchBar lang={lang} onSelect={onSelect} />
        {favorites.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-white/40">
              <Star className="h-3.5 w-3.5" /> {tr("favorites", lang)}:
            </span>
            {favorites.map((f) => (
              <button
                key={f.id}
                onClick={() => onSelect({ race: f, confidence: 1, matchedOn: [] })}
                className="rounded-full border border-white/10 bg-ink-800/60 px-3 py-1 text-xs text-white/70 hover:border-gold-500/40 hover:text-white"
              >
                {f.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Selected race header ── */}
      <AnimatePresence>
        {race && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-ink-800/50 p-4"
          >
            <div>
              <h2 className="text-lg font-semibold text-white">{race.name}</h2>
              <p className="text-sm text-white/40">
                {race.track} · {race.betType} · {race.distance}m · {race.startType}
              </p>
            </div>
            <button
              onClick={() => toggleFavorite(race)}
              aria-label="toggle favorite"
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 hover:border-gold-500/40"
            >
              <Star
                className={isFav ? "h-5 w-5 fill-gold-400 text-gold-400" : "h-5 w-5 text-white/40"}
              />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Analysis area ── */}
      <section className="mt-6">
        <AnimatePresence mode="wait">
          {status === "analyzing" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HorseLoader label={tr("analyzing", lang)} />
            </motion.div>
          )}

          {status === "error" && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300"
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {status === "idle" && analysis && (
            <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AnalysisPanel analysis={analysis} lang={lang} />
              {/* ── Mid-analysis ad ── */}
              <div className="my-6">
                <AdSlot placement="mid" />
              </div>
            </motion.div>
          )}

          {status === "idle" && !analysis && !race && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid place-items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-ink-800/30 py-16 text-center"
            >
              <Sparkles className="h-8 w-8 text-gold-400/60" />
              <p className="max-w-sm text-sm text-white/40">{tr("searchPlaceholder", lang)}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Bottom ad ── */}
      <div className="mt-10">
        <AdSlot placement="bottom" />
      </div>

      <footer className="mt-8 flex items-center justify-center gap-4 text-xs text-white/30">
        <span className="inline-flex items-center gap-1">
          <History className="h-3.5 w-3.5" /> {tr("history", lang)}
        </span>
        <span>·</span>
        <span>Play responsibly · +18</span>
      </footer>
    </div>
  );
}
