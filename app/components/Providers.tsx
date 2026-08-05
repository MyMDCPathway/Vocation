"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

// Makes useSession() work anywhere in the tree. Without this wrapper,
// next-auth/react's client hooks have no context to read from — the header
// controls (AuthControls.tsx) would have no way to tell a signed-in visitor
// from an anonymous one.
export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
