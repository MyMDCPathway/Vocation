// The merged view /schools reads from.
//
// Two tiers, not one: 61 curated Florida schools with real identity (logo,
// brand color, kind, hand-placed campus coordinates) plus, on request, every
// other real institution the US Dept. of Education's College Scorecard
// tracks — data/scorecard.json is a NATIONAL pull (see
// scripts/fetch-scorecard.mjs), not the Florida-only snapshot this file
// originally merged against. A non-curated school gets no logo and no brand
// color (a fixed neutral instead — inventing one would be exactly the kind
// of unearned identity Rule 1 forbids) and no scraped catalog, but every
// other field — name, city, state, real coordinates, real Scorecard figures,
// its own real website — is as real as a curated school's.
//
// Four sources, none of which know about each other:
//   floridaSchools.ts    curated identity — name, logo, brand color, kind
//   geography.ts         SCHOOL_COORDINATES — curated schools' campus lat/lng
//   scorecard.ts         real federal earnings/completion/admission/price/
//                         coordinates/website, national in scope
//   (synthesis below)    turns an uncurated Scorecard row into the same
//                         DirectorySchool shape a curated one gets
//
// Server-only. /schools' API route reads this; nothing here ships to the
// browser bundle, the same discipline apiCache.ts and scorecard.ts follow —
// /plan's 232 kB catalog bundle (HANDOFF §14) is the known cost of skipping
// that discipline once, not a pattern to repeat.
//
// Rule 1 (never invent school data) governs every merge here exactly as it
// does the catalogs: a school with no Scorecard row gets `scorecard:
// undefined`, never an estimated figure standing in for a real one.

import { FLORIDA_SCHOOLS, getSchoolById, type School } from "@/app/lib/floridaSchools";
import { SCHOOL_COORDINATES, distanceMiles, type Coordinates } from "@/app/lib/geography";
import { hasCatalog } from "@/app/lib/schoolCatalogs";
import {
  findScorecardMatch,
  getScorecardByUnitId,
  listAllScorecardSchools,
  type ScorecardSchool,
} from "@/app/lib/scorecard";
import type { SchoolKindRef } from "@/app/lib/schoolRef";

export interface DirectorySchool {
  id: string;
  name: string;
  shortName: string;
  city: string;
  /** Two-letter USPS code. "FL" for every curated school; the real Scorecard
   *  value (which also covers DC and the territories) for a synthesized one. */
  state: string | null;
  /** SchoolKindRef, not floridaSchools.ts's narrower SchoolKind — a
   *  synthesized school has no Florida College System-style classification,
   *  only what Scorecard's ownership field actually tells us (public,
   *  private) or "unknown" when it tells us nothing. Reuses the same
   *  "unknown" member schoolRef.ts already defines for AI-discovered
   *  schools rather than inventing a new one. */
  kind: SchoolKindRef;
  color: string;
  logo?: string;
  /** The school's own real homepage, when Scorecard reports one — the
   *  fallback link for a school with no catalog and no curated resource
   *  list (see /api/schools/[id]/programs). */
  website?: string | null;
  latitude?: number;
  longitude?: number;
  /** Whether app/lib/programs/*.ts has a real scraped catalog for this
   *  school — the "full catalog" badge is this, not a guess. Always false
   *  for a synthesized school: every catalog we hold is keyed to a curated
   *  Florida id. */
  hasCatalog: boolean;
  /** Miles from the request's origin, when one was supplied and both ends
   *  have usable coordinates. Never backfilled with a guess. */
  distanceMiles: number | null;
  /** Real US Dept. of Education figures, present only when a Scorecard row
   *  was actually joined (by name-match for a curated school, or directly —
   *  it IS the source row — for a synthesized one). */
  scorecard?: {
    admissionRate: number | null;
    completionRate: number | null;
    medianEarnings10yr: number | null;
    netPrice: number | null;
    studentSize: number | null;
  };
}

