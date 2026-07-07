// Tiny in-memory TTL cache shared across the API route handlers (one instance
// per running server). Its purpose is to avoid re-calling the Gemini API for
// identical inputs — the same careers, exams, and prompts get queried over and
// over (especially while demoing), and the free tier caps requests per minute.
//
// This is server-only: route handlers import it, so it never ships to the
// browser. Cached values are plain JSON-serializable objects.

interface CacheEntry {
  value: unknown;
  expires: number;
}

const store = new Map<string, CacheEntry>();

// Default time-to-live: results are stable enough to reuse for an hour.
const DEFAULT_TTL_MS = 60 * 60 * 1000;

// Cap the number of entries so a long-running server can't grow unbounded.
const MAX_ENTRIES = 500;

export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setCached(key: string, value: unknown, ttlMs: number = DEFAULT_TTL_MS): void {
  // Evict the oldest entry when full (Map preserves insertion order).
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, expires: Date.now() + ttlMs });
}

// Normalize free-text input into a stable cache key fragment.
export function cacheKey(namespace: string, input: string): string {
  return `${namespace}:${input.trim().toLowerCase()}`;
}

// Test-only: clear all entries.
export function _clearCache(): void {
  store.clear();
}
