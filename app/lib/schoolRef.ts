// One shape for "a school", however we came to know about it.
//
// Vocation now plans against two very different kinds of school:
//
//   source: "catalog"  One of the 53 Florida schools whose entire program list
//                      was scraped from its own site. The pathway prompt is
//                      constrained to that list, so the model cannot invent a
//                      degree. This is the high-confidence path and it is
//                      unchanged from 1.0.
//
//   source: "ai"       Any other school on earth. There's no catalog to
//                      constrain against, so the model proposes programs AND
//                      the URLs it thinks they live at, and the server fetches
//                      those URLs before we show anything. See urlVerify.ts.
//
// Everything downstream — track resolution, cost, the plan page — works off
// this shape and branches on `source` only where the difference is real.
//
// Client-safe: no imports, so a browser component can hold these without
// dragging a catalog into the bundle.

export type SchoolConfidence = "catalog" | "ai";

export type SchoolKindRef =
  | "state-college"
  | "public-university"
  | "private"
  | "community-college"
  | "unknown";

export interface TuitionEstimate {
  low: number;
  high: number;
  /** Currency the school actually quotes, e.g. "GBP". Display uses this. */
  currency: string;
  /** Same figure converted to USD so tracks can be compared. */
  usdLow: number;
  usdHigh: number;
}

export interface SchoolRef {
  /**
   * Stable identity. Catalog schools keep their floridaSchools.ts id ("mdc")
   * so every existing lookup still works. AI-discovered schools are prefixed
   * ("open:harvard-university") so the two can never be confused — and so
   * `hasCatalog()` returns false for them without a special case.
   */
  id: string;
  name: string;
  city: string;
  /** State, province, prefecture — whatever the country calls it. */
  subdivision: string;
  countryCode: string;
  kind: SchoolKindRef;
  source: SchoolConfidence;
  /** Homepage. */
  website?: string;
  /** The school's general programs/majors index — the verification fallback. */
  programsUrl?: string;
  tuition?: TuitionEstimate;
  /** Straight-line miles from the student, when we can compute it. */
  distanceMiles?: number | null;
  /** One line on why this school is relevant to the career. */
  note?: string;
}

export const OPEN_SCHOOL_PREFIX = "open:";

export function isOpenSchool(id: string): boolean {
  return id.startsWith(OPEN_SCHOOL_PREFIX);
}

/**
 * A stable id for a school we only know by name.
 *
 * Used as part of a cache key, so it has to be deterministic: the same school
 * named the same way must produce the same id on every request, or every
 * lookup is a miss and every plan costs a fresh generation.
 */
export function openSchoolId(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${OPEN_SCHOOL_PREFIX}${slug}`;
}

/** The name to show, given we might know the city and might not. */
export function schoolLocationLabel(school: SchoolRef): string {
  return [school.city, school.subdivision].filter(Boolean).join(", ");
}
