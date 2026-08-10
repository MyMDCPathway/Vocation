import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { normalizePostalCode } from "@/app/lib/postalCode";

// Where the account holder lives, remembered across visits.
//
// The intake asks for a postal code itself (app/components/intake/LocationStep
// leads with it, because one code resolves to a town, a region and coordinates
// in a single lookup). That question is the ONLY way a signed-out visitor gets
// a local answer, and it stays exactly where it is — career research has never
// required an account and still doesn't.
//
// What an account adds is not being asked twice. GET lets the wizard prefill
// from the profile; POST saves whatever the wizard just resolved. Both are
// best-effort conveniences: every caller treats a failure here as "ask the
// question", which is the pre-account behaviour and a perfectly good outcome.

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    // Not an error worth reporting. A signed-out visitor having no saved
    // location is the normal case, not a failure, and the caller's next move
    // is the same either way: ask.
    return NextResponse.json({ postalCode: null, countryCode: null });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { postalCode: true, countryCode: true },
  });

  return NextResponse.json({
    postalCode: user?.postalCode ?? null,
    countryCode: user?.countryCode ?? null,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // A country with no postal system (see NO_POSTAL_SYSTEM) yields no code at
  // all, and that's a valid thing to store — it means "asked, nothing to
  // record" rather than "not asked yet", which the country code carries.
  const postalCode =
    typeof body.postalCode === "string" && body.postalCode.trim()
      ? normalizePostalCode(body.postalCode)
      : null;
  const countryCode =
    typeof body.countryCode === "string" && body.countryCode.trim()
      ? body.countryCode.trim().toUpperCase().slice(0, 2)
      : null;

  await db.user.update({
    where: { id: session.user.id },
    data: { postalCode, countryCode },
  });

  return NextResponse.json({ ok: true });
}
