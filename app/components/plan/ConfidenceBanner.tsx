"use client";

import type { SchoolRef } from "@/app/lib/schoolRef";

// How much to trust what's below.
//
// This is the honest half of going open-world. Vocation used to plan only for
// schools whose entire program catalog had been scraped, which made every
// program on screen real by construction. It now plans for any school on
// earth, and for most of them there is no catalog — the model proposes the
// programs and the server checks whether their pages exist.
//
// Those are meaningfully different levels of confidence and a student
// deciding where to spend four years deserves to know which one they're
// looking at. Hiding the difference would make the AI-sourced plans feel as
// solid as the catalog-backed ones, which is exactly the failure the scraping
// work existed to prevent.

export function ConfidenceBanner({
  school,
  verification,
}: {
  school: SchoolRef;
  verification?: { verified: number; fallback: number; unverified: number };
}) {
  if (school.source === "catalog") {
    return (
      <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-semibold text-green-900">
          Built from {school.name}&apos;s real program catalog
        </p>
        <p className="mt-1 text-sm leading-relaxed text-green-800">
          We hold this school&apos;s full program list, scraped from its own
          site, and the plan below could only be built from programs that
          actually exist there.
        </p>
      </div>
    );
  }

  const checked = verification
    ? verification.verified + verification.fallback + verification.unverified
    : 0;
  const confirmed = verification?.verified ?? 0;

  return (
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-900">
        AI-generated for {school.name} — program pages checked
      </p>
      <p className="mt-1 text-sm leading-relaxed text-amber-900">
        We don&apos;t hold this school&apos;s program catalog, so the programs
        below are the model&apos;s best attempt rather than a list taken from
        the school itself.{" "}
        {checked > 0 ? (
          <>
            We fetched the page for each one:{" "}
            <strong>
              {confirmed} of {checked}
            </strong>{" "}
            resolved to a real program page.
            {verification!.fallback > 0 && (
              <>
                {" "}
                {verification!.fallback} fell back to the school&apos;s general
                program list.
              </>
            )}
            {verification!.unverified > 0 && (
              <>
                {" "}
                {verification!.unverified} couldn&apos;t be confirmed at all —
                treat those as unproven.
              </>
            )}
          </>
        ) : (
          <>There were no specific program pages to check on this route.</>
        )}{" "}
        Confirm any program exists before you rely on it.
      </p>
    </div>
  );
}

/** The per-step badge, shown on a card whose link we did or didn't confirm. */
export function StepVerificationBadge({
  status,
  reason,
}: {
  status: "verified" | "fallback" | "unverified";
  reason: string;
}) {
  const styles = {
    verified: "bg-green-50 text-green-800",
    fallback: "bg-amber-50 text-amber-800",
    unverified: "bg-sand-deep text-ink-soft",
  } as const;

  const labels = {
    verified: "Program page confirmed",
    fallback: "Specific page not found",
    unverified: "Couldn't confirm",
  } as const;

  return (
    <span
      title={reason}
      className={`mt-3 inline-block rounded px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
