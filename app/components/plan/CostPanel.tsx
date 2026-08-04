"use client";

import {
  estimateAid,
  estimatePlanCost,
  formatCostRange,
  formatCostRangeShort,
} from "@/app/lib/planCost";
import type { IncomeBand } from "@/app/lib/intake";
import type { PathwayOption } from "@/app/lib/types";
import type { SchoolRef } from "@/app/lib/schoolRef";

// What a route costs — the free half.
//
// THE GATE IS A PRODUCT BOUNDARY, NOT A SECURITY ONE. Everything below is
// computed in the browser from data the browser already has, so the locked
// rows are not rendered at all rather than rendered-and-blurred: a CSS blur
// over real figures is readable in two clicks of devtools and would make the
// paid tier a lie. Skeleton rows show what you'd get without shipping it.
//
// If this ever becomes a real paid tier, the itemization has to move behind an
// authenticated server route. Gating it in a client component can't work, and
// pretending otherwise now would build the wrong thing to migrate later.

const LOCKED_ROWS = [
  {
    label: "Cost of every step, itemized",
    detail: "Tuition per degree, per exam, per year — not just the total",
  },
  {
    label: "Grant aid you'd likely qualify for",
    detail: "Pell and state grants estimated from what you told us",
  },
  {
    label: "What you'd actually pay after aid",
    detail: "Net price, which is usually nothing like the sticker figure",
  },
  {
    label: "Living costs on top of tuition",
    detail: "Housing, food, and transport for the area you'd study in",
  },
  {
    label: "Year-by-year cash flow",
    detail: "What's due when, so you can see the years that actually hurt",
  },
];

export function CostPanel({
  pathway,
  school,
  incomeBand,
  countryCode,
}: {
  pathway: PathwayOption;
  school: SchoolRef;
  incomeBand: IncomeBand | undefined;
  /** Where the STUDENT lives — aid eligibility follows them, not the school. */
  countryCode: string | undefined;
}) {
  const cost = estimatePlanCost(pathway.steps, school.id, school.tuition);
  const aid = estimateAid(incomeBand, countryCode);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Free: the headline. */}
      <div className="rounded-xl border border-outline-variant bg-surface-lowest p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-outline">
          Estimated cost of this route
        </h3>
        <p className="mt-2 text-3xl font-bold text-primary">
          {formatCostRange(cost.total)}
        </p>
        <p className="mt-1 text-sm text-on-surface-variant">
          Tuition and fees across roughly {cost.years}{" "}
          {cost.years === 1 ? "year" : "years"} of study.
        </p>

        <dl className="mt-6 space-y-3 border-t border-outline-variant/50 pt-6 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-on-surface-variant">Time to qualified</dt>
            <dd className="font-semibold text-primary">
              ~{cost.years} {cost.years === 1 ? "year" : "years"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-on-surface-variant">Grant aid outlook</dt>
            <dd className="text-right font-semibold text-primary">
              {aid.headline}
            </dd>
          </div>
        </dl>

        <p className="mt-6 text-xs leading-relaxed text-outline">
          Tuition and fees only — housing, food, books, and transport are not
          included and often cost more than tuition does.
          {cost.hasSectorEstimate &&
            " Some figures here are sector rates rather than this school's own published price."}
        </p>
      </div>

      {/* Paid: what the itemization would tell you. */}
      <div className="relative overflow-hidden rounded-xl border border-outline-variant bg-gradient-to-b from-surface-lowest to-surface p-6">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-semibold text-primary">
            Vocation Plus
          </span>
          <span className="text-xs text-outline">Coming soon</span>
        </div>

        <h3 className="mt-3 text-lg font-bold text-primary">
          The full financial breakdown
        </h3>
        <p className="mt-1 text-sm text-on-surface-variant">
          The headline range is the sticker price. What you&apos;d actually pay
          depends on aid, and that&apos;s the part worth getting right.
        </p>

        <ul className="mt-5 space-y-3">
          {LOCKED_ROWS.map((row) => (
            <li key={row.label} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-surface-container"
              >
                <svg className="h-2.5 w-2.5 text-outline" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>
                <span className="block text-sm font-medium text-on-surface">
                  {row.label}
                </span>
                <span className="block text-xs text-outline">{row.detail}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-xl border border-dashed border-outline-variant/70 bg-surface-lowest p-4">
          <p className="text-xs text-outline">
            Here&apos;s the one piece we&apos;ll show you free, because it
            changes the answer most:
          </p>
          <p className="mt-2 text-sm font-semibold text-primary">
            {aid.estimated
              ? `Roughly ${formatCostRangeShort(aid.annual)} a year in grant aid`
              : "Add an income range to see your aid outlook"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-outline">{aid.detail}</p>
        </div>

        <p className="mt-4 text-xs text-outline">
          Not a financial aid determination. Real eligibility comes from the
          FAFSA, which weighs household size and assets alongside income.
        </p>
      </div>
    </div>
  );
}
