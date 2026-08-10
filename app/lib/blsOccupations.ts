// Turning "I want to be a pediatric nurse" into a code BLS will answer to.
//
// Every statistic on the career page is keyed on a Standard Occupational
// Classification code. Getting that code wrong doesn't produce an error — it
// produces a real, authoritative-looking wage table for a completely different
// job, which is worse than showing nothing. So the matching here is
// deliberately conservative and refuses more often than it guesses.
//
// TWO SOURCES, ONE ARBITER. The model is asked for a SOC code because it
// genuinely knows many of them, but its answer is only ever used if that code
// exists in BLS's own published table. Local scoring runs regardless. When the
// two disagree, the confident local match wins, because a hallucinated code
// that happens to be well-formed is indistinguishable from a correct one.

import occupationTable from "@/data/bls-occupations.json";

export interface Occupation {
  /** Six digits, no hyphen — the form OEWS series IDs use. */
  code: string;
  /** BLS's own title, verbatim. Shown to the student so they can sanity-check. */
  title: string;
}

export interface OccupationMatch extends Occupation {
  /** 0-1. Below MATCH_FLOOR we show no statistics at all. */
  score: number;
  /** How we got here, for the "what does this number describe" line. */
  via: "hint" | "exact" | "fuzzy";
}

const OCCUPATIONS = occupationTable as Occupation[];

/**
 * Below this we decline. Tuned so "pediatrician" reaches "Pediatricians,
 * General" but "esports coach" reaches nothing — BLS has no esports category,
 * and the nearest survivor ("Coaches and Scouts") describes a different job
 * with different pay.
 */
export const MATCH_FLOOR = 0.5;

/**
 * Words that appear in so many occupation titles that matching on them is
 * noise. "Other" is the worst offender: BLS ends most families with a catch-all
 * like "Healthcare Practitioners, All Other", which otherwise scores against
 * every healthcare query.
 */
const STOPWORDS = new Set([
  "all", "other", "and", "or", "of", "the", "a", "an", "general",
  "workers", "occupations", "specialists", "except",
]);

/** Plural and inflection endings BLS titles use but people don't type. */
function stem(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.length > 3 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s")) return word.slice(0, -1);
  return word;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word))
    .map(stem);
}

/** Normalised for exact comparison: "Pediatricians, General" -> "pediatrician". */
function normalize(text: string): string {
  return tokenize(text).sort().join(" ");
}

const NORMALIZED = OCCUPATIONS.map((occupation) => ({
  occupation,
  normal: normalize(occupation.title),
  tokens: new Set(tokenize(occupation.title)),
}));

const BY_CODE = new Map(OCCUPATIONS.map((o) => [o.code, o]));

/** Strip the hyphen BLS prints in "29-1141" but omits from series IDs. */
function canonicalCode(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

/**
 * The model's suggested code, but only if BLS actually publishes it.
 *
 * This is the whole safety property: a made-up code fails the lookup and we
 * fall through to local matching, so a hallucination costs us precision rather
 * than correctness.
 */
export function occupationByCode(raw: string | undefined): Occupation | null {
  if (!raw) return null;
  const code = canonicalCode(raw);
  if (code.length !== 6) return null;
  return BY_CODE.get(code) ?? null;
}

/**
 * Score a career phrase against one occupation title.
 *
 * Weighted toward covering the QUERY rather than the title: someone typing
 * "nurse" should reach "Registered Nurses" even though the title carries a
 * word they didn't type, but someone typing "nurse anesthetist" should not
 * settle for plain "Registered Nurses" when the more specific title exists.
 */
function score(queryTokens: string[], entry: (typeof NORMALIZED)[number]): number {
  if (!queryTokens.length) return 0;

  let matched = 0;
  for (const token of queryTokens) {
    if (entry.tokens.has(token)) {
      matched++;
      continue;
    }
    // Partial credit for a token that's contained in one of the title's words
    // ("dental" inside "dentistry"), which is common between how people speak
    // and how BLS writes.
    for (const titleToken of entry.tokens) {
      if (titleToken.length > 4 && token.length > 4) {
        if (titleToken.startsWith(token) || token.startsWith(titleToken)) {
          matched += 0.6;
          break;
        }
      }
    }
  }

  const queryCoverage = matched / queryTokens.length;
  const titleCoverage = matched / entry.tokens.size;

  // 75/25 toward the query. Title coverage is kept in the mix only to break
  // ties toward the more specific of two titles that both cover the query.
  return queryCoverage * 0.75 + titleCoverage * 0.25;
}

/**
 * Find the BLS occupation a career refers to, or null if none is close enough.
 *
 * `hint` is the model's proposed SOC code. It's trusted only when it resolves
 * to a real occupation AND local matching doesn't strongly prefer something
 * else, so a confident local match can overrule a plausible-looking guess.
 */
export function matchOccupation(
  career: string,
  hint?: string
): OccupationMatch | null {
  const queryTokens = tokenize(career);
  if (!queryTokens.length) return null;

  const normal = queryTokens.slice().sort().join(" ");

  // An exact title match is unambiguous and beats everything, including the
  // hint — "Registered Nurses" typed verbatim means that occupation.
  const exact = NORMALIZED.find((entry) => entry.normal === normal);
  if (exact) {
    return { ...exact.occupation, score: 1, via: "exact" };
  }

  let best: (typeof NORMALIZED)[number] | null = null;
  let bestScore = 0;
  for (const entry of NORMALIZED) {
    const value = score(queryTokens, entry);
    if (value > bestScore) {
      bestScore = value;
      best = entry;
    }
  }

  const hinted = occupationByCode(hint);
  if (hinted) {
    // A local match has to be clearly better, not merely better, to displace a
    // code the model gave deliberately. 0.8 is "the query almost is this title".
    if (!best || bestScore < 0.8 || best.occupation.code === hinted.code) {
      return { ...hinted, score: Math.max(bestScore, 0.7), via: "hint" };
    }
  }

  if (!best || bestScore < MATCH_FLOOR) return null;

  return { ...best.occupation, score: bestScore, via: "fuzzy" };
}

/** Exposed for tests and for the "we matched you to X" line on the page. */
export function occupationCount(): number {
  return OCCUPATIONS.length;
}
