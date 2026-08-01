// The Vocation 2.0 intake: everything we ask a student before planning.
//
// Vocation 1.0 asked one question ("which school are you at?") and generated a
// pathway from it. That inverted the actual decision — a student picks a
// career and then works out where to study, not the other way round. The
// intake below collects the career first and derives the schools from it, so
// the answer can be "here are three ways to do this" instead of "here is the
// one way to do this from the school you already named".
//
// Every field is optional in the stored shape because a partially-filled
// intake is a real state: the wizard persists after each step so a refresh
// doesn't throw away six answers. `isComplete` is the gate, not the type.

import type { SchoolRef } from "@/app/lib/schoolRef";

export interface CareerSpecifics {
  /** What the student typed, verbatim. */
  raw: string;
  /**
   * The specific job being planned for. Equal to `raw` when the career was
   * already specific enough to plan against (a BCBA is a BCBA); otherwise the
   * option picked at the specifics step ("Pediatrician" from "doctor").
   */
  resolved: string;
  /** The follow-up question that produced `resolved`, for the summary line. */
  question?: string;
}

export type EducationLevel =
  | "in-high-school"
  | "hs-diploma"
  | "some-college"
  | "associate"
  | "bachelor"
  | "graduate";

export const EDUCATION_LEVELS: {
  id: EducationLevel;
  label: string;
  detail: string;
}[] = [
  { id: "in-high-school", label: "Still in high school", detail: "Haven't graduated yet" },
  { id: "hs-diploma", label: "High school diploma or GED", detail: "Done with high school, no college credit yet" },
  { id: "some-college", label: "Some college", detail: "Started a degree, haven't finished one" },
  { id: "associate", label: "Associate degree", detail: "A.A. or A.S. completed" },
  { id: "bachelor", label: "Bachelor's degree", detail: "B.A. or B.S. completed" },
  { id: "graduate", label: "Graduate degree", detail: "Master's or higher" },
];

export type SupportSituation = "dependent" | "independent" | "both";

export const SUPPORT_SITUATIONS: {
  id: SupportSituation;
  label: string;
  detail: string;
  /** Whose income the follow-up band is asking about. */
  incomeLabel: string;
}[] = [
  {
    id: "dependent",
    label: "My family supports me",
    detail: "You live with parents or guardians who cover most costs",
    incomeLabel: "Roughly what does your household make a year?",
  },
  {
    id: "independent",
    label: "I support myself",
    detail: "You cover your own rent, food, and bills",
    incomeLabel: "Roughly what do you make a year?",
  },
  {
    id: "both",
    label: "A bit of both",
    detail: "You work, and family helps with some costs",
    incomeLabel: "Roughly what does your household make a year, including you?",
  },
];

export type IncomeBand =
  | "under-30k"
  | "30-60k"
  | "60-100k"
  | "100-150k"
  | "over-150k"
  | "prefer-not-to-say";

export const INCOME_BANDS: {
  id: IncomeBand;
  label: string;
  /** Midpoint used for aid estimation; null when unstated. */
  midpoint: number | null;
}[] = [
  { id: "under-30k", label: "Under $30,000", midpoint: 20000 },
  { id: "30-60k", label: "$30,000 – $60,000", midpoint: 45000 },
  { id: "60-100k", label: "$60,000 – $100,000", midpoint: 80000 },
  { id: "100-150k", label: "$100,000 – $150,000", midpoint: 125000 },
  { id: "over-150k", label: "Over $150,000", midpoint: 175000 },
  { id: "prefer-not-to-say", label: "I'd rather not say", midpoint: null },
];

export function incomeMidpoint(band: IncomeBand | undefined): number | null {
  if (!band) return null;
  return INCOME_BANDS.find((b) => b.id === band)?.midpoint ?? null;
}

export type BudgetPriority = "lowest-cost" | "balanced" | "best-program";

export const BUDGET_PRIORITIES: {
  id: BudgetPriority;
  label: string;
  detail: string;
}[] = [
  {
    id: "lowest-cost",
    label: "Spend as little as possible",
    detail: "Cheapest route that still gets me licensed and hired",
  },
  {
    id: "balanced",
    label: "Balance cost and convenience",
    detail: "Reasonable price, close enough to home to be practical",
  },
  {
    id: "best-program",
    label: "Best program, cost second",
    detail: "I'd take on more cost for a stronger or better-known program",
  },
];

