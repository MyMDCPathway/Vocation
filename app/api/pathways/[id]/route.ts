import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { withDbErrors } from "@/app/lib/withDbErrors";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/db";

// One saved pathway — read, edited, archived, or deleted.
//
// Every handler loads the row scoped to (id AND session.user.id) in one
// query rather than loading by id and checking ownership after. A row that
// exists but belongs to someone else must look identical to a row that
// doesn't exist at all — 404, never 403 — so a student can't use this route
// to learn whether an id belongs to another account.

async function loadOwned(id: string, userId: string) {
  return db.savedPathway.findFirst({ where: { id, userId } });
}

export const GET = withDbErrors(handleGET);
async function handleGET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const pathway = await loadOwned(params.id, session.user.id);
  if (!pathway) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ pathway });
}

export const PATCH = withDbErrors(handlePATCH);
async function handlePATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const existing = await loadOwned(params.id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Only these three fields are ever mutable here. `data` — what the
  // generator actually returned — is deliberately absent: edits belong in
  // their own column (see prisma/schema.prisma's SavedPathway.edits comment)
  // so "reset to original" always has an original to reset to, and a
  // student's edit is never mistaken for model output by anything reading
  // this row later.
  const update: {
    notes?: string | null;
    archived?: boolean;
    edits?: object | typeof Prisma.JsonNull;
  } = {};

  if ("notes" in body) {
    if (body.notes !== null && typeof body.notes !== "string") {
      return NextResponse.json({ error: "notes must be a string or null." }, { status: 400 });
    }
    update.notes = body.notes;
  }

  if ("archived" in body) {
    if (typeof body.archived !== "boolean") {
      return NextResponse.json({ error: "archived must be a boolean." }, { status: 400 });
    }
    update.archived = body.archived;
  }

  if ("edits" in body) {
    if (body.edits !== null && (typeof body.edits !== "object" || !Array.isArray(body.edits.steps))) {
      return NextResponse.json(
        { error: "edits must be null or an object with a steps array." },
        { status: 400 }
      );
    }
    // Prisma represents "clear this JSON column" as the Prisma.JsonNull
    // sentinel, not a plain JS null — passing null literally is a no-op to
    // the query engine and silently leaves the old edits in place.
    update.edits = body.edits === null ? Prisma.JsonNull : body.edits;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "Provide at least one of notes, archived, edits." },
      { status: 400 }
    );
  }

  const pathway = await db.savedPathway.update({
    where: { id: params.id },
    data: update,
  });

  return NextResponse.json({ pathway });
}

export const DELETE = withDbErrors(handleDELETE);
async function handleDELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const existing = await loadOwned(params.id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await db.savedPathway.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
