// Cost estimation for a generated plan.
//
// This supersedes cost.ts for the 2.0 flow. cost.ts prices a pathway that
// always starts at MDC and always transfers to one of twenty named
// universities; a 2.0 plan can start at any of the 53 schools we hold a
// catalog for, so the school has to be an input rather than an assumption.
//
// HOW HONEST THESE NUMBERS ARE — read this before quoting one.
//
// Every figure is tuition and fees only. Housing, food, books, transport, and
// health insurance are excluded, and for a student living away from home those
// routinely cost more than tuition does. Financial aid is excluded from the
// headline number and estimated separately.
//
// Figures come from one of two places, and `basis` says which:
//
//   "listed"  A figure curated for that specific school in universities.ts.
//             Covers all 12 public universities and 8 private ones.
//   "sector"  A band for the school's sector, not a claim about that school.
//             A Florida state college charges a statutory rate that barely
//             varies between them, so the band is tight and reliable. The
//             private band is wide because private tuition genuinely varies
//             that much, and a wide honest range beats a narrow invented one.
//
// That split exists because of the project's first rule: never invent school
// data. Saying "Florida private universities typically run $25k–$45k a year"
// is a true statement about the sector. Printing "$31,400" next to a school
// whose rate nobody looked up is not, however confident it looks.

import { PathwayStep } from "@/app/lib/types";
import { FLORIDA_SCHOOLS, getSchoolById } from "@/app/lib/floridaSchools";
import { FLORIDA_UNIVERSITIES } from "@/app/lib/universities";
import { requestedLevel, type ProgramLevel } from "@/app/lib/programCatalog";
import { incomeMidpoint, type IncomeBand } from "@/app/lib/intake";

export interface CostRange {
  low: number;
  high: number;
}

export type CostBasis = "listed" | "sector" | "published-fee";

const ZERO: CostRange = { low: 0, high: 0 };
const flat = (amount: number): CostRange => ({ low: amount, high: amount });

const scale = (range: CostRange, factor: number): CostRange => ({
  low: Math.round(range.low * factor),
  high: Math.round(range.high * factor),
});

const add = (a: CostRange, b: CostRange): CostRange => ({
  low: a.low + b.low,
  high: a.high + b.high,
});

// --- Annual tuition --------------------------------------------------------

// Florida sets state-college tuition by statute, so all 27 charge close to the
// same rate. Lower division runs ~$104-130 per credit hour all-in; a full-time
// year is 30 credits. Upper division (the bachelor's some of them grant) is
// roughly 20% higher per credit.
const FCS_LOWER_DIVISION: CostRange = { low: 3000, high: 3900 };
const FCS_UPPER_DIVISION: CostRange = { low: 3600, high: 4500 };

// Private universities in Florida span Ave Maria to the University of Miami.
// Anything narrower than this would be a guess dressed up as a figure.
const PRIVATE_SECTOR: CostRange = { low: 25000, high: 45000 };

// Fallback for a public university we somehow have no listed figure for. The
// twelve SUS schools cluster tightly around $6,400.
const PUBLIC_UNIVERSITY_SECTOR: CostRange = { low: 5800, high: 7400 };

/**
 * Per-school annual tuition, from universities.ts where that file names the
 * school. Keyed by floridaSchools.ts id.
 *
 * planCost.test.ts asserts every entry here still matches universities.ts, so
 * the two can't drift apart silently — which is the whole reason the mapping
 * is explicit rather than a fuzzy name match at runtime.
 */
export const LISTED_UNIVERSITY_NAMES: Record<string, string> = {
  uf: "University of Florida (UF)",
  fsu: "Florida State University (FSU)",
  usf: "University of South Florida (USF)",
  fiu: "Florida International University (FIU)",
  ucf: "University of Central Florida (UCF)",
  fau: "Florida Atlantic University (FAU)",
  famu: "Florida A&M University (FAMU)",
  unf: "University of North Florida (UNF)",
  fgcu: "Florida Gulf Coast University (FGCU)",
  uwf: "University of West Florida (UWF)",
  ncf: "New College of Florida",
  flpoly: "Florida Polytechnic University",
  miami: "University of Miami",
  nova: "Nova Southeastern University (NSU)",
  fit: "Florida Institute of Technology (FIT)",
  rollins: "Rollins College",
  stetson: "Stetson University",
  barry: "Barry University",
  stu: "St. Thomas University",
  lynn: "Lynn University",
};

