// The rough shape of the route, known from the career question onward.
//
// The intake used to be: answer eight questions, receive a plan. That's a
// form. The student gives eight answers on faith and finds out at the end
// whether any of it was worth it — and if they abandon halfway they leave with
// nothing.
//
// So the outline arrives with the career classification (same Gemini call, no
// extra cost) and stays on screen for the rest of the intake. Every subsequent
// answer visibly sharpens it: where you'd train, which steps you've already
// cleared, what it'll cost. The questions stop being a toll and start being
// obviously connected to the thing in front of you.
//
// ENRICHMENT IS PURE AND LOCAL. Nothing here calls an API. Re-generating the
// outline on every answer would be five Gemini calls per intake and a spinner
// between every question; instead the model supplies the skeleton once and
// this annotates it from answers we already hold. The full, real plan is still
// generated at the end — this is the sketch, and it says so.

import type { EducationLevel, IntakeAnswers } from "@/app/lib/intake";

export type OutlineStepKind =
  | "education"
  | "training"
  | "credential"
  | "experience"
  | "work";

export interface OutlineStep {
  /** Short label, e.g. "Apprenticeship" or "Bachelor's degree". */
  label: string;
  /** One line on what happens here. */
  detail: string;
  kind: OutlineStepKind;
  /** Rough duration, e.g. "4-5 years". Empty when it isn't time-bounded. */
  duration: string;
  /**
   * The education level that makes this step unnecessary.
   *
   * "You already have a bachelor's, so the bachelor's step is behind you."
   * Enum-constrained on the model side and rank-compared here, so a student
   * who's further along sees their real starting point rather than a path
   * that begins where they were four years ago.
   */
  clearedBy?: EducationLevel;
}

export type StepStatus = "cleared" | "next" | "later";

export interface EnrichedStep extends OutlineStep {
  status: StepStatus;
  /** Annotations added from answers, shown under the step. */
  notes: string[];
}

// Ascending order of attainment. Used only to compare, never displayed.
const LEVEL_RANK: Record<EducationLevel, number> = {
  "in-high-school": 0,
  "hs-diploma": 1,
  "some-college": 2,
  associate: 3,
  bachelor: 4,
  graduate: 5,
};

function rank(level: EducationLevel | undefined): number {
  return level === undefined ? -1 : LEVEL_RANK[level];
}

/**
 * Annotate the outline with everything the student has told us so far.
 *
 * Deliberately tolerant: every input is optional, because this runs while the
 * intake is still half-answered. An outline with nothing else known renders as
 * a plain skeleton, which is exactly what it should be at question two.
 */
export function enrichOutline(
  outline: OutlineStep[],
  answers: IntakeAnswers
): EnrichedStep[] {
  const studentLevel = rank(answers.educationLevel);

  // "Cleared" means the student's existing attainment already covers it —
  // someone holding a bachelor's does not need to be shown the bachelor's
  // step as work still to do.
  const cleared = outline.map(
    (step) =>
      step.clearedBy !== undefined &&
      answers.educationLevel !== undefined &&
      studentLevel >= rank(step.clearedBy)
  );

  // The first step they haven't cleared is where they actually start.
  const nextIndex = cleared.findIndex((done) => !done);

  const city = answers.location?.city?.trim();
  const providers = answers.desiredSchools ?? [];

  return outline.map((step, index) => {
    const notes: string[] = [];

    // Where the training would happen, once we know. Attached only to the
    // steps that are actually located somewhere — a licensing exam isn't.
    if (city && (step.kind === "education" || step.kind === "training")) {
      const named = providers[0];
      if (named && index === nextIndex) {
        notes.push(
          providers.length > 1
            ? `At ${named.name} or ${providers.length - 1} other${providers.length > 2 ? "s" : ""} you picked`
            : `At ${named.name}`
        );
      } else {
        notes.push(`Near ${city}`);
      }
    }

    return {
      ...step,
      status: cleared[index] ? "cleared" : index === nextIndex ? "next" : "later",
      notes,
    };
  });
}

/**
 * How much of the outline is already behind them, 0-1.
 *
 * Shown as a progress hint. Returns 0 when nothing is cleared, which is the
 * common case and reads correctly as "you're at the start".
 */
export function clearedFraction(steps: EnrichedStep[]): number {
  if (!steps.length) return 0;
  return steps.filter((step) => step.status === "cleared").length / steps.length;
}

/** Total of the duration hints, for a rough "time to qualified". */
export function outlineDurationHint(steps: EnrichedStep[]): string {
  const remaining = steps.filter((step) => step.status !== "cleared");
  if (!remaining.length) return "";

  // Durations are free text like "4-5 years" or "6 months". Summing them
  // properly would need parsing we can't trust; showing the longest single
  // step is honest and useful, and avoids inventing a total.
  const years = remaining
    .map((step) => {
      const match = step.duration.match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)?\s*(\d+(?:\.\d+)?)?\s*year/i);
      if (!match) return 0;
      return Number(match[2] ?? match[1]) || 0;
    })
    .reduce((sum, value) => sum + value, 0);

  if (!years) return "";
  return years === 1 ? "about a year" : `about ${Math.round(years)} years`;
}
