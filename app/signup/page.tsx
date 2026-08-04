"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { loadIntake } from "@/app/lib/intakeStorage";

// PRD §1: "Create Account — two-step initial sign-up. Basic info (Name,
// Email, Password) followed by account type selection (Student, Career
// Changer, Professional)."
//
// The Stitch mock for this screen paired the form with a side panel quoting
// "Dr. Elena Rostova, Head of Career Strategy, Vocation AI" — a person and
// title that don't exist. PRODUCT.md is explicit that there are no
// testimonials and no named people on this product; the panel below carries
// real, already-approved copy instead (the same claim the landing page makes),
// not an invented endorsement.
const ACCOUNT_TYPES = [
  { id: "student", label: "Student" },
  { id: "career_changer", label: "Career Changer" },
  { id: "professional", label: "Professional" },
] as const;

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<(typeof ACCOUNT_TYPES)[number]["id"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  function goToStepTwo(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setStep(2);
  }

  async function createAccount() {
    if (!accountType) {
      setError("Pick the option closest to where you are right now.");
      return;
    }
    setError(null);
    setSubmitting(true);

    // Carries a visitor's in-progress intake into the new account, so
    // answering questions before deciding to sign up doesn't throw them away
    // — see app/lib/intakeAdoption.ts.
    const intake = loadIntake();

    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, accountType, intake }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong creating your account.");
      setSubmitting(false);
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    router.push("/onboarding");
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Real product copy, not a stock photo or an invented quote. */}
      <div className="hidden flex-col justify-center bg-primary px-12 py-16 text-on-primary lg:flex">
        <p className="text-3xl font-semibold leading-snug">
          Not every job runs through a four-year degree.
        </p>
        <p className="mt-4 max-w-md text-on-primary/80">
          Vocation works out how people actually get into the career you want —
          the programs, the transfers, the licences, the apprenticeships — and
          what each step costs, using real course catalogs rather than
          guesswork.
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold text-primary">Create your account</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Start navigating your professional future today.
          </p>

          {step === 1 && (
            <form onSubmit={goToStepTwo} className="mt-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-on-surface-variant">
                  Full name
                </label>
                <input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="mt-1 w-full rounded border border-outline-variant bg-surface-lowest px-3 py-2 text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-on-surface-variant">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="mt-1 w-full rounded border border-outline-variant bg-surface-lowest px-3 py-2 text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-on-surface-variant">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="mt-1 w-full rounded border border-outline-variant bg-surface-lowest px-3 py-2 text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="mt-1 text-xs text-on-surface-variant">
                  Must be at least 8 characters long.
                </p>
              </div>

              {error && <p className="text-sm text-error">{error}</p>}

              <button
                type="submit"
                className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-on-primary transition-colors hover:bg-primary-container"
              >
                Continue
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="mt-6 space-y-4">
              <p className="text-sm font-medium text-on-surface-variant">
                I identify primarily as a:
              </p>
              <div className="grid grid-cols-3 gap-3">
                {ACCOUNT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setAccountType(type.id)}
                    aria-pressed={accountType === type.id}
                    className={`rounded-md border p-4 text-center text-sm font-medium transition-colors ${
                      accountType === type.id
                        ? "border-secondary bg-secondary/10 text-secondary"
                        : "border-outline-variant text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {error && <p className="text-sm text-error">{error}</p>}

              <button
                type="button"
                onClick={createAccount}
                disabled={submitting}
                className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Creating account…" : "Create Account"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-sm font-medium text-on-surface-variant hover:text-primary"
              >
                Back
              </button>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-outline-variant" />
            <span className="text-xs font-semibold uppercase tracking-wider text-outline">or</span>
            <span className="h-px flex-1 bg-outline-variant" />
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => signIn("google")}
              className="w-full rounded-md border border-outline-variant py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              Sign up with Google
            </button>
            <button
              type="button"
              onClick={() => signIn("linkedin")}
              className="w-full rounded-md border border-outline-variant py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              Sign up with LinkedIn
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-secondary hover:text-secondary/80">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