export interface AnnualCost {
  range: CostRange;
  basis: CostBasis;
  /** Shown next to the figure so nobody reads a sector band as a price. */
  note: string;
}

/** Annual tuition & fees at a school, for a given credential level. */
export function annualCostFor(
  schoolId: string,
  level: ProgramLevel
): AnnualCost {
  const listedName = LISTED_UNIVERSITY_NAMES[schoolId];
  if (listedName) {
    const listed = FLORIDA_UNIVERSITIES.find((u) => u.name === listedName);
    if (listed) {
      return {
        range: listed.annualCost,
        basis: "listed",
        note: `${listed.type === "Public" ? "In-state" : "Published"} tuition & fees, per year`,
      };
    }
  }

  const school = getSchoolById(schoolId);

  if (school?.kind === "state-college") {
    const upper = level === "bachelor" || level === "graduate";
    return {
      range: upper ? FCS_UPPER_DIVISION : FCS_LOWER_DIVISION,
      basis: "sector",
      note: `Florida College System in-state rate (${upper ? "upper" : "lower"} division), per year`,
    };
  }

  if (school?.kind === "private") {
    return {
      range: PRIVATE_SECTOR,
      basis: "sector",
      note: "Typical Florida private university range, per year — this school's own rate wasn't looked up",
    };
  }

  return {
    range: PUBLIC_UNIVERSITY_SECTOR,
    basis: "sector",
    note: "Typical Florida public university in-state rate, per year",
  };
}

// --- Exam fees -------------------------------------------------------------

// Licensure exam fees are published by the boards that administer them, so
// unlike tuition these are single figures rather than ranges.
const EXAM_FEES: { match: RegExp; fee: number }[] = [
  { match: /nclex/, fee: 200 },
  { match: /\bpe\b|principles and practice/, fee: 375 },
  { match: /\bfe\b|fundamentals of engineering/, fee: 175 },
  { match: /\bare\b|architect registration/, fee: 1200 },
  { match: /bar exam/, fee: 1000 },
  { match: /\bcpa\b/, fee: 800 },
  { match: /\busmle\b|step 1|step 2/, fee: 1300 },
  { match: /\bmcat\b/, fee: 345 },
  { match: /\blsat\b/, fee: 240 },
  { match: /\bgre\b/, fee: 220 },
  { match: /\bbcba\b|behavior analyst/, fee: 375 },
  { match: /\bpraxis\b/, fee: 150 },
  { match: /\bnbcot\b|occupational therapy/, fee: 555 },
  { match: /\bnpte\b|physical therapy/, fee: 485 },
];

const DEFAULT_EXAM_FEE = 300;

function examFee(name: string): number {
  // Strip periods so "A.R.E." and "F.E." match their word-boundary patterns.
  const normalized = name.toLowerCase().replace(/\./g, "");
  return EXAM_FEES.find((e) => e.match.test(normalized))?.fee ?? DEFAULT_EXAM_FEE;
}

// --- Durations -------------------------------------------------------------

const YEARS_BY_LEVEL: Record<ProgramLevel, number> = {
  certificate: 1,
  associate: 2,
  bachelor: 4,
  graduate: 2,
};

/** A bachelor's entered with an associate in hand is the last two years only. */
const BACHELOR_YEARS_AFTER_ASSOCIATE = 2;

// A doctorate is much longer than the two years YEARS_BY_LEVEL assigns the
// graduate tier, and the difference is large enough to distort a total.
const DOCTORAL_YEARS = 4;
const DOCTORAL_HINT = /\b(ph\.?d|ed\.?d|d\.?b\.?a|dnp|dpt|m\.?d\.?|d\.?d\.?s|d\.?v\.?m|pharm\.?d|doctor(al|ate)?)\b/i;

// --- Which school is a step at? -------------------------------------------

/**
 * The school a step happens at.
 *
 * The starting school is known from the track. Later steps name their school
 * in prose ("B.S. in Nursing at UCF"), so those are matched against the school
 * list by full name and by abbreviation. A step that names nobody is assumed
 * to be at the starting school, which is right for every pathway that never
 * transfers and wrong only for a transfer step's *destination* — and that case
 * is handled by `afterTransfer` below rather than by guessing here.
 */
function schoolNamedIn(text: string): string | null {
  const haystack = text.toLowerCase();

  for (const school of FLORIDA_SCHOOLS) {
    const bareName = school.name.replace(/\s*\([^)]*\)/, "").toLowerCase();
    if (haystack.includes(bareName)) return school.id;
  }

  // Abbreviations need word boundaries: "UF" must not match "Stanford".
  for (const school of FLORIDA_SCHOOLS) {
    const abbr = school.shortName.toLowerCase();
    if (abbr.length >= 2 && new RegExp(`\\b${abbr}\\b`).test(haystack)) {
      return school.id;
    }
  }

  return null;
}

