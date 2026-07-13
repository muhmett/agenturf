// ─────────────────────────────────────────────────────────────
// POST /api/search
// Universal multi-language race search.
// Body: { q: string }
// Returns ranked SearchResult[] with the normalization trace for debugging.
// ─────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { matchRace } from "@/lib/data";
import { normalizeQuery } from "@/lib/normalize";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { q?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const q = (body.q ?? "").toString();
  if (q.trim().length < 2) {
    return NextResponse.json({ error: "Query too short", results: [] }, { status: 400 });
  }

  const trace = normalizeQuery(q);
  const results = matchRace(q);

  return NextResponse.json({
    query: q,
    normalized: trace.normalized,
    script: trace.script,
    detectedTerms: trace.detectedTerms,
    results,
  });
}
