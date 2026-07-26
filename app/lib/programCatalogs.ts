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
import { CF_PROGRAMS } from "./programs/cf";
import { CFK_PROGRAMS } from "./programs/cfk";
import { CHIPOLA_PROGRAMS } from "./programs/chipola";
import { DSC_PROGRAMS } from "./programs/dsc";
import { EFSC_PROGRAMS } from "./programs/efsc";
import { FGC_PROGRAMS } from "./programs/fgc";
import { FSCJ_PROGRAMS } from "./programs/fscj";
import { FSW_PROGRAMS } from "./programs/fsw";
import { GCSC_PROGRAMS } from "./programs/gcsc";
import { HCC_PROGRAMS } from "./programs/hcc";
import { IRSC_PROGRAMS } from "./programs/irsc";
import { LSSC_PROGRAMS } from "./programs/lssc";
import { NFC_PROGRAMS } from "./programs/nfc";
import { NWFSC_PROGRAMS } from "./programs/nwfsc";
import { PBSC_PROGRAMS } from "./programs/pbsc";
import { PHSC_PROGRAMS } from "./programs/phsc";
import { POLK_PROGRAMS } from "./programs/polk";
import { PSC_PROGRAMS } from "./programs/psc";
import { SCF_PROGRAMS } from "./programs/scf";
import { SF_PROGRAMS } from "./programs/sf";
import { SFSC_PROGRAMS } from "./programs/sfsc";
import { SJR_PROGRAMS } from "./programs/sjr";
import { SPC_PROGRAMS } from "./programs/spc";
import { SSC_PROGRAMS } from "./programs/ssc";
import { TSC_PROGRAMS } from "./programs/tsc";
import { ucfCatalog } from "./programs/ucf";
import { VALENCIA_PROGRAMS } from "./programs/valencia";
import { createProgramCatalog, type ProgramCatalog } from "./programCatalog";

// A state college's pathways start at an associate degree, so an unqualified
// program name should resolve there rather than to a bachelor's.
const asCollege = (programs: Parameters<typeof createProgramCatalog>[0]) =>
  createProgramCatalog(programs, { preferred: "associate" });

// FIU and Broward build their own catalog inside their data file (the older
// pattern). Newer schools keep their generated file as pure data and are wired
// up here instead, so regenerating a scraped file can never drop the catalog.
const CATALOGS: Record<string, ProgramCatalog> = {
  fiu: fiuCatalog,
  ucf: ucfCatalog,
  broward: browardCatalog,
  cf: asCollege(CF_PROGRAMS),
  efsc: asCollege(EFSC_PROGRAMS),
  fgc: asCollege(FGC_PROGRAMS),
  fscj: asCollege(FSCJ_PROGRAMS),
  fsw: asCollege(FSW_PROGRAMS),
  nwfsc: asCollege(NWFSC_PROGRAMS),
  polk: asCollege(POLK_PROGRAMS),
  psc: asCollege(PSC_PROGRAMS),
  scf: asCollege(SCF_PROGRAMS),
  sf: asCollege(SF_PROGRAMS),
  sfsc: asCollege(SFSC_PROGRAMS),
  sjr: asCollege(SJR_PROGRAMS),
  cfk: asCollege(CFK_PROGRAMS),
  chipola: asCollege(CHIPOLA_PROGRAMS),
  gcsc: asCollege(GCSC_PROGRAMS),
  irsc: asCollege(IRSC_PROGRAMS),
  tsc: asCollege(TSC_PROGRAMS),
  valencia: asCollege(VALENCIA_PROGRAMS),
  // Catalog files are dsc.ts / ssc.ts, but floridaSchools.ts ids are
  // "daytona" / "seminole" — keyed here to match the id the app actually
  // uses everywhere else.
  daytona: asCollege(DSC_PROGRAMS),
  hcc: asCollege(HCC_PROGRAMS),
  lssc: asCollege(LSSC_PROGRAMS),
  nfc: asCollege(NFC_PROGRAMS),
  pbsc: asCollege(PBSC_PROGRAMS),
  phsc: asCollege(PHSC_PROGRAMS),
  spc: asCollege(SPC_PROGRAMS),
  seminole: asCollege(SSC_PROGRAMS),
};

/** The scraped catalog for a school, or null if it has none. */
export function catalogFor(schoolId: string): ProgramCatalog | null {
  return CATALOGS[schoolId] ?? null;
}

/** School ids that have a scraped catalog (excludes MDC — see above). */
export function scrapedCatalogIds(): string[] {
  return Object.keys(CATALOGS).sort();
}
