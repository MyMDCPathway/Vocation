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
import type { RouteArchetype } from "@/app/lib/routeArchetype";
import type { OutlineStep } from "@/app/lib/pathOutline";

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
  /**
   * How people actually get into this job — see routeArchetype.ts.
   *
   * Decided once, at the career step, and then steers every later question:
   * whether the student is shown universities, union halls, certification
   * bodies, or a recruiter. Absent on an intake restored from before
   * classification existed, which callers handle by falling back to the
   * default rather than guessing.
   */
  routeArchetype?: RouteArchetype;
  /** One line naming the real gate — the licence, the union, the audition. */
  routeReason?: string;
  /**
   * The BLS occupation the summary matched this career to.
   *
   * Carried forward so the plan page's wage panel describes the SAME
   * occupation the summary did. Without it the plan re-matches from the career
   * text alone and can land somewhere else — the summary had the model's SOC
   * hint to work from and the plan wouldn't, so a career that only resolved
   * via the hint would show figures on one page and nothing on the other.
   */
  socCode?: string;
  /**
   * The rough shape of the route, from the same call that classified it.
   *
   * Shown from the career question onward and sharpened locally as answers
   * arrive — see pathOutline.ts. Stored so a refresh mid-intake doesn't blank
   * the path the student has been watching fill in.
   */
  outline?: OutlineStep[];
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

/**
 * Dependency status, derived rather than asked.
 *
 * This used to be a three-way "who supports you" question, and it was the
 * wrong question twice over. It fed nothing — estimateAid never received it —
 * and the thing it stood in for isn't about support at all.
 *
 * For federal aid, "independent" is a fixed test, not a description of your
 * living arrangement. Paying your own rent does not make you independent. A
 * nineteen-year-old with a full-time job, their own apartment, and parents who
 * give them nothing is still a DEPENDENT student who must report parent
 * income. It's the most common misunderstanding in the whole aid process.
 *
 * Which is why this asks for the criteria and derives the answer, rather than
 * asking students to classify themselves with a term of art. Asked plainly,
 * that nineteen-year-old picks "independent", we estimate a full Pell Grant
 * against their own $20k, and we've told them school is nearly free when it
 * isn't — wrong in the direction that does the most damage.
 *
 * Checking nothing is the common and correct answer for a high schooler.
 */
export type DependencyFlag =
  | "age-24"
  | "married"
  | "supporting-children"
  | "military"
  | "foster-or-ward"
  | "unhoused"
  | "graduate-school";

export const DEPENDENCY_CRITERIA: {
  id: DependencyFlag;
  label: string;
  detail: string;
}[] = [
  {
    id: "age-24",
    label: "I'm 24 or older",
    detail: "Age alone settles it, whatever else is true",
  },
  {
    id: "married",
    label: "I'm married",
    detail: "Married now, not planning to be",
  },
  {
    id: "supporting-children",
    label: "I support a child or dependent",
    detail: "You provide more than half of someone's support",
  },
  {
    id: "military",
    label: "I'm a veteran or on active duty",
    detail: "Active duty for something other than training",
  },
  {
    id: "foster-or-ward",
    label: "I was in foster care or a ward of the court",
    detail: "At any point since you turned 13, or both parents have died",
  },
  {
    id: "unhoused",
    label: "I've been unhoused or at risk of it",
    detail: "Unaccompanied and without stable housing",
  },
  {
    id: "graduate-school",
    label: "I'm going for a master's or doctorate",
    detail: "Graduate students are always independent",
  },
];

/** Any single criterion is enough — the test is an OR, not a tally. */
export function isIndependent(flags: DependencyFlag[] | undefined): boolean {
  return Boolean(flags?.length);
}

/**
 * Independent students supporting children are treated far more generously
 * than independent students who aren't, so it's worth carrying through rather
 * than flattening to one "independent" bit.
 */
export function supportsDependents(flags: DependencyFlag[] | undefined): boolean {
  return Boolean(flags?.includes("supporting-children"));
}

/** Whose income the band is asking about — the answer moves with status. */
export function incomeQuestion(flags: DependencyFlag[] | undefined): string {
  return isIndependent(flags)
    ? "Roughly what do you make a year?"
    : "Roughly what does your household make a year?";
}

/**
 * Household size, the input that decides what a given income MEANS.
 *
 * Eligibility is scored against the federal poverty line for a household of
 * your size, so $60,000 across six people and $60,000 across two are not the
 * same answer. The old estimate said as much in prose and then didn't model
 * it.
 */
export const HOUSEHOLD_SIZES: { value: number; label: string; detail: string }[] = [
  { value: 1, label: "Just me", detail: "You're the whole household" },
  { value: 2, label: "2 people", detail: "You and one other" },
  { value: 3, label: "3 people", detail: "" },
  { value: 4, label: "4 people", detail: "" },
  { value: 5, label: "5 people", detail: "" },
  { value: 6, label: "6 or more", detail: "Counted as six for the estimate" },
];

/** What to call the household, given who the student is counting. */
export function householdQuestion(flags: DependencyFlag[] | undefined): string {
  return isIndependent(flags)
    ? "How many people do you support, including yourself?"
    : "How many people live in your household?";
}

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
  /** Optional, and absent entirely for countries with no postal system. */
  postalCode?: string;
  /**
   * Resolved from the postal code when one was given and recognised.
   *
   * This is what makes "closest to home" mean anything outside Florida. With
   * no coordinates, distance can only be computed against the school table we
   * ship, which is Florida-only; with them, great-circle distance works
   * anywhere.
   */
  latitude?: number;
  longitude?: number;
}

export interface IntakeAnswers {
  career?: CareerSpecifics;
  location?: StudentLocation;
  educationLevel?: EducationLevel;
  /**
   * Which independence criteria the student ticked. Empty is a real, common
   * answer — it's what a high schooler correctly reports — so it can't be
   * told apart from "never asked" by emptiness alone; `dependencyAnswered`
   * carries that, the same way `schoolsAnswered` does for an empty school
   * list.
   */
  dependencyFlags?: DependencyFlag[];
  dependencyAnswered?: boolean;
  incomeBand?: IncomeBand;
  /** People in the household the income above covers. See HOUSEHOLD_SIZES. */
  householdSize?: number;
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
// The profile comes straight after the career, before any other question.
//
// It's the screen most likely to make a student decide this isn't the job for
// them, and every question after it costs them effort — so it goes first, not
// fourth. The cost is that it runs before we know where they live, so its wage
// figures are national rather than their metro's. That's handled by showing
// national figures AS national (see blsAreas.resolveAreas), never by dressing
// a country-wide number up as a local one.
export const INTAKE_STEPS = [
  "career",
  "specifics",
  "profile",
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
      // City OR state. The location step used to always end on a free-text
      // city box, so city was a safe thing to require; it now ends on either a
      // postal code (which resolves a city) or a state list (which doesn't).
      // Requiring city after that change would have made every state-only
      // answer look like an unfinished intake and bounced the student home.
      (answers.location?.city || answers.location?.subdivision) &&
      answers.educationLevel &&
      answers.dependencyAnswered &&
      answers.incomeBand &&
      // Household size deliberately isn't required. It sharpens the aid
      // estimate and estimateAid falls back cleanly without it, so it's an
      // improvement to a plan rather than a precondition for one — and
      // intakes saved before it was asked still generate.
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
