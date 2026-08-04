import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/db";

const VALID_VISIBILITY = ["private", "mentors_only", "public"];

// PRD §2: "Interests & Goals... Privacy Controls: initial setup for profile
// visibility (Private, Mentors Only, Public)." Saves the onboarding step onto
// the same User row the signup route created — there's no separate profile
// table to keep in sync.
export async function POST(request: NextRequest) {
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
