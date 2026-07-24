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
