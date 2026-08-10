"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";

// The one place "am I signed in" actually gets checked, shared by the landing
// header (app/page.tsx) and the intake's TopBar (StepShell.tsx) so the two
// don't drift into answering that question two different ways.
//
// Notifications stays a disabled stub in both states — there's no
// notification system yet. The standalone Settings gear is gone: it was
// redundant with "Account Settings" now living inside the profile menu below.
// Every item in that menu goes somewhere real; placeholders that only promised
// a future page have been taken back out rather than left to advertise
// themselves.
function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-[18px] w-[18px]">
      <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
      <path d="M10.5 20a2 2 0 0 0 3 0" />
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

function menuIcon(children: React.ReactNode) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-[18px] w-[18px]">
      {children}
    </svg>
  );
}

function RoadmapIcon() {
  return menuIcon(
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 4v5" />
    </>
  );
}

function SettingsIcon() {
  return menuIcon(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15a2 2 0 1 1 0-4 1.6 1.6 0 0 0 1.7-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 11 4.6V4a2 2 0 1 1 4 0v.6a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 21 11a2 2 0 1 1 0 4h-.6a1.6 1.6 0 0 0-1 .9z" />
    </>
  );
}

function HelpIcon() {
  return menuIcon(
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.2 2.4c-.7.2-1.2.9-1.2 1.6v.5" />
      <path d="M11.5 17h.01" />
    </>
  );
}

function SignOutIcon() {
  return menuIcon(
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  );
}

/** Initials from a name, since no avatar-upload feature exists — a real
 *  fallback rather than a stock silhouette pretending to be a photo. */
function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function MenuItem({
  icon,
  label,
  href,
  onNavigate,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
    >
      {icon}
      {label}
    </Link>
  );
}

function ProfileMenu({ name, email }: { name: string | null | undefined; email: string | null | undefined }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
      >
        {initials(name)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-lg border border-outline-variant bg-surface-lowest shadow-overlay"
        >
          <div className="border-b border-outline-variant px-4 py-3">
            <p className="text-sm font-semibold text-on-surface">{name ?? "Your account"}</p>
            <p className="mt-0.5 truncate text-xs text-on-surface-variant">{email}</p>
          </div>

          <div className="py-1">
            <MenuItem
              icon={<RoadmapIcon />}
              label="My Roadmap"
              href="/pathways"
              onNavigate={() => setOpen(false)}
            />
            <MenuItem
              icon={<SettingsIcon />}
              label="Account Settings"
              href="/account/settings"
              onNavigate={() => setOpen(false)}
            />
            <MenuItem
              icon={<HelpIcon />}
              label="Help Center"
              href="/help"
              onNavigate={() => setOpen(false)}
            />
          </div>

          <div className="border-t border-outline-variant py-1">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-error transition-colors hover:bg-error-container/40"
            >
              <SignOutIcon />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AuthControls() {
  const { data: session, status } = useSession();

  return (
    <div className="flex items-center gap-2">
      {/* Signed-out visitors have no account for this to be adjacent to —
          it appears only once a session actually exists. */}
      {session && (
        <BarStub label="Notifications" title="Notifications are coming soon">
          <BellIcon />
        </BarStub>
      )}

      {status === "loading" ? (
        // A fixed-width placeholder, not a spinner — the session check is a
        // single fast local read, and a spinner would flash for longer than
        // the thing it's announcing.
        <div className="h-9 w-20" aria-hidden="true" />
      ) : session ? (
        <ProfileMenu name={session.user?.name} email={session.user?.email} />
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
