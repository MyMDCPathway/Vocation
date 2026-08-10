// The Gemini model every route generates with, in one place.
//
// This used to be a copy of "gemini-2.5-flash" hardcoded in each route. Google
// retired that model for new API keys, which meant a fresh clone of this repo
// got a 404 from every AI feature and four files had to be edited to fix it.
//
// "gemini-flash-latest" tracks whatever the current Flash model is, so the app
// keeps working when a specific version is retired. That's the right default
// for a project that sits between demos. Set GEMINI_MODEL in .env.local to pin
// a specific version (e.g. "gemini-3.6-flash") if you need reproducible output.

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

export function geminiUrl(apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
}

/**
 * How long to wait on Gemini before giving up.
 *
 * Every other outbound call in the app is bounded (durableCache 2s, blsStats,
 * postal-lookup, careerPhotos, urlVerify); these were the exceptions. An
 * unbounded fetch doesn't fail when Gemini is merely slow — it hangs until the
 * platform kills the function, which returns a 504 with an HTML body, and an
 * HTML body is what the client's `await response.json()` chokes on. Failing on
 * our own terms lets each route return its own JSON error shape instead.
 *
 * 25s sits under Vercel's default function timeout so we get there first, and
 * comfortably above a normal generation (measured in single-digit seconds).
 */
export const GEMINI_TIMEOUT_MS = 25_000;
