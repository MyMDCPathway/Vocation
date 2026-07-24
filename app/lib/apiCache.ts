// Two-layer cache shared across the API route handlers.
//
// Layer 1 — the seed file (data/seed-cache.json). Pathways and exam lookups
// generated ahead of time by scripts/seed-pathways.mjs and committed to the
// repo. These are permanent, cost nothing, and are reviewable in a pull
// request, which matters because students may act on them.
//
// Layer 2 — an in-memory TTL map, filled as real traffic arrives. This is what
// catches careers the seed file doesn't cover.
//
// The distinction exists because serverless deployments (Vercel) run route
// handlers in short-lived processes with a read-only filesystem: layer 2 is
// wiped on every cold start and cannot be written to disk, so anything we want
// to survive a deploy has to be in layer 1.
//
// Server-only: route handlers import it, so it never ships to the browser.

import seedCache from "@/data/seed-cache.json";

// Keys here use the exact format produced by cacheKey(), e.g.
// "pathway:registered nurse". Values are whatever the route stores.
const COMMITTED_SEED = seedCache as Record<string, unknown>;

// Swappable so tests can exercise the generation path deterministically. Once
// a career is seeded, requests for it never reach Gemini — correct in
// production, but it silently disables any test that mocks a Gemini response
// for that career.
let SEED: Record<string, unknown> = COMMITTED_SEED;

interface CacheEntry {
  value: unknown;
  expires: number;
}

const store = new Map<string, CacheEntry>();

// Pathways change when MDC changes its catalog, not by the hour. A day is long
// enough to make repeat traffic effectively free while still letting a
// long-running instance pick up corrections without a redeploy.
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

// Cap the number of entries so a long-running server can't grow unbounded.
const MAX_ENTRIES = 500;

export function getCached<T>(key: string): T | undefined {
  // Seeded entries are authoritative and never expire.
  const seeded = SEED[key];
  if (seeded !== undefined) return seeded as T;

  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setCached(key: string, value: unknown, ttlMs: number = DEFAULT_TTL_MS): void {
  // Never shadow a seeded entry with a generated one.
  if (SEED[key] !== undefined) return;

  // Evict the oldest entry when full (Map preserves insertion order).
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, expires: Date.now() + ttlMs });
}

// Normalize free-text input into a stable cache key fragment. Callers should
// pass an already-canonicalized career (see resolveCareer) so that "RN" and
// "nurse" arrive here as the same string.
export function cacheKey(namespace: string, input: string): string {
  return `${namespace}:${input.trim().toLowerCase()}`;
}

/** True when a key is served from the committed seed file. */
export function isSeeded(key: string): boolean {
  return SEED[key] !== undefined;
}

/** Number of entries in the committed seed file. */
export function seedSize(): number {
  return Object.keys(SEED).length;
}

// Test-only: clear the in-memory layer. The seed layer is static and stays.
export function _clearCache(): void {
  store.clear();
}

/**
 * Test-only: replace the seed layer. Pass {} to exercise code paths that run
 * on a cache miss, or null to restore the committed seed file.
 */
export function _setSeedForTests(entries: Record<string, unknown> | null): void {
  SEED = entries ?? COMMITTED_SEED;
}
