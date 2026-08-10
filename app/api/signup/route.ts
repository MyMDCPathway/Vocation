import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { hashPassword } from "@/app/lib/password";
import { adoptIntake } from "@/app/lib/intakeAdoption";
import type { IntakeAnswers } from "@/app/lib/intake";
import { checkIpLimit, clientIp } from "@/app/lib/rateLimit";
import { isCommonPassword } from "@/app/lib/passwordStrength";

// Creates the account itself — PRD §1's "Create Account" step. OAuth signup
// (Google) never touches this route; Auth.js's own callback creates those
// users directly via the Prisma adapter. This route exists only for the
// email/password path, where nothing else will hash the password or check
// for an existing email first.
export async function POST(request: NextRequest) {
  // Same per-IP sliding-window limiter the Gemini routes use, but under its
  // own "signup:" key rather than the bare IP — sharing one bucket would mean
  // a student who'd already spent their 10 pathway-generation requests this
  // window gets locked out of creating an account too, which has nothing to
  // do with abuse and everything to do with two unrelated features colliding
  // on one shared counter.
  const ipLimit = checkIpLimit(`signup:${clientIp(request)}`);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many signup attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds ?? 60) } }
    );
  }

  let body: {
    name?: unknown;
    email?: unknown;
    password?: unknown;
    intake?: IntakeAnswers;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, password, intake } = body;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !name.trim() ||
    !email.trim() ||
    password.length < 8
  ) {
    return NextResponse.json(
      { error: "Name, email, and an 8+ character password are required." },
      { status: 400 }
    );
  }

  // Checked here, not just in the client's strength meter — a client-only
  // check is a suggestion, not a rule. Rejecting on commonality rather than
  // requiring a symbol/digit mix follows NIST SP 800-63B (see
  // passwordStrength.ts's own header for why): length is enforced above,
  // this catches "password123"-style weakness a length check alone can't.
  if (isCommonPassword(password)) {
    return NextResponse.json(
      { error: "That password is too common. Try something less guessable." },
      { status: 400 }
    );
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Deliberately vague — matches the Credentials provider's own refusal to
    // distinguish "wrong password" from "no such user". A precise "that email
    // is taken" message is a normal UX nicety elsewhere, but paired with a
    // generic login failure it becomes an email-enumeration oracle.
    return NextResponse.json(
      { error: "Could not create an account with those details." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  await adoptIntake(user.id, intake);

  return NextResponse.json({ id: user.id, email: user.email });
}
