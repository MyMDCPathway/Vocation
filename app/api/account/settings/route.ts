import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { withDbErrors } from "@/app/lib/withDbErrors";

const VALID_VISIBILITY = ["private", "mentors_only", "public"];

// Name and privacy visibility only — deliberately narrower than
// /api/onboarding, which sets interests/goals/privacyVisibility together as
// one onboarding step. Reusing that route for a settings-page edit would
// require resending interests and goals on every save just to avoid
// clobbering them with an empty array, and one missed field would silently
// wipe onboarding data nobody meant to touch. This route only ever writes
// the fields it's actually given.

export const GET = withDbErrors(handleGET);
async function handleGET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, privacyVisibility: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json(user);
}

export const PATCH = withDbErrors(handlePATCH);
async function handlePATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const update: { name?: string; privacyVisibility?: string } = {};

  if ("name" in body) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "name must be a non-empty string." }, { status: 400 });
    }
    update.name = body.name.trim();
  }

  if ("privacyVisibility" in body) {
    if (!VALID_VISIBILITY.includes(body.privacyVisibility)) {
      return NextResponse.json(
        { error: `privacyVisibility must be one of: ${VALID_VISIBILITY.join(", ")}.` },
        { status: 400 }
      );
    }
    update.privacyVisibility = body.privacyVisibility;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "Provide at least one of name, privacyVisibility." },
      { status: 400 }
    );
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data: update,
    select: { name: true, email: true, privacyVisibility: true },
  });

  return NextResponse.json(user);
}
