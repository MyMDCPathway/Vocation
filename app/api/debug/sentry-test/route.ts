import { NextResponse } from "next/server";

// Deliberately throws, so there is a way to confirm error reporting works
// without waiting for a real bug to find a real student.
//
// GATED BEHIND AN ENV VAR RATHER THAN DELETED AFTER USE. The obvious version
// of this file is one you add, deploy, hit once, and remember to remove — and
// the last step is the one that doesn't happen. Off by default it answers 404,
// which is also what an unauthenticated stranger should see; set
// ALLOW_SENTRY_TEST=1 in Vercel when you want to check, unset it after. No
// commit to revert, nothing to forget.
//
// NOT wrapped in withDbErrors, on purpose: that wrapper catches, and the whole
// point here is to let something escape the handler the way an unhandled bug
// would.

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.ALLOW_SENTRY_TEST !== "1") {
    // Indistinguishable from a route that doesn't exist.
    return new NextResponse(null, { status: 404 });
  }

  throw new Error(
    "Sentry test error from /api/debug/sentry-test — thrown on purpose, nothing is broken"
  );
}
