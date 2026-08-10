import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { resolveCareer } from "@/app/lib/careerCanonical";
import { BLOCKED_CAREER_MESSAGE, MAX_CAREER_INPUT } from "@/app/lib/careerPolicy";
import { withDbErrors } from "@/app/lib/withDbErrors";

// The saved-plan collection /pathways reads and writes to.
//
// Every route in this file is authenticated — a saved pathway belongs to an
// account, and there's no anonymous equivalent (the tab-scoped intake and
// /plan's free-standing generation already cover a signed-out visitor; see
// HANDOFF §15: a signed-out visitor can complete the whole intake, and that's
// deliberate). Ownership is enforced by scoping every query to
// session.user.id, never by trusting an id the client sends.

export const GET = withDbErrors(handleGET);
async function handleGET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const includeArchived = request.nextUrl.searchParams.get("archived") === "1";

  const pathways = await db.savedPathway.findMany({
    where: {
      userId: session.user.id,
      ...(includeArchived ? {} : { archived: false }),
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ pathways });
}

export const POST = withDbErrors(handlePOST);
async function handlePOST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { career, schoolId, schoolName, data } = body;

  if (
    typeof career !== "string" ||
    !career.trim() ||
    typeof schoolId !== "string" ||
    !schoolId.trim() ||
    typeof schoolName !== "string" ||
    !schoolName.trim() ||
    !data ||
    typeof data !== "object" ||
    typeof data.title !== "string" ||
    !Array.isArray(data.steps)
  ) {
    return NextResponse.json(
      { error: "career, schoolId, schoolName, and data{title,steps} are required." },
      { status: 400 }
    );
  }

  if (career.length > MAX_CAREER_INPUT) {
    return NextResponse.json(
      { error: "That's too long to be a career." },
      { status: 400 }
    );
  }

  // The generating routes all refuse a blocked career, but this is the write,
  // and nothing stops a client POSTing straight here with a body it composed
  // itself. Without this check a refused career is still persistable — and a
  // saved pathway is the one artefact that outlives the session and reappears
  // on the account's /pathways page.
  if (resolveCareer(career).blocked) {
    return NextResponse.json({ error: BLOCKED_CAREER_MESSAGE }, { status: 400 });
  }

  const pathway = await db.savedPathway.create({
    data: {
      userId: session.user.id,
      career: career.trim(),
      schoolId: schoolId.trim(),
      schoolName: schoolName.trim(),
      data,
    },
  });

  return NextResponse.json({ pathway }, { status: 201 });
}
