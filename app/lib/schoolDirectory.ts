// The merged view /schools reads from: every Florida school we know, plus
// whatever real ranking data we hold for it.
//
// Three sources, none of which know about each other:
//   floridaSchools.ts    identity — name, logo, brand color, kind
//   geography.ts         SCHOOL_COORDINATES — campus-level lat/lng
//   scorecard.ts         real federal earnings/completion/admission/price
//
// Server-only. /schools' API route reads this; nothing here ships to the
// browser bundle, the same discipline apiCache.ts and scorecard.ts follow —
// /plan's 232 kB catalog bundle (HANDOFF §14) is the known cost of skipping
// that discipline once, not a pattern to repeat.
//
// Rule 1 (never invent school data) governs every merge here exactly as it
// does the catalogs: a school with no Scorecard row gets `scorecard:
// undefined`, never an estimated figure standing in for a real one.

import { FLORIDA_SCHOOLS, type School, type SchoolKind } from "@/app/lib/floridaSchools";
import { SCHOOL_COORDINATES, distanceMiles, type Coordinates } from "@/app/lib/geography";
import { hasCatalog } from "@/app/lib/schoolCatalogs";
import { findScorecardMatch } from "@/app/lib/scorecard";

export interface DirectorySchool {
  id: string;
  name: string;
  shortName: string;
  city: string;
  kind: SchoolKind;
  color: string;
  logo?: string;
  latitude?: number;
  longitude?: number;
  /** Whether app/lib/programs/*.ts has a real scraped catalog for this
   *  school — the "full catalog" badge is this, not a guess. */
  hasCatalog: boolean;
  /** Miles from the request's origin, when one was supplied and both ends
   *  have usable coordinates. Never backfilled with a guess. */
  distanceMiles: number | null;
  /** Real US Dept. of Education figures, present only when scorecard.ts
   *  found exactly one confident match for this school in Florida. */
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
    kind: school.kind,
    color: school.color,
    logo: school.logo,
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

/** Every Florida school /schools can show, merged with whatever real
 *  distance and Scorecard figures we have for it. FLORIDA_SCHOOLS already
 *  excludes the "no school picked yet" placeholder entry, so nothing here
 *  needs to filter it back out. */
export function listDirectorySchools(origin?: Coordinates): DirectorySchool[] {
  return FLORIDA_SCHOOLS.map((school) => toDirectorySchool(school, origin));
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
