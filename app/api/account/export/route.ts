import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { checkIpLimit, clientIp } from "@/app/lib/rateLimit";
import { withDbErrors } from "@/app/lib/withDbErrors";

// "Download your data" — the half of /privacy that the app promised but never
// implemented. A privacy policy that says an account holder can get their data
// out is only true if there's a route that hands it to them.
//
// Same authorization shape as every other account route (/api/pathways,
// /api/account/settings): a session is required and every query is scoped to
// session.user.id. Nothing here reads an id off the request — there is no id to
// send, which is the point. An export is the highest-value response this app
// can produce, so "whose data is this" must never depend on a client value.

// Five exports per IP per fifteen-minute window, well under the default
// allowance: this is an unbounded read of a user row plus every SavedPathway
// row they own, serialized in full, and there is no honest reason to ask for
// it five times in a quarter of an hour.
const MAX_EXPORTS_PER_WINDOW = 5;

export const GET = withDbErrors(handleGET);
async function handleGET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // Keyed under its own "export:" prefix rather than the bare IP, for the same
  // reason /api/signup does: a student who has spent their pathway-generation
  // allowance this window has done nothing that should cost them the ability
  // to download their own data.
  const ipLimit = checkIpLimit(`export:${clientIp(request)}`, MAX_EXPORTS_PER_WINDOW);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many export requests. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds ?? 60) } }
    );
  }

  // Field-selected, not fetched-then-pruned. A `select` fails closed: a column
  // added to User later is absent from the export until someone deliberately
  // lists it here, whereas a delete-after-fetch leaks every new secret by
  // default and only stops leaking when someone remembers to extend the
  // delete list.
  //
  // Deliberately absent, and they must stay absent:
  //   - passwordHash — a bcrypt digest is offline-crackable material, and the
  //     account holder already knows their own password.
  //   - Account rows — they hold Google refresh_token/access_token/id_token,
  //     which are live bearer credentials for a third-party account, not
  //     "the user's data" in any sense a data export means.
  //   - Session rows — sessionToken is a live credential for this account.
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      accountType: true,
      interests: true,
      goals: true,
      postalCode: true,
      countryCode: true,
      savedIntake: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const savedPathways = await db.savedPathway.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      career: true,
      schoolId: true,
      schoolName: true,
      data: true,
      edits: true,
      notes: true,
      archived: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Archived pathways are included on purpose — archiving hides a plan from
  // /pathways, it doesn't delete it, so it's still data the account holds.

  const filename = `vocation-data-${new Date().toISOString().slice(0, 10)}.json`;

  return NextResponse.json(
    { exportedAt: new Date().toISOString(), user, savedPathways },
    {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        // An export must never sit in a shared or browser cache — the next
        // person on this machine is not necessarily the account holder.
        "Cache-Control": "no-store",
      },
    }
  );
}
