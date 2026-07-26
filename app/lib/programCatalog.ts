// Shared machinery for every school's program catalog.
//
// Each school's catalog file (app/lib/programs/*.ts) is generated data plus one
// call to createProgramCatalog. The matching rules live here once, so adding a
// school is a scraper and a data file — not another copy of this logic.
//
// The hard part is the gap between how a school names a program and how the
// pathway generator names it. FIU lists "Accounting (BACC)", Broward lists
// "Accounting Technology", and Gemini emits "Bachelor of Science in
// Accounting". Normalizing strips case, punctuation, parenthetical degree
// codes, and the common degree prefixes so those meet in the middle.

export type ProgramLevel =
  | "certificate"
  | "associate"
  | "bachelor"
  | "graduate";

export type CostUnit =
  | "per-credit-hour"
  | "per-year"
  | "total-program"
  | "school-wide-flat-rate";

export interface ProgramCost {
  amount: number;
  unit: CostUnit;
  /** Set only when the page quotes a separate out-of-state/non-resident rate. */
  outOfStateAmount?: number;
}

export interface SchoolProgram {
  /** Program title as the school lists it. */
  name: string;
  url: string;
  level: ProgramLevel;
  /** School's own credential abbreviation, e.g. "AS", "BAS", "BACC". */
  credential?: string;
  /** College, school, or career area the program belongs to. */
  area?: string;
  /** Omit rather than guess: most schools quote one flat rate for the whole
   *  school, not a true per-program cost — see costNote for that case. */
  cost?: ProgramCost;
  /** Free-text explanation when cost is absent, a flat rate, or a range. */
  costNote?: string;
}

const DEGREE_PREFIX =
  /^(bachelor|master|doctor|associate)(s)?( of| in)?( science| arts| applied science| business administration| fine arts| public administration)?( in| of)?\s+/;

export function normalizeProgramName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function programMatchKey(value: string): string {
  return normalizeProgramName(value).replace(DEGREE_PREFIX, "").trim();
}

// Schools label degrees by code far more often than by name, so these lists
// carry every code that actually appears in a catalog we hold. A code missing
// here does not fail loudly — it silently falls through to `preferred`, which
// is how FIU's "Art Education (MAT)" used to resolve to the bachelor's of the
// same name. programCatalogs.test.ts round-trips every program to keep that
// from happening again as new catalogs land.
const GRADUATE_HINT =
  /\b(master|masters|doctor|doctoral|graduate|ph\.?d|ed\.?d|m\.?s\.?|m\.?a\.?|m\.?b\.?a|macc|mat|mfa|mha|mhsa|mia|mib|mla|mm|mpa|mpas|mph|msn|msw|psm|dba|ddes|dnp|dpt|jd|jm|llm)\b/i;

const BACHELOR_HINT =
  /\b(bachelor|bachelors|undergraduate|b\.?s\.?|b\.?a\.?|b\.?b\.?a|b\.?f\.?a|b\.?a\.?s|bacc|bhsa|bm|bppa|bpps|bsn)\b/i;

const ASSOCIATE_HINT =
  /\b(associate|associates|a\.?a\.?|a\.?s\.?|a\.?a\.?s|saat)\b/i;

// Florida colleges name certificates by abbreviation far more often than they
// spell them out — C.C.C., T.C., A.T.C., C.T.C., C.C.P., A.T.D., PSAV, V.C.,
// O.C., and FSCJ's N.C. for non-credit adult education. Without these, a
// certificate step resolves to a same-named associate degree, which is the
// exact wrong-level mis-link this module exists to prevent. Certificates are
// tested before associates in requestedLevel, so these win the tie.
const CERTIFICATE_HINT =
  /\b(certificate|certification|certificates|cert|diploma|c\.?c\.?c\.?|c\.?t\.?c\.?|c\.?c\.?p\.?|a\.?t\.?c\.?|a\.?t\.?d\.?|p\.?s\.?a\.?v\.?|t\.?c\.?|c\.?c\.?|n\.?c\.?|v\.?c\.?|o\.?c\.?)\b/i;

// "Data Analytics & AI AA Graduate" is Broward's bachelor's for students who
// arrive holding an A.A. — "graduate" is the student, not the degree level.
// Left in, it reads as a master's and the program resolves to nothing.
const GRADUATE_OF_A_DEGREE = /\b(a\.?a\.?|a\.?s\.?|b\.?a\.?|b\.?s\.?)\s+graduates?\b/gi;

/** Which level a free-text query is explicitly asking for, if any. */
export function requestedLevel(...hints: (string | undefined)[]): ProgramLevel | null {
  const text = hints.filter(Boolean).join(" ").replace(GRADUATE_OF_A_DEGREE, " ");
  if (!text.trim()) return null;
  // Order matters: "Bachelor of Applied Science" contains "applied science",
  // and a master's step often names the bachelor's it builds on.
  if (GRADUATE_HINT.test(text)) return "graduate";
  if (BACHELOR_HINT.test(text)) return "bachelor";
  if (CERTIFICATE_HINT.test(text)) return "certificate";
  if (ASSOCIATE_HINT.test(text)) return "associate";
  return null;
}

export interface ProgramCatalog {
  programs: SchoolProgram[];
  /**
   * Resolves free text to a program.
   *
   * When the query names a credential the match is STRICT — it returns nothing
   * rather than a program at the wrong level, because sending a student reading
   * a master's step to an associate degree page is worse than showing no link.
   * With no credential stated, `preferred` breaks the tie.
   */
  find(name: string, levelHint?: string): SchoolProgram | undefined;
  getUrl(name: string, levelHint?: string): string | null;
  has(name: string, levelHint?: string): boolean;
  byLevel(level: ProgramLevel): SchoolProgram[];
  areas(): string[];
}

export function createProgramCatalog(
  programs: SchoolProgram[],
  options: { preferred?: ProgramLevel } = {}
): ProgramCatalog {
  const preferred = options.preferred ?? "bachelor";

  const index = new Map<string, SchoolProgram[]>();
  for (const program of programs) {
    const keys = new Set([
      normalizeProgramName(program.name),
      programMatchKey(program.name),
    ]);
    for (const key of keys) {
      if (!key) continue;
      const bucket = index.get(key);
      if (bucket) bucket.push(program);
      else index.set(key, [program]);
    }
  }

  function find(name: string, levelHint?: string): SchoolProgram | undefined {
    if (!name) return undefined;
    const candidates =
      index.get(normalizeProgramName(name)) ?? index.get(programMatchKey(name));
    if (!candidates?.length) return undefined;

    // An explicit level hint outranks the program title, because titles
    // routinely name a level the program is not: EFSC's "Business
    // Administration, AS to BS/BAS University Transfer Specialization" is an
    // A.S., and CF's "Registered Nurse to Bachelor of Science in Nursing" is a
    // bachelor's. Reading the title first mis-levels both. Only when the caller
    // gives no usable hint do we fall back to reading the name.
    const wanted = requestedLevel(levelHint) ?? requestedLevel(name);
    if (wanted) return candidates.find((p) => p.level === wanted);

    return candidates.find((p) => p.level === preferred) ?? candidates[0];
  }

  return {
    programs,
    find,
    getUrl: (name, levelHint) => find(name, levelHint)?.url ?? null,
    has: (name, levelHint) => find(name, levelHint) !== undefined,
    byLevel: (level) => programs.filter((p) => p.level === level),
    areas: () =>
      [...new Set(programs.map((p) => p.area).filter((a): a is string => !!a))].sort(),
  };
}
