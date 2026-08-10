import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { checkIpLimit, clientIp } from "@/app/lib/rateLimit";
import { sendPasswordResetEmail } from "@/app/lib/email";
import {
  generateResetToken,
  hashResetToken,
  resetTokenExpiry,
  RESET_TOKEN_TTL_MS,
} from "@/app/lib/passwordReset";

// Step one of a password reset: "email me a link".
//
// Before this existed a forgotten password was a permanently dead account —
// bcrypt is one-way, so there was nothing to recover and no way to replace it.

/**
 * The one and only answer this route gives, whether the address belongs to an
 * account, belongs to nobody, or was rejected as malformed.
 *
 * This is the whole security posture of the endpoint. A route that says "no
 * such account" for unknown addresses is a free email-enumeration oracle:
 * point a list at it and it sorts your list into customers and non-customers.
 * Both existing account surfaces already refuse to do that — /api/signup
 * answers a taken email with a vague 409, and authorize() in app/lib/auth.ts
 * returns the same null for "no such user" and "wrong password" — so this one
 * matches them rather than quietly undoing the care they took.
 *
 * The wording is chosen to be true in every case: it describes what the server
 * did, not what the recipient will find in their inbox.
 */
const SAME_ANSWER = {
  message:
    "If an account exists for that email, a reset link is on its way. Check your inbox and your spam folder.",
};

/**
 * Five attempts per IP per window rather than the default ten.
 *
 * Each accepted request sends mail to an address the caller chose, so an
 * unlimited endpoint is two things at once: a way to have this app spam
 * arbitrary strangers under its own domain, and a way to burn a metered Resend
 * quota until real resets stop being delivered. A person who genuinely didn't
 * get the email retries once or twice.
 */
const MAX_REQUESTS_PER_IP = 5;

export async function POST(request: NextRequest) {
  // Keyed under its own prefix, not the bare IP — sharing one bucket with
  // signup or the Gemini routes would mean unrelated features locking each
  // other out, which is the same reasoning /api/signup's own limiter uses.
  const ipLimit = checkIpLimit(
    `forgot-password:${clientIp(request)}`,
    MAX_REQUESTS_PER_IP
  );
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many reset requests. Try again in a few minutes." },
      {
        status: 429,
        headers: { "Retry-After": String(ipLimit.retryAfterSeconds ?? 60) },
      }
    );
  }

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email } = body;
  if (typeof email !== "string" || !email.trim()) {
    // A malformed body is a client bug, not an answer about any account, so
    // this one may be specific — it says nothing about who has an account.
    return NextResponse.json(
      { error: "An email address is required." },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({
    where: { email: email.trim() },
    select: { id: true, email: true },
  });

  // Note what does NOT happen when there is no user: no different status, no
  // different body, no early return that a caller could time. The work below
  // is skipped, which is a measurable timing difference and the one residual
  // signal this design accepts — closing it properly means burning an
  // equivalent amount of work on every miss, which is a real cost for a signal
  // that is already noisy across a network.
  if (user) {
    const rawToken = generateResetToken();

    // Issuing a new link invalidates every older outstanding one, so a mailbox
    // never accumulates several simultaneously-valid keys to the same account.
    // Deleted rather than marked consumed: an unspent token has nothing worth
    // keeping, and consumedAt is meant to record an actual reset.
    await db.$transaction([
      db.passwordResetToken.deleteMany({
        where: { userId: user.id, consumedAt: null },
      }),
      db.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashResetToken(rawToken),
          expiresAt: resetTokenExpiry(),
        },
      }),
    ]);

    // sendEmail never throws and never reports failure (see app/lib/email.ts).
    // That is what lets this stay inside the branch without leaking it: a
    // delivery failure must not change the response, or "which addresses
    // bounce" becomes the oracle "which addresses exist" was.
    await sendPasswordResetEmail(
      user.email,
      resetUrl(request, rawToken),
      Math.round(RESET_TOKEN_TTL_MS / 60_000)
    );
  }

  return NextResponse.json(SAME_ANSWER);
}

/**
 * Where the emailed link points.
 *
 * APP_URL first, and it should be set on any deployed environment. The request
 * origin is derived from the Host header, which a caller controls on any host
 * that doesn't rewrite it — a poisoned Host would mean this app mailing a
 * valid reset token to a real user at an attacker's domain. Falling back to it
 * keeps local dev and preview deployments working with no configuration, where
 * the header is not an attack surface worth the setup step.
 */
function resetUrl(request: NextRequest, rawToken: string): string {
  const origin = process.env.APP_URL?.replace(/\/+$/, "") || new URL(request.url).origin;
  return `${origin}/reset-password?token=${encodeURIComponent(rawToken)}`;
}
