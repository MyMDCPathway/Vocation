"use client";

import { useState } from "react";
import Link from "next/link";

// Step one of the reset flow, and the answer to the PRD's "Forgot password"
// item the login screen used to point at nothing.
//
// The screen deliberately never says whether the address matched an account —
// the route can't tell it (see /api/auth/forgot-password for why that would be
// an enumeration oracle), so the UI shows the same confirmation either way
// rather than inventing certainty it doesn't have. That is also why the
// confirmation mentions the spam folder: "nothing arrived" has two innocent
// explanations and this page can't distinguish them.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function requestLink(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);

    setSubmitting(false);

    // Only genuine failures — a malformed request, a 429, a dead network —
    // surface as errors. Everything the server accepts lands on the same
    // confirmation.
    if (!response) {
      setError("Couldn't reach the server. Check your connection and try again.");
      return;
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong sending that link.");
      return;
    }

    setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-5 py-16">
      <div className="w-full max-w-md rounded-lg border border-outline-variant bg-surface-lowest p-8 shadow-card">
        <h1 className="text-2xl font-semibold text-primary">Reset your password</h1>

        {sent ? (
          <>
            <p className="mt-2 text-sm text-on-surface-variant">
              If an account exists for <span className="font-medium text-on-surface">{email}</span>,
              a reset link is on its way. It works once and expires in an hour.
            </p>
            <p className="mt-4 text-sm text-on-surface-variant">
              Nothing in your inbox after a few minutes? Check your spam folder, then{" "}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="font-medium text-secondary hover:text-secondary/80"
              >
                try a different email
              </button>
              .
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-on-surface-variant">
              Enter the email you signed up with and we&apos;ll send you a link to
              choose a new password.
            </p>

            <form onSubmit={requestLink} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-on-surface-variant">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="mt-1 w-full rounded border border-outline-variant bg-surface-lowest px-3 py-2 text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {error && <p className="text-sm text-error">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Email me a reset link"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-secondary hover:text-secondary/80">
            Back to log in
          </Link>
        </p>
      </div>
    </main>
  );
}
