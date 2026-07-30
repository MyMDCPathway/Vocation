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
// "Specialist" (e.g. an Ed.S.) is its own credential tier between a master's
// and a doctorate — UF's Graduate Degree Table lists "Specialist in
// Education (Ed.S.)" alongside its Master's and Doctoral sections.
// mpas and mph are dot-tolerant (m\.?p\.?a\.?s\.?, m\.?p\.?h\.?), not bare,
// because FGCU and UWF spell their Physician Assistant Studies and Public
// Health master's "M.P.A.S." / "M.P.H." — with dots, unlike the undotted
// style (e.g. FIU's "MACC") the other bare codes below were scraped from.
// mpas's embedded "A.S." would otherwise read as an associate degree; mph
// bare simply never matched a dotted credential at all.
// mscj/msee/msme (UNF) are the same "MS" + two-letter-subject shape as mpa —
// bare "ms" alone can't catch these because there's no word boundary between
// the "S" and the subject letters that follow.
// march and dr.p.h are USF: "M.Arch." (Master of Architecture) was entirely
// unrecognized; "D.B.A." (Doctor of Business Administration) already had a
// bare "dba" code but, dotted, it never matched — same undotted-vs-dotted gap
// as mpas/mph — so dba is now dot-tolerant too. "Dr.P.H." (Doctor of Public
// Health) is a new code outright.
// mm/bm/mfa are FAU: "Music" (B.M./M.M.) and "Theatre" (B.A./M.F.A.) are each
// offered at both levels, and FAU dots every credential letter, so the same
// undotted-vs-dotted gap as mpas/mph meant neither code matched its own
// program — collapsing both to the bachelor's, the only collisions among
// FAU's many same-named bachelor's/graduate pairs (the rest share a
// level-agnostic code like B.S./M.S. or B.A./Ph.D. that was already
// dot-tolerant).
// Dot-tolerant md, mps, and bare msf are UM: "M.D./Security Management
// Certificate" has no other graduate hint once EMBEDDED_DEGREE_FRAGMENT and
// CERTIFICATE_HINT are in play, so an undotted-or-dotted "md" is needed the
// same way FIU's/UCF's own "Doctor of Medicine" entries rely on the spelled-
// out word "doctor" instead — UM's own listing never spells it out. "M.P.S."
// (Master of Professional Science, "...B.A.M.A./M.P.S. Program") and "MSF"
// (Master of Science in Finance, "BBA/BSBA - MSF Dual Degree Program") were
// both entirely unrecognized codes.
// Dot-tolerant m.acc., ed.s., j.d., m.b.s., and d.n.p. are all NSU: its
// Degree Finder dots every letter of every credential ("Accounting
// (M.Acc.)", "Education (Ed.S.)", "Law (J.D.)", "Biomedical Sciences
// (M.B.S.)", "Nursing (D.N.P.)"), and each of these previously only had a
// bare/undotted form (macc, jd, dnp) or none at all (Ed.S. relied on the
// spelled-out word "specialist," which NSU's own abbreviation never
// includes; M.B.S. had no code at all). Left bare, each dotted credential
// fell through GRADUATE_HINT and matched a same-named bachelor's instead —
// e.g. "Nursing (D.N.P.)" resolving to "Nursing (Accelerated B.S.)" — the
// exact wrong-level mis-link this module exists to prevent.
const GRADUATE_HINT =
  /\b(master|masters|doctor|doctoral|specialist|graduate|ph\.?d|ed\.?d|ed\.?s\.?|m\.?ed\.?|m\.?s\.?|m\.?a\.?|m\.?b\.?a|m\.?arch\.?|m\.?a\.?c\.?c\.?|mat|m\.?f\.?a\.?|m\.?b\.?s\.?|mha|mhsa|mia|mib|mla|m\.?m\.?|mpa|m\.?p\.?a\.?s\.?|m\.?p\.?h\.?|m\.?p\.?s\.?|mscj|msee|msme|msf|msn|msw|psm|d\.?b\.?a\.?|ddes|d\.?n\.?p\.?|dpt|dr\.?p\.?h\.?|m\.?d\.?|j\.?d\.?|jm|llm)\b/i;

