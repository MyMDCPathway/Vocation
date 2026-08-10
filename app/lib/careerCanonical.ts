// Resolves free-text career input to a single canonical title.
//
// Students type the same career a dozen ways: "nurse", "Nurse", "RN",
// "registered nurse", "I want to be a nurse". Each spelling used to produce its
// own Gemini generation and its own cache entry. Routing everything through
// resolveCareer() first means those all share one generated pathway, which is
// what keeps API usage flat as traffic grows.
//
// Resolution is deliberately exact-match only (after normalization). There is
// no fuzzy or semantic matching here: collapsing two careers that genuinely
// differ would hand a student the wrong degree plan, and that failure is far
// more expensive than generating a near-duplicate pathway.

import { CAREER_ALIASES } from "./careerAliases";
import { blockedCareer, type BlockReason } from "./careerPolicy";

// Everything except letters, numbers, whitespace, and the two symbols that
// carry meaning in job titles ("C++ Developer", "C# Developer"). Replaced with
// a space rather than removed, so "Nurse-Midwife" becomes "nurse midwife".
const STRIP_PUNCTUATION = /[^\p{L}\p{N}\s+#]/gu;

// "i want to be a nurse" / "how to become an architect" -> the career itself.
const LEADING_INTENT =
  /^(?:i\s+(?:want|would\s+like)\s+to\s+(?:be|become)|how\s+(?:do\s+i\s+|to\s+)?become|become|be)\s+/;

const LEADING_ARTICLE = /^(?:a|an|the)\s+/;

export interface ResolvedCareer {
  /** Title to generate against and key the cache on. */
  canonical: string;
  /** Normalized form of what the user actually typed. */
  normalized: string;
  /** Whether an alias table entry matched. */
  matched: boolean;
  /**
   * Why we won't plan a route to this, or null to proceed.
   *
   * A flag rather than a thrown error, following `matched` above: resolution
   * stays a pure function every caller can run without a try/catch, and the
   * routes decide what a refusal looks like. See careerPolicy.ts.
   */
  blocked: BlockReason | null;
}

export function normalizeCareer(input: string): string {
  let value = input.toLowerCase().replace(STRIP_PUNCTUATION, " ");
  value = value.replace(/\s+/g, " ").trim();
  value = value.replace(LEADING_INTENT, "").trim();
  value = value.replace(LEADING_ARTICLE, "").trim();
  return value;
}

// Returns the singular form, or null when stripping the trailing "s" would be
// unsafe. Used only as a fallback lookup, never to rewrite the stored key, so
// a wrong guess here can miss a match but can never corrupt one.
function depluralize(value: string): string | null {
  if (!value.endsWith("s")) return null;
  if (value.length < 4) return null;
  // business, campus, analysis, physics, mathematics, economics
  if (/(?:ss|us|is|ics)$/.test(value)) return null;
  return value.slice(0, -1);
}

function titleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function resolveCareer(input: string): ResolvedCareer {
  const normalized = normalizeCareer(input);
  // Judged on what the student actually typed, before any alias rewrite: the
  // alias table maps synonyms onto canonical titles, and nothing in it should
  // ever be able to launder a refused phrase into an accepted one.
  const blocked = blockedCareer(normalized);

  const direct = CAREER_ALIASES[normalized];
  if (direct) {
    return { canonical: direct, normalized, matched: true, blocked };
  }

  const singular = depluralize(normalized);
  if (singular) {
    const viaSingular = CAREER_ALIASES[singular];
    if (viaSingular) {
      return { canonical: viaSingular, normalized, matched: true, blocked };
    }
  }

  // Unknown career: keep exactly what the user typed (normalized) rather than
  // guessing at a singular form for a word we don't recognize. Case and
  // spacing still collapse, so "MECHANICAL  ENGINEER" and "mechanical engineer"
  // remain one entry.
  return { canonical: titleCase(normalized), normalized, matched: false, blocked };
}

/** Every distinct canonical title, for the seed script to pre-generate. */
export function canonicalCareers(): string[] {
  return Array.from(new Set(Object.values(CAREER_ALIASES))).sort();
}
