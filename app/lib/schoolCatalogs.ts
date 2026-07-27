// Which schools we hold a real program catalog for.
//
// Kept in its own tiny module so client components can ask the question without
// pulling in the catalogs themselves — importing this from pathwayPrompts would
// drag all 287 FIU programs into the browser bundle just to check two strings.

export const SCHOOLS_WITH_CATALOG = [
  "mdc",
  "fiu",
  "broward",
  "cf",
  "efsc",
  "fgc",
  "fscj",
  "fsw",
  "nwfsc",
  "polk",
  "psc",
  "scf",
  "sf",
  "sfsc",
  "sjr",
  "cfk",
  "chipola",
  "gcsc",
  "irsc",
  "tsc",
  "valencia",
  "daytona",
  "hcc",
  "lssc",
  "nfc",
  "pbsc",
  "phsc",
  "spc",
  "seminole",
  "ucf",
  "uf",
  "fgcu",
  "uwf",
  "ncf",
  "unf",
  "flpoly",
  "usf",
  "fau",
  "famu",
  "fsu",
  "miami",
  "stetson",
  "erau",
  "tampa",
  "barry",
  "lynn",
] as const;

export type CatalogSchoolId = (typeof SCHOOLS_WITH_CATALOG)[number];

export function hasCatalog(schoolId: string): schoolId is CatalogSchoolId {
  return (SCHOOLS_WITH_CATALOG as readonly string[]).includes(schoolId);
}
