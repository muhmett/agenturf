// ─────────────────────────────────────────────────────────────
// Chibani AI — LLM prompt engine.
//
// This module owns:
//   • the system prompt (persona + STRICT glossary/entity protection +
//     the 4-method analysis contract + language/localization rules)
//   • the provider call (Anthropic default, OpenAI fallback)
//   • robust JSON parsing of the model output into `Analysis`
//
// The strict translation rules live here so both the persona and the
// output contract are versioned in one place.
// ─────────────────────────────────────────────────────────────

import { buildGlossaryBlock } from "./glossary";
import { LANGS } from "./i18n";
import type { Analysis, Lang, Race } from "@/types";

const PROVIDER = process.env.LLM_PROVIDER ?? "anthropic";

/**
 * The system prompt. Deterministic given `lang` so it caches well.
 * The three rule blocks (persona, protection, contract) are the heart of
 * the "smart translation & glossary protection" requirement.
 */
export function buildSystemPrompt(lang: Lang): string {
  const target = LANGS[lang].llmName;

  return `You are "Chibani AI" (الشيباني), a veteran Moroccan horse-racing (Tiref / Quinté) handicapper. You are shrewd, calm and speak like an experienced turf elder. You analyze data — you do not gamble and you always attach a responsible-play note.

# LANGUAGE & LOCALIZATION
- Write ALL human commentary in: ${target}.
- Adapt tone naturally to that language. For Darija, use everyday Moroccan spoken register written in Arabic script — not formal MSA.
- Localize meaning, not word-for-word.

# ${buildGlossaryBlock()}

# ENTITY PROTECTION — ABSOLUTE RULE
- NEVER translate proper names. Horse names, jockey names, trainer names, and track/hippodrome names must appear EXACTLY as given in the input data (e.g. "Bold Eagle" stays "Bold Eagle").
- If the target language is Arabic/Darija you MAY add a phonetic transliteration in parentheses the FIRST time a horse is mentioned, e.g. Bold Eagle (بولد إيغل) — but the Latin original must always be present. Never invent a semantic translation of a name.
- Race titles that are proper nouns (e.g. "Prix d'Amérique") are entities too: keep them verbatim.

# ANALYSIS METHOD — you MUST produce all four
a) Digital Logic — Forme, Musique, jockey/trainer statistics. Reason from the numbers.
b) Race Conditions — track type, distance, start type (Autostart/Volte), Corda, past performance on this configuration.
c) Coup de Poker — 1-3 outsiders with hidden potential or a sudden improvement curve. Justify each.
d) Final Prognosis — a definitive Base + Top 5 + Top 8 with an overall risk level (safe | balanced | risky).

# OUTPUT FORMAT — return ONE JSON object, no markdown fences, matching exactly:
{
  "digitalLogic":   { "title": string, "summary": string, "picks": [{"number": int, "name": string, "note": string}] },
  "raceConditions": { "title": string, "summary": string, "factors": [{"label": string, "value": string}] },
  "coupDePoker":    { "title": string, "summary": string, "outsiders": [{"number": int, "name": string, "reason": string}] },
  "finalPrognosis": { "title": string, "base": [int], "top5": [int], "top8": [int], "risk": "safe|balanced|risky", "commentary": string },
  "disclaimer": string
}
- "number" fields must be the runner's race number from the input.
- "name" fields must be the runner's exact name from the input (entity rule).
- Titles and all free text: in ${target}. Keep protected terms verbatim.`;
}

/** Serialize the race into a compact, model-friendly prompt payload. */
export function buildUserPrompt(race: Race): string {
  const runners = race.runners
    .map(
      (r) =>
        `#${r.number} ${r.name} | jockey: ${r.jockey} | trainer: ${r.trainer}` +
        `${r.music ? ` | Musique: ${r.music}` : ""}` +
        `${r.weight ? ` | poids: ${r.weight}` : ""}` +
        `${r.draw != null ? ` | Corda: ${r.draw}` : ""}` +
        `${r.odds ? ` | cote: ${r.odds}` : ""}`,
    )
    .join("\n");

  return `Race: ${race.name}
Track: ${race.track}
Date: ${race.date}
Discipline: ${race.discipline} | Distance: ${race.distance}m | Start: ${race.startType} | Bet: ${race.betType}

Runners:
${runners}

Analyze this race now. Return only the JSON object.`;
}

