"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { loadIntake } from "@/app/lib/intakeStorage";
import { GoogleSignInButton } from "@/app/components/auth/GoogleSignInButton";
import { PasswordField } from "@/app/components/auth/PasswordField";
import { useGoogleAvailable } from "@/app/lib/useGoogleAvailable";
import { passwordStrength } from "@/app/lib/passwordStrength";

// PRD §1 originally called for a two-step sign-up — basic info, then account
// type selection (Student, Career Changer, Professional). That second step
// is gone: accountType was write-only (saved to the User row, read back by
// nothing — the same class of dead capability as onboarding's old privacy
// step, see app/onboarding/page.tsx). One screen collects everything this
// account actually needs.
//
// The Stitch mock for this screen paired the form with a side panel quoting
// "Dr. Elena Rostova, Head of Career Strategy, Vocation AI" — a person and
// title that don't exist. PRODUCT.md is explicit that there are no
// testimonials and no named people on this product; the panel below carries
// real, already-approved copy instead (the same claim the landing page makes),
// not an invented endorsement.

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const googleAvailable = useGoogleAvailable();

  async function createAccount(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    // Mirrors the server's own check in /api/signup/route.ts — this is a
    // convenience that saves a round trip, never the actual enforcement.
    const strength = passwordStrength(password);
    if (strength.blocked) {
      setError(strength.feedback);
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords don't match.");
      return;
    }
    if (!agreedToTerms) {
      setError("You'll need to agree to the Terms and Privacy Policy to continue.");
      return;
    }

    setSubmitting(true);

    // Carries a visitor's in-progress intake into the new account, so
    // answering questions before deciding to sign up doesn't throw them away
    // — see app/lib/intakeAdoption.ts.
    const intake = loadIntake();

    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, intake }),
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

          <form onSubmit={createAccount} className="mt-6 space-y-4">
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

            <PasswordField
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Create a secure password"
              autoComplete="new-password"
              helpText="Must be at least 8 characters long."
              showStrength
            />

            <PasswordField
              id="confirm-password"
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Type it again"
              autoComplete="new-password"
            />

            <label className="flex items-start gap-2 text-sm text-on-surface-variant">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-outline-variant"
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" target="_blank" className="font-medium text-secondary hover:text-secondary/80">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="font-medium text-secondary hover:text-secondary/80">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            {error && <p className="text-sm text-error">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !agreedToTerms}
              className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating account…" : "Create Account"}
            </button>
          </form>

          {googleAvailable && (
            <>
              <div className="mt-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-outline-variant" />
                <span className="text-xs font-semibold uppercase tracking-wider text-outline">or</span>
                <span className="h-px flex-1 bg-outline-variant" />
              </div>

              <div className="mt-6 space-y-3">
                <GoogleSignInButton label="Sign up with Google" />
              </div>
            </>
          )}

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
