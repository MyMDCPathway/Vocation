"use client";

import {
  leadWageArea,
  wageScale,
  type AreaStats,
  type LaborStats,
} from "@/app/lib/blsStats";
import type { StatsStatus } from "@/app/lib/careerProfileTypes";

// The official numbers, drawn.
//
// Two charts, both answering questions a single "average salary" figure can't:
//
//   THE SPREAD    A median hides that the bottom tenth of registered nurses
//                 make $68,940 and the top tenth make $137,470. A student
//                 choosing a career is choosing a distribution, not a point,
//                 and the width of that bar is the thing they should see.
//
//   THE PLACE     The same job pays differently in their metro than in their
//                 state than in the country, and all three are drawn on ONE
//                 shared scale so the comparison is honest. Rescaling each row
//                 to its own width would make every market look identical.
//
// No chart library. Percentage-positioned divs handle a horizontal range bar
// perfectly well, they reflow on a phone without viewBox arithmetic, and the
// project holds to five runtime dependencies for good reasons.
//
// Everything here is BLS OEWS data. Nothing on this panel is model-generated,
// which is why it's allowed to look authoritative — see blsStats.ts.

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const count = new Intl.NumberFormat("en-US");

/** Order matters: the student's own market leads, the country anchors it. */
function orderedAreas(stats: LaborStats): AreaStats[] {
  return [stats.metro, stats.state, stats.national].filter(
    (area): area is AreaStats => area !== null
  );
}

function areaKind(area: AreaStats): string {
  if (area.type === "M") return "Your metro area";
  if (area.type === "S") return "Your state";
  return "Nationally";
}

