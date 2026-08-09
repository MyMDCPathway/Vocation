"use client";

import { useEffect, useState } from "react";
import { getProviders } from "next-auth/react";

// Whether Google sign-in is actually configured — asked of Auth.js itself
// (getProviders() is a client-safe fetch to /api/auth/providers) rather than
// assumed. Shared by login and signup so both can hide the ENTIRE "or Google"
// section, divider included, when it isn't: hiding just the button would
// leave an "or" rule floating above nothing, which is still a promise of a
// capability that isn't there, just a quieter one.
export function useGoogleAvailable(): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProviders().then((providers) => {
      if (!cancelled) setAvailable(Boolean(providers?.google));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return available;
}
