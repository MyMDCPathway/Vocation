"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  RESOURCE_KIND_LABELS,
  type CareerProfile,
  type DemandLevel,
} from "@/app/lib/careerProfileTypes";
import { ContinueButton, StepShell } from "@/app/components/intake/StepShell";

// What the job actually is, before anyone commits years to it.
//
// This sits between "which career" and the questions that build a plan, and
// it's the one screen in the wizard that isn't a question. That's deliberate:
// every question after it costs the student effort, and some of them will
// decide this isn't the job for them once they read what it pays and how
// competitive it is. Better here than four screens later.
//
// Demand is not colour-coded green-for-good. "Competitive" gets amber and
// "Shrinking" gets red because those are real signals a student should feel,
// and the prompt is explicit that the model must not flatter the job.

const DEMAND_STYLES: Record<DemandLevel, string> = {
  "Growing fast": "bg-green-50 text-green-800 ring-green-200",
  "Steady demand": "bg-blue-50 text-blue-800 ring-blue-200",
  Competitive: "bg-amber-50 text-amber-900 ring-amber-200",
  Shrinking: "bg-red-50 text-red-800 ring-red-200",
};

function formatPay(amount: number, currency: string): string {
  if (!amount) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // An unrecognised currency code shouldn't blank out the salary.
    return `${amount.toLocaleString()} ${currency}`;
  }
}

export function CareerProfileStep({
  career,
  countryCode,
  stepNumber,
  stepCount,
  onBack,
  onNext,
  rail,
}: {
  career: string;
  countryCode?: string;
  stepNumber: number;
  stepCount: number;
  onBack: () => void;
  onNext: () => void;
  rail?: ReactNode;
}) {
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bumped to re-run the fetch. Gemini returns a transient 503 under load
  // often enough that a page with no way to retry is a page that strands
  // people on an error for no reason.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const response = await fetch("/api/career-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ career, countryCode }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Couldn't load that career.");
        if (!cancelled) setProfile(body);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Couldn't load that career.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [career, countryCode, attempt]);

  return (
    <StepShell
      stepNumber={stepNumber}
      stepCount={stepCount}
      question={career}
      help={loading ? "Pulling together what this job is really like…" : undefined}
      onBack={onBack}
      rail={rail}
      footer={<ContinueButton onClick={onNext} label="Build my plan" />}
    >
      {loading && (
        <div className="space-y-4" aria-live="polite">
          <div className="h-48 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">{error}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
            >
              Try again
            </button>
            <span className="text-sm text-amber-800">
              or carry on — this page is background reading, not part of the plan.
            </span>
          </div>
        </div>
      )}

      {profile && !loading && (
        <div className="space-y-8">
          <Photos profile={profile} />

          <p className="text-lg leading-relaxed text-gray-800">{profile.summary}</p>

          {/* The three numbers that decide whether to keep reading. */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Typical pay
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatPay(profile.pay.median, profile.pay.currency)}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {formatPay(profile.pay.low, profile.pay.currency)} –{" "}
                {formatPay(profile.pay.high, profile.pay.currency)} · {profile.pay.market}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Hiring
              </p>
              <span
                className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold ring-1 ${
                  DEMAND_STYLES[profile.demand.level] ?? DEMAND_STYLES["Steady demand"]
                }`}
              >
                {profile.demand.level}
              </span>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Time to get there
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {profile.timeToEntry}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">from starting study</p>
            </div>
          </div>

          {profile.pay.note && (
            <p className="-mt-4 text-sm text-gray-600">{profile.pay.note}</p>
          )}
          {profile.demand.detail && (
            <p className="-mt-6 text-sm text-gray-600">{profile.demand.detail}</p>
          )}

          {profile.dayToDay.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900">What the work looks like</h2>
              <ul className="mt-3 space-y-2">
                {profile.dayToDay.map((item) => (
                  <li key={item} className="flex gap-3 text-gray-700">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-school-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {profile.entryRoute && (
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                The usual way in
              </h2>
              <p className="mt-2 text-gray-800">{profile.entryRoute}</p>
              <p className="mt-3 text-sm text-gray-500">
                The next few questions turn this into a plan built around where you
                live, what you can spend, and where you are in school now.
              </p>
            </section>
          )}

          {profile.relatedCareers.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900">If this isn&apos;t quite it</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.relatedCareers.map((related) => (
                  <span
                    key={related}
                    className="rounded-full bg-white px-3 py-1.5 text-sm text-gray-700 ring-1 ring-gray-200"
                  >
                    {related}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Go back a step to plan for one of these instead.
              </p>
            </section>
          )}

          <Resources profile={profile} />
        </div>
      )}
    </StepShell>
  );
}

function Photos({ profile }: { profile: CareerProfile }) {
  // Images can 404 after we cached the profile, and a broken-image icon looks
  // like a bug. Hiding the individual failure keeps the rest of the strip.
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const usable = profile.photos.filter((photo) => !broken[photo.src]);

  if (!usable.length) return null;

  return (
    <figure>
      <div
        className={`grid gap-3 ${
          usable.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"
        }`}
      >
        {usable.map((photo, index) => (
          <img
            key={photo.src}
            src={photo.src}
            alt={photo.title}
            // The first one is above the fold and is the page's main visual —
            // deferring it just delays the thing people look at first. The
            // rest can wait until they're scrolled to.
            loading={index === 0 ? "eager" : "lazy"}
            onError={() => setBroken((b) => ({ ...b, [photo.src]: true }))}
            className={`w-full rounded-xl bg-gray-100 object-cover ${
              usable.length === 1 ? "max-h-80" : "h-40"
            }`}
          />
        ))}
      </div>
      {/* Attribution isn't optional — most of these are CC BY-SA, which
          requires crediting the author and naming the licence. */}
      <figcaption className="mt-2 text-xs leading-relaxed text-gray-400">
        {usable.map((photo, index) => (
          <span key={photo.src}>
            {index > 0 && " · "}
            <a
              href={photo.descriptionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 hover:underline"
            >
              {photo.title}
            </a>
            {photo.artist && ` by ${photo.artist}`}
            {photo.license && `, ${photo.license}`}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

function Resources({ profile }: { profile: CareerProfile }) {
  if (!profile.resources.length) {
    return profile.droppedResources > 0 ? (
      <p className="text-sm text-gray-500">
        We couldn&apos;t confirm any of the links suggested for this career, so
        none are shown rather than sending you somewhere dead.
      </p>
    ) : null;
  }

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900">Where to look next</h2>
      <p className="mt-1 text-sm text-gray-500">
        We opened each of these to check it loads.
        {profile.droppedResources > 0 &&
          (profile.droppedResources === 1
            ? " One more didn't load, so it was dropped."
            : ` ${profile.droppedResources} more didn't load, so they were dropped.`)}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {profile.resources.map((resource) => (
          <a
            key={resource.url}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-school-400 hover:shadow-md"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-school-700">
              {RESOURCE_KIND_LABELS[resource.kind] ?? "Resource"}
            </span>
            <span className="mt-1 block font-semibold text-gray-900">
              {resource.label}
            </span>
            <span className="mt-1 block text-sm text-gray-600">{resource.detail}</span>
          </a>
        ))}
      </div>

      {profile.article && (
        <p className="mt-4 text-xs text-gray-400">
          Description and photos from{" "}
          <a
            href={profile.article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            Wikipedia: {profile.article.title}
          </a>
          .
        </p>
      )}
    </section>
  );
}
