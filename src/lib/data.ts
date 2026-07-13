// ─────────────────────────────────────────────────────────────
// Mock race data source + fuzzy matcher.
//
// In production this module would query Supabase / a turf data feed.
// The `matchRace` scorer is provider-agnostic: it works on the
// normalized query so it handles FR / Arabic / Darija / transliteration.
// ─────────────────────────────────────────────────────────────

import type { Race, SearchResult } from "@/types";
import { normalizeQuery, resolveWeekday, type NormalizedQuery } from "./normalize";

// Aliases let a single race be found by many spellings/scripts.
interface IndexedRace {
  race: Race;
  aliases: string[]; // free-form, will be normalized at match time
}

const RACES: IndexedRace[] = [
  {
    race: {
      id: "prix-amerique-2026",
      name: "Prix d'Amérique",
      track: "Vincennes",
      date: "2026-01-25",
      discipline: "trot",
      distance: 2700,
      startType: "volte",
      betType: "quinte+",
      runners: [
        { number: 1, name: "Idao de Tillard", jockey: "É. Raffin", trainer: "S. Guarato", music: "1a2a1a3a", draw: 1 },
        { number: 2, name: "Hooker Berry", jockey: "F. Nivard", trainer: "F. Souloy", music: "2a1a4a1a", draw: 3 },
        { number: 3, name: "Vivid Wise As", jockey: "A. Abrivard", trainer: "A. Gocciadoro", music: "1a1aDa2a", draw: 5 },
        { number: 4, name: "Bold Eagle", jockey: "T. Duvaldestin", trainer: "S. Guarato", music: "3a2a1a1a", draw: 2 },
        { number: 5, name: "Face Time Bourbon", jockey: "B. Goop", trainer: "S. Guarato", music: "1a1a1a2a", draw: 4 },
        { number: 6, name: "Davidson du Pont", jockey: "M. Abrivard", trainer: "J.-M. Bazire", music: "4a3a2a1a", draw: 6 },
        { number: 7, name: "Feliciano", jockey: "G. Gelormini", trainer: "P. Moiron", music: "2a4a3a2a", draw: 8 },
        { number: 8, name: "Gu d'Héripré", jockey: "Y. Lebourgeois", trainer: "S. Roger", music: "5a2a1aDa", draw: 7 },
      ],
    },
    aliases: ["prix damerique", "amerique", "بريك داميريك", "امريك", "vincennes trot"],
  },
  {
    race: {
      id: "grand-prix-hassan-ii-2026",
      name: "Grand Prix Hassan II",
      track: "Casablanca — Casa-Anfa",
      date: "2026-07-18", // a Saturday
      discipline: "galop",
      distance: 2000,
      startType: "stalles",
      betType: "quinte",
      runners: [
        { number: 1, name: "Tbourida Star", jockey: "A. Hafid", trainer: "M. Cherkaoui", music: "1p2p1p3p", draw: 4 },
        { number: 2, name: "Atlas Wind", jockey: "R. Fatih", trainer: "H. Bennani", music: "2p1p1p2p", draw: 1 },
        { number: 3, name: "Sahara Gold", jockey: "K. Idrissi", trainer: "M. Cherkaoui", music: "3p1p2p1p", draw: 6 },
        { number: 4, name: "Marrakech Express", jockey: "O. Ziani", trainer: "S. Alaoui", music: "1p1p4p2p", draw: 2 },
        { number: 5, name: "Zellige", jockey: "N. Berrada", trainer: "H. Bennani", music: "4p3p2p1p", draw: 8 },
        { number: 6, name: "Chergui", jockey: "A. Tazi", trainer: "F. Kabbaj", music: "2p2p1p5p", draw: 3 },
        { number: 7, name: "Argan Prince", jockey: "M. Saidi", trainer: "S. Alaoui", music: "5p1p2p2p", draw: 7 },
        { number: 8, name: "Ourika Flyer", jockey: "Y. Amrani", trainer: "F. Kabbaj", music: "1p3p1p1p", draw: 5 },
      ],
    },
    aliases: ["grand prix hassan", "hassan ii", "الحسن الثاني", "كورس السبت", "casablanca galop", "anfa"],
  },
];

export function getRaceById(id: string): Race | null {
  return RACES.find((r) => r.race.id === id)?.race ?? null;
}

export function allRaces(): Race[] {
  return RACES.map((r) => r.race);
}

function scoreRace(nq: NormalizedQuery, ir: IndexedRace): { score: number; matchedOn: string[] } {
  const matchedOn: string[] = [];
  let score = 0;

  const haystacks = [
    nqNormalize(ir.race.name),
    nqNormalize(ir.race.track),
    ...ir.aliases.map(nqNormalize),
  ];

  // Token overlap
  for (const token of nq.tokens) {
    if (token.length < 2) continue;
    if (haystacks.some((h) => h.includes(token))) {
      score += 2;
      matchedOn.push(token);
    }
  }

  // Detected technical terms bias toward races of that bet type/discipline.
  for (const term of nq.detectedTerms) {
    const t = term.toLowerCase();
    if (ir.race.betType.includes(t) || ir.race.discipline === t) {
      score += 1;
      matchedOn.push(term);
    }
  }

  // Weekday resolution ("كورس السبت" / "course de samedi").
  const dow = resolveWeekday(nq.tokens);
  if (dow != null) {
    const raceDow = new Date(ir.race.date).getUTCDay();
    if (raceDow === dow) {
      score += 3;
      matchedOn.push(`weekday:${dow}`);
    }
  }

  return { score, matchedOn };
}

function nqNormalize(s: string): string {
  return normalizeQuery(s).normalized;
}

/** Return best matches, ranked, with a confidence in 0..1. */
export function matchRace(rawQuery: string): SearchResult[] {
  const nq = normalizeQuery(rawQuery);
  const scored = RACES.map((ir) => {
    const { score, matchedOn } = scoreRace(nq, ir);
    return { race: ir.race, score, matchedOn };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const max = scored[0]?.score ?? 1;
  return scored.map((s) => ({
    race: s.race,
    confidence: Math.min(1, s.score / Math.max(max, 4)),
    matchedOn: s.matchedOn,
  }));
}
