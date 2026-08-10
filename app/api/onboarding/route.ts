import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { withDbErrors } from "@/app/lib/withDbErrors";

const VALID_VISIBILITY = ["private", "mentors_only", "public"];

// PRD §2: "Interests & Goals... Privacy Controls: initial setup for profile
// visibility (Private, Mentors Only, Public)." Saves the onboarding step onto
// the same User row the signup route created — there's no separate profile
// table to keep in sync.

// What onboarding collected, read back for /pathways' empty state — see that
// page for why interests/goals stopped being write-only. Deliberately not
// folded into /api/account/settings: that route is the settings-page editor
// and only ever writes the fields it's given, whereas this one is read-only
// and specific to what onboarding itself set.
export const GET = withDbErrors(handleGET);
async function handleGET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { interests: true, goals: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json(user);
}

export const POST = withDbErrors(handlePOST);
async function handlePOST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const interests = Array.isArray(body.interests)
    ? body.interests.filter((i: unknown) => typeof i === "string")
    : [];
  const goals = Array.isArray(body.goals)
    ? body.goals.filter((g: unknown) => typeof g === "string")
    : [];
  const privacyVisibility = VALID_VISIBILITY.includes(body.privacyVisibility)
    ? body.privacyVisibility
    : "private";

  await db.user.update({
    where: { id: session.user.id },
    data: { interests, goals, privacyVisibility },
  });

  return NextResponse.json({ ok: true });
}
