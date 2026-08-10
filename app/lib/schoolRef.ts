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
  /**
   * Main-campus coordinates, for the map pin.
   *
   * Catalog schools take these from SCHOOL_COORDINATES, which was compiled by
   * hand. AI-discovered schools get them from the discovery call, validated by
   * `hasUsableCoordinates` before they're trusted — a school with no usable
   * pair is listed without a pin rather than dropped, because being unable to
   * place it on a map says nothing about whether it's a good school.
   */
  latitude?: number;
  longitude?: number;
  /** One line on why this school is relevant to the career. */
  note?: string;
}

/**
 * Whether a school can be put on a map.
 *
 * Null Island (0, 0) is the giveaway for a model that filled the field in
 * because the schema asked rather than because it knew — it's in the Gulf of
 * Guinea, and no university is there. Treating it as missing costs one pin;
 * trusting it puts a school in the ocean.
 */
export function hasUsableCoordinates(
  school: Pick<SchoolRef, "latitude" | "longitude">
): school is SchoolRef & { latitude: number; longitude: number } {
  const { latitude, longitude } = school;
  if (typeof latitude !== "number" || typeof longitude !== "number") return false;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (latitude === 0 && longitude === 0) return false;
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
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

/** Must match schoolDirectory.ts's own SYNTHESIZED_PREFIX — duplicated
 *  rather than imported because that file's module graph pulls in the
 *  multi-megabyte national Scorecard snapshot, which must never reach a
 *  client bundle (see its own header). This constant alone is safe to ship;
 *  the file it mirrors is not. */
const DIRECTORY_SYNTHESIZED_PREFIX = "sc-";

/** The subset of DirectorySchool this needs — not the type itself, so a
 *  client component can build one without importing schoolDirectory.ts. */
export interface DirectorySchoolLike {
  id: string;
  name: string;
  city: string;
  state: string | null;
  kind: SchoolKindRef;
  hasCatalog: boolean;
  website?: string | null;
  latitude?: number;
  longitude?: number;
  distanceMiles: number | null;
}

/**
 * Turns a school picked from the directory (/schools, or an intake step
 * built on the same data) into a SchoolRef the rest of the app already knows
 * how to plan against.
 *
 * A curated Florida school keeps its own id and, if we hold a scraped
 * catalog for it, source: "catalog" — completely unchanged from before.
 * A synthesized (Scorecard-only) school gets remapped to the "open:" id
 * scheme /api/find-schools already gives every AI-discovered school, so it
 * flows through the exact same tested path (isOpenSchool, /api/generate-
 * pathway's open-prompt-plus-URL-verification branch) rather than a new one
 * built just for this.
 */
export function directorySchoolToRef(
  school: DirectorySchoolLike,
  subdivision: string
): SchoolRef {
  const curated = !school.id.startsWith(DIRECTORY_SYNTHESIZED_PREFIX);
  return {
    id: curated ? school.id : openSchoolId(school.name),
    name: school.name,
    city: school.city,
    subdivision,
    countryCode: "US",
    kind: school.kind,
    source: curated && school.hasCatalog ? "catalog" : "ai",
    website: school.website ?? undefined,
    latitude: school.latitude,
    longitude: school.longitude,
    distanceMiles: school.distanceMiles,
  };
}
