// Accredited Florida institutions for the school selector.
//
// Inclusion criterion: institutional accreditation by SACSCOC (the regional
// accreditor covering Florida). The Florida College System and State
// University System lists are complete; the private list is curated to
// well-known SACSCOC members and can grow. Schools accredited only nationally
// or vocationally (e.g. Full Sail, ACCSC) are deliberately excluded.
//
// `logo` is an optional image for the selector; when absent the UI falls back
// to a monogram chip tinted with `color`. Colors are approximations of each
// school's primary brand color, used only for that fallback chip — they are
// not official palettes.
//
// ADDING A LOGO — the fallback exists because this can't be automated safely.
// Most schools serve only ONE logo in their site header, and because their
// headers are dark, that file is usually the white/inverse variant: it
// downloads fine, passes every check, and renders invisible on our white
// dropdown. UF, FSU, and Valencia all failed exactly this way. So:
//
//   1. Save the standard (dark-on-transparent) mark to public/logos/<id>.png
//   2. Set `logo: "/logos/<id>.png"` below
//   3. LOOK AT IT in the running app — a blank row means you got the inverse
//
// Logos are trademarks. Displaying them to identify the school is ordinary
// nominative use, but take them from the school's own brand page and skim its
// guidelines rather than hotlinking from wherever.

export type SchoolKind = "state-college" | "public-university" | "private";

export interface School {
  id: string;
  name: string;
  /** 2–4 characters for the fallback monogram chip. */
  shortName: string;
  city: string;
  kind: SchoolKind;
  /** Approximate primary brand color for the fallback chip. */
  color: string;
  logo?: string;
}

export const SCHOOL_KIND_LABELS: Record<SchoolKind, string> = {
  "state-college": "Florida College System",
  "public-university": "State Universities",
  private: "Private Universities & Colleges",
};

/** The identity shown before a visitor has picked a school. */
export const DEFAULT_SCHOOL_ID = "default";

// Not a real school, so it's deliberately NOT in FLORIDA_SCHOOLS — that's what
// keeps it out of the selector dropdown and its search results. It exists so
// a first-time visitor sees Vocation's own mark and a neutral blue instead of
// one school's branding before they've chosen anything. `kind` is unused
// here (nothing groups or filters this entry) and is set only to satisfy the
// type.
const DEFAULT_SCHOOL: School = {
  id: DEFAULT_SCHOOL_ID,
  name: "Vocation",
  shortName: "VOC",
  city: "",
  kind: "state-college",
  color: "#2563EB",
  logo: "/logos/default.png",
};

