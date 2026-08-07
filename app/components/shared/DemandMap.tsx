"use client";

import { useEffect, useState } from "react";
import type { StateDemandMap } from "@/app/lib/blsStats";
import { US_TILE_MAP, TILE_COLS } from "@/app/lib/usTileMap";

// Where in the country a job actually is.
//
// Extracted from app/components/intake/CareerProfileStep.tsx so /insights
// (HANDOFF's "build Insights into something real") can show the same real
// BLS map outside the intake, without duplicating the fetch, the scaling
// logic, or the "unpublished ≠ no jobs" distinction below. CareerProfileStep
// still renders this on the career-profile step; both call sites share this
// one implementation.
//
// Concentration, not headcount. Ranked by raw employment this would be a
// population map with California and Texas on top of almost every occupation,
// which tells a student nothing they didn't already know about California and
// Texas. The location quotient answers the question they're really asking:
// relative to everywhere else, is this a place where this work happens?
//
// Loaded separately from any career profile because it's the most expensive
// BLS call in the app and most students scroll past it — see
// /api/career-demand. The panel simply isn't there until it arrives, and
// stays absent if it never does. A page that renders without statistics is a
// supported state here, not a broken one.

const CARD = "rounded-xl bg-surface-lowest p-6 shadow-card";

function CardHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-primary">{children}</h2>;
}

interface Props {
  career: string;
  socCode?: string;
}

export function DemandMap({ career, socCode }: Props) {
  const [demand, setDemand] = useState<StateDemandMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDemand(null);
    (async () => {
      try {
        const response = await fetch("/api/career-demand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ career, socCode }),
        });
        if (!response.ok) return;
        const body = await response.json();
        if (!cancelled && body.demand) setDemand(body.demand);
      } catch {
        // Silence is the right failure here: no panel rather than an error
        // box for a figure nobody asked for by name.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [career, socCode]);

  if (!demand) return null;

  const byName = new Map(demand.states.map((state) => [state.name, state]));
  const quotients = demand.states
    .map((state) => state.locationQuotient)
    .filter((q): q is number => q !== null);
  if (!quotients.length) return null;

  // Scaled against the busiest state rather than a fixed ceiling, because
  // occupations differ wildly in how concentrated they get: petroleum
  // engineers hit 20× in Texas while cashiers barely leave 1× anywhere. A
  // fixed scale would render most careers as a uniformly cold map.
  const hottest = Math.max(...quotients);

  return (
    <section className={CARD}>
      <CardHeading>Where the jobs are</CardHeading>
      <p className="mt-1 text-xs leading-relaxed text-outline">
        How concentrated this job is in each state, against the national rate.
        Darker means more of this work happens there per job overall — not
        simply that the state is bigger.
      </p>

      <div
        className="mt-4 grid gap-1"
        style={{ gridTemplateColumns: `repeat(${TILE_COLS}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`Map of the United States shading each state by how concentrated ${career} work is there.`}
      >
        {US_TILE_MAP.map((tile) => {
          const state = byName.get(tile.name);
          const quotient = state?.locationQuotient ?? null;
          // Absence is "BLS didn't publish this", NOT "no jobs here" — those
          // are very different facts and must not share a colour. Unpublished
          // states stay outlined and empty; see fetchStateDemand.
          const share = quotient === null ? null : quotient / hottest;

          return (
            <div
              key={tile.postal}
              style={{
                gridRow: tile.row + 1,
                gridColumn: tile.col + 1,
                // Floored so the faintest real reading is still visibly a
                // reading, rather than fading into the "no data" tile.
                //
                // color-mix against the school-agnostic --secondary token
                // (see globals.css) rather than a hardcoded rgba() triplet —
                // this used to be a literal rgba(15, 118, 110, ...) that
                // drifted from the actual --secondary value (HANDOFF §15
                // open item). color-mix reads the live CSS variable, so it
                // can never drift again.
                backgroundColor:
                  share === null
                    ? undefined
                    : `color-mix(in srgb, var(--secondary) ${(0.12 + share * 0.88) * 100}%, transparent)`,
              }}
              title={
                quotient === null
                  ? `${tile.name} — no published figure`
                  : `${tile.name} — ${quotient.toFixed(2)}× the national rate${
                      state?.employment
                        ? `, about ${state.employment.toLocaleString()} jobs`
                        : ""
                    }`
              }
              className={`flex aspect-square items-center justify-center rounded text-xs font-semibold ${
                share === null
                  ? "border border-dashed border-outline-variant text-outline/50"
                  : share > 0.55
                    ? "text-white"
                    : "text-on-surface"
              }`}
            >
              {tile.postal}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-outline">
        <span>Less</span>
        <div className="flex h-2 flex-1 overflow-hidden rounded-full">
          {[0.12, 0.34, 0.56, 0.78, 1].map((step) => (
            <div
              key={step}
              className="flex-1"
              style={{
                backgroundColor: `color-mix(in srgb, var(--secondary) ${step * 100}%, transparent)`,
              }}
            />
          ))}
        </div>
        <span>More</span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-outline">
        {demand.states.length} states reported
        {demand.year ? ` in ${demand.year}` : ""}. A dashed square means the
        Bureau of Labor Statistics didn&apos;t publish a figure there, which
        usually means too few workers to report safely — not that the job
        doesn&apos;t exist.
      </p>
    </section>
  );
}
