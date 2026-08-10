import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { verifyPassword } from "@/app/lib/password";
import { checkIpLimit, clientIp } from "@/app/lib/rateLimit";

// Permanent account deletion — the other half of what /privacy promises.
//
// Same authorization shape as the rest of the account routes: a session is
// required and the only row touched is the one at session.user.id. There is no
// id in the body, deliberately — an admin-style "delete this user" parameter is
// exactly the kind of thing that becomes an authorization bug later.
//
// A session ALONE is not enough here, which is where this route departs from
// /api/account/settings. Every other write on the account is recoverable by
// writing again; this one is not. A session rides in a cookie, so anything that
// can make a same-origin request in the student's browser — an XSS, a rogue
// extension, a mis-fired click handler — can spend that session. Requiring the
// current password means the caller has to know something the cookie doesn't
// carry.

// Ten attempts per IP per fifteen-minute window. This route compares a password,
// so it is a credential-guessing surface like /api/signup and gets the same
// treatment: each attempt costs a bcrypt verify, and nobody deletes their
// account ten times.
const MAX_ATTEMPTS_PER_WINDOW = 10;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // Own bucket, like signup's — an unrelated allowance shouldn't be able to
  // lock someone out of deleting their account, and vice versa.
  const ipLimit = checkIpLimit(`account-delete:${clientIp(request)}`, MAX_ATTEMPTS_PER_WINDOW);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds ?? 60) } }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { password } = body as { password?: unknown };
  if (typeof password !== "string" || !password) {
    return NextResponse.json(
      { error: "Your current password is required to delete your account." },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    // A valid session pointing at a row that no longer exists — already gone,
    // as far as the caller is concerned.
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // A Google-only account has no hash to compare against (schema.prisma:
  // "Null for an OAuth-only user who never set a password"). Handled as its own
  // answer rather than falling through to verifyPassword, which would compare a
  // string against undefined. Refusing is the honest outcome: with no password
  // there is no second factor beyond the cookie, and silently accepting the
  // session alone would quietly drop the very protection this route exists for.
  if (!user.passwordHash) {
    return NextResponse.json(
      {
        error:
          "This account signs in with Google and has no password to confirm with. Email advisement@mdc.edu and we'll delete it for you.",
      },
      { status: 409 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "That password isn't right." }, { status: 401 });
  }

  // One delete, not a transaction. Every child of User in prisma/schema.prisma
  // — SavedPathway, Account, Session — already declares
  // `onDelete: Cascade` on its relation, so Postgres removes them as part of
  // this same statement. Deleting them by hand first would be a second way to
  // do the same thing, and the hand-written version is the one that goes stale
  // when a new child model is added.
  await db.user.delete({ where: { id: user.id } });

  // The session cookie is a signed JWT (auth.ts uses `strategy: "jwt"`), so it
  // stays technically valid in the browser until it expires — the server can't
  // revoke it by deleting a row, because there is no row. The client has to
  // call signOut() itself, and this flag is what tells it to.
  return NextResponse.json({ deleted: true, signOut: true });
}
