// Records which searches actually reached Gemini, so the seed file can be grown
// from real demand instead of guesses about what students type.
//
// Read these in Vercel: Project -> Logs, filtered on "cache-miss". A term that
// shows up repeatedly is one to add to careerAliases.ts and re-seed, after
// which it stops appearing here.
//
// Only the search term is logged, never request bodies — quiz answers in
// particular can carry personal detail and have no business in a log you read
// casually.

const MAX_LENGTH = 80;

// The value is untrusted user input being written into a log line. Stripping
// control characters stops someone typing a newline to forge a second entry,
// and the cap keeps one long paste from burying everything else.
function sanitize(value: string): string {
  let out = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    out += code < 0x20 || code === 0x7f ? " " : char;
  }
  return out.trim().slice(0, MAX_LENGTH);
}

export function logCacheMiss(
  kind: "pathway" | "exam" | "suggestions",
  raw: string,
  canonical?: string
): void {
  const parts = [`[cache-miss] ${kind}`, `raw="${sanitize(raw)}"`];
  if (canonical !== undefined && canonical !== raw) {
    parts.push(`canonical="${sanitize(canonical)}"`);
  }
  console.log(parts.join(" "));
}