// ── Provider calls ────────────────────────────────────────────

async function callAnthropic(system: string, user: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  const model = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

async function callOpenAI(system: string, user: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");
  const model = process.env.OPENAI_MODEL ?? "gpt-4o";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/** Extract the first balanced JSON object from a possibly-noisy string. */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);
  return text;
}

/**
 * Run the full analysis. Falls back to a deterministic mock when no API key
 * is configured, so the app is demoable offline.
 */
export async function analyzeRace(race: Race, lang: Lang): Promise<Analysis> {
  const system = buildSystemPrompt(lang);
  const user = buildUserPrompt(race);

  // Demo mode: when no provider key is configured, return a structure-accurate
  // mock so the full UX is usable offline. Set LLM_STRICT=1 to disable and
  // require a real key (recommended for production).
  const hasKey =
    PROVIDER === "openai" ? !!process.env.OPENAI_API_KEY : !!process.env.ANTHROPIC_API_KEY;
  if (!hasKey && process.env.LLM_STRICT !== "1") {
    return mockAnalysis(race, lang);
  }

  let raw = "";
  try {
    if (PROVIDER === "openai") raw = await callOpenAI(system, user);
    else raw = await callAnthropic(system, user);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      return mockAnalysis(race, lang);
    }
    throw err;
  }

  const parsed = JSON.parse(extractJson(raw));
  return { raceId: race.id, lang, ...parsed } as Analysis;
}

/** Offline / no-key demo analysis (structure-accurate). */
export function mockAnalysis(race: Race, lang: Lang): Analysis {
  const r = race.runners;
  const pick = (i: number) => r[i % r.length];
  return {
    raceId: race.id,
    lang,
    digitalLogic: {
      title: lang === "fr" ? "Logique Digitale" : "المنطق الرقمي",
      summary:
        lang === "fr"
          ? `Sur la Forme et la Musique, ${pick(0).name} domine les indicateurs.`
          : `على مستوى الفورم و الموزيك، ${pick(0).name} كيهيمن على المؤشرات.`,
      picks: [0, 1, 2].map((i) => ({
        number: pick(i).number,
        name: pick(i).name,
        note: lang === "fr" ? "Régulier, jockey en forme." : "منتظم، الجوكي فحالة مزيانة.",
      })),
    },
    raceConditions: {
      title: lang === "fr" ? "Conditions de Course" : "شروط السباق",
      summary:
        lang === "fr"
          ? `${race.distance}m en ${race.startType}. La Corda favorise les petits numéros.`
          : `${race.distance} متر ف ${race.startType}. الكوردا كتخدم النمر الصغار.`,
      factors: [
        { label: "Distance", value: `${race.distance}m` },
        { label: "Start", value: race.startType },
        { label: "Discipline", value: race.discipline },
      ],
    },
    coupDePoker: {
      title: "Coup de Poker",
      summary:
        lang === "fr"
          ? `${pick(4).name} sort d'une progression cachée.`
          : `${pick(4).name} خارج من تطور مخفي.`,
      outsiders: [
        {
          number: pick(4).number,
          name: pick(4).name,
          reason: lang === "fr" ? "Musique en amélioration nette." : "الموزيك كيتحسن بزاف.",
        },
      ],
    },
    finalPrognosis: {
      title: lang === "fr" ? "Pronostic Final" : "التوقّع النهائي",
      base: [pick(0).number, pick(1).number],
      top5: [0, 1, 2, 3, 4].map((i) => pick(i).number),
      top8: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => pick(i).number),
      risk: "balanced",
      commentary:
        lang === "fr"
          ? "Base solide autour des deux favoris, un outsider pour le rapport."
          : "قاعدة قوية على الفافوري، و أوتسايدر باش نزيدو الربح.",
    },
    disclaimer:
      lang === "fr"
        ? "Analyse informative — jouez de manière responsable (+18)."
        : "تحليل معلوماتي — لعب بمسؤولية (+18).",
  };
}
