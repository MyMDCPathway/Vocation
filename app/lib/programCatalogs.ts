// Registry mapping a school id to its program catalog.
//
// This is the seam that keeps the UI school-agnostic: ProgramLink asks for
// "the catalog for whichever school this pathway was generated for" rather
// than branching per school. Adding a college is a scraper, a generated data
// file, and one line here.
//
// MDC is deliberately absent. Its catalog is app/lib/mdc-programs.ts, which
// predates this abstraction and carries its own bespoke URL-slug logic rather
// than a scraped name-to-URL table. It works and is well covered by tests, so
// it stays on its own path until there's a reason to move it.

import { fiuCatalog } from "./fiu-programs";
import { browardCatalog } from "./programs/broward";
import type { ProgramCatalog } from "./programCatalog";

const CATALOGS: Record<string, ProgramCatalog> = {
  fiu: fiuCatalog,
  broward: browardCatalog,
};

/** The scraped catalog for a school, or null if it has none. */
export function catalogFor(schoolId: string): ProgramCatalog | null {
  return CATALOGS[schoolId] ?? null;
}

/** School ids that have a scraped catalog (excludes MDC — see above). */
export function scrapedCatalogIds(): string[] {
  return Object.keys(CATALOGS).sort();
}
