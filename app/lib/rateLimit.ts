// Request limiting for the Gemini-backed routes.
//
// Two independent limits:
//   - per-IP, so one visitor can't loop the endpoint
//   - a global daily ceiling, so total spend is bounded no matter what
//
// The daily ceiling counts in the shared durable store (durableCache.ts), not
// in process memory. It used to be a plain module-level number, which meant
// every warm serverless instance handed out its own fresh 300 — the real
// ceiling was 300 x instances, and it GREW under load, because load is exactly
// what makes Vercel start more instances. A shared INCR fixes that: one tally,
// counted once, no matter how many instances are running.
//
// The per-IP window is still per-instance, and that is a deliberate trade. It
// exists to stop one visitor hammering one endpoint in a tight loop, which a
// single instance already sees; spreading a burst across instances costs the
// attacker nothing in Gemini spend that the daily ceiling doesn't already
// bound. Keeping it local keeps the hot path free of a network round trip.
//
// STILL NOT A HARD GUARANTEE, for two honest reasons. The durable count is
// read through a short-lived local view (see below), so the global cap is
// approximate under concurrency. And the store is treated as an optimization:
// if it is unreachable the limiter falls back to in-memory counting rather
// than refusing a student's request. The only true guarantee remains a billing
// budget cap set in Google Cloud — that is the thing that cannot be raced,
// spoofed, or knocked over by a cache outage, and it should be configured.

import { NextResponse } from "next/server";
import { RATE_LIMIT_CONFIG } from "@/app/api/rate-limit-config";
import {
  durableCacheEnabled,
  incrementCounter,
  readCounter,
} from "@/app/lib/durableCache";

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

/**
 * What this instance knows about today's global spend.
 *
 * `local` is what this process has recorded itself — the fallback, and the
 * only number that exists when no store is configured (local dev, CI).
 * `shared` is the last value the durable counter reported, and `inFlight` is
 * the increments we've fired but not yet had answered, so a burst inside one
 * instance is counted immediately rather than waiting for round trips.
 */
let daily = freshDaily();

function freshDaily() {
  return {
    day: currentDay(),
    local: 0,
    shared: undefined as number | undefined,
    sharedAt: 0,
    inFlight: 0,
  };
}

function currentDay(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
}

// The durable counter's key. Day-scoped, so rollover needs no reset logic:
// tomorrow is simply a different key that doesn't exist yet.
function dailyCounterKey(day: string): string {
  return `generations:${day}`;
}

// Two days, so a counter always outlives the day it belongs to even if a
// deploy's clock or an in-flight request straddles midnight UTC.
const COUNTER_TTL_SECONDS = 60 * 60 * 48;

// How stale the shared view may get before an idle instance re-reads it. Short
// enough that an instance which has been serving cache hits for a while learns
// about everyone else's spend before it commits to a generation, long enough
// that it costs roughly one extra round trip per instance per minute.
const SHARED_VIEW_MAX_AGE_MS = 30_000;

function rollDayIfNeeded(): void {
  const today = currentDay();
  if (daily.day !== today) daily = freshDaily();
}

/**
 * Best available estimate of today's global generation count.
 *
 * max() rather than a plain read of `shared`: if the store stops answering,
 * `shared` freezes at its last known value while `local` keeps climbing, and
 * the limiter keeps tightening instead of silently going blind.
 */
function effectiveDailyCount(): number {
  if (daily.shared === undefined) return daily.local;
  return Math.max(daily.local, daily.shared + daily.inFlight);
}

/**
 * Pulls the shared count into the local view, at most once per
 * SHARED_VIEW_MAX_AGE_MS. Fire-and-forget: the caller is on the synchronous
 * hot path and must not wait for a network round trip.
 */
