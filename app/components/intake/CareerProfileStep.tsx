"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  RESOURCE_KIND_LABELS,
  type CareerProfile,
  type CareerVoice,
  type DemandLevel,
  type VoiceTone,
} from "@/app/lib/careerProfileTypes";
import { ContinueButton, StepShell } from "@/app/components/intake/StepShell";
import { LaborStatsPanel, NoStatsNote } from "@/app/components/LaborStatsPanel";
import { leadWageArea } from "@/app/lib/blsStats";

// What the job actually is, before anyone commits years to it.
//
// This sits between "which career" and the questions that build a plan, and
// it's the one screen in the wizard that isn't a question. That's deliberate:
// every question after it costs the student effort, and some of them will
// decide this isn't the job for them once they read what it pays and how
// competitive it is. Better here than four screens later.
//
// TWO CLASSES OF FACT LIVE ON THIS PAGE and they are never allowed to blur
// together. Wages and employment come from the BLS survey and say so. Demand
// commentary, the route in, and what practitioners report are the model's
// judgement, and where they sit next to a sourced figure the page says which
// is which. A student can't tell an estimate from a measurement by looking at
// it, so the page has to tell them.
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

const VOICE_STYLES: Record<VoiceTone, { ring: string; dot: string; label: string }> = {
  reward: { ring: "ring-green-200", dot: "bg-green-500", label: "Why people stay" },
  tradeoff: { ring: "ring-amber-200", dot: "bg-amber-500", label: "The trade-off" },
  warning: { ring: "ring-red-200", dot: "bg-red-500", label: "Why people leave" },
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
  subdivision,
  city,
  stepNumber,
  stepCount,
  onBack,
  onNext,
  onLoaded,
  rail,
}: {
  career: string;
  countryCode?: string;
  /** State or province — resolves the BLS area, so pay is local. */
  subdivision?: string;
  city?: string;
  stepNumber: number;
  stepCount: number;
  onBack: () => void;
  onNext: () => void;
  /**
   * Hands the resolved BLS occupation back to the intake, so the plan page's
   * wage panel can ask about the same one rather than re-deriving it.
   */
  onLoaded?: (profile: CareerProfile) => void;
  rail?: ReactNode;
}) {
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bumped to re-run the fetch. Gemini returns a transient 503 under load
  // often enough that a page with no way to retry is a page that strands
  // people on an error for no reason.
  const [attempt, setAttempt] = useState(0);

  // Held in a ref, not a dependency. The wizard passes this inline, so it's a
  // new function every render — as a dependency it would re-run the fetch on
  // every keystroke's worth of parent state, and each re-run calls it again.
  const onLoadedRef = useRef(onLoaded);
  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const response = await fetch("/api/career-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ career, countryCode, subdivision, city }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Couldn't load that career.");
        if (!cancelled) {
          setProfile(body);
          onLoadedRef.current?.(body);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Couldn't load that career.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [career, countryCode, subdivision, city, attempt]);

  // BLS is the better answer for the headline number when we have it: it's
  // measured rather than estimated, and it's for the student's own metro.
  //
  // The figure and the place name come from the SAME area object on purpose —
  // taking the wage from one and the label from another is how you print a
  // state median under a city's name. See leadWageArea.
  const localWageArea = profile?.stats ? leadWageArea(profile.stats) : null;
  const localWage = localWageArea?.wages.median ?? null;

  return (
    <StepShell
      stepNumber={stepNumber}
      stepCount={stepCount}
      question={career}
      help={loading ? "Pulling together what this job is really like…" : undefined}
      onBack={onBack}
      rail={rail}
      wide
      footer={<ContinueButton onClick={onNext} label="Build my plan" />}
    >
      {loading && (
        <div className="space-y-4" aria-live="polite">
          <div className="h-48 animate-pulse rounded-xl bg-surface-container" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-surface-container" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-surface-container" />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">{error}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
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

          <p className="text-lg leading-relaxed text-on-surface">{profile.summary}</p>

          {/* The three numbers that decide whether to keep reading. */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-outline-variant bg-surface-lowest p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-outline">
                Typical pay
              </p>
              {localWage !== null ? (
                <>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {formatPay(localWage, "USD")}
                  </p>
                  <p className="mt-0.5 text-xs text-outline">
                    median · {localWageArea?.name}
                  </p>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-green-700">
                    BLS survey figure
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {formatPay(profile.pay.median, profile.pay.currency)}
                  </p>
                  <p className="mt-0.5 text-xs text-outline">
                    {formatPay(profile.pay.low, profile.pay.currency)} –{" "}
                    {formatPay(profile.pay.high, profile.pay.currency)} ·{" "}
                    {profile.pay.market}
                  </p>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-outline">
                    Estimate
                  </p>
                </>
              )}
            </div>

            <div className="rounded-xl border border-outline-variant bg-surface-lowest p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-outline">
                Hiring
              </p>
              <span
                className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold ring-1 ${
                  DEMAND_STYLES[profile.demand.level] ?? DEMAND_STYLES["Steady demand"]
                }`}
              >
                {profile.demand.level}
              </span>
              {profile.stats?.national.employment != null && (
                <p className="mt-2 text-xs text-outline">
                  {new Intl.NumberFormat("en-US").format(
                    profile.stats.national.employment
                  )}{" "}
                  employed nationally
                </p>
              )}
            </div>

            <div className="rounded-xl border border-outline-variant bg-surface-lowest p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-outline">
                Time to get there
              </p>
              <p className="mt-1 text-2xl font-bold text-primary">{profile.timeToEntry}</p>
              <p className="mt-0.5 text-xs text-outline">from where most people start</p>
            </div>
          </div>

          {profile.demand.detail && (
            <p className="-mt-4 text-sm text-on-surface-variant">{profile.demand.detail}</p>
          )}

          {/* The measured half of the page. */}
          {profile.stats ? (
            <LaborStatsPanel stats={profile.stats} />
          ) : (
            <div className="rounded-xl border border-outline-variant bg-surface-lowest p-5">
              <p className="text-sm text-on-surface-variant">{profile.pay.note}</p>
              <div className="mt-3 border-t border-outline-variant/50 pt-3">
                <NoStatsNote
                  status={profile.statsStatus ?? "unmatched"}
                  market={profile.pay.market}
                />
              </div>
            </div>
          )}

          {profile.stats && profile.pay.note && (
            <p className="-mt-4 text-sm text-on-surface-variant">{profile.pay.note}</p>
          )}

          {profile.dayToDay.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-primary">What the work looks like</h2>
              <ul className="mt-3 space-y-2">
                {profile.dayToDay.map((item) => (
                  <li key={item} className="flex gap-3 text-on-surface-variant">
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <TypicalPath profile={profile} />
          <Voices profile={profile} />

          {profile.relatedCareers.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-primary">If this isn&apos;t quite it</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.relatedCareers.map((related) => (
                  <span
                    key={related}
                    className="rounded-full bg-surface-lowest px-3 py-1.5 text-sm text-on-surface-variant ring-1 ring-black/10"
                  >
                    {related}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-outline">
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

/**
 * The usual route in, stage by stage.
 *
 * This is the CANONICAL path — what it takes anyone. The rail beside the
 * wizard shows the student's own version once it knows what they've already
 * finished, which is a different question and deliberately a different answer.
 */
function TypicalPath({ profile }: { profile: CareerProfile }) {
  if (!profile.typicalPath.length) return null;

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 className="text-lg font-bold text-primary">How people actually get in</h2>
        <p className="text-sm text-outline">{profile.timeToEntry} end to end</p>
      </div>

      <ol className="mt-4 space-y-3">
        {profile.typicalPath.map((stage, index) => (
          <li
            key={`${stage.label}-${index}`}
            className="flex gap-4 rounded-xl border border-outline-variant bg-surface-lowest p-4"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-sm font-bold text-primary"
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <h3 className="font-semibold text-primary">{stage.label}</h3>
                <span className="text-sm font-medium text-outline">
                  {stage.duration}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                {stage.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {profile.entryRoute && (
        <p className="mt-3 text-sm text-on-surface-variant">{profile.entryRoute}</p>
      )}
    </section>
  );
}

/**
 * What people who do the job say about it.
 *
 * A SYNTHESIS, NOT QUOTES, and the page says so in as many words. We don't
 * scrape Glassdoor, Indeed, or Reddit — the reasons are in careerVoices.ts and
 * they're legal as well as editorial. What this section can honestly do is name
 * the themes that recur and then send the student to read the real thing.
 */
function Voices({ profile }: { profile: CareerProfile }) {
  if (!profile.voices.length && !profile.venues.length) return null;

  return (
    <section>
      <h2 className="text-lg font-bold text-primary">What people in the job say</h2>
      <p className="mt-1 text-sm text-outline">
        The themes that come up again and again when people who do this work
        talk about it — summarised, not quoted.
      </p>

      {profile.voices.length > 0 && (
        <div className="mt-4 space-y-3">
          {profile.voices.map((voice) => (
            <VoiceCard key={voice.theme} voice={voice} />
          ))}
        </div>
      )}

      {profile.venues.length > 0 && (
        <div className="mt-5 rounded-xl bg-surface-container p-5">
          <h3 className="font-semibold text-primary">Go and read it first-hand</h3>
          <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
            We won&apos;t republish other people&apos;s reviews, and a summary is
            no substitute for an hour spent reading what practitioners argue
            about. These open a search for this job on each site.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.venues.map((venue) => (
              <a
                key={venue.url}
                href={venue.url}
                target="_blank"
                rel="noopener noreferrer"
                title={venue.detail}
                className="rounded-full bg-surface-lowest px-4 py-2 text-sm font-semibold text-primary ring-1 ring-black/10 transition-all hover:ring-primary/40"
              >
                {venue.label} →
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function VoiceCard({ voice }: { voice: CareerVoice }) {
  const style = VOICE_STYLES[voice.tone] ?? VOICE_STYLES.tradeoff;

  return (
    <div className={`rounded-xl bg-surface-lowest p-4 ring-1 ${style.ring}`}>
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${style.dot}`} />
        <span className="text-xs font-semibold uppercase tracking-wide text-outline">
          {style.label}
        </span>
      </div>
      <h3 className="mt-1.5 font-semibold text-primary">{voice.theme}</h3>
      <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{voice.detail}</p>
    </div>
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
            className={`w-full rounded-xl bg-surface-container object-cover ${
              usable.length === 1 ? "max-h-80" : "h-40"
            }`}
          />
        ))}
      </div>
      {/* Attribution isn't optional — most of these are CC BY-SA, which
          requires crediting the author and naming the licence. */}
      <figcaption className="mt-2 text-xs leading-relaxed text-outline">
        {usable.map((photo, index) => (
          <span key={photo.src}>
            {index > 0 && " · "}
            <a
              href={photo.descriptionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-on-surface-variant hover:underline"
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
      <p className="text-sm text-outline">
        We couldn&apos;t confirm any of the links suggested for this career, so
        none are shown rather than sending you somewhere dead.
      </p>
    ) : null;
  }

  return (
    <section>
      <h2 className="text-lg font-bold text-primary">Where to look next</h2>
      <p className="mt-1 text-sm text-outline">
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
            className="rounded-xl border border-outline-variant bg-surface-lowest p-4 transition-all hover:border-primary/40 hover:shadow-md"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-on-surface">
              {RESOURCE_KIND_LABELS[resource.kind] ?? "Resource"}
            </span>
            <span className="mt-1 block font-semibold text-primary">{resource.label}</span>
            <span className="mt-1 block text-sm text-on-surface-variant">{resource.detail}</span>
          </a>
        ))}
      </div>

      {profile.article && (
        <p className="mt-4 text-xs text-outline">
          Description and photos from{" "}
          <a
            href={profile.article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-on-surface-variant"
          >
            Wikipedia: {profile.article.title}
          </a>
          .
        </p>
      )}
    </section>
  );
}
