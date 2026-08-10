"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/app/components/auth/PasswordField";

// PRD §1: "Login Screen — simple, focused layout. Email/password fields,
// social login options (LinkedIn, Google)." Neither social option survived:
// email/password is the only way in, because shipping an OAuth app Google
// hasn't verified caps sign-ups at 100 people, which is a worse launch than
// no social login at all.
//
// "Forgot password" was held back while account creation was the whole scope,
// on the rule that a link to a page which doesn't exist is exactly the kind of
// promised-but-missing control this project avoids (see PRODUCT.md). The reset
// flow now exists — /forgot-password through /reset-password — so the link
// below points at something real.
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (result?.error) {
      setError("That email and password don't match an account.");
      return;
    }

    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-5 py-16">
      <div className="w-full max-w-md rounded-lg border border-outline-variant bg-surface-lowest p-8 shadow-card">
        <h1 className="text-2xl font-semibold text-primary">Log in</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Pick up your saved plan where you left off.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-on-surface-variant">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border border-outline-variant bg-surface-lowest px-3 py-2 text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          {error && <p className="text-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link href="/forgot-password" className="font-medium text-secondary hover:text-secondary/80">
            Forgot password?
          </Link>
        </p>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          New here?{" "}
          <Link href="/signup" className="font-medium text-secondary hover:text-secondary/80">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