function toDirectorySchool(school: School, origin?: Coordinates): DirectorySchool {
  const coords = SCHOOL_COORDINATES[school.id];
  const scorecardRow = findScorecardMatch(school.name, "FL");
  // Reuses geography.ts's own haversine rather than a second implementation
  // — that file already carries this exact formula for the intake's "closest
  // to home" ranking (HANDOFF rule 9: grep for the others before adding one).
  const miles = origin && coords ? distanceMiles(origin, coords) : null;

  return {
    id: school.id,
    name: school.name,
    shortName: school.shortName,
    city: school.city,
    state: "FL",
    kind: school.kind,
    color: school.color,
    logo: school.logo,
    website: scorecardRow?.website,
    latitude: coords?.lat,
    longitude: coords?.lng,
    hasCatalog: hasCatalog(school.id),
    distanceMiles: miles,
    scorecard: scorecardRow
      ? {
          admissionRate: scorecardRow.admissionRate,
          completionRate: scorecardRow.completionRate,
          medianEarnings10yr: scorecardRow.medianEarnings10yr,
          netPrice: scorecardRow.netPrice,
          studentSize: scorecardRow.studentSize,
        }
      : undefined,
  };
}

/** Id prefix for a school known only from Scorecard, never from
 *  floridaSchools.ts — mirrors schoolRef.ts's OPEN_SCHOOL_PREFIX convention
 *  of making the two kinds of school un-confusable by id shape alone. IPEDS
 *  UnitID is Scorecard's own stable identity, so it's a safe, deterministic
 *  suffix. */
const SYNTHESIZED_PREFIX = "sc-";

function synthesizedId(unitId: number): string {
  return `${SYNTHESIZED_PREFIX}${unitId}`;
}

export function isSynthesizedSchoolId(id: string): boolean {
  return id.startsWith(SYNTHESIZED_PREFIX);
}

const SHORT_NAME_STOPWORDS = new Set(["of", "the", "and", "at", "in", "for", "&"]);

/** Initials from significant words ("University of Michigan" -> "UM"),
 *  capped at four characters for the monogram chip — same box SchoolMark
 *  already draws for a curated school with no logo. */
function shortNameFor(name: string): string {
  const words = name
    .split(/\s+/)
    .filter((word) => word && !SHORT_NAME_STOPWORDS.has(word.toLowerCase()));
  const initials = words.map((word) => word[0]).join("").toUpperCase();
  return (initials || name.replace(/\s+/g, "")).slice(0, 4);
}

/** Scorecard's ownership code (1 public, 2 private nonprofit, 3 private
 *  for-profit) is the only classification a non-curated school has — mapped
 *  to schoolRef.ts's existing SchoolKindRef rather than a new vocabulary.
 *  Neither value distinguishes a community college from a university the
 *  way floridaSchools.ts's curated "state-college" does, because Scorecard's
 *  ownership field genuinely doesn't carry that distinction. */
function kindFromOwnership(ownership: number | null): SchoolKindRef {
  if (ownership === 1) return "public-university";
  if (ownership === 2 || ownership === 3) return "private";
  return "unknown";
}

/** Not a real brand color — a fixed neutral for every school whose actual
 *  color we don't curate, the same "no invented brand asset" rule
 *  floridaSchools.ts states for logos. Slate-500, already in the design
 *  system's neutral ramp. */
const UNCURATED_COLOR = "#64748B";

function toSynthesizedDirectorySchool(row: ScorecardSchool, origin?: Coordinates): DirectorySchool {
  const hasCoords = typeof row.latitude === "number" && typeof row.longitude === "number";
  const coords = hasCoords ? { lat: row.latitude as number, lng: row.longitude as number } : undefined;
  const miles = origin && coords ? distanceMiles(origin, coords) : null;

  return {
    id: synthesizedId(row.unitId),
    name: row.name ?? `Institution ${row.unitId}`,
    shortName: shortNameFor(row.name ?? String(row.unitId)),
    city: row.city ?? "",
    state: row.state,
    kind: kindFromOwnership(row.ownership),
    color: UNCURATED_COLOR,
    website: row.website,
    latitude: coords?.lat,
    longitude: coords?.lng,
    hasCatalog: false,
    distanceMiles: miles,
    scorecard: {
      admissionRate: row.admissionRate,
      completionRate: row.completionRate,
      medianEarnings10yr: row.medianEarnings10yr,
      netPrice: row.netPrice,
      studentSize: row.studentSize,
    },
  };
}

/** Scorecard UnitIDs already claimed by a curated Florida identity — kept
 *  out of the synthesized list so the same physical school never appears
 *  twice under two different ids and two different sets of chrome. */
