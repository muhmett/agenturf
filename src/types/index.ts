// ─────────────────────────────────────────────────────────────
// Domain types for Chibani AI
// ─────────────────────────────────────────────────────────────

export type Lang = "dar" | "ar" | "fr";

export type RiskLevel = "safe" | "balanced" | "risky";

export interface Runner {
  number: number;
  name: string; // NEVER translated — protected entity
  jockey: string;
  trainer: string;
  weight?: string;
  music?: string; // "Musique" — protected technical term
  odds?: string;
  draw?: number; // "Corda"
}

export interface Race {
  id: string;
  name: string; // e.g. "Prix d'Amérique" — protected entity
  track: string; // hippodrome
  date: string; // ISO
  discipline: "trot" | "galop" | "obstacle";
  distance: number; // meters
  startType: "autostart" | "volte" | "stalles"; // "Autostart" protected
  betType: "quinte" | "tierce" | "quarte" | "quinte+"; // protected terms
  runners: Runner[];
}

export interface SearchResult {
  race: Race;
  confidence: number; // 0..1
  matchedOn: string[]; // which tokens/aliases matched
}

// The 4-method analysis structure produced by the Chibani engine.
export interface DigitalLogic {
  title: string;
  summary: string;
  picks: { number: number; name: string; note: string }[];
}

export interface RaceConditions {
  title: string;
  summary: string;
  factors: { label: string; value: string }[];
}

export interface CoupDePoker {
  title: string;
  summary: string;
  outsiders: { number: number; name: string; reason: string }[];
}

export interface FinalPrognosis {
  title: string;
  base: number[]; // race numbers, ordered
  top5: number[];
  top8: number[];
  risk: RiskLevel;
  commentary: string;
}

export interface Analysis {
  raceId: string;
  lang: Lang;
  digitalLogic: DigitalLogic;
  raceConditions: RaceConditions;
  coupDePoker: CoupDePoker;
  finalPrognosis: FinalPrognosis;
  disclaimer: string;
}

export interface CreditState {
  used: number;
  limit: number;
  remaining: number;
  premium: boolean;
  resetAt: string; // ISO
}
