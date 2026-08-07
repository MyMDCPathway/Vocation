import Link from "next/link";
import { SchoolMark } from "@/app/components/SchoolMark";
import type { DirectorySchool } from "@/app/lib/schoolDirectory";

// One school, in the /schools grid.
//
// Two classes of fact on this card and they're never allowed to blur, same
// discipline as the career profile page (HANDOFF §"Part 3"): the catalog
// badge is a fact we hold (a real scraped program list, or not); the
// Scorecard figures are a fact from a named federal source, present only
// when we actually have a row for this school (Rule 1 — never invent school
// data). A school with no Scorecard match shows an honest "not available"
// line instead of a blank space that reads as "zero".

const KIND_LABELS: Record<DirectorySchool["kind"], string> = {
  "state-college": "Florida College System",
  "public-university": "State University",
  private: "Private",
};

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMiles(value: number): string {
  return `${Math.round(value)} mi`;
}

interface Props {
  school: DirectorySchool;
  programMatchCount?: number;
}

export function SchoolCard({ school, programMatchCount }: Props) {
  const sc = school.scorecard;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-surface-lowest shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3 border-b border-outline-variant p-5">
        <SchoolMark school={school} size="lg" />
        {school.hasCatalog ? (
          <span className="inline-flex shrink-0 items-center rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-on-primary">
            Full catalog
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center rounded-full border border-outline-variant px-2.5 py-1 text-xs font-medium text-on-surface-variant">
            AI-sourced
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {/* min-h reserves room for a two-line name so a one-line name doesn't
            leave every other stat, and the footer link below, sitting higher
            than its neighbors in the row — the same fix career-discovery's
            result cards needed for the same reason. */}
        <p className="min-h-[3.5rem] text-lg font-semibold leading-snug text-on-surface">
          {school.name}
        </p>
        <p className="mt-0.5 text-sm text-on-surface-variant">
          {school.city}, FL · {KIND_LABELS[school.kind]}
          {school.distanceMiles !== null && ` · ${formatMiles(school.distanceMiles)}`}
        </p>

        {typeof programMatchCount === "number" && (
          <p className="mt-2 text-xs font-semibold text-secondary">
            {programMatchCount} matching program{programMatchCount === 1 ? "" : "s"}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-outline">
              Median earnings
            </p>
            <p className="mt-0.5 font-medium text-on-surface">
              {sc?.medianEarnings10yr ? `${formatMoney(sc.medianEarnings10yr)}/yr` : "Not available yet"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-outline">
              Completion rate
            </p>
            <p className="mt-0.5 font-medium text-on-surface">
              {sc?.completionRate ? formatPercent(sc.completionRate) : "Not available yet"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-outline">
              Avg. net price
            </p>
            <p className="mt-0.5 font-medium text-on-surface">
              {sc?.netPrice ? `${formatMoney(sc.netPrice)}/yr` : "Not available yet"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-outline">
              Admission rate
            </p>
            <p className="mt-0.5 font-medium text-on-surface">
              {sc?.admissionRate ? formatPercent(sc.admissionRate) : "Not available yet"}
            </p>
          </div>
        </div>

        {/* mt-auto, not mt-5: pushes this link (and only this link) to the
            bottom of the card's remaining height, so every card's button
            lines up across a row regardless of how much text sits above it. */}
        <Link
          href="/start"
          className="mt-auto inline-flex items-center gap-2 border-t border-outline-variant pt-4 text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
        >
          Plan a pathway here
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-4 w-4"
          >
            <path d="M5 12h13" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
