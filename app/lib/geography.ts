// Where schools are, and where the student is.
//
// Vocation 2.0 picks schools *for* the student instead of asking them to pick
// one, so it needs to answer "which of these 61 schools is closest to you".
// That needs coordinates, which floridaSchools.ts deliberately doesn't carry —
// that file is the selector's data (name, logo, brand color) and has tests
// asserting its shape. Distance is a separate concern, so it lives here and is
// keyed by the same school id.
//
// Coordinates are campus-level for single-campus schools and main-campus for
// multi-campus systems (MDC has eight campuses; Kendall is not Wolfson). They
// are used only to RANK schools by distance, never displayed as a location or
// used to route anyone anywhere, so main-campus precision is the right amount.
//
// The student's own location is a region, not a point. Asking for a ZIP would
// need a geocoder (a dependency, and PII we don't want); asking for a city
// means handling spelling. Regions are a closed list, they map cleanly to how
// Floridians actually describe where they live, and a region centroid ranks
// nearby schools just as well as a house address would.

export interface Coordinates {
  lat: number;
  lng: number;
}

/** Main-campus coordinates for every school in floridaSchools.ts. */
export const SCHOOL_COORDINATES: Record<string, Coordinates> = {
  // --- Florida College System ---------------------------------------------
  broward: { lat: 26.122, lng: -80.137 },
  chipola: { lat: 30.774, lng: -85.227 },
  cf: { lat: 29.187, lng: -82.14 },
  cfk: { lat: 24.555, lng: -81.78 },
  daytona: { lat: 29.211, lng: -81.023 },
  efsc: { lat: 28.386, lng: -80.742 },
  fgc: { lat: 30.19, lng: -82.639 },
  fsw: { lat: 26.64, lng: -81.872 },
  fscj: { lat: 30.332, lng: -81.656 },
  gcsc: { lat: 30.159, lng: -85.66 },
  hcc: { lat: 27.951, lng: -82.457 },
  irsc: { lat: 27.447, lng: -80.325 },
  lssc: { lat: 28.811, lng: -81.878 },
  mdc: { lat: 25.774, lng: -80.194 },
  nfc: { lat: 30.469, lng: -83.413 },
  nwfsc: { lat: 30.517, lng: -86.482 },
  pbsc: { lat: 26.617, lng: -80.057 },
  phsc: { lat: 28.244, lng: -82.719 },
  psc: { lat: 30.421, lng: -87.217 },
  polk: { lat: 28.022, lng: -81.733 },
  sjr: { lat: 29.649, lng: -81.638 },
  spc: { lat: 27.771, lng: -82.64 },
  sf: { lat: 29.652, lng: -82.325 },
  seminole: { lat: 28.8, lng: -81.273 },
  sfsc: { lat: 27.596, lng: -81.506 },
  scf: { lat: 27.498, lng: -82.575 },
  tsc: { lat: 30.438, lng: -84.281 },
  valencia: { lat: 28.538, lng: -81.379 },

  // --- State University System --------------------------------------------
  famu: { lat: 30.424, lng: -84.288 },
  fau: { lat: 26.371, lng: -80.102 },
  fgcu: { lat: 26.464, lng: -81.775 },
  fiu: { lat: 25.757, lng: -80.374 },
  flpoly: { lat: 28.147, lng: -81.851 },
  fsu: { lat: 30.442, lng: -84.298 },
  ncf: { lat: 27.383, lng: -82.557 },
  ucf: { lat: 28.602, lng: -81.2 },
  uf: { lat: 29.644, lng: -82.355 },
  unf: { lat: 30.271, lng: -81.51 },
  usf: { lat: 28.059, lng: -82.414 },
  uwf: { lat: 30.547, lng: -87.218 },

  // --- Private -------------------------------------------------------------
  avemaria: { lat: 26.339, lng: -81.418 },
  barry: { lat: 25.862, lng: -80.192 },
  cookman: { lat: 29.203, lng: -81.032 },
  eckerd: { lat: 27.712, lng: -82.687 },
  ewu: { lat: 30.339, lng: -81.667 },
  erau: { lat: 29.19, lng: -81.052 },
  flagler: { lat: 29.893, lng: -81.313 },
  fit: { lat: 28.064, lng: -80.624 },
  fmu: { lat: 25.943, lng: -80.246 },
  fsc: { lat: 28.033, lng: -81.936 },
  ju: { lat: 30.351, lng: -81.606 },
  keiser: { lat: 26.153, lng: -80.144 },
  lynn: { lat: 26.398, lng: -80.104 },
  nova: { lat: 26.081, lng: -80.242 },
  pba: { lat: 26.706, lng: -80.052 },
  rollins: { lat: 28.593, lng: -81.349 },
  saintleo: { lat: 28.336, lng: -82.259 },
  stu: { lat: 25.928, lng: -80.256 },
  stetson: { lat: 29.037, lng: -81.303 },
  miami: { lat: 25.718, lng: -80.279 },
  tampa: { lat: 27.947, lng: -82.464 },
};

