"use client";

import { useEffect, useState } from "react";
import { LaborStatsPanel } from "@/app/components/LaborStatsPanel";
import type { LaborStats } from "@/app/lib/blsStats";
import type { StudentLocation } from "@/app/lib/intake";

// What the job pays where they actually live.
//
// The career summary runs before the location question, so the wage figures
// there are national — right, but not theirs. By the time the plan is built we
// know the metro, and the difference is not small: registered nurses have a
// national median of $97,550, a Florida median of $84,190, and a Miami median
// of $91,380. A student comparing four years of tuition against a salary
// deserves the one that describes their own market.
//
// It sits directly above the routes on purpose. Every cost figure further down
// the page is only meaningful against this number, and a payoff shown after the
// price reads as justification rather than as information.
//
// Fetched from /api/labor-stats rather than re-requesting the profile: the
// summary, day-to-day and practitioner themes don't vary by metro, and asking
// the profile route for a new area would pay for a fresh Gemini call to
// regenerate text we already have.

export function LocalPayPanel({
  career,
  location,
  socCode,
}: {
  career: string;
  location: StudentLocation | undefined;
  /** The occupation the summary matched, so both pages agree on the job. */
  socCode: string | undefined;
}) {
  const [stats, setStats] = useState<LaborStats | null>(null);

  const countryCode = location?.countryCode;
  const subdivision = location?.subdivision;
  const city = location?.city;

  useEffect(() => {
    if (!career || !countryCode) return;
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/labor-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ career, countryCode, subdivision, city, socCode }),
        });
        const body = await response.json().catch(() => ({}));
        if (!cancelled && response.ok) setStats(body.stats ?? null);
      } catch {
        // Silent. This panel is context, not part of the plan — a BLS outage
        // shouldn't put an error box above someone's routes.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [career, countryCode, subdivision, city, socCode]);

  // Nothing to say is better than a box explaining why there's nothing to say.
  // Unlike the summary, this panel wasn't promised — it either has figures or
  // it isn't there.
  if (!stats) return null;

  return (
    <div className="mt-8">
      <LaborStatsPanel stats={stats} />
    </div>
  );
}
