// Reads data/scorecard-programs.json — the committed College Scorecard
// field-of-study snapshot fetched by scripts/fetch-scorecard-programs.mjs.
// Server-only, mirroring scorecard.ts exactly: this is what a program's OWN
// graduates earn, as opposed to scorecard.ts's medianEarnings10yr (every
// major at the school averaged together). Rule 1 (never invent school data)
// applies the same way — a (school, program, credential) combination this
// file has no row for gets no figure, never an estimate standing in for one.
//
// The committed file may legitimately be the empty placeholder if nobody has
// run `npm run fetch:scorecard-programs` yet — every function here degrades
// to "no data" rather than throwing, same shape scorecard.ts and
// durableCache.ts use for their own unconfigured/empty states.
//
// TWO THINGS THIS FILE'S CALLERS MUST KNOW, both discovered against a live
// API call before this was written (see the fetch script's header for the
// full detail):
//
//   1. cip4 IS COARSER than the O*NET crosswalk's cipCode. Look up with
//      `toCip4()` below, never by comparing a crosswalk cipCode directly —
//      several crosswalk entries collapse into one cip4 bucket (confirmed:
//      01.0601/01.0605/01.0607 all land on "0106"). The earnings figure this
//      file returns describes that whole program FAMILY, not the single
//      6-digit program the crosswalk matched.
//
//   2. schoolMedianEarnings is null far more often than not — real federal
//      small-cohort privacy suppression, confirmed live at ~65% of rows.
//      nationalMedianEarnings (same CIP+credential, aggregated nationally)
//      is populated far more often and is the intended fallback. This file
//      returns both and does NOT pick one for you — the "prefer school, fall
//      back to national, label whichever is shown" decision belongs to the
//      route/UI layer, the same separation scorecard.ts keeps between raw
//      data access and display choices.

import scorecardProgramsSnapshot from "@/data/scorecard-programs.json";
import type { ProgramLevel } from "@/app/lib/programCatalog";

export interface ProgramEarningsRow {
  unitId: number;
  /** Scorecard's coarser bucket — see file header. Dot-free, e.g. "0106". */
  cip4: string;
  cipTitle: string | null;
  /** Scorecard's own numeric credential scale — see LEVEL_MAP below for the
   *  mapping onto our own ProgramLevel. */
  credentialLevel: number | null;
  credentialTitle: string | null;
  /** USD. Null far more often than not — see file header. */
  schoolMedianEarnings: number | null;
  /** USD. Same (CIP, credential) pair, aggregated nationally. */
  nationalMedianEarnings: number | null;
}

interface ScorecardProgramsSnapshot {
  fetchedAt: string | null;
  source: string;
  scope: string;
  schoolCount: number;
  count: number;
  programs: ProgramEarningsRow[];
}

const COMMITTED_SNAPSHOT = scorecardProgramsSnapshot as ScorecardProgramsSnapshot;

// Same test seam as scorecard.ts's _setSnapshotForTests.
let SNAPSHOT: ScorecardProgramsSnapshot = COMMITTED_SNAPSHOT;

/** Test-only. Restores the committed file when called with null. */
export function _setProgramsSnapshotForTests(
  snapshot: ScorecardProgramsSnapshot | null
): void {
  SNAPSHOT = snapshot ?? COMMITTED_SNAPSHOT;
}

/** False for the committed empty placeholder — see the file header above. */
export function scorecardProgramsAvailable(): boolean {
  return SNAPSHOT.count > 0;
}

/** Provenance to print next to any figure this file supplies — same
 *  "never show a number without when and where it came from" rule
 *  scorecard.ts states for its own data. */
export function scorecardProgramsMeta(): Pick<
  ScorecardProgramsSnapshot,
  "fetchedAt" | "source" | "scope" | "count"
> {
  const { fetchedAt, source, scope, count } = SNAPSHOT;
  return { fetchedAt, source, scope, count };
}

/** Truncates the O*NET crosswalk's dotted 6-digit CIP code (e.g. "01.0601")
 *  to the coarser 4-character bucket Scorecard's field-of-study data reports
 *  earnings at (e.g. "0106") — dot stripped, first four characters. This is
 *  the exact transform confirmed against a live API response; see this
 *  file's header and the fetch script's header for the evidence. */
export function toCip4(cipCode: string): string {
  return cipCode.replace(".", "").slice(0, 4);
}

// Our own ProgramLevel is coarser than Scorecard's 8-point credential scale
// (plus a 99 "non-credential" bucket we never match). "certificate" and
// "bachelor" map onto exactly one Scorecard level each. "graduate" does not
// — Scorecard separately reports Master's/Doctoral/First-Professional/
// Graduate-Certificate, a distinction our catalogs don't carry. Rather than
// guess which one a given school's "graduate" program actually is, this
// tries them in the order a graduate PROGRAM (not a standalone certificate)
// is most likely to be — master's first — and returns the first level that
// has ANY row for that (unitId, cip4), i.e. the first level Scorecard itself
// reported data for at this school, not the first level with a non-null
// earnings figure. That keeps the choice "which credential did this school
// actually offer" rather than "which credential pays best", which would be
// cherry-picking.
const LEVEL_MAP: Record<ProgramLevel, number[]> = {
  certificate: [1],
  associate: [2],
  bachelor: [3],
  graduate: [5, 6, 7, 4, 8],
};

/**
 * Earnings for one (school, program family, credential) combination.
 *
 * `cipCode` is the crosswalk's dotted 6-digit code (from
 * programCareers.ts's match) — this function truncates it internally via
 * `toCip4`, so callers never need to think about the granularity mismatch
 * themselves. Returns undefined when Scorecard reports nothing for this
 * school at this credential level for this program family — never a guess,
 * never a zero standing in for missing data.
 */
export function earningsForProgram(
  unitId: number,
  cipCode: string,
  level: ProgramLevel
): ProgramEarningsRow | undefined {
  const cip4 = toCip4(cipCode);
  const candidates = SNAPSHOT.programs.filter(
    (row) => row.unitId === unitId && row.cip4 === cip4
  );
  if (candidates.length === 0) return undefined;

  for (const scorecardLevel of LEVEL_MAP[level]) {
    const match = candidates.find((row) => row.credentialLevel === scorecardLevel);
    if (match) return match;
  }
  return undefined;
}