export interface StepCost {
  step: PathwayStep;
  range: CostRange;
  basis: CostBasis;
  /** Years attributed to this step; 0 for exams and transfers. */
  years: number;
  /** Where the money goes, e.g. "Miami Dade College · 2 years". */
  label: string;
  note: string;
}

export interface PlanCost {
  steps: StepCost[];
  total: CostRange;
  /** True when any step priced off a sector band rather than a listed figure. */
  hasSectorEstimate: boolean;
  years: number;
}

/**
 * Price every step in a pathway.
 *
 * `schoolId` is where the pathway starts. Steps after a transfer are priced at
 * whichever school they name, falling back to the public-university sector
 * band — a transfer destination that the model didn't name is far more likely
 * to be an SUS school than a private one, since that's what Florida's 2+2
 * articulation guarantees.
 */
export function estimatePlanCost(
  steps: PathwayStep[],
  schoolId: string,
  /**
   * Tuition for a school we hold no table entry for.
   *
   * An AI-discovered school's price comes back from the discovery call and
   * exists nowhere else. Without this, every school outside Florida would be
   * priced at the public-university sector band — which would quietly tell a
   * student that Harvard and their local state school cost the same.
   */
  openTuition?: { usdLow: number; usdHigh: number } | null
): PlanCost {
  let transferred = false;
  let holdsAssociate = false;
  let hasSectorEstimate = false;

  const priced: StepCost[] = steps.map((step) => {
    if (step.type === "transfer") {
      transferred = true;
      return {
        step,
        range: ZERO,
        basis: "published-fee" as CostBasis,
        years: 0,
        label: "Transfer",
        note: "Transferring itself costs nothing beyond application fees",
      };
    }

    if (step.type === "internship") {
      return {
        step,
        range: ZERO,
        basis: "published-fee" as CostBasis,
        years: 0,
        label: "Work experience",
        note: "Supervised hours are usually paid, or at least not billed",
      };
    }

    if (step.type === "exam") {
      const fee = examFee(step.name);
      return {
        step,
        range: flat(fee),
        basis: "published-fee" as CostBasis,
        years: 0,
        label: "Exam fee",
        note: "Registration fee only — prep courses and retakes cost extra",
      };
    }

    // A degree step. Work out its level, its school, and how long it takes.
    const level: ProgramLevel =
      requestedLevel(step.level, step.name) ?? (transferred ? "bachelor" : "associate");

    const named = schoolNamedIn(`${step.level} ${step.name}`);
    // Before any transfer the student is at the starting school even if the
    // step doesn't say so. After a transfer, an unnamed school is unknown.
    const stepSchoolId = named ?? (transferred ? null : schoolId);

    let years =
      level === "graduate" && DOCTORAL_HINT.test(`${step.level} ${step.name}`)
        ? DOCTORAL_YEARS
        : YEARS_BY_LEVEL[level];

    if (level === "bachelor" && holdsAssociate) {
      years = BACHELOR_YEARS_AFTER_ASSOCIATE;
    }
    if (level === "associate") holdsAssociate = true;

    // A step at the starting school, when that school is one we only know via
    // discovery, prices off the figure that came back with it. Steps that name
    // a different school still resolve through the tables — a transfer
    // destination is not the school we were given a price for.
    const useOpenTuition =
      openTuition && !named && (openTuition.usdLow > 0 || openTuition.usdHigh > 0);

    const annual = useOpenTuition
      ? {
          range: { low: openTuition!.usdLow, high: openTuition!.usdHigh },
          basis: "sector" as CostBasis,
          note: "Estimated annual tuition & fees for this school, in USD",
        }
      : stepSchoolId
        ? annualCostFor(stepSchoolId, level)
        : {
            range: PUBLIC_UNIVERSITY_SECTOR,
            basis: "sector" as CostBasis,
            note: "Typical public university in-state rate, per year",
          };

    if (annual.basis === "sector") hasSectorEstimate = true;

    const schoolName = useOpenTuition
      ? "This school"
      : stepSchoolId
        ? getSchoolById(stepSchoolId)?.name ?? "University"
        : "A four-year university";

    return {
      step,
      range: scale(annual.range, years),
      basis: annual.basis,
      years,
      label: `${schoolName} · ${years} ${years === 1 ? "year" : "years"}`,
      note: annual.note,
    };
  });

  return {
    steps: priced,
    total: priced.reduce((sum, s) => add(sum, s.range), ZERO),
    hasSectorEstimate,
    years: priced.reduce((sum, s) => sum + s.years, 0),
  };
}

