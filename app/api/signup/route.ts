import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { hashPassword } from "@/app/lib/password";
import { adoptIntake } from "@/app/lib/intakeAdoption";
import type { IntakeAnswers } from "@/app/lib/intake";

// Creates the account itself — PRD §1's "Create Account" step. OAuth signup
// (Google) never touches this route; Auth.js's own callback creates those
// users directly via the Prisma adapter. This route exists only for the
// email/password path, where nothing else will hash the password or check
// for an existing email first.
export async function POST(request: NextRequest) {
  let body: {
    name?: unknown;
    email?: unknown;
    password?: unknown;
    accountType?: unknown;
    intake?: IntakeAnswers;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, password, accountType, intake } = body;

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

  // PRD §1: "Student, Career Changer, Professional" — validated against the
  // fixed set rather than stored as whatever string the client sent, so a
  // typo'd or malicious value can't end up driving onboarding/settings logic
  // that expects one of these three.
  const validAccountTypes = ["student", "career_changer", "professional"];
  const normalizedAccountType =
    typeof accountType === "string" && validAccountTypes.includes(accountType)
      ? accountType
      : null;

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
      accountType: normalizedAccountType,
    },
  });

  await adoptIntake(user.id, intake);

  return NextResponse.json({ id: user.id, email: user.email });
}
