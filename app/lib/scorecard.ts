// Reads data/scorecard.json — the committed US Dept. of Education College
// Scorecard snapshot fetched by scripts/fetch-scorecard.mjs. Server-only: it
// is not imported by anything that ships to the browser, the same discipline
// app/lib/apiCache.ts follows for data/seed-cache.json, and for the same
// reason /plan's 232 kB catalog bundle is a known problem rather than a
// pattern to repeat (see HANDOFF §14's "open-world schools").
//
// This is the ranking data /schools sorts by — median earnings, completion
// rate, admission rate, net price — since floridaSchools.ts deliberately
// carries none of that (it's the selector's data: name, logo, brand color).
// Rule 1 (never invent school data) governs everything here: a school this
// file has no row for gets no figure, never an estimate standing in for one.
//
// The committed data/scorecard.json may legitimately be the empty placeholder
// (count: 0) if nobody has run `npm run fetch:scorecard` with a real
// SCORECARD_API_KEY yet — every function here degrades to "no data" rather
// than throwing, the same shape durableCache.ts uses for an unconfigured
// store.

import scorecardSnapshot from "@/data/scorecard.json";

export interface ScorecardSchool {
  /** IPEDS UnitID — Scorecard's own stable identity for the institution. */
  unitId: number;
  name: string | null;
  city: string | null;
  /** Two-letter USPS state code. */
  state: string | null;
  zip: string | null;
  /** 1 public, 2 private nonprofit, 3 private for-profit. */
  ownership: number | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  studentSize: number | null;
  /** 0–1 fraction, e.g. 0.42 = 42%. */
  admissionRate: number | null;
  /** 0–1 fraction. 4-year completion where reported, else less-than-4-year. */
  completionRate: number | null;
  /** USD. */
  medianEarnings10yr: number | null;
  /** USD, average net price after aid. */
  netPrice: number | null;
}

interface ScorecardSnapshot {
  fetchedAt: string | null;
  source: string;
  scope: string;
  count: number;
  schools: ScorecardSchool[];
}

const COMMITTED_SNAPSHOT = scorecardSnapshot as ScorecardSnapshot;

// Swappable so tests can exercise real-looking match/lookup behavior without
// depending on data/scorecard.json actually being populated — the same seam
// apiCache.ts's _setSeedForTests gives the committed pathway seed file.
let SNAPSHOT: ScorecardSnapshot = COMMITTED_SNAPSHOT;

/** Test-only. Restores the committed file when called with null. */
export function _setSnapshotForTests(snapshot: ScorecardSnapshot | null): void {
  SNAPSHOT = snapshot ?? COMMITTED_SNAPSHOT;
}

/** False for the committed empty placeholder — see the file header above. */
export function scorecardAvailable(): boolean {
  return SNAPSHOT.count > 0;
}

/** Provenance to print next to any figure this file supplies — never show a
 *  number without also showing when and where it came from. */
export function scorecardMeta(): Pick<ScorecardSnapshot, "fetchedAt" | "source" | "scope" | "count"> {
  const { fetchedAt, source, scope, count } = SNAPSHOT;
  return { fetchedAt, source, scope, count };
}

export function getScorecardByUnitId(unitId: number): ScorecardSchool | undefined {
  return SNAPSHOT.schools.find((school) => school.unitId === unitId);
}

export function listScorecardByState(stateCode: string): ScorecardSchool[] {
  const upper = stateCode.toUpperCase();
  return SNAPSHOT.schools.filter((school) => school.state === upper);
}

/** Every institution the committed snapshot holds, unfiltered — the source
 *  schoolDirectory.ts synthesizes non-Florida (and un-curated Florida)
 *  entries from, now that this snapshot is a national pull rather than
 *  Florida-only. */
export function listAllScorecardSchools(): ScorecardSchool[] {
  return SNAPSHOT.schools;
}

/** Lowercased, punctuation-stripped, whitespace-collapsed — good enough to
 *  compare Scorecard's IPEDS name against floridaSchools.ts's own, not
 *  loose enough to blur two different institutions into one match. */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Joins a floridaSchools.ts entry to its real Scorecard row by name, scoped
 * to the state, so "College of Central Florida" in FL can never accidentally
 * match a same-named school elsewhere.
 *
 * Deliberately exact-after-normalization, not fuzzy. A wrong match would put
 * one school's real earnings/completion figures under another school's name,
 * which is worse than showing no figure at all (the same "prefer no link
 * over a wrong link" call HANDOFF rule 7 makes for program URLs). Returns
 * undefined rather than guessing whenever normalization doesn't produce
 * exactly one candidate.
 */
export function findScorecardMatch(
  name: string,
  stateCode: string
): ScorecardSchool | undefined {
  const target = normalizeName(name);
  const candidates = listScorecardByState(stateCode).filter(
    (school) => school.name && normalizeName(school.name) === target
  );
  return candidates.length === 1 ? candidates[0] : undefined;
}
