// Which BLS area the student actually lives in.
//
// BLS publishes wages three ways: nationally, by state, and by metropolitan
// area. The metro figure is the one that matters — "nurses make $97,550" is
// true nationally and useless in Miami, where the same job pays $91,380 against
// a cost of living that isn't the national average either.
//
// Matching a typed city to a metro is fuzzier than it looks. BLS names metros
// as multi-city hyphenated regions ("Miami-Fort Lauderdale-West Palm Beach,
// FL"), so a student in Hialeah lives in the Miami metro without "Hialeah"
// appearing anywhere in the name. We match on the component cities and fall
// back to the state, which is always resolvable and never wrong — just broader.
//
// UNITED STATES ONLY, deliberately. OEWS surveys US establishments; there is no
// row for Edinburgh. A student outside the US gets no BLS block at all rather
// than a national US figure mislabelled as theirs.

import areaTable from "@/data/bls-areas.json";
import type { StudentLocation } from "@/app/lib/intake";

export interface BlsArea {
  /** FIPS state code, "12" for Florida. */
  state: string;
  /** Seven-digit area code used in the OEWS series ID. */
  code: string;
  /** "S" state, "M" metropolitan. */
  type: string;
  name: string;
}

const AREAS = areaTable as BlsArea[];
const STATES = AREAS.filter((a) => a.type === "S");
const METROS = AREAS.filter((a) => a.type === "M");

export const NATIONAL_AREA_CODE = "0000000";

/** USPS abbreviations, needed because BLS metro names end in one. */
const STATE_ABBREVIATIONS: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", "district of columbia": "DC",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID", illinois: "IL",
  indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA",
  maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI",
  minnesota: "MN", mississippi: "MS", missouri: "MO", montana: "MT",
  nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC",
  "north dakota": "ND", ohio: "OH", oklahoma: "OK", oregon: "OR",
  pennsylvania: "PA", "puerto rico": "PR", "rhode island": "RI",
  "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX",
  utah: "UT", vermont: "VT", virginia: "VA", washington: "WA",
  "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
};

function clean(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Accepts "Florida" or "FL" — the intake stores whatever the student picked. */
export function stateAbbreviation(subdivision: string): string | null {
  const value = clean(subdivision);
  if (!value) return null;
  if (value.length === 2) return value.toUpperCase();
  return STATE_ABBREVIATIONS[value] ?? null;
}

export function findState(subdivision: string): BlsArea | null {
  const value = clean(subdivision);
  if (!value) return null;

  const byName = STATES.find((state) => clean(state.name) === value);
  if (byName) return byName;

  // Given "FL", go back through the abbreviation table to the full name.
  const abbreviation = value.length === 2 ? value.toUpperCase() : null;
  if (abbreviation) {
    const entry = Object.entries(STATE_ABBREVIATIONS).find(
      ([, code]) => code === abbreviation
    );
    if (entry) {
      return STATES.find((state) => clean(state.name) === entry[0]) ?? null;
    }
  }

  return null;
}

/**
 * The metro whose name contains this city, within this state.
 *
 * Scoped to the state first, because city names repeat across the country —
 * there are Portlands in Oregon and Maine, and a Springfield nearly
 * everywhere. Without the state scope, "Springfield" would resolve to whichever
 * one happened to sort first.
 */
export function findMetro(city: string, subdivision: string): BlsArea | null {
  const target = clean(city);
  if (!target) return null;

  const state = findState(subdivision);
  const abbreviation = stateAbbreviation(subdivision);
  const candidates = state
    ? METROS.filter((metro) => metro.state === state.state)
    : abbreviation
      ? METROS.filter((metro) => metro.name.endsWith(`, ${abbreviation}`))
      : METROS;

  // BLS strips the state suffix onto the end: "Miami-Fort Lauderdale-West Palm
  // Beach, FL". The cities are the hyphenated part before the comma.
  for (const metro of candidates) {
    const cities = clean(metro.name.split(",")[0]).split("-");
    if (cities.some((name) => name === target)) return metro;
  }

  // Nothing matched a whole component, so accept a city that appears inside
  // one — "St. Petersburg" against "Tampa-St. Petersburg-Clearwater".
  for (const metro of candidates) {
    if (clean(metro.name.split(",")[0]).includes(target)) return metro;
  }

  return null;
}

export interface ResolvedAreas {
  /** Always present — the national figure is the comparison baseline. */
  national: BlsArea;
  state: BlsArea | null;
  metro: BlsArea | null;
}

const NATIONAL: BlsArea = {
  state: "00",
  code: NATIONAL_AREA_CODE,
  type: "N",
  name: "United States",
};

/**
 * Resolve an intake location to the areas we can ask BLS about.
 *
 * Returns null outside the US, which is the signal to the profile route to
 * skip the whole BLS block rather than quote US figures at someone who doesn't
 * live there.
 */
export function resolveAreas(
  location: Pick<StudentLocation, "countryCode" | "subdivision" | "city"> | undefined
): ResolvedAreas | null {
  if (!location || location.countryCode?.toUpperCase() !== "US") return null;

  const state = location.subdivision ? findState(location.subdivision) : null;
  const metro =
    location.city && location.subdivision
      ? findMetro(location.city, location.subdivision)
      : null;

  return { national: NATIONAL, state, metro };
}
