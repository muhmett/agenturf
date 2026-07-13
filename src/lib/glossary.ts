// ─────────────────────────────────────────────────────────────
// Glossary protection.
//
// Two responsibilities:
//   1. PROTECTED_TERMS  — technical vocabulary that must NEVER be
//      translated or altered by the LLM (Quinté, Tiercé, Musique…).
//   2. ENTITY guards    — horse/jockey/track names are proper nouns and
//      must survive translation untouched (or be transliterated
//      phonetically, never translated literally).
//
// These lists are injected into the LLM system prompt and are also used
// to sanity-check output before it is returned to the client.
// ─────────────────────────────────────────────────────────────

/** Technical terms of the sport. Case-insensitive match, preserved verbatim. */
export const PROTECTED_TERMS: string[] = [
  "Quinté",
  "Quinté+",
  "Tiercé",
  "Quarté",
  "Quarté+",
  "Multi",
  "Couplé",
  "Trio",
  "Musique",
  "Corda",
  "Autostart",
  "Volte",
  "Handicap",
  "Trot",
  "Galop",
  "Attelé",
  "Monté",
  "Obstacle",
  "Steeple",
  "Haies",
  "Disqualifié",
  "Forme",
  "Coup de Poker",
  "Tiref", // Moroccan term for the racing tote / turf
];

/**
 * Bilingual alias map used both for search normalization and to remind the
 * LLM which technical concepts have local spellings. Keys are canonical.
 */
export const TERM_ALIASES: Record<string, string[]> = {
  Quinté: ["quinte", "كينتي", "الكينتي", "خمسي"],
  Tiercé: ["tierce", "تيرسي", "الثلاثي"],
  Quarté: ["quarte", "كارتي", "الرباعي"],
  Musique: ["musique", "موزيك", "الموزيك"],
  Autostart: ["autostart", "auto-start", "أوتوستارت"],
  Corda: ["corda", "كوردا"],
  Trot: ["trot", "طروط"],
  Galop: ["galop", "غالوب"],
  Tiref: ["tiref", "tierf", "التيرف", "لتيرف"],
};

/**
 * Build the glossary block that gets embedded verbatim in the system prompt.
 * Kept deterministic so prompt-caching stays warm.
 */
export function buildGlossaryBlock(): string {
  const terms = PROTECTED_TERMS.join(", ");
  return [
    "PROTECTED TECHNICAL TERMS (keep EXACTLY as written, never translate):",
    terms,
    "",
    "These are proper technical nouns of horse racing. If the surrounding",
    "sentence is Arabic or Darija, keep the Latin-spelled term inline.",
  ].join("\n");
}

/**
 * A cheap post-generation guard: verifies the model did not accidentally
 * strip a protected term that existed in the source. Returns the list of
 * terms that appear to have been dropped (best-effort, non-blocking).
 */
export function findDroppedTerms(source: string, output: string): string[] {
  const lower = output.toLowerCase();
  return PROTECTED_TERMS.filter(
    (t) => source.toLowerCase().includes(t.toLowerCase()) && !lower.includes(t.toLowerCase()),
  );
}
