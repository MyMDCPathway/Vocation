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

export interface SchoolProgram {
  /** Program title as the school lists it. */
  name: string;
  url: string;
  level: ProgramLevel;
  /** School's own credential abbreviation, e.g. "AS", "BAS", "BACC". */
  credential?: string;
  /** College, school, or career area the program belongs to. */
  area?: string;
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

const GRADUATE_HINT =
  /\b(master|masters|m\.?s\.?|m\.?a\.?|mba|macc|m\.?b\.?a|ph\.?d|doctor|doctoral|graduate)\b/i;

const BACHELOR_HINT =
  /\b(bachelor|bachelors|b\.?s\.?|b\.?a\.?|b\.?b\.?a|b\.?f\.?a|b\.?a\.?s|bsn|bacc|undergraduate)\b/i;

const ASSOCIATE_HINT = /\b(associate|associates|a\.?a\.?|a\.?s\.?|a\.?a\.?s)\b/i;

const CERTIFICATE_HINT = /\b(certificate|certification|diploma)\b/i;

/** Which level a free-text query is explicitly asking for, if any. */
export function requestedLevel(...hints: (string | undefined)[]): ProgramLevel | null {
  const text = hints.filter(Boolean).join(" ");
  if (!text) return null;
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

    const wanted = requestedLevel(name, levelHint);
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