const BACHELOR_HINT =
  /\b(bachelor|bachelors|undergraduate|b\.?s\.?|b\.?a\.?|b\.?b\.?a|b\.?f\.?a|b\.?a\.?s|bacc|bhsa|b\.?m\.?|bppa|bpps|bsn)\b/i;

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

// A university's accelerated dual-degree tracks name the credential a student
// enters WITH, not the level of the program itself — UCF's "Environmental
// Engineering MSEnvE, Accelerated BS to MSEnvE" is entirely a graduate
// program, but "BS" in "BS to MSEnvE" would otherwise read as a bachelor's
// hint. Same shape as GRADUATE_OF_A_DEGREE above, one degree code further.
const DEGREE_TRANSITION = /\b(a\.?a\.?|a\.?s\.?|b\.?a\.?|b\.?s\.?|m\.?s\.?|m\.?a\.?)\s+to\s+/gi;

// Compound engineering credentials like UCF's "(B.S.M.S.E.)" — Bachelor of
// Science in Materials Science and Engineering — spell out a discipline
// name whose initials happen to embed "M.S." with no space before it. A
// genuine standalone "M.S." or "M.A." mention always has a space, an opening
// paren, or the string start immediately before it, so only the run-together
// variant (which can only occur buried inside a longer bachelor's code, never
// as a credential in its own right) gets stripped.
//
// This is deliberately narrow (just m.s./m.a.) rather than covering every
// short degree code: widening it to a.s./a.a./b.s./b.a. once broke PSC's
// real "B.A.S." (Bachelor of Applied Science) credential, whose trailing
// "A.S." isn't a fragment to strip — it's part of the genuine, complete
// credential. Add a case here only once a real school's data proves it's
// needed, the way UCF's and FGCU's did.
const EMBEDDED_DEGREE_FRAGMENT = /(?<=[A-Za-z]\.)(m\.?s\.?|m\.?a\.?)\b/gi;

// PBA's "Biology: Concentration in Graduate School Preparation, B.S." is
// entirely a bachelor's — "Graduate School" here is the destination a
// student is being prepped for, not the level of this program. Same shape
// as GRADUATE_OF_A_DEGREE (a real word that means something other than
// "this program is graduate-level" in context), one phrase further.
const GRADUATE_SCHOOL_PHRASE = /\bgraduate\s+school\b/gi;

// St. Thomas's "BA-JD in Political Science" (and its Criminal Justice,
// English, Psychology siblings) is an accelerated law-track option entirely
// at the bachelor's level — the student enrolls as a normal undergrad, and
// "JD" names the eventual destination the track is aimed at, not this
// program's own level. Same "a degree code names something other than this
// program's level" shape as DEGREE_TRANSITION's "BS to MSEnvE", one
// compound abbreviation further: bare "jd" is a real GRADUATE_HINT token,
// and it would otherwise outrank the "BA" right next to it.
const BA_JD_PATHWAY = /\bba[\s/-]*jd\b/gi;

// Keiser's "Biomedical Sciences (BMT, Pre-Med), BS" and "Interdisciplinary
// Studies, Pre-DPT Bridge, BS" are entirely bachelor's-level — "Pre-Med" and
// "Pre-DPT" name the graduate program a student is preparing to apply to
// next, not this program's own level. Same "a degree code names something
// other than this program's level" shape as BA_JD_PATHWAY: bare "dpt" is a
// real GRADUATE_HINT token, and "Med" is caught by the dot-tolerant
// "m.?ed.?" (Master of Education) token via the real word "Pre-Med" — both
// would otherwise outrank the "BS" right next to them.
const PRE_PROFESSIONAL_TRACK = /\bpre-?(med|dpt)\b/gi;

/** Which level a free-text query is explicitly asking for, if any. */
export function requestedLevel(...hints: (string | undefined)[]): ProgramLevel | null {
  const text = hints
    .filter(Boolean)
    .join(" ")
    .replace(GRADUATE_OF_A_DEGREE, " ")
    .replace(DEGREE_TRANSITION, " ")
    .replace(EMBEDDED_DEGREE_FRAGMENT, " ")
    .replace(GRADUATE_SCHOOL_PHRASE, " ")
    .replace(BA_JD_PATHWAY, " ")
    .replace(PRE_PROFESSIONAL_TRACK, " ");
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