// --- Aid ------------------------------------------------------------------

// The maximum federal Pell Grant per year. Pell is the single biggest lever on
// what a low-income Florida student actually pays, and leaving it out makes
// every total read as unaffordable when it may not be.
const PELL_MAX_ANNUAL = 7395;

export interface AidEstimate {
  /** Estimated annual grant aid (money that isn't repaid). */
  annual: CostRange;
  headline: string;
  detail: string;
  /** False when the student declined to say, so the UI can say why. */
  estimated: boolean;
}

/**
 * A rough grant-aid estimate from the income band alone.
 *
 * This is not a financial aid determination and the UI must not present it as
 * one. Real eligibility runs off the FAFSA's Student Aid Index, which weighs
 * household size, assets, and how many siblings are enrolled — none of which
 * we ask for. What this does capture is the part that dominates the answer:
 * income. A student under $30k is nearly always Pell-eligible; one over $100k
 * nearly never is.
 */
export function estimateAid(
  band: IncomeBand | undefined,
  /**
   * Where the student lives. Everything this function models — Pell, FAFSA,
   * Bright Futures — is United States federal or Florida state aid. Told a
   * student in Scotland they'd "likely qualify for a partial Pell Grant", the
   * app would be confidently describing a programme they cannot apply to,
   * while saying nothing about the SAAS funding that actually pays their fees.
   * Silence is the honest answer outside the system we model.
   */
  countryCode?: string
): AidEstimate {
  const midpoint = incomeMidpoint(band);

  if (countryCode && countryCode.toUpperCase() !== "US") {
    return {
      annual: ZERO,
      headline: "Not modelled for your country",
      detail:
        "Our aid estimates cover United States federal and state programmes only. Most countries fund students very differently — grants, income-contingent loans, or free tuition — so check your national student finance body for what you'd actually pay.",
      estimated: false,
    };
  }

  if (midpoint === null) {
    return {
      annual: ZERO,
      headline: "Not estimated",
      detail:
        "Fill in an income range to see what grant aid you'd likely qualify for. Nothing you enter is stored or sent anywhere.",
      estimated: false,
    };
  }

  if (midpoint < 30000) {
    return {
      annual: { low: PELL_MAX_ANNUAL * 0.75, high: PELL_MAX_ANNUAL },
      headline: "Likely full or near-full Pell Grant",
      detail:
        "At this income most students qualify for the maximum Pell Grant, which does not have to be repaid. Florida student assistance grants often stack on top.",
      estimated: true,
    };
  }

  if (midpoint < 60000) {
    return {
      annual: { low: PELL_MAX_ANNUAL * 0.3, high: PELL_MAX_ANNUAL * 0.7 },
      headline: "Likely partial Pell Grant",
      detail:
        "Partial Pell is common in this range. The exact amount depends on household size and how many family members are in college at once.",
      estimated: true,
    };
  }

  if (midpoint < 100000) {
    return {
      annual: { low: 0, high: PELL_MAX_ANNUAL * 0.25 },
      headline: "Limited need-based aid",
      detail:
        "Need-based grants thin out here. Bright Futures is the bigger lever at this income — it's merit-based, so it doesn't count income at all.",
      estimated: true,
    };
  }

  return {
    annual: ZERO,
    headline: "Little to no need-based aid",
    detail:
      "Expect to plan around merit aid rather than need-based grants. Bright Futures and institutional scholarships don't consider income.",
    estimated: true,
  };
}

// --- Formatting ------------------------------------------------------------

export function formatCostRange(range: CostRange): string {
  const round = (n: number) => Math.round(n).toLocaleString();
  if (Math.round(range.low) === Math.round(range.high)) {
    return `$${round(range.low)}`;
  }
  return `$${round(range.low)} – $${round(range.high)}`;
}

/** A shorter form for headline figures: "$18k – $24k". */
export function formatCostRangeShort(range: CostRange): string {
  const short = (n: number) =>
    n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n)}`;
  if (Math.round(range.low / 1000) === Math.round(range.high / 1000)) {
    return short(range.high);
  }
  return `${short(range.low)} – ${short(range.high)}`;
}
