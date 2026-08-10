"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordField } from "@/app/components/auth/PasswordField";
import { passwordStrength } from "@/app/lib/passwordStrength";

// Step two of the reset flow: the screen the emailed link opens.
//
// The token rides in the query string, which is why this page is a client
// component wrapped in Suspense — useSearchParams opts a route out of static
// prerendering unless there's a boundary above it (same shape as
// app/pathway/page.tsx).
//
// It is deliberately not sent to the server until the form is submitted. A
// page that validated the token on load would tell anyone who opened the link
// whether it was live before they typed anything, and would burn a single-use
// token on a preview fetch by a mail client or link scanner.

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function resetPassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    // Mirrors the server's own check in /api/auth/reset-password — the same
    // shared policy from passwordStrength.ts, run here only to save a round
    // trip. The server's copy is the enforcement.
    const strength = passwordStrength(password);
    if (strength.blocked) {
      setError(strength.feedback);
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords don't match.");
      return;
    }

    setSubmitting(true);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    }).catch(() => null);

    setSubmitting(false);

    if (!response) {
      setError("Couldn't reach the server. Check your connection and try again.");
      return;
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong resetting your password.");
      return;
    }

    // Signed in with the new password rather than automatically — the reset
    // route deliberately creates no session, so the password gets used once
    // for real before it's trusted.
    setDone(true);
    router.push("/login");
  }

  // A link that arrived without a token can't be recovered from here, so say
  // so plainly instead of failing on submit.
  if (!token) {
    return (
      <Card>
        <h1 className="text-2xl font-semibold text-primary">Reset link incomplete</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          This link is missing its reset token — some mail clients trim long
          URLs. Request a fresh one and open it directly from the email.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 block w-full rounded-md bg-primary py-2.5 text-center text-sm font-medium text-on-primary transition-colors hover:bg-primary-container"
        >
          Email me a new link
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-2xl font-semibold text-primary">Choose a new password</h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        {done
          ? "Password changed. Taking you to the login screen…"
          : "Once you set this, the link you used stops working."}
      </p>

      <form onSubmit={resetPassword} className="mt-6 space-y-4">
        <PasswordField
          id="password"
          label="New password"
          value={password}
          onChange={setPassword}
          placeholder="Create a secure password"
          autoComplete="new-password"
          helpText="Must be at least 8 characters long."
          showStrength
        />

        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Type it again"
          autoComplete="new-password"
        />

        {error && <p className="text-sm text-error">{error}</p>}

        <button
          type="submit"
          disabled={submitting || done}
          className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Set new password"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-on-surface-variant">
        Link expired?{" "}
        <Link href="/forgot-password" className="font-medium text-secondary hover:text-secondary/80">
          Request a new one
        </Link>
      </p>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-5 py-16">
      <div className="w-full max-w-md rounded-lg border border-outline-variant bg-surface-lowest p-8 shadow-card">
        {children}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <p className="text-sm text-on-surface-variant">Loading…</p>
        </Card>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
