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
import { avemariaCatalog } from "./programs/avemaria";
import { barryCatalog } from "./programs/barry";
import { browardCatalog } from "./programs/broward";
import { CF_PROGRAMS } from "./programs/cf";
import { CFK_PROGRAMS } from "./programs/cfk";
import { CHIPOLA_PROGRAMS } from "./programs/chipola";
import { cookmanCatalog } from "./programs/cookman";
import { DSC_PROGRAMS } from "./programs/dsc";
import { eckerdCatalog } from "./programs/eckerd";
import { EFSC_PROGRAMS } from "./programs/efsc";
import { erauCatalog } from "./programs/erau";
import { ewuCatalog } from "./programs/ewu";
import { famuCatalog } from "./programs/famu";
import { fauCatalog } from "./programs/fau";
import { FGC_PROGRAMS } from "./programs/fgc";
import { fgcuCatalog } from "./programs/fgcu";
import { fitCatalog } from "./programs/fit";
import { flaglerCatalog } from "./programs/flagler";
import { flpolyCatalog } from "./programs/flpoly";
import { fmuCatalog } from "./programs/fmu";
import { fscCatalog } from "./programs/fsc";
import { FSCJ_PROGRAMS } from "./programs/fscj";
import { fsuCatalog } from "./programs/fsu";
import { FSW_PROGRAMS } from "./programs/fsw";
import { GCSC_PROGRAMS } from "./programs/gcsc";
import { HCC_PROGRAMS } from "./programs/hcc";
import { IRSC_PROGRAMS } from "./programs/irsc";
import { juCatalog } from "./programs/ju";
import { keiserCatalog } from "./programs/keiser";
import { novaCatalog } from "./programs/nova";
import { LSSC_PROGRAMS } from "./programs/lssc";
import { lynnCatalog } from "./programs/lynn";
import { umCatalog } from "./programs/miami";
import { ncfCatalog } from "./programs/ncf";
import { NFC_PROGRAMS } from "./programs/nfc";
import { NWFSC_PROGRAMS } from "./programs/nwfsc";
import { pbaCatalog } from "./programs/pba";
import { PBSC_PROGRAMS } from "./programs/pbsc";
import { PHSC_PROGRAMS } from "./programs/phsc";
import { POLK_PROGRAMS } from "./programs/polk";
import { PSC_PROGRAMS } from "./programs/psc";
import { rollinsCatalog } from "./programs/rollins";
import { saintleoCatalog } from "./programs/saintleo";
import { SCF_PROGRAMS } from "./programs/scf";
import { SF_PROGRAMS } from "./programs/sf";
import { SFSC_PROGRAMS } from "./programs/sfsc";
import { SJR_PROGRAMS } from "./programs/sjr";
import { SPC_PROGRAMS } from "./programs/spc";
import { SSC_PROGRAMS } from "./programs/ssc";
import { stetsonCatalog } from "./programs/stetson";
import { stuCatalog } from "./programs/stu";
import { tampaCatalog } from "./programs/tampa";
import { TSC_PROGRAMS } from "./programs/tsc";
import { ucfCatalog } from "./programs/ucf";
import { ufCatalog } from "./programs/uf";
import { unfCatalog } from "./programs/unf";
import { usfCatalog } from "./programs/usf";
import { uwfCatalog } from "./programs/uwf";
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
  uf: ufCatalog,
  fgcu: fgcuCatalog,
  uwf: uwfCatalog,
  unf: unfCatalog,
  flpoly: flpolyCatalog,
  usf: usfCatalog,
  ncf: ncfCatalog,
  fau: fauCatalog,
  famu: famuCatalog,
  fsu: fsuCatalog,
  miami: umCatalog,
  stetson: stetsonCatalog,
  erau: erauCatalog,
  tampa: tampaCatalog,
  barry: barryCatalog,
  lynn: lynnCatalog,
  rollins: rollinsCatalog,
  flagler: flaglerCatalog,
  pba: pbaCatalog,
  fit: fitCatalog,
  saintleo: saintleoCatalog,
  stu: stuCatalog,
  avemaria: avemariaCatalog,
  cookman: cookmanCatalog,
  eckerd: eckerdCatalog,
  fmu: fmuCatalog,
  ju: juCatalog,
  keiser: keiserCatalog,
  fsc: fscCatalog,
  nova: novaCatalog,
  ewu: ewuCatalog,
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
