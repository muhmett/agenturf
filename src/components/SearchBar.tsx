"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Sparkles } from "lucide-react";
import type { Lang, SearchResult } from "@/types";
import { LANGS, tr } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export function SearchBar({
  lang,
  onSelect,
}: {
  lang: Lang;
  onSelect: (r: SearchResult) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>();
  const dir = LANGS[lang].dir;

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ q }),
        });
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(debounce.current);
  }, [q]);

  return (
    <div className="relative w-full" dir={dir}>
      <div
        className={cn(
          "group flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-800/70 px-4 py-3.5",
          "shadow-panel backdrop-blur transition-all focus-within:border-gold-500/50 focus-within:shadow-gold",
        )}
      >
        <Search className="h-5 w-5 shrink-0 text-gold-400/80" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={tr("searchPlaceholder", lang)}
          className="w-full bg-transparent text-base text-white placeholder:text-white/30 focus:outline-none"
          aria-label="search"
        />
        {loading ? (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-gold-400" />
        ) : (
          <Sparkles className="h-5 w-5 shrink-0 text-white/20 transition-colors group-focus-within:text-gold-400" />
        )}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-ink-800/95 shadow-panel backdrop-blur-xl"
          >
            {results.map((r) => (
              <li key={r.race.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(r);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-start transition-colors hover:bg-white/5"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-white">{r.race.name}</span>
                    <span className="block truncate text-sm text-white/40">
                      {r.race.track} · {r.race.betType} · {r.race.distance}m
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-racing-500/15 px-2 py-0.5 text-xs font-medium text-racing-400">
                    {Math.round(r.confidence * 100)}%
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
