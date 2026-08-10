"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useRef, type ReactNode } from "react";
import { loadPending, clearPending } from "@/app/lib/pendingSaveStorage";

// Makes useSession() work anywhere in the tree. Without this wrapper,
// next-auth/react's client hooks have no context to read from — the header
// controls (AuthControls.tsx) would have no way to tell a signed-in visitor
// from an anonymous one.
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <PendingSaveAdopter />
      {children}
    </SessionProvider>
  );
}

/**
 * Adopts a "save this plan" click a signed-out visitor made before signing
 * up — the same problem intakeAdoption.ts solves for the intake, but for a
 * pathway save instead. Mounted once at the root (inside SessionProvider, so
 * it can see the session everywhere) rather than on /plan itself, because
 * signup doesn't redirect back to /plan — it goes to /onboarding — so the
 * one place guaranteed to render after a fresh sign-in is the root layout.
 *
 * Renders nothing. The `adopted` ref, not just checking session status,
 * stops this from re-firing the POST on every re-render while signed in.
 */
function PendingSaveAdopter() {
  const { status } = useSession();
  const adopted = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || adopted.current) return;
    const pending = loadPending();
    if (!pending) return;

    adopted.current = true;
    (async () => {
      try {
        await fetch("/api/pathways", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pending),
        });
      } finally {
        // Cleared either way: a failed adopt would otherwise retry forever
        // on every future sign-in, silently resurrecting a stale save.
        clearPending();
      }
    })();
  }, [status]);

  return null;
}