export const FLORIDA_SCHOOLS: School[] = [
  // --- Florida College System (all 28) ------------------------------------
  { id: "broward", name: "Broward College", shortName: "BC", city: "Fort Lauderdale", kind: "state-college", color: "#00539F", logo: "/logos/broward.png" },
  { id: "chipola", name: "Chipola College", shortName: "CC", city: "Marianna", kind: "state-college", color: "#003087", logo: "/logos/chipola.png" },
  { id: "cf", name: "College of Central Florida", shortName: "CF", city: "Ocala", kind: "state-college", color: "#005CB9", logo: "/logos/cf.png" },
  { id: "cfk", name: "College of the Florida Keys", shortName: "CFK", city: "Key West", kind: "state-college", color: "#006A8E", logo: "/logos/cfk.png" },
  // Blue, sampled from the school's own logo wordmark (matches the site's blue too).
  { id: "daytona", name: "Daytona State College", shortName: "DSC", city: "Daytona Beach", kind: "state-college", color: "#0079C2", logo: "/logos/daytona.png" },
  { id: "efsc", name: "Eastern Florida State College", shortName: "EFSC", city: "Cocoa", kind: "state-college", color: "#1B365D", logo: "/logos/efsc.png" },
  { id: "fgc", name: "Florida Gateway College", shortName: "FGC", city: "Lake City", kind: "state-college", color: "#00563F", logo: "/logos/fgc.png" },
  { id: "fsw", name: "Florida SouthWestern State College", shortName: "FSW", city: "Fort Myers", kind: "state-college", color: "#002F6C", logo: "/logos/fsw.png" },
  { id: "fscj", name: "Florida State College at Jacksonville", shortName: "FSCJ", city: "Jacksonville", kind: "state-college", color: "#003E7E", logo: "/logos/fscj.png" },
  { id: "gcsc", name: "Gulf Coast State College", shortName: "GCSC", city: "Panama City", kind: "state-college", color: "#005EB8", logo: "/logos/gcsc.png" },
  { id: "hcc", name: "Hillsborough Community College", shortName: "HCC", city: "Tampa", kind: "state-college", color: "#00447C", logo: "/logos/hcc.png" },
  { id: "irsc", name: "Indian River State College", shortName: "IRSC", city: "Fort Pierce", kind: "state-college", color: "#0067B1", logo: "/logos/irsc.png" },
  { id: "lssc", name: "Lake-Sumter State College", shortName: "LSSC", city: "Leesburg", kind: "state-college", color: "#003DA5", logo: "/logos/lssc.png" },
  {
    id: "mdc",
    name: "Miami Dade College",
    shortName: "MDC",
    city: "Miami",
    kind: "state-college",
    color: "#0053A0",
    logo: "/logos/mdc.png",
  },
  // Burgundy, sampled from the school's own logo (its colors are burgundy/gray/black).
  { id: "nfc", name: "North Florida College", shortName: "NFC", city: "Madison", kind: "state-college", color: "#8B1D41", logo: "/logos/nfc.png" },
  { id: "nwfsc", name: "Northwest Florida State College", shortName: "NWF", city: "Niceville", kind: "state-college", color: "#003087", logo: "/logos/nwfsc.png" },
  { id: "pbsc", name: "Palm Beach State College", shortName: "PBSC", city: "Lake Worth", kind: "state-college", color: "#007367", logo: "/logos/pbsc.png" },
  // Gold, sampled from the school's own logo. Light enough that schoolTheme
  // darkens step 600 for white-text contrast (same path as UCF's gold).
  { id: "phsc", name: "Pasco-Hernando State College", shortName: "PHSC", city: "New Port Richey", kind: "state-college", color: "#D0B457", logo: "/logos/phsc.png" },
  { id: "psc", name: "Pensacola State College", shortName: "PSC", city: "Pensacola", kind: "state-college", color: "#00539B", logo: "/logos/psc.png" },
  { id: "polk", name: "Polk State College", shortName: "PSC", city: "Winter Haven", kind: "state-college", color: "#A6192E", logo: "/logos/polk.png" },
  { id: "sjr", name: "St. Johns River State College", shortName: "SJR", city: "Palatka", kind: "state-college", color: "#003DA5", logo: "/logos/sjr.png" },
  { id: "spc", name: "St. Petersburg College", shortName: "SPC", city: "St. Petersburg", kind: "state-college", color: "#0066A1", logo: "/logos/spc.png" },
  { id: "sf", name: "Santa Fe College", shortName: "SF", city: "Gainesville", kind: "state-college", color: "#003865", logo: "/logos/sf.png" },
  { id: "seminole", name: "Seminole State College of Florida", shortName: "SSC", city: "Sanford", kind: "state-college", color: "#003DA5", logo: "/logos/seminole.png" },
  // Purple, sampled from southflorida.edu's live styles (their dominant brand
  // color). Note /logos/sfsc.png predates this and is still orange/navy.
  { id: "sfsc", name: "South Florida State College", shortName: "SFSC", city: "Avon Park", kind: "state-college", color: "#373668", logo: "/logos/sfsc.png" },
  { id: "scf", name: "State College of Florida, Manatee-Sarasota", shortName: "SCF", city: "Bradenton", kind: "state-college", color: "#003E7E", logo: "/logos/scf.png" },
  { id: "tsc", name: "Tallahassee State College", shortName: "TSC", city: "Tallahassee", kind: "state-college", color: "#00539F", logo: "/logos/tsc.png" },
  { id: "valencia", name: "Valencia College", shortName: "VC", city: "Orlando", kind: "state-college", color: "#B0272E", logo: "/logos/valencia.png" },

  // --- State University System (all 12) -----------------------------------
  { id: "famu", name: "Florida A&M University", shortName: "FAMU", city: "Tallahassee", kind: "public-university", color: "#006633", logo: "/logos/famu.png" },
  { id: "fau", name: "Florida Atlantic University", shortName: "FAU", city: "Boca Raton", kind: "public-university", color: "#003366", logo: "/logos/fau.png" },
  { id: "fgcu", name: "Florida Gulf Coast University", shortName: "FGCU", city: "Fort Myers", kind: "public-university", color: "#00338D", logo: "/logos/fgcu.png" },
  { id: "fiu", name: "Florida International University", shortName: "FIU", city: "Miami", kind: "public-university", color: "#081E3F", logo: "/logos/fiu.png" },
  { id: "flpoly", name: "Florida Polytechnic University", shortName: "POLY", city: "Lakeland", kind: "public-university", color: "#582C83", logo: "/logos/flpoly.png" },
  { id: "fsu", name: "Florida State University", shortName: "FSU", city: "Tallahassee", kind: "public-university", color: "#782F40", logo: "/logos/fsu.png" },
  { id: "ncf", name: "New College of Florida", shortName: "NCF", city: "Sarasota", kind: "public-university", color: "#003865", logo: "/logos/ncf.png" },
  { id: "ucf", name: "University of Central Florida", shortName: "UCF", city: "Orlando", kind: "public-university", color: "#BA9B37", logo: "/logos/ucf.png" },
  { id: "uf", name: "University of Florida", shortName: "UF", city: "Gainesville", kind: "public-university", color: "#0021A5", logo: "/logos/uf.png" },
  { id: "unf", name: "University of North Florida", shortName: "UNF", city: "Jacksonville", kind: "public-university", color: "#00246B", logo: "/logos/unf.png" },
  { id: "usf", name: "University of South Florida", shortName: "USF", city: "Tampa", kind: "public-university", color: "#006747", logo: "/logos/usf.png" },
  { id: "uwf", name: "University of West Florida", shortName: "UWF", city: "Pensacola", kind: "public-university", color: "#004C97", logo: "/logos/uwf.png" },

  // --- Private (SACSCOC-accredited, curated) ------------------------------
  { id: "avemaria", name: "Ave Maria University", shortName: "AMU", city: "Ave Maria", kind: "private", color: "#00205B", logo: "/logos/avemaria.png" },
  { id: "barry", name: "Barry University", shortName: "BU", city: "Miami Shores", kind: "private", color: "#C8102E", logo: "/logos/barry.png" },
  { id: "cookman", name: "Bethune-Cookman University", shortName: "BCU", city: "Daytona Beach", kind: "private", color: "#621244", logo: "/logos/cookman.png" },
  { id: "eckerd", name: "Eckerd College", shortName: "EC", city: "St. Petersburg", kind: "private", color: "#006BA6", logo: "/logos/eckerd.png" },
  { id: "ewu", name: "Edward Waters University", shortName: "EWU", city: "Jacksonville", kind: "private", color: "#4B2E83", logo: "/logos/ewu.png" },
  { id: "erau", name: "Embry-Riddle Aeronautical University", shortName: "ERAU", city: "Daytona Beach", kind: "private", color: "#00205B", logo: "/logos/erau.png" },
  { id: "flagler", name: "Flagler College", shortName: "FC", city: "St. Augustine", kind: "private", color: "#A6192E", logo: "/logos/flagler.png" },
  { id: "fit", name: "Florida Institute of Technology", shortName: "FIT", city: "Melbourne", kind: "private", color: "#A6192E", logo: "/logos/fit.png" },
  { id: "fmu", name: "Florida Memorial University", shortName: "FMU", city: "Miami Gardens", kind: "private", color: "#F47C30", logo: "/logos/fmu.png" },
  { id: "fsc", name: "Florida Southern College", shortName: "FSC", city: "Lakeland", kind: "private", color: "#A6192E", logo: "/logos/fsc.png" },
  { id: "ju", name: "Jacksonville University", shortName: "JU", city: "Jacksonville", kind: "private", color: "#00694E", logo: "/logos/ju.png" },
  { id: "keiser", name: "Keiser University", shortName: "KU", city: "Fort Lauderdale", kind: "private", color: "#003DA5", logo: "/logos/keiser.png" },
  { id: "lynn", name: "Lynn University", shortName: "LU", city: "Boca Raton", kind: "private", color: "#00447C", logo: "/logos/lynn.png" },
  { id: "nova", name: "Nova Southeastern University", shortName: "NSU", city: "Davie", kind: "private", color: "#003893", logo: "/logos/nova.png" },
  { id: "pba", name: "Palm Beach Atlantic University", shortName: "PBA", city: "West Palm Beach", kind: "private", color: "#003DA5", logo: "/logos/pba.png" },
  { id: "rollins", name: "Rollins College", shortName: "RC", city: "Winter Park", kind: "private", color: "#00205B", logo: "/logos/rollins.png" },
  { id: "saintleo", name: "Saint Leo University", shortName: "SLU", city: "St. Leo", kind: "private", color: "#00694E", logo: "/logos/saintleo.png" },
  { id: "stu", name: "St. Thomas University", shortName: "STU", city: "Miami Gardens", kind: "private", color: "#A6192E", logo: "/logos/stu.png" },
  { id: "stetson", name: "Stetson University", shortName: "SU", city: "DeLand", kind: "private", color: "#006747", logo: "/logos/stetson.png" },
  { id: "miami", name: "University of Miami", shortName: "UM", city: "Coral Gables", kind: "private", color: "#005030", logo: "/logos/miami.png" },
  { id: "tampa", name: "University of Tampa", shortName: "UT", city: "Tampa", kind: "private", color: "#A6192E", logo: "/logos/tampa.png" },
];

export function getSchoolById(id: string): School | undefined {
  if (id === DEFAULT_SCHOOL_ID) return DEFAULT_SCHOOL;
  return FLORIDA_SCHOOLS.find((school) => school.id === id);
}
