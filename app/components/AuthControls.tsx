"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

// The one place "am I signed in" actually gets checked, shared by the landing
// header (app/page.tsx) and the intake's TopBar (StepShell.tsx) so the two
// don't drift into answering that question two different ways.
//
// Notifications and Settings stay disabled stubs in BOTH states. Signing in
// doesn't make either real — there's no notification system and no Settings
// Dashboard yet (see PRODUCT.md's "explicitly undecided"). The Account
// control is the only one that changes meaning: signed out, it's Log in /
// Sign up; signed in, it's a real, working Sign out — never a stub dressed up
// to look otherwise.
function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-[18px] w-[18px]">
      <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
      <path d="M10.5 20a2 2 0 0 0 3 0" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-[18px] w-[18px]">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15a2 2 0 1 1 0-4 1.6 1.6 0 0 0 1.7-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 11 4.6V4a2 2 0 1 1 4 0v.6a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 21 11a2 2 0 1 1 0 4h-.6a1.6 1.6 0 0 0-1 .9z" />
    </svg>
  );
}

function BarStub({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled
      aria-label={label}
      title={title}
      className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full text-outline/70"
    >
      {children}
    </button>
  );
}

export function AuthControls() {
  const { data: session, status } = useSession();

  return (
    <div className="flex items-center gap-1">
      {/* Signed-out visitors have no account for these to be adjacent to —
          showing them anyway reads as "here's a feature you're locked out
          of" rather than "here's a feature coming soon". They appear only
          once a session actually exists. */}
      {session && (
        <>
          <BarStub label="Notifications" title="Notifications are coming soon">
            <BellIcon />
          </BarStub>
          <BarStub label="Settings" title="Settings are coming soon">
            <GearIcon />
          </BarStub>
        </>
      )}

      {status === "loading" ? (
        // A fixed-width placeholder, not a spinner — the session check is a
        // single fast local read, and a spinner would flash for longer than
        // the thing it's announcing.
        <div className="h-9 w-20" aria-hidden="true" />
      ) : session ? (
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="px-3 text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
        >
          Sign out
        </button>
      ) : (
        <>
          <Link
            href="/login"
            className="px-3 text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-on-secondary transition-colors hover:bg-secondary/90"
          >
            Sign up
          </Link>
        </>
      )}
    </div>
  );
}