function refreshSharedView(): void {
  if (!durableCacheEnabled()) return;

  const now = Date.now();
  if (now - daily.sharedAt < SHARED_VIEW_MAX_AGE_MS) return;
  // Stamped before the read is issued, not after it lands, so a burst of
  // concurrent checks fires one read rather than one per request.
  daily.sharedAt = now;

  const day = daily.day;
  void readCounter(dailyCounterKey(day))
    .then((value) => {
      if (value === undefined || daily.day !== day) return;
      // Monotonic within a day, so a slow response that lands out of order can
      // never walk the count backwards.
      daily.shared = Math.max(daily.shared ?? 0, value);
    })
    .catch((error) => {
      // readCounter swallows its own failures; this is belt and braces so a
      // background refresh can never surface as an unhandled rejection.
      console.error("[rate-limit] daily counter refresh failed:", error);
    });
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

const IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

function isIpv4(value: string): boolean {
  return IPV4.test(value);
}

/**
 * Structural IPv6 check, written out rather than crammed into one regex
 * because the correct single-regex version is unreadable and unreviewable.
 * Node's `net.isIP` would be ideal, but this module can run on the Edge
 * runtime, which has no node builtins.
 */
function isIpv6(value: string): boolean {
  if (!value.includes(":") || !/^[0-9a-f:.]+$/i.test(value)) return false;

  const halves = value.split("::");
  if (halves.length > 2) return false; // "::" may appear at most once

  const groups: string[] = [];
  for (const half of halves) {
    if (half === "") continue;
    for (const part of half.split(":")) {
      if (part === "") return false; // stray leading/trailing colon
      groups.push(part);
    }
  }

  let width = 0;
  for (const [index, group] of groups.entries()) {
    if (group.includes(".")) {
      // An IPv4 tail ("::ffff:203.0.113.7") is legal only in the last position
      // and occupies two groups' worth of address.
      if (index !== groups.length - 1 || !isIpv4(group)) return false;
      width += 2;
      continue;
    }
    if (!/^[0-9a-f]{1,4}$/i.test(group)) return false;
    width += 1;
  }

  // "::" stands in for at least one omitted zero group; without it every group
  // must be spelled out.
  return halves.length === 2 ? width <= 7 : width === 8;
}

/**
 * Strips the decorations a proxy may add — "[2001:db8::1]", "[2001:db8::1]:443",
 * "203.0.113.7:54321" — so a legitimate client isn't dumped into the shared
 * bucket over punctuation.
 */
function normalizeIpCandidate(raw: string): string {
  const value = raw.trim();

  const bracketed = value.match(/^\[(.+)\](?::\d+)?$/);
  if (bracketed) return bracketed[1];

  // A single colon means IPv4 with a port; more than one means bare IPv6.
  const colons = value.split(":").length - 1;
  if (colons === 1) return value.slice(0, value.indexOf(":"));

  return value;
}

/** The first entry of a forwarding header, if it is actually an IP address. */
function validatedIp(header: string | null | undefined): string | null {
  if (!header) return null;
  // May be "client, proxy1, proxy2" — the first entry is the origin client.
  const candidate = normalizeIpCandidate(header.split(",")[0] ?? "");
  if (!candidate) return null;
  return isIpv4(candidate) || isIpv6(candidate) ? candidate : null;
}

/**
 * Best-effort client IP, used as the per-IP bucket key.
 *
 * Order matters. x-vercel-forwarded-for is written by Vercel's edge and
 * overwritten on every request, so a caller cannot choose it. x-forwarded-for
 * and x-real-ip are whatever arrived, and on a platform that doesn't rewrite
 * them a caller can put anything there — which is the whole problem this
 * function used to have: it returned the first comma-separated fragment
 * unchecked, so "X-Forwarded-For: <random>" bought a brand new allowance on
 * every single request. Anything that isn't a well-formed address now lands in
 * the shared bucket instead of minting a fresh one.
 *
 * Falls back to that same shared bucket when no forwarding header is present
 * (local dev, or a caller that isn't a real Request), which means those callers
 * share one allowance rather than bypassing the limit.
 */
export function clientIp(request: unknown): string {
  const headers = (request as { headers?: { get?: (name: string) => string | null } })
    ?.headers;
  if (typeof headers?.get !== "function") return "unknown";

  return (
    validatedIp(headers.get("x-vercel-forwarded-for")) ??
    validatedIp(headers.get("x-forwarded-for")) ??
    validatedIp(headers.get("x-real-ip")) ??
    "unknown"
  );
}

/**
 * Per-IP sliding window check. Records the request when it is allowed.
 *
 * `max` defaults to the generic per-IP allowance. Callers whose requests cost
 * something different pass their own — a Gemini generation and a signup
 * attempt are both "one request from this IP", but a sensible ceiling for one
 * is a silly ceiling for the other.
 */
export function checkIpLimit(
  ip: string,
  max: number = RATE_LIMIT_CONFIG.maxRequestsPerIP
): LimitResult {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_CONFIG.windowMs;

  const recent = (hits.get(ip) ?? []).filter((t) => t > cutoff);

  if (recent.length >= max) {
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
 *
 * Synchronous on purpose: eight route files call this through
 * enforceGenerationLimits, and a limiter is not worth an await in every one of
 * them. It reads a locally cached view of the shared counter and kicks off a
 * refresh in the background when that view has gone stale.
 */
export function checkDailyLimit(): LimitResult {
  rollDayIfNeeded();
  refreshSharedView();

  if (effectiveDailyCount() >= RATE_LIMIT_CONFIG.maxGenerationsPerDay) {
    return {
      allowed: false,
      reason: "daily",
      message: RATE_LIMIT_CONFIG.dailyLimitMessage,
      retryAfterSeconds: secondsUntilNextDay(),
    };
  }
  return ALLOWED;
}

/**
 * Record that a Gemini request was actually spent.
 *
 * The durable INCR is fired without being awaited, which is what lets
 * checkDailyLimit stay synchronous. Two things make that safe rather than
 * merely convenient:
 *
 *   - Routes call this BEFORE the Gemini call, not after, so the increment has
 *     the entire generation — seconds — to land before the lambda can freeze.
 *   - The local count moves immediately, and `inFlight` covers the window
 *     between firing and hearing back, so an instance can never race itself.
 *
 * The honest cost: between instances the cap is approximate. An instance can
 * be up to SHARED_VIEW_MAX_AGE_MS out of date, so the true ceiling is the
 * configured limit plus at most a few generations per active instance in that
 * window. That is bounded by a small multiple — and it no longer grows with
 * the attack, which is what the old per-process counter did.
 */
export function recordGeneration(): void {
  rollDayIfNeeded();
  daily.local += 1;

  if (!durableCacheEnabled()) return;

  const day = daily.day;
  daily.inFlight += 1;
  void incrementCounter(dailyCounterKey(day), COUNTER_TTL_SECONDS)
    .then((value) => {
      if (daily.day !== day) return; // rolled past midnight while in flight
      daily.inFlight -= 1;
      if (value === undefined) return; // store unreachable: local count stands
      daily.shared = Math.max(daily.shared ?? 0, value);
      daily.sharedAt = Date.now();
    })
    .catch((error) => {
      // incrementCounter already swallows and logs its own failures, so this
      // only fires on something unforeseen. Still never rethrow: a limiter
      // that can crash a request is worse than one that miscounts.
      if (daily.day === day) daily.inFlight -= 1;
      console.error("[rate-limit] daily counter increment failed:", error);
    });
}

/** Current daily usage, for diagnostics. */
export function dailyUsage(): { day: string; count: number; limit: number } {
  return {
    day: daily.day,
    count: effectiveDailyCount(),
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

  const ip = checkIpLimit(
    clientIp(request),
    RATE_LIMIT_CONFIG.maxGenerationsPerIP
  );
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

// Test-only: reset both limiters, including the cached view of the shared
// counter. Does not touch the durable store itself — tests run without one.
export function _resetRateLimits(): void {
  hits.clear();
  daily = freshDaily();
}