/**
 * How far the student will go for the *job*, not the degree.
 *
 * This is the question that changes the advice most and gets asked least.
 * Plenty of careers are only realistically enterable through a rural posting,
 * an unglamorous market, or an overseas assignment, and a student who rules
 * those out has a materially different path than one who doesn't.
 */
export interface WorkMobility {
  /** Rural, small-town, or designated underserved areas. */
  rural: boolean;
  /** Elsewhere in the US. */
  relocate: boolean;
  /** Outside the country. */
  international: boolean;
}

export const MOBILITY_OPTIONS: {
  id: keyof WorkMobility;
  label: string;
  detail: string;
  /**
   * How the option reads inside "Open to …" on the plan summary.
   *
   * Written out rather than lowercasing `label`, because that turned
   * "Anywhere in the US" into "anywhere in the us".
   */
  summaryLabel: string;
}[] = [
  {
    id: "rural",
    label: "Rural or underserved areas",
    detail: "Small towns and shortage areas — often the fastest way in, and where loan-forgiveness programs live",
    summaryLabel: "rural areas",
  },
  {
    id: "relocate",
    label: "Relocating for the right role",
    detail: "You'd move to another part of the country",
    summaryLabel: "relocating",
  },
  {
    id: "international",
    label: "Working abroad",
    detail: "You'd work in another country, at least for a while",
    summaryLabel: "working abroad",
  },
];

/** Where the student lives, anywhere on earth. */
export interface StudentLocation {
  /** ISO 3166-1 alpha-2. */
  countryCode: string;
  /** State, province, prefecture — whatever that country calls it. */
  subdivision: string;
  city: string;
}

export interface IntakeAnswers {
  career?: CareerSpecifics;
  location?: StudentLocation;
  educationLevel?: EducationLevel;
  support?: SupportSituation;
  incomeBand?: IncomeBand;
  /**
   * The schools the student named, stored whole rather than by id.
   *
   * An AI-discovered school exists in no table we ship — its name, URLs, and
   * tuition come back from one discovery call and nothing can look them up
   * again later. Keeping the record means a plan can still be generated for
   * it after a refresh.
   *
   * Empty is a real answer ("no preference"), which is why `schoolsAnswered`
   * tracks whether they were asked separately.
   */
  desiredSchools?: SchoolRef[];
  /**
   * Everything the schools step found, not just what was picked.
   *
   * Carried forward so /plan doesn't repeat the discovery call it already
   * paid for — that was doubling the Gemini cost of every plan and adding a
   * few seconds to a screen the student is already waiting on. /plan still
   * fetches if this is missing, so an intake restored from an older session
   * degrades rather than breaks.
   */
  discoveredSchools?: SchoolRef[];
  schoolsAnswered?: boolean;
  budgetPriority?: BudgetPriority;
  mobility?: WorkMobility;
}

export const EMPTY_INTAKE: IntakeAnswers = {};

export const NO_MOBILITY: WorkMobility = {
  rural: false,
  relocate: false,
  international: false,
};

/**
 * The wizard's steps, in order.
 *
 * `specifics` is in the list but conditionally skipped — see
 * `nextStepAfter`. Everything else always runs.
 */
export const INTAKE_STEPS = [
  "career",
  "specifics",
  "location",
  "education",
  "finances",
  "schools",
  "priority",
  "mobility",
] as const;

export type IntakeStep = (typeof INTAKE_STEPS)[number];

/** Whether the intake has enough to generate a plan. */
export function isComplete(answers: IntakeAnswers): boolean {
  return Boolean(
    answers.career?.resolved &&
      answers.location?.countryCode &&
      answers.location?.city &&
      answers.educationLevel &&
      answers.support &&
      answers.incomeBand &&
      answers.schoolsAnswered &&
      answers.budgetPriority &&
      answers.mobility
  );
}

/** A one-line recap of the intake, shown above the generated plan. */
export function summarize(answers: IntakeAnswers): string[] {
  const parts: string[] = [];

  if (answers.educationLevel) {
    const level = EDUCATION_LEVELS.find((l) => l.id === answers.educationLevel);
    if (level) parts.push(level.label);
  }
  if (answers.budgetPriority) {
    const priority = BUDGET_PRIORITIES.find(
      (p) => p.id === answers.budgetPriority
    );
    if (priority) parts.push(priority.label);
  }

  const willing = MOBILITY_OPTIONS.filter(
    (option) => answers.mobility?.[option.id]
  ).map((option) => option.summaryLabel);
  if (willing.length) parts.push(`Open to ${willing.join(", ")}`);

  return parts;
}