function claimedUnitIds(): Set<number> {
  const claimed = new Set<number>();
  for (const school of FLORIDA_SCHOOLS) {
    const match = findScorecardMatch(school.name, "FL");
    if (match) claimed.add(match.unitId);
  }
  return claimed;
}

/**
 * Every school /schools can show, for a given scope:
 *
 *   "FL" (default)   The 61 curated Florida schools only — unchanged from
 *                     before this file gained national scope. This is the
 *                     product's home turf and the out-of-the-box view.
 *   "ALL"             The 61 curated schools plus every other real Scorecard
 *                     institution nationwide, synthesized.
 *   any other 2-letter code   Only that state's schools — curated Florida
 *                     identities if the code is "FL" (handled above), pure
 *                     synthesis otherwise, since floridaSchools.ts only ever
 *                     curates Florida.
 */
export function listDirectorySchools(
  origin?: Coordinates,
  scope: string = "FL"
): DirectorySchool[] {
  const normalizedScope = scope.toUpperCase();
  const curated = FLORIDA_SCHOOLS.map((school) => toDirectorySchool(school, origin));
  if (normalizedScope === "FL") return curated;

  const claimed = claimedUnitIds();
  const synthesized = listAllScorecardSchools()
    .filter((row) => row.name && !claimed.has(row.unitId))
    .filter((row) => normalizedScope === "ALL" || row.state === normalizedScope)
    .map((row) => toSynthesizedDirectorySchool(row, origin));

  return normalizedScope === "ALL" ? [...curated, ...synthesized] : synthesized;
}

/** Every real state (plus DC and the territories Scorecard tracks) with at
 *  least one institution — the state-filter dropdown's options, always the
 *  full set regardless of any current filter. */
export function listDirectoryStates(): string[] {
  const states = new Set<string>();
  for (const row of listAllScorecardSchools()) {
    if (row.state) states.add(row.state);
  }
  return [...states].sort();
}

/**
 * One school by id, whichever kind it is — used by /schools/[id] and its
 * programs route so a synthesized (non-curated) school resolves too, instead
 * of only ever recognizing the 61 ids floridaSchools.ts curates. A single
 * UnitID lookup, not a rebuild of the full national list, so loading one
 * school's page never scans all 6,000+ Scorecard rows.
 */
export function getDirectorySchoolById(id: string, origin?: Coordinates): DirectorySchool | null {
  if (isSynthesizedSchoolId(id)) {
    const unitId = Number(id.slice(SYNTHESIZED_PREFIX.length));
    if (!Number.isFinite(unitId)) return null;
    const row = getScorecardByUnitId(unitId);
    if (!row || !row.name) return null;
    return toSynthesizedDirectorySchool(row, origin);
  }

  const curated = getSchoolById(id);
  if (!curated) return null;
  return toDirectorySchool(curated, origin);
}

export type SchoolSortKey = "distance" | "earnings" | "completion" | "price" | "name";

const SORT_LABELS: Record<SchoolSortKey, string> = {
  distance: "Distance",
  earnings: "Median earnings (10yr)",
  completion: "Completion rate",
  price: "Average net price",
  name: "Name",
};

export function sortLabel(key: SchoolSortKey): string {
  return SORT_LABELS[key];
}

function metricFor(school: DirectorySchool, key: SchoolSortKey): number | null {
  switch (key) {
    case "distance":
      return school.distanceMiles;
    case "earnings":
      return school.scorecard?.medianEarnings10yr ?? null;
    case "completion":
      return school.scorecard?.completionRate ?? null;
    case "price":
      return school.scorecard?.netPrice ?? null;
    case "name":
      return null;
  }
}

/**
 * Sorts by a real figure only — a school with no value for the chosen sort
 * always sorts after every school that has one, rather than being placed by
 * an assumed 0 or dropped silently. "Lower is better" for distance and net
 * price; "higher is better" for earnings and completion.
 */
export function sortDirectorySchools(
  schools: DirectorySchool[],
  key: SchoolSortKey
): DirectorySchool[] {
  const sorted = [...schools];

  if (key === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }

  const ascending = key === "distance" || key === "price";
  sorted.sort((a, b) => {
    const av = metricFor(a, key);
    const bv = metricFor(b, key);
    if (av === null && bv === null) return a.name.localeCompare(b.name);
    if (av === null) return 1;
    if (bv === null) return -1;
    return ascending ? av - bv : bv - av;
  });
  return sorted;
}
