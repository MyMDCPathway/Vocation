import type { IntakeAnswers } from "@/app/lib/intake";
import { db } from "@/app/lib/db";

// Adopting a visitor's in-progress intake into their new account.
//
// The intake (app/lib/intake.ts) lives in sessionStorage and dies with the
// tab — that's deliberate for an anonymous visitor, but it means a student who
// answers six questions and THEN decides to make an account would lose all of
// it the moment they sign up, unless something carries it across. This is
// that something: the client sends its current IntakeAnswers object alongside
// the signup request, and it's stored as-is on the new User row.
//
// Deliberately not validated against `isComplete()` — a half-finished intake
// is exactly the case this exists for. Whatever the visitor had typed, saved,
// whole or partial, is what should still be there after they sign up.
export async function adoptIntake(
  userId: string,
  intake: IntakeAnswers | null | undefined
): Promise<void> {
  if (!intake || Object.keys(intake).length === 0) return;

  await db.user.update({
    where: { id: userId },
    data: {
      savedIntake: intake as object,
      // Lifted out of the snapshot into real columns as well, because this is
      // the one part of the intake the account reads back on a later visit in
      // order to skip a question. Everything else in `savedIntake` is a record
      // of what they answered once; this is a setting.
      postalCode: intake.location?.postalCode ?? undefined,
      countryCode: intake.location?.countryCode ?? undefined,
    },
  });
}