export function LaborStatsPanel({ stats }: { stats: LaborStats }) {
  const areas = orderedAreas(stats);
  // Not areas[0] — a metro can report an employment count with its wages
  // suppressed, and heading the panel with it would leave no headline figure
  // at all. See leadWageArea.
  const lead = leadWageArea(stats);

  // One scale across every row, or the comparison lies. See wageScale.
  const hasAnyWage = areas.some((area) =>
    Object.values(area.wages).some((v) => v !== null)
  );
  if (!hasAnyWage) return null;

  const position = wageScale(areas);

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-lg font-bold text-ink">What it actually pays</h2>
        <p className="text-xs text-ink-faint">
          US Bureau of Labor Statistics, {stats.year}
        </p>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        Survey figures for{" "}
        <span className="font-medium text-ink">{stats.occupation.title}</span> — annual
        wages, not model estimates.
      </p>

      {/* The headline: what the middle of the field earns where they live. */}
      {lead?.wages.median != null && (
        <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-2">
          <div>
            <p className="text-4xl font-bold tracking-tight text-ink">
              {money.format(lead.wages.median)}
            </p>
            <p className="text-sm text-ink-soft">
              median · {lead.name}
            </p>
          </div>
          {lead.wages.p10 !== null && lead.wages.p90 !== null && (
            <p className="pb-1 text-sm text-ink-faint">
              Most earn between {money.format(lead.wages.p10)} and{" "}
              {money.format(lead.wages.p90)}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 space-y-5">
        {areas.map((area) => (
          <WageRow key={`${area.type}-${area.name}`} area={area} position={position} />
        ))}
      </div>

      <p className="mt-5 text-xs leading-relaxed text-ink-faint">
        The bar spans the 10th to the 90th percentile; the notch is the median.
        The bottom tenth and top tenth of earners fall outside it.
        {/* The metro is asked for on the next screen, so this panel is
            national on first read. Saying so beats letting a country-wide
            figure pass as a local one. */}
        {!stats.hasLocal && (
          <>
            {" "}
            These are national figures — tell us your area next and they narrow
            to your own market, which is often thousands of dollars different.
          </>
        )}
      </p>

      <Concentration stats={stats} />
    </section>
  );
}

function WageRow({
  area,
  position,
}: {
  area: AreaStats;
  position: (value: number) => number;
}) {
  const { p10, p25, median, p75, p90 } = area.wages;

  // Nothing to draw without both ends. The row still renders its median so a
  // partially-suppressed area isn't silently dropped.
  const hasBar = p10 !== null && p90 !== null;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span className="font-medium text-ink">
          {area.name}
          <span className="ml-2 text-xs font-normal text-ink-faint">
            {areaKind(area)}
          </span>
        </span>
        {median !== null && (
          <span className="font-semibold text-ink">{money.format(median)}</span>
        )}
      </div>

      {hasBar && (
        <div className="relative mt-2 h-7">
          {/* Track */}
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-sand-deep" />

          {/* 10th-90th */}
          <div
            className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-pop-blue"
            style={{
              left: `${position(p10)}%`,
              width: `${Math.max(position(p90) - position(p10), 0.5)}%`,
            }}
          />

          {/* 25th-75th: where half the field actually sits. */}
          {p25 !== null && p75 !== null && (
            <div
              className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-pop-purple"
              style={{
                left: `${position(p25)}%`,
                width: `${Math.max(position(p75) - position(p25), 0.5)}%`,
              }}
            />
          )}

          {/* Median notch */}
          {median !== null && (
            <div
              className="absolute top-1/2 h-5 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
              style={{ left: `${position(median)}%` }}
            />
          )}
        </div>
      )}

      {hasBar && (
        <div className="mt-1 flex justify-between text-xs text-ink-faint">
          <span>{money.format(p10)}</span>
          <span>{money.format(p90)}</span>
        </div>
      )}

      {area.employment !== null && (
        <p className="mt-1 text-xs text-ink-faint">
          {count.format(area.employment)} people hold this job here
          {area.perThousand !== null && (
            <> · {area.perThousand.toFixed(1)} of every 1,000 jobs</>
          )}
        </p>
      )}
    </div>
  );
}

/**
 * Location quotient, in words a student can act on.
 *
 * BLS publishes no national quotient — nationally it is 1.0 by definition —
 * so this only appears when a state or metro reported one.
 *
 * Deliberately NOT framed as good news. A high quotient means the work is
 * concentrated here, which also means the competition is. Both halves get said.
 */
function Concentration({ stats }: { stats: LaborStats }) {
  const area = stats.metro?.locationQuotient != null
    ? stats.metro
    : stats.state?.locationQuotient != null
      ? stats.state
      : null;

  if (!area || area.locationQuotient == null) return null;

  const quotient = area.locationQuotient;
  const percent = Math.round(Math.abs(quotient - 1) * 100);

  let verdict: string;
  if (quotient >= 1.2) {
    verdict = `${area.name} employs about ${percent}% more of them per job than the country average. The work is concentrated here — so is the competition for it.`;
  } else if (quotient <= 0.8) {
    verdict = `${area.name} employs about ${percent}% fewer of them per job than the country average. Fewer local employers, and possibly fewer people chasing each opening.`;
  } else {
    verdict = `${area.name} employs about as many of them per job as the country average — this is an ordinary market for the work, neither a hub nor a desert.`;
  }

  return (
    <div className="mt-5 rounded-xl bg-sand p-4">
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold text-ink">{quotient.toFixed(2)}×</span>
        <span className="text-sm font-medium text-ink-soft">
          how concentrated this job is near you
        </span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{verdict}</p>
    </div>
  );
}

/**
 * Why there are no official figures.
 *
 * Three genuinely different situations, and saying the wrong one is a false
 * claim about a public data source. This originally collapsed a failed request
 * into "BLS doesn't survey this job" and told that to a dental hygienist —
 * an occupation BLS has surveyed for decades. "We couldn't get it" and "it
 * doesn't exist" are not interchangeable.
 */
export function NoStatsNote({
  status,
  market,
}: {
  status: StatsStatus;
  market: string;
}) {
  return (
    <p className="text-xs leading-relaxed text-ink-faint">
      The pay figures above are estimates.{" "}
      {status === "outside-us" && (
        <>
          Our official wage data comes from the US Bureau of Labor Statistics,
          which only surveys US employers, so there are no survey figures to
          show for {market}.
        </>
      )}
      {status === "unmatched" && (
        <>
          The Bureau of Labor Statistics doesn&apos;t survey this job as its own
          occupation, so there are no official figures to check them against.
        </>
      )}
      {status === "unavailable" && (
        <>
          We couldn&apos;t reach the Bureau of Labor Statistics for this one just
          now — that&apos;s a problem at our end, not a gap in their data.
          Reload in a little while and the survey figures should appear.
        </>
      )}
    </p>
  );
}
