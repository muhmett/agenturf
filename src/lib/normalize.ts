// ─────────────────────────────────────────────────────────────
// Query normalization for the universal search bar.
//
// Goal: take ANY input — French, Standard Arabic, Moroccan Darija, or a
// mix / transliteration — and reduce it to a comparable canonical form
// WITHOUT destroying protected technical terms or entity names.
// ─────────────────────────────────────────────────────────────

import { TERM_ALIASES } from "./glossary";

/** Strip Arabic diacritics (tashkeel) and tatweel. */
function stripArabicMarks(s: string): string {
  return s
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭ]/g, "")
    .replace(/ـ/g, "");
}

/** Fold common Arabic letter variants so search is forgiving. */
function foldArabic(s: string): string {
  return s
    .replace(/[آأإٱ]/g, "ا") // آ أ إ ٱ → ا
    .replace(/ة/g, "ه") // ة → ه
    .replace(/ى/g, "ي") // ى → ي
    .replace(/[ک]/g, "ك"); // ک → ك
}

/** Fold Latin accents (é, ç, à…) to ASCII. */
function foldLatin(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export interface NormalizedQuery {
  raw: string;
  normalized: string; // whitespace-collapsed, accent/diacritic folded, lowercased
  script: "arabic" | "latin" | "mixed";
  /** Canonical technical terms detected via the alias map. */
  detectedTerms: string[];
  tokens: string[];
}

const ARABIC_RE = /[؀-ۿ]/;
const LATIN_RE = /[A-Za-z]/;

export function normalizeQuery(raw: string): NormalizedQuery {
  const trimmed = raw.trim();

  const hasArabic = ARABIC_RE.test(trimmed);
  const hasLatin = LATIN_RE.test(trimmed);
  const script: NormalizedQuery["script"] =
    hasArabic && hasLatin ? "mixed" : hasArabic ? "arabic" : "latin";

  let n = trimmed;
  n = stripArabicMarks(n);
  n = foldArabic(n);
  n = foldLatin(n);
  n = n.toLowerCase();
  n = n.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

  // Detect protected/technical terms via alias table.
  const detected = new Set<string>();
  for (const [canonical, aliases] of Object.entries(TERM_ALIASES)) {
    const pool = [canonical, ...aliases].map((a) =>
      foldLatin(foldArabic(stripArabicMarks(a))).toLowerCase(),
    );
    if (pool.some((a) => n.includes(a))) detected.add(canonical);
  }

  return {
    raw: trimmed,
    normalized: n,
    script,
    detectedTerms: [...detected],
    tokens: n.split(" ").filter(Boolean),
  };
}

/**
 * Very small day-of-week resolver so queries like "كورس السبت" /
 * "course de samedi" can be mapped to an actual date downstream.
 */
export const WEEKDAY_ALIASES: Record<string, number> = {
  // 0 = Sunday
  dimanche: 0, "الاحد": 0, "لحد": 0,
  lundi: 1, "الاثنين": 1, "لتنين": 1,
  mardi: 2, "الثلاثاء": 2, "لتلات": 2,
  mercredi: 3, "الاربعاء": 3, "لاربع": 3,
  jeudi: 4, "الخميس": 4, "لخميس": 4,
  vendredi: 5, "الجمعة": 5, "لجمعه": 5,
  samedi: 6, "السبت": 6, "لسبت": 6,
};

export function resolveWeekday(tokens: string[]): number | null {
  for (const tk of tokens) {
    const folded = foldLatin(foldArabic(stripArabicMarks(tk))).toLowerCase();
    for (const [alias, dow] of Object.entries(WEEKDAY_ALIASES)) {
      const fa = foldLatin(foldArabic(stripArabicMarks(alias))).toLowerCase();
      if (folded === fa) return dow;
    }
  }
  return null;
}
