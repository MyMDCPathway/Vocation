// "What jobs does this degree lead to?" — resolves a school's program name
// to the real occupations O*NET's own CIP-to-SOC crosswalk links it to.
//
// THE HARD PART, same as blsOccupations.ts's career matching: a school names
// a program its own way ("Nursing — R.N.", "Applied Artificial
// Intelligence"), and data/cip-soc.json speaks in CIP titles ("Registered
// Nursing/Registered Nurse", "Artificial Intelligence"). Matching them wrong
// would show a student a confident, completely invented career list under a
// real program's name — worse than showing nothing. So this mirrors
// blsOccupations.ts's approach exactly: normalize, score by token overlap,
// refuse below a floor rather than guess.
//
// Server-only: data/cip-soc.json and data/bls-occupations.json (via
// blsOccupations.ts) never need to reach the browser bundle.

import crosswalkSnapshot from "@/data/cip-soc.json";
import { occupationByCode, type Occupation } from "@/app/lib/blsOccupations";

interface CrosswalkEntry {
  cipCode: string;
  cipTitle: string;
  socCodes: string[];
}

interface CrosswalkSnapshot {
  fetchedAt: string;
  source: string;
  sourceUrl: string;
  note: string;
  count: number;
  entries: CrosswalkEntry[];
}

const SNAPSHOT = crosswalkSnapshot as CrosswalkSnapshot;

/** Same floor blsOccupations.ts uses — tuned for the same reason: a wrong
 *  program match is worse than an honest "we don't know". */
export const MATCH_FLOOR = 0.5;

const STOPWORDS = new Set([
  "and", "or", "of", "the", "a", "an", "in", "for", "with",
  "general", "other", "studies", "technology", "science", "sciences",
]);

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

const NORMALIZED = SNAPSHOT.entries.map((entry) => ({
  entry,
  tokens: new Set(tokenize(entry.cipTitle)),
}));

function score(queryTokens: string[], tokens: Set<string>): number {
  if (!queryTokens.length || !tokens.size) return 0;

  let matched = 0;
  for (const token of queryTokens) {
    if (tokens.has(token)) {
      matched++;
      continue;
    }
    for (const titleToken of tokens) {
      if (titleToken.length > 4 && token.length > 4) {
        if (titleToken.startsWith(token) || token.startsWith(titleToken)) {
          matched += 0.6;
          break;
        }
      }
    }
  }

  const queryCoverage = matched / queryTokens.length;
  const titleCoverage = matched / tokens.size;

  // Same 75/25 weighting as blsOccupations.ts's score(), for the same
  // reason: favor covering what the school actually named the program,
  // breaking ties toward the more specific CIP title.
  return queryCoverage * 0.75 + titleCoverage * 0.25;
}

export interface ProgramMatch {
  cipCode: string;
  cipTitle: string;
  score: number;
}

/** Finds the CIP program a school's program name most likely refers to, or
 *  null if nothing clears MATCH_FLOOR. Exact title matches (after
 *  normalizing) always win, the same guarantee matchOccupation() gives. */
export function matchProgramToCip(programName: string): ProgramMatch | null {
  const queryTokens = tokenize(programName);
  if (!queryTokens.length) return null;

  const normalizedQuery = queryTokens.slice().sort().join(" ");

  const exact = NORMALIZED.find(
    ({ tokens }) => [...tokens].sort().join(" ") === normalizedQuery
  );
  if (exact) {
    return { cipCode: exact.entry.cipCode, cipTitle: exact.entry.cipTitle, score: 1 };
  }

  let best: (typeof NORMALIZED)[number] | null = null;
  let bestScore = 0;
  for (const candidate of NORMALIZED) {
    const value = score(queryTokens, candidate.tokens);
    if (value > bestScore) {
      bestScore = value;
      best = candidate;
    }
  }

  if (!best || bestScore < MATCH_FLOOR) return null;
  return { cipCode: best.entry.cipCode, cipTitle: best.entry.cipTitle, score: bestScore };
}

export interface ProgramCareersResult {
  match: ProgramMatch;
  careers: Occupation[];
}

/** The real occupations a school's program leads to, or null when the
 *  program name doesn't confidently match anything in the crosswalk. */
export function careersForProgram(programName: string): ProgramCareersResult | null {
  const match = matchProgramToCip(programName);
  if (!match) return null;

  const entry = SNAPSHOT.entries.find((e) => e.cipCode === match.cipCode);
  if (!entry) return null;

  const careers = entry.socCodes
    .map((code) => occupationByCode(code))
    .filter((o): o is Occupation => o !== null);

  if (!careers.length) return null;
  return { match, careers };
}

/** Provenance to print next to any figure this file supplies. */
export function crosswalkMeta(): Pick<CrosswalkSnapshot, "source" | "sourceUrl" | "fetchedAt"> {
  const { source, sourceUrl, fetchedAt } = SNAPSHOT;
  return { source, sourceUrl, fetchedAt };
}
