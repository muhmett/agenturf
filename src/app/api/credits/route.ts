// GET  /api/credits            → current credit state
// POST /api/credits { reward }  → grant +1 after a rewarded ad completes
import { NextResponse } from "next/server";
import { getCredits, grantRewardedCredit } from "@/lib/credits";

export const runtime = "nodejs";

function userId(req: Request): string {
  return req.headers.get("x-user-id") ?? "anon";
}

export async function GET(req: Request) {
  return NextResponse.json({ credits: await getCredits(userId(req)) });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body?.reward !== true) {
    return NextResponse.json({ error: "reward flag required" }, { status: 400 });
  }
  // In production: verify the rewarded-ad SSV callback signature before granting.
  const credits = await grantRewardedCredit(userId(req));
  return NextResponse.json({ credits });
}
