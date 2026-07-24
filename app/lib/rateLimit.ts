// Request limiting for the Gemini-backed routes.
//
// Two independent limits:
//   - per-IP, so one visitor can't loop the endpoint
//   - a global daily ceiling, so total spend is bounded no matter what
//
// IMPORTANT LIMITATION: state lives in process memory. On a serverless deploy
// each instance keeps its own counters, so the effective limits scale with the
// number of warm instances rather than being exact. That's acceptable here —
// it stops casual abuse and bounds the blast radius — but it is NOT a hard
// guarantee. The actual guarantee should come from a billing budget cap set in
// Google Cloud. If you later need exact limits, move these two maps to a
// shared store (Redis, Postgres) and the call sites stay unchanged.

import { NextResponse } from "next/server";
import { RATE_LIMIT_CONFIG } from "@/app/api/rate-limit-config";

export type LimitReason = "ip" | "daily";

export interface LimitResult {
  allowed: boolean;
  reason?: LimitReason;
  message?: string;
  retryAfterSeconds?: number;
}

const ALLOWED: LimitResult = { allowed: true };

// ip -> timestamps of recent requests, pruned on each check.
const hits = new Map<string, number[]>();

let daily = { day: currentDay(), count: 0 };

function currentDay(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
}

function secondsUntilNextDay(): number {
  const now = new Date();
  const midnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  return Math.max(1, Math.ceil((midnight - now.getTime()) / 1000));
}

/**
 * Best-effort client IP. Falls back to a shared bucket when no forwarding
 * header is present (local dev, or a caller that isn't a real Request), which
 * means those callers share one allowance rather than bypassing the limit.
 */
export function clientIp(request: unknown): string {
  const headers = (request as { headers?: { get?: (name: string) => string | null } })
    ?.headers;
  if (typeof headers?.get !== "function") return "unknown";

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    // May be "client, proxy1, proxy2" — the first entry is the origin client.
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Per-IP sliding window check. Records the request when it is allowed. */
export function checkIpLimit(ip: string): LimitResult {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_CONFIG.windowMs;

  const recent = (hits.get(ip) ?? []).filter((t) => t > cutoff);

  if (recent.length >= RATE_LIMIT_CONFIG.maxRequestsPerIP) {
    const oldest = recent[0];
    return {
      allowed: false,
      reason: "ip",
      message: RATE_LIMIT_CONFIG.message,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((oldest + RATE_LIMIT_CONFIG.windowMs - now) / 1000)
      ),
    };
  }

  recent.push(now);
  hits.set(ip, recent);

  // Opportunistic cleanup so idle IPs don't accumulate forever.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => t <= cutoff)) hits.delete(key);
    }
  }

  return ALLOWED;
}

/**
 * Global daily ceiling. Call this ONLY when about to spend a Gemini request —
 * cache hits and seeded careers must not consume the allowance.
 */
export function checkDailyLimit(): LimitResult {
  const today = currentDay();
  if (daily.day !== today) daily = { day: today, count: 0 };

  if (daily.count >= RATE_LIMIT_CONFIG.maxGenerationsPerDay) {
    return {
      allowed: false,
      reason: "daily",
      message: RATE_LIMIT_CONFIG.dailyLimitMessage,
      retryAfterSeconds: secondsUntilNextDay(),
    };
  }
  return ALLOWED;
}

/** Record that a Gemini request was actually spent. */
export function recordGeneration(): void {
  const today = currentDay();
  if (daily.day !== today) daily = { day: today, count: 0 };
  daily.count += 1;
}

/** Current daily usage, for diagnostics. */
export function dailyUsage(): { day: string; count: number; limit: number } {
  return {
    day: daily.day,
    count: daily.count,
    limit: RATE_LIMIT_CONFIG.maxGenerationsPerDay,
  };
}

/**
 * Applies both limits for a route that is about to spend a Gemini request.
 * Returns a ready-to-send 429 when the caller should stop, or null to proceed.
 *
 * Call this AFTER the cache lookup: serving a cached or seeded answer costs
 * nothing, so it should never count against a visitor or the daily budget.
 */
export function enforceGenerationLimits(request: unknown): NextResponse | null {
  // Local escape hatch for scripts/seed-pathways.mjs, which deliberately makes
  // dozens of generations in a row against a dev server. This reads a
  // server-side environment variable, so it can only ever be enabled by whoever
  // starts the process — never by a request. Do not set it in production.
  if (process.env.SEED_MODE === "1") return null;

  const ip = checkIpLimit(clientIp(request));
  if (!ip.allowed) return limitedResponse(ip);

  const day = checkDailyLimit();
  if (!day.allowed) return limitedResponse(day);

  return null;
}

function limitedResponse(result: LimitResult): NextResponse {
  return NextResponse.json(
    { error: result.message },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds ?? 60) },
    }
  );
}

// Test-only: reset both limiters.
export function _resetRateLimits(): void {
  hits.clear();
  daily = { day: currentDay(), count: 0 };
}
