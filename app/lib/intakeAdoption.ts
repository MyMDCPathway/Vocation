import type { IntakeAnswers } from "@/app/lib/intake";
import { db } from "@/app/lib/db";

// Adopting a visitor's in-progress intake into their new account.
//
// The intake (app/lib/intake.ts) lives in sessionStorage and dies with the
// tab — that's deliberate for an anonymous visitor, but it means a student who
// answers six questions and THEN decides to make an account would lose all of
// it the moment they sign up, unless something carries it across. This is
// that something: the client sends its current IntakeAnswers object alongside
// the signup request, and the part of it below is stored on the new User row.
//
// Deliberately not validated against `isComplete()` — a half-finished intake
// is exactly the case this exists for. Whatever the visitor had typed, saved,
// whole or partial, is what should still be there after they sign up.

/**
 * The only intake fields allowed to outlive the tab they were typed in.
 *
 * This is an ALLOWLIST, not a denylist, and the direction is the whole point.
 * "Everything except income" is correct right up until the next person adds a
 * field to `IntakeAnswers` — a birth date, a disability status, a parent's
 * employer — at which point a denylist silently starts persisting it and
 * nobody notices. An allowlist fails closed: a new answer is not stored until
 * someone deliberately writes its name here, which is a line a reviewer sees
 * in the diff.
 *
 * Deliberately NOT on this list, and not to be added back:
 *
 *   - `incomeBand`, `householdSize`, `dependencyFlags`, `dependencyAnswered`.
 *     Family finances, collected from a population that is largely minors.
 *     intakeStorage.ts's header states the rule this list enforces: answers
 *     about your family's income shouldn't outlive the tab you typed them in.
 *     Nothing on the server ever needed them — `estimateAid` (planCost.ts) is
 *     a pure function called from a client component, so the aid maths works
 *     without the server ever seeing a household income at all. Storing them
 *     bought nothing and created a breach surface that can't be justified.
 *   - `location`. Not sensitive in the same way, but the two parts of it the
 *     account actually reads back are lifted into real columns below, so
 *     keeping a second copy in here would just be the same data stored twice.
 *   - `desiredSchools`, `discoveredSchools`. Unbounded records from a lookup
 *     that can be run again, not answers the student gave.
 *
 * What's left is what a returning student would want their account to
 * remember: the career they're planning for, where they are in school, and
 * how they'd trade cost against program quality.
 */
const ADOPTED_FIELDS = ["career", "educationLevel", "budgetPriority"] as const;

/** The storable shape of an intake — `IntakeAnswers` minus everything above. */
export type AdoptedIntake = Pick<
  IntakeAnswers,
  (typeof ADOPTED_FIELDS)[number]
>;

/**
 * Narrows an intake to the fields that are allowed to be persisted.
 *
 * Exported separately from the write so the rule can be asserted directly in
 * a test, rather than only through a mocked Prisma call.
 */
export function adoptableIntake(intake: IntakeAnswers): AdoptedIntake {
  const kept: Record<string, unknown> = {};
  for (const field of ADOPTED_FIELDS) {
    // `undefined` is skipped rather than written as an explicit null, so a
    // student who never reached a question doesn't get a row claiming they
    // answered it with nothing.
    if (intake[field] !== undefined) kept[field] = intake[field];
  }
  return kept as AdoptedIntake;
}

export async function adoptIntake(
  userId: string,
  intake: IntakeAnswers | null | undefined
): Promise<void> {
  if (!intake || Object.keys(intake).length === 0) return;

  await db.user.update({
    where: { id: userId },
    data: {
      savedIntake: adoptableIntake(intake) as object,
      // Lifted out of the snapshot into real columns, because this is the one
      // part of the intake the account reads back on a later visit in order to
      // skip a question. `savedIntake` is a record of what they answered once;
      // this is a setting.
      postalCode: intake.location?.postalCode ?? undefined,
      countryCode: intake.location?.countryCode ?? undefined,
    },
  });
}
