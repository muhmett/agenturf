// ─────────────────────────────────────────────────────────────
// Credit / token system (architecture).
//
// Rule: N free analyses per day (default 3). After that the user must
// watch a rewarded ad (+1) or upgrade to premium (unlimited).
//
// This file exposes a small, storage-agnostic interface. The default
// implementation is an in-memory day-bucket store for local dev; swap
// `store` for a Supabase-backed adapter in production (schema in README).
// ─────────────────────────────────────────────────────────────

import type { CreditState } from "@/types";

const FREE_PER_DAY = Number(process.env.NEXT_PUBLIC_FREE_ANALYSES_PER_DAY ?? 3);

interface Bucket {
  day: string; // YYYY-MM-DD (UTC)
  used: number;
  premium: boolean;
}

interface CreditStore {
  get(userId: string): Promise<Bucket>;
  set(userId: string, bucket: Bucket): Promise<void>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextResetISO(): string {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.toISOString();
}

// ── In-memory dev store (replace with Supabase adapter) ──────────
const mem = new Map<string, Bucket>();
const memoryStore: CreditStore = {
  async get(userId) {
    const existing = mem.get(userId);
    if (!existing || existing.day !== today()) {
      const fresh: Bucket = { day: today(), used: 0, premium: existing?.premium ?? false };
      mem.set(userId, fresh);
      return fresh;
    }
    return existing;
  },
  async set(userId, bucket) {
    mem.set(userId, bucket);
  },
};

let store: CreditStore = memoryStore;
export function setCreditStore(s: CreditStore) {
  store = s;
}

function toState(b: Bucket): CreditState {
  const limit = b.premium ? Infinity : FREE_PER_DAY;
  const remaining = b.premium ? Infinity : Math.max(0, FREE_PER_DAY - b.used);
  return {
    used: b.used,
    limit: b.premium ? Number.MAX_SAFE_INTEGER : FREE_PER_DAY,
    remaining: b.premium ? Number.MAX_SAFE_INTEGER : remaining,
    premium: b.premium,
    resetAt: nextResetISO(),
  };
}

export async function getCredits(userId: string): Promise<CreditState> {
  return toState(await store.get(userId));
}

/** Returns null if allowed (and consumes 1), or the current state if blocked. */
export async function consumeCredit(userId: string): Promise<{ ok: boolean; state: CreditState }> {
  const b = await store.get(userId);
  if (!b.premium && b.used >= FREE_PER_DAY) {
    return { ok: false, state: toState(b) };
  }
  b.used += 1;
  await store.set(userId, b);
  return { ok: true, state: toState(b) };
}

/** Grant +1 analysis after a rewarded ad completes. */
export async function grantRewardedCredit(userId: string): Promise<CreditState> {
  const b = await store.get(userId);
  b.used = Math.max(0, b.used - 1);
  await store.set(userId, b);
  return toState(b);
}