export interface Region {
  id: string;
  /** How a resident would name it, not the census name. */
  label: string;
  /** Recognizable places inside it, shown as the option's subtitle. */
  examples: string;
  center: Coordinates;
}

/**
 * The answer set for "where do you live".
 *
 * ELSEWHERE_REGION_ID is deliberately not in this list — it's a real answer
 * ("I'm not in Florida") but it has no centroid, so distance ranking has to
 * skip it rather than pretend it's somewhere.
 */
export const ELSEWHERE_REGION_ID = "elsewhere";

export const FLORIDA_REGIONS: Region[] = [
  { id: "miami-dade", label: "Miami-Dade", examples: "Miami, Hialeah, Homestead", center: { lat: 25.774, lng: -80.194 } },
  { id: "broward", label: "Broward", examples: "Fort Lauderdale, Hollywood, Pembroke Pines", center: { lat: 26.122, lng: -80.137 } },
  { id: "palm-beach", label: "Palm Beach", examples: "West Palm Beach, Boca Raton, Boynton", center: { lat: 26.715, lng: -80.053 } },
  { id: "treasure-coast", label: "Treasure Coast", examples: "Port St. Lucie, Stuart, Vero Beach", center: { lat: 27.273, lng: -80.358 } },
  { id: "southwest", label: "Southwest Florida", examples: "Fort Myers, Naples, Cape Coral", center: { lat: 26.512, lng: -81.8 } },
  { id: "tampa-bay", label: "Tampa Bay", examples: "Tampa, St. Petersburg, Clearwater", center: { lat: 27.951, lng: -82.457 } },
  { id: "sarasota", label: "Sarasota–Bradenton", examples: "Sarasota, Bradenton, Venice", center: { lat: 27.437, lng: -82.556 } },
  { id: "orlando", label: "Orlando / Central Florida", examples: "Orlando, Kissimmee, Sanford", center: { lat: 28.538, lng: -81.379 } },
  { id: "space-coast", label: "Space Coast", examples: "Melbourne, Cocoa, Titusville", center: { lat: 28.286, lng: -80.741 } },
  { id: "polk", label: "Polk County", examples: "Lakeland, Winter Haven", center: { lat: 28.041, lng: -81.95 } },
  { id: "volusia", label: "Daytona / Volusia", examples: "Daytona Beach, DeLand, Ormond", center: { lat: 29.126, lng: -81.05 } },
  { id: "jacksonville", label: "Jacksonville / Northeast", examples: "Jacksonville, St. Augustine, Palatka", center: { lat: 30.332, lng: -81.656 } },
  { id: "gainesville", label: "Gainesville / North Central", examples: "Gainesville, Lake City, Starke", center: { lat: 29.652, lng: -82.325 } },
  { id: "ocala", label: "Ocala / Marion", examples: "Ocala, The Villages, Leesburg", center: { lat: 29.187, lng: -82.14 } },
  { id: "tallahassee", label: "Tallahassee / Big Bend", examples: "Tallahassee, Madison, Perry", center: { lat: 30.438, lng: -84.281 } },
  { id: "panhandle", label: "Panhandle", examples: "Pensacola, Panama City, Destin", center: { lat: 30.4, lng: -86.5 } },
  { id: "keys", label: "Florida Keys", examples: "Key West, Marathon, Key Largo", center: { lat: 24.7, lng: -81.3 } },
];

export function getRegion(id: string): Region | undefined {
  return FLORIDA_REGIONS.find((region) => region.id === id);
}

const EARTH_RADIUS_MILES = 3958.8;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance in miles. */
export function distanceMiles(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

/**
 * School ids sorted nearest-first from a region.
 *
 * Returns the candidates unchanged for a region we have no centroid for
 * (i.e. "outside Florida"), because an arbitrary ordering is more honest than
 * one that looks distance-ranked and isn't. Callers that care must check the
 * region themselves rather than reading the first element as "closest".
 */
export function schoolsNearestTo(
  regionId: string,
  candidates: readonly string[]
): string[] {
  const region = getRegion(regionId);
  if (!region) return [...candidates];

  return [...candidates].sort((a, b) => {
    const coordA = SCHOOL_COORDINATES[a];
    const coordB = SCHOOL_COORDINATES[b];
    // A school with no coordinates sorts last rather than to distance 0,
    // which is where a missing entry would otherwise land it.
    if (!coordA) return 1;
    if (!coordB) return -1;
    return (
      distanceMiles(region.center, coordA) - distanceMiles(region.center, coordB)
    );
  });
}

/** Distance from a region to a school, or null when either is unknown. */
export function distanceToSchool(
  regionId: string,
  schoolId: string
): number | null {
  const region = getRegion(regionId);
  const school = SCHOOL_COORDINATES[schoolId];
  if (!region || !school) return null;
  return distanceMiles(region.center, school);
}
