import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { withDbErrors } from "@/app/lib/withDbErrors";
import { hashPassword } from "@/app/lib/password";
import { passwordStrength } from "@/app/lib/passwordStrength";
import { checkIpLimit, clientIp } from "@/app/lib/rateLimit";
import { hashResetToken, isResetTokenUsable } from "@/app/lib/passwordReset";

// Step two of a password reset: spend the emailed token, set the new password.

/**
 * The single failure message for anything wrong with the token — unknown,
 * expired, already spent, or belonging to a deleted account.
 *
 * Distinguishing them would be friendlier and would also confirm to whoever is
 * holding a token that it once belonged to a real account, and tell someone
 * grinding tokens which guesses were closer. The recovery is identical in
 * every case, so one message costs the honest user nothing.
 */
const INVALID_TOKEN =
  "That reset link is invalid or has expired. Request a new one and try again.";

/**
 * Tighter than the generic per-IP allowance because this endpoint is the one
 * an attacker would grind: each request is a guess at a token. The token's own
 * 256 bits are the real defence — this just makes the attempt pointless rather
 * than merely futile, and stops the guessing from costing a bcrypt hash each.
 */
const MAX_ATTEMPTS_PER_IP = 10;

export const POST = withDbErrors(handlePOST);
async function handlePOST(request: NextRequest) {
  const ipLimit = checkIpLimit(
    `reset-password:${clientIp(request)}`,
    MAX_ATTEMPTS_PER_IP
  );
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      {
        status: 429,
        headers: { "Retry-After": String(ipLimit.retryAfterSeconds ?? 60) },
      }
    );
  }

  let body: { token?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { token, password } = body;
  if (typeof token !== "string" || !token.trim() || typeof password !== "string") {
    return NextResponse.json(
      { error: "A reset token and a new password are required." },
      { status: 400 }
    );
  }

  // The existing policy from app/lib/passwordStrength.ts, not a second one
  // written here. A reset that accepted "password123" would be a hole straight
  // through the rule signup already enforces, and two copies of a policy drift
  // apart the first time either is touched. `blocked` covers both halves of
  // what that module enforces — minimum length and the common-password check.
  const strength = passwordStrength(password);
  if (strength.blocked) {
    return NextResponse.json({ error: strength.feedback }, { status: 400 });
  }

  // Looked up by hash: the raw token exists only in the email, and the column
  // holds a SHA-256 digest of it (see app/lib/passwordReset.ts for why that
  // hash rather than bcrypt).
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token.trim()) },
    select: { id: true, userId: true, expiresAt: true, consumedAt: true },
  });

  if (!record || !isResetTokenUsable(record)) {
    return NextResponse.json({ error: INVALID_TOKEN }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  // One transaction, so the account can never end up with a new password and a
  // still-outstanding reset token, or vice versa.
  //
  // Consumption is an updateMany filtered on consumedAt: null rather than an
  // update by id, which makes spending the token a conditional write the
  // database itself arbitrates. Two requests racing the same link both pass the
  // check above; only one of them can match a row here, and the loser rolls
  // back having changed nothing — an interactive transaction rather than the
  // array form precisely so the password write can be made conditional on
  // having won.
  const spent = await db.$transaction(async (tx) => {
    const consumed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (consumed.count === 0) return false;

    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });

    // Every other outstanding link for this account dies with the reset. Anyone
    // who triggered an unwanted reset — or requested several — must not be left
    // holding a working key after the owner has taken the account back.
    await tx.passwordResetToken.deleteMany({
      where: { userId: record.userId, consumedAt: null },
    });

    return true;
  });

  if (!spent) {
    // Lost the race described above; the other request already reset it.
    return NextResponse.json({ error: INVALID_TOKEN }, { status: 400 });
  }

  // No session is created here on purpose. The reset proves control of the
  // mailbox, and the new password is the thing that proves control of the
  // account — so the flow ends at the login screen, where that password gets
  // used once for real.
  return NextResponse.json({ ok: true });
}
