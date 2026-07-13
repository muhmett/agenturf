// ─────────────────────────────────────────────────────────────
// POST /api/analyze
// Runs the Chibani AI 4-method analysis for a race, in the chosen language,
// with STRICT glossary/entity protection, gated by the credit system.
//
// Body: { raceId: string, lang: "dar" | "ar" | "fr" }
// ─────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getRaceById } from "@/lib/data";
import { analyzeRace } from "@/lib/llm";
import { consumeCredit } from "@/lib/credits";
import { findDroppedTerms } from "@/lib/glossary";
import { LANGS } from "@/lib/i18n";
import type { Lang } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function resolveUserId(req: Request): string {
  // Wire to NextAuth/Supabase session in production. For now, fall back to a
  // per-device anonymous id supplied by the client, else a shared bucket.
  return req.headers.get("x-user-id") ?? "anon";
}

export async function POST(req: Request) {
  let body: { raceId?: string; lang?: Lang };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { raceId, lang } = body;
  if (!raceId) return NextResponse.json({ error: "raceId required" }, { status: 400 });
  if (!lang || !(lang in LANGS)) {
    return NextResponse.json({ error: "lang must be one of dar|ar|fr" }, { status: 400 });
  }

  const race = getRaceById(raceId);
  if (!race) return NextResponse.json({ error: "Race not found" }, { status: 404 });

  // ── Credit gate ──
  const userId = resolveUserId(req);
  const credit = await consumeCredit(userId);
  if (!credit.ok) {
    return NextResponse.json(
      { error: "no_credits", credits: credit.state },
      { status: 402 }, // Payment Required
    );
  }

  // ── Run the engine ──
  try {
    const analysis = await analyzeRace(race, lang);

    // Best-effort protection audit (non-blocking): confirm the model kept
    // horse names + technical terms intact.
    const sourceNames = race.runners.map((r) => r.name).join(" ");
    const outText = JSON.stringify(analysis);
    const dropped = findDroppedTerms(sourceNames, outText);

    return NextResponse.json({
      analysis,
      credits: credit.state,
      protection: { droppedTerms: dropped, ok: dropped.length === 0 },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
