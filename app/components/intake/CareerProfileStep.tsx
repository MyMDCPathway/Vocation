"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  RESOURCE_KIND_LABELS,
  type CareerProfile,
  type CareerResource,
  type CareerVoice,
  type CompetitionLevel,
  type DemandLevel,
  type ResourceKind,
  type VoiceTone,
} from "@/app/lib/careerProfileTypes";
import { ContinueButton, StepShell } from "@/app/components/intake/StepShell";
import { LaborStatsPanel, NoStatsNote } from "@/app/components/LaborStatsPanel";
import { DemandMap } from "@/app/components/shared/DemandMap";
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
//
// THE LAYOUT is a briefing, not a scroll: a hero band that answers "what is
// this job and should I keep reading", then two columns. The left column is
// the reading — what the work is, how people get in, what practitioners say.
// The right rail is the reference — the money, the links, the neighbouring
// jobs — because those are what a student comes BACK to, and a thing you come
// back to shouldn't be four screens down. On a phone the rail simply follows
// the reading.

// "Growing fast" is the one chip on this page allowed to be BRIGHT rather than
// tinted. It's the single piece of unambiguous good news a career page can
// carry, and at the same 50-weight wash as everything else it read as another
// grey label. The rest stay tinted on purpose — a screen where every chip
// shouts is a screen where none of them do.
const DEMAND_STYLES: Record<DemandLevel, string> = {
  "Growing fast": "bg-teal-300 text-teal-950 ring-teal-400",
  "Steady demand": "bg-blue-50 text-blue-800 ring-blue-200",
  Competitive: "bg-amber-50 text-amber-900 ring-amber-200",
  Shrinking: "bg-red-50 text-red-800 ring-red-200",
};

// Green only for the genuinely open end. "Extremely competitive" is the single
// most useful thing this page can tell a student about entry-level software or
// architecture, and it doesn't get to look like a neutral tag.
const COMPETITION_STYLES: Record<CompetitionLevel, string> = {
  "Wide open": "bg-green-50 text-green-800 ring-green-200",
  Manageable: "bg-blue-50 text-blue-800 ring-blue-200",
  Competitive: "bg-amber-50 text-amber-900 ring-amber-200",
  "Extremely competitive": "bg-red-50 text-red-800 ring-red-200",
};

const VOICE_STYLES: Record<
  VoiceTone,
  { bar: string; tag: string; label: string }
> = {
  reward: {
    bar: "border-l-green-500",
    tag: "text-green-700",
    label: "Why people stay",
  },
  tradeoff: {
    bar: "border-l-amber-500",
    tag: "text-amber-700",
    label: "The trade-off",
  },
  warning: {
    bar: "border-l-red-500",
    tag: "text-red-700",
    label: "Why people leave",
  },
};

/** Card chrome, so twelve panels can't drift into twelve slightly different cards. */
const CARD = "rounded-xl bg-surface-lowest p-6 shadow-card";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** For axis labels, where "$77K" beats "$77,340" at 11 characters of width. */
const moneyShort = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 0,
});

const headcount = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

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
  onSelectRelated,
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
  /**
   * Re-runs the wizard's own career resolution for a related career, the same
   * path a typed answer on the career question takes. Optional so a caller
   * without a resolver just gets the chips as plain, honest labels rather
   * than a broken click.
   */
  onSelectRelated?: (career: string) => void;
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

  return (
    <StepShell
      stepNumber={stepNumber}
      stepCount={stepCount}
      // Blank once loaded: the hero below owns the job title at full size, and
      // printing it twice put a small copy of the heading a card above the big
      // one. While loading it's the only title there is, so it stays.
      question={loading ? career : ""}
      help={loading ? "Pulling together what this job is really like…" : undefined}
      navLabel="Insights"
      hideSteps
      onBack={onBack}
      // Deliberately NOT passed to the shell. Every other step lets StepShell
      // place the route sketch; this one has a reference column of its own, and
      // the shell's wide layout drops the rail underneath the content — which
      // on a page this long stranded it a full screen below anything it
      // relates to. It goes in the rail with the other reference cards instead.
      wide
      footer={<ContinueButton onClick={onNext} label="Explore pathways" />}
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
        <div className="space-y-6">
          <Hero profile={profile} career={career} onNext={onNext} />

          {/* The rail is fixed-width rather than a fraction: the compensation
              card is built around a percentile bar, and a bar that changes
              width between breakpoints changes what the distribution LOOKS
              like. `items-start` stops a short rail from stretching its cards
              to match a long left column. */}
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-6">
              <DayToDay profile={profile} />
              <TypicalPath profile={profile} />
              <Voices profile={profile} />
              <PayBreakdown profile={profile} />
              <MorePhotos profile={profile} />
            </div>

            <div className="space-y-6">
              <Compensation profile={profile} />
              {rail}
              <Resources profile={profile} />
              <RelatedPaths profile={profile} onSelect={onSelectRelated} />
              <DemandMap career={profile.career} socCode={profile.socCode} />
              <Attribution profile={profile} />
            </div>
          </div>
        </div>
      )}
    </StepShell>
  );
}

/**
 * The band that decides whether the rest of the page gets read.
 *
 * Demand and time-to-entry lead as chips because they're the two facts most
 * likely to end the conversation early, and a student who's going to walk away
 * from a six-year route should be able to do it in three seconds rather than
 * after a scroll.
 *
 * The heading itself is StepShell's — repeating the career here would print it
 * twice, which is what the first pass at this layout did.
 */
function Hero({
  profile,
  career,
  onNext,
}: {
  profile: CareerProfile;
  career: string;
  onNext: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const photo = profile.photos[0];
  const showPhoto = photo && !broken;

  return (
    <div className={`${CARD} md:p-8`}>
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_20rem] md:items-start">
        <div>
          {/* Three chips, three different questions, and they are not
              interchangeable: is the work there, would they pick me, and how
              long until I'm doing it. */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                DEMAND_STYLES[profile.demand.level] ?? DEMAND_STYLES["Steady demand"]
              }`}
            >
              {profile.demand.level}
            </span>
            {profile.competition && (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                  COMPETITION_STYLES[profile.competition.level] ??
                  COMPETITION_STYLES.Competitive
                }`}
              >
                {profile.competition.level} to enter
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
              <ClockIcon />
              {profile.timeToEntry}
            </span>
          </div>

          {/* The career, at full size. StepShell's heading is suppressed on
              this screen (see the `question` it's given) — a job title is the
              thing the page is about and it should look like it, rather than
              sitting a card away from everything that describes it. */}
          <h1 className="mt-4 text-[32px] font-bold leading-tight tracking-[-0.02em] text-primary md:text-5xl">
            {career}
          </h1>

          <p className="mt-4 text-lg leading-relaxed text-on-surface">
            {profile.summary}
          </p>

          {profile.demand.detail && (
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
              {profile.demand.detail}
            </p>
          )}

          {profile.competition?.detail && (
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
              {profile.competition.detail}
            </p>
          )}

          {profile.entryRoute && (
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
              {profile.entryRoute}
            </p>
          )}

          {/* Duplicates the button in the shell's footer on purpose. This page
              is long enough that the footer control is off-screen for most of
              it, and the moment a student decides to commit is usually right
              here, not after the resource links. */}
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onNext}
              className="rounded-md bg-primary px-6 py-3 text-sm font-bold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-container hover:shadow-lift"
            >
              Explore pathways
            </button>
            {/* Accounts are the next feature. The button ships disabled and
                says why on hover rather than pretending to work — a save
                control that silently does nothing is worse than no save
                control, because the student believes their work is kept. */}
            <button
              type="button"
              disabled
              title="Accounts are coming soon — you'll be able to save careers then."
              className="cursor-not-allowed rounded-md bg-surface-container px-6 py-3 text-sm font-bold text-outline"
            >
              Save to profile
            </button>
          </div>
        </div>

        {showPhoto && (
          <figure>
            <img
              src={photo.src}
              alt={photo.title}
              // Above the fold and the page's main visual — deferring it just
              // delays the thing people look at first.
              loading="eager"
              onError={() => setBroken(true)}
              className="h-56 w-full rounded-xl bg-surface-container object-cover md:h-64"
            />
            <PhotoCredit photos={[photo]} />
          </figure>
        )}
      </div>
    </div>
  );
}

/**
 * The work itself, one row per thing you'd actually be doing.
 *
 * The model writes these as sentences, not label/detail pairs, so the bold
 * lead is taken from a separator it already used rather than invented by
 * chopping at a word count — a heading cut mid-clause reads worse than no
 * heading at all.
 *
 * THE ONE SECTION ON THIS PAGE BUILT TO STAND OUT. Everything else here is a
 * peer card; this is the answer to the question the whole page exists to
 * answer — what would I actually be DOING — so it gets a bigger heading and
 * its own icon rather than sitting at the same visual weight as "Where to
 * look next".
 */
function DayToDay({ profile }: { profile: CareerProfile }) {
  if (!profile.dayToDay.length) return null;

  return (
    <section className={CARD}>
      <div className="flex items-center gap-3 border-b border-outline-variant/60 pb-4">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary"
        >
          <BriefcaseIcon />
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-on-surface">
          Day-to-Day Operations
        </h2>
      </div>

      <ul className="mt-5 space-y-4">
        {profile.dayToDay.map((item) => {
          const { lead, rest } = splitLead(item);
          // A distinct icon per line rather than one repeated square — the
          // model returns free sentences, not icon names, so a keyword match
          // sorts each one into the same handful of pictograms a checklist
          // would use itself. Unmatched falls back to the generic task icon;
          // getting the wrong icon on an odd sentence costs nothing, since
          // nothing here is a claim the icon has to be accountable for.
          const BulletIcon = dayToDayIcon(item);
          return (
            <li key={item} className="flex gap-3.5">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary/10 text-secondary"
              >
                <BulletIcon />
              </span>
              <div className="min-w-0">
                {lead && (
                  <p className="font-semibold text-secondary">{lead}</p>
                )}
                {rest && (
                  <p
                    className={`text-sm leading-relaxed text-on-surface-variant ${
                      lead ? "mt-0.5" : ""
                    }`}
                  >
                    {rest}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Which pictogram a day-to-day sentence gets, by keyword.
 *
 * First match wins, so rule order encodes priority: "Writing and Refining
 * Code" contains both a coding word and a writing word, and it should read as
 * the coding icon, not the generic-document one — so code is checked first.
 */
const DAY_TO_DAY_ICON_RULES: { test: RegExp; Icon: () => JSX.Element }[] = [
  { test: /\b(code|coding|program|develop|script|build)/i, Icon: CodeIcon },
  { test: /\b(test|debug|bug|qa\b|quality)/i, Icon: BugIcon },
  { test: /\b(review|audit)/i, Icon: ClipboardCheckIcon },
  {
    test: /\b(meet|collab|team|coordinat|stakeholder|client|customer)/i,
    Icon: PeopleIcon,
  },
  {
    test: /\b(architect|design|roadmap|structure|scal)/i,
    Icon: BlueprintIcon,
  },
  { test: /\b(document|writ(e|ing)|report)/i, Icon: BookIcon },
];

function dayToDayIcon(item: string): () => JSX.Element {
  return DAY_TO_DAY_ICON_RULES.find((rule) => rule.test.test(item))?.Icon ?? TaskIcon;
}

/**
 * Split a day-to-day item into a bold lead and the rest.
 *
 * Only ever splits on punctuation the writer put there. If there's no dash or
 * colon, the whole item is the body and nothing is bolded — better a flat row
 * than a heading invented by truncation.
 */
function splitLead(item: string): { lead: string | null; rest: string } {
  // [\s\S] rather than the `s` flag: tsconfig targets ES2017.
  const match = item.match(/^([\s\S]{3,60}?)\s*[—–:]\s+([\s\S]+)$/);
  if (!match) return { lead: null, rest: item };
  return { lead: match[1], rest: match[2] };
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
    <section className={CARD}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <CardHeading>How people actually get in</CardHeading>
        <p className="text-sm text-outline">{profile.timeToEntry} end to end</p>
      </div>

      <ol className="mt-5 space-y-3">
        {profile.typicalPath.map((stage, index) => (
          <li
            key={`${stage.label}-${index}`}
            className="flex gap-4 rounded-lg bg-surface p-4"
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
 *
 * Which is also why these cards carry no avatar and no job title. A face and a
 * name beside a sentence says "a person said this", and no person did.
 */
function Voices({ profile }: { profile: CareerProfile }) {
  if (!profile.voices.length && !profile.venues.length) return null;

  return (
    <section className={CARD}>
      <CardHeading>What people in the job say</CardHeading>
      <p className="mt-1 text-sm leading-relaxed text-outline">
        The themes that come up again and again when people who do this work
        talk about it — summarised, not quoted.
      </p>

      {profile.voices.length > 0 && (
        // Three across only when three (or six) actually arrived. The model
        // returns three themes some days and four or five on others, and a
        // fixed three-column grid holding four cards leaves two thirds of a
        // row empty under the first two. Two across always divides four
        // evenly and gives the longer summaries room to breathe.
        <div
          className={`mt-5 grid gap-4 ${
            profile.voices.length % 3 === 0
              ? "sm:grid-cols-2 lg:grid-cols-3"
              : "sm:grid-cols-2"
          }`}
        >
          {profile.voices.map((voice) => (
            <VoiceCard key={voice.theme} voice={voice} />
          ))}
        </div>
      )}

      {profile.venues.length > 0 && (
        <div className="mt-6 rounded-lg bg-surface p-5">
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
    <div
      className={`rounded-lg border-l-4 bg-surface p-4 ${style.bar}`}
    >
      <span
        className={`text-xs font-semibold uppercase tracking-wide ${style.tag}`}
      >
        {style.label}
      </span>
      <h3 className="mt-2 font-semibold text-primary">{voice.theme}</h3>
      <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
        {voice.detail}
      </p>
    </div>
  );
}

/**
 * The measured pay data, area by area.
 *
 * Only rendered when there's more than one area to compare. With national
 * figures alone — which is every first load, since the metro is asked for on
 * the NEXT screen — the rail's compensation card has already said everything
 * this panel would, and printing the same median twice on one screen makes a
 * reader hunt for the difference between them.
 */
function PayBreakdown({ profile }: { profile: CareerProfile }) {
  const stats = profile.stats;
  if (!stats) return null;

  const areas = [stats.metro, stats.state, stats.national].filter(Boolean);
  if (areas.length < 2) return null;

  return <LaborStatsPanel stats={stats} />;
}

/**
 * The money, and the page's only wholly-measured card.
 *
 * It gets the verified tick and the survey year in the header for that reason
 * — everything else on this screen is the model's judgement, and the one card
 * that isn't should be visibly different.
 *
 * Falls back to the model's estimate when BLS has nothing, and says which it
 * is showing. The two must never look alike.
 */
function Compensation({ profile }: { profile: CareerProfile }) {
  const stats = profile.stats;
  // Wage and place name come from the SAME area object on purpose — taking
  // the wage from one and the label from another is how you print a state
  // median under a city's name. See leadWageArea.
  const lead = stats ? leadWageArea(stats) : null;
  const median = lead?.wages.median ?? null;

  if (!stats || median === null || !lead) {
    return (
      <section className={CARD}>
        <div className="flex items-baseline justify-between gap-3">
          <CardHeading>Compensation</CardHeading>
          <span className="text-xs font-semibold uppercase tracking-wide text-outline">
            Estimate
          </span>
        </div>
        <p className="mt-4 text-[32px] font-bold leading-none tracking-tight text-primary">
          {formatPay(profile.pay.median, profile.pay.currency)}
        </p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-outline">
          Median annual wage · {profile.pay.market}
        </p>
        <p className="mt-3 text-sm text-on-surface-variant">
          {formatPay(profile.pay.low, profile.pay.currency)} –{" "}
          {formatPay(profile.pay.high, profile.pay.currency)}
        </p>
        {profile.pay.note && (
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
            {profile.pay.note}
          </p>
        )}
        <div className="mt-4 border-t border-outline-variant/50 pt-3">
          <NoStatsNote
            status={profile.statsStatus ?? "unmatched"}
            market={profile.pay.market}
          />
        </div>
      </section>
    );
  }

  const national = stats.national;

  return (
    <section className={CARD}>
      <div className="flex items-center justify-between gap-3">
        <CardHeading>Compensation</CardHeading>
        <span
          title="Survey data, not an estimate"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700 ring-1 ring-green-200"
        >
          <CheckIcon />
          <span className="sr-only">Verified survey figure</span>
        </span>
      </div>
      <p className="mt-1 text-xs text-outline">
        {stats.year} US Bureau of Labor Statistics · {stats.occupation.title}
      </p>

      <p className="mt-5 text-[32px] font-bold leading-none tracking-tight text-primary">
        {money.format(median)}
      </p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-outline">
        Median annual wage · {lead.name}
      </p>

      <PercentileBar wages={lead.wages} />

      {(national?.employment != null || national?.perThousand != null) && (
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-outline-variant/50 pt-4">
          {national?.employment != null && (
            <div>
              <p className="text-lg font-bold text-on-surface">
                {headcount.format(national.employment)}
              </p>
              <p className="text-xs text-outline">Employed nationally</p>
            </div>
          )}
          {national?.perThousand != null && (
            <div>
              <p className="text-lg font-bold text-on-surface">
                {national.perThousand.toFixed(1)}
              </p>
              <p className="text-xs text-outline">Per 1,000 jobs</p>
            </div>
          )}
        </div>
      )}

      {/* The metro is asked for on the next screen, so this card is national
          on first read. Saying so beats letting a country-wide figure pass as
          a local one. */}
      {!stats.hasLocal && (
        <p className="mt-4 text-xs leading-relaxed text-outline">
          These are national figures — tell us your area next and they narrow to
          your own market, which is often thousands of dollars different.
        </p>
      )}

      {profile.pay.note && (
        <p className="mt-3 text-xs leading-relaxed text-outline">
          {profile.pay.note}
        </p>
      )}
    </section>
  );
}

/**
 * The spread behind the median, in one bar.
 *
 * A median hides that the bottom tenth of registered nurses make $68,940 and
 * the top tenth make $137,470. A student choosing a career is choosing a
 * distribution, not a point, and the width of that bar is the thing they
 * should see. Scaled p10-to-p90 across the full width — this bar compares one
 * area against itself, not against other areas, so it needs no shared scale.
 */
function PercentileBar({
  wages,
}: {
  wages: {
    p10: number | null;
    p25: number | null;
    median: number | null;
    p75: number | null;
    p90: number | null;
  };
}) {
  const { p10, p25, median, p75, p90 } = wages;
  if (p10 === null || p90 === null || p90 <= p10) return null;

  const at = (value: number) =>
    Math.min(100, Math.max(0, ((value - p10) / (p90 - p10)) * 100));

  return (
    <div className="mt-5">
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary-fixed" />
        {/* 25th–75th: where half the field actually sits. */}
        {p25 !== null && p75 !== null && (
          <div
            className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary"
            style={{
              left: `${at(p25)}%`,
              width: `${Math.max(at(p75) - at(p25), 0.5)}%`,
            }}
          />
        )}
        {median !== null && (
          <div
            className="absolute top-1/2 h-5 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-on-surface"
            style={{ left: `${at(median)}%` }}
          />
        )}
      </div>

      <div className="mt-1 flex justify-between text-xs text-outline">
        <span>{moneyShort.format(p10)} (10th)</span>
        <span>{moneyShort.format(p90)} (90th)</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-outline">
        The bar spans the 10th to the 90th percentile; the darker band is the
        middle half and the notch is the median.
      </p>
    </div>
  );
}

const RESOURCE_ICONS: Record<ResourceKind, () => JSX.Element> = {
  "professional-body": BadgeIcon,
  licensing: CertificateIcon,
  data: ChartIcon,
  community: PeopleIcon,
  reading: BookIcon,
};

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
    <section className={CARD}>
      <CardHeading>Where to look next</CardHeading>
      <ul className="mt-4 space-y-2">
        {profile.resources.map((resource) => (
          <li key={resource.url}>
            <ResourceRow resource={resource} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResourceRow({ resource }: { resource: CareerResource }) {
  const Icon = RESOURCE_ICONS[resource.kind] ?? BookIcon;

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 rounded-lg bg-surface p-3 transition-colors hover:bg-surface-container"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-lowest text-primary shadow-card"
      >
        <Icon />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium uppercase tracking-wide text-outline">
          {RESOURCE_KIND_LABELS[resource.kind] ?? "Resource"}
        </span>
        <span className="mt-0.5 block font-semibold text-primary">
          {resource.label}
        </span>
        <span className="mt-0.5 block text-sm leading-relaxed text-on-surface-variant">
          {resource.detail}
        </span>
      </span>
      <span aria-hidden="true" className="mt-1 shrink-0 text-outline">
        <ExternalIcon />
      </span>
    </a>
  );
}

function RelatedPaths({
  profile,
  onSelect,
}: {
  profile: CareerProfile;
  onSelect?: (career: string) => void;
}) {
  if (!profile.relatedCareers.length) return null;

  return (
    <section className={CARD}>
      <CardHeading>If this isn&apos;t quite it</CardHeading>
      <div className="mt-4 flex flex-wrap gap-2">
        {profile.relatedCareers.map((related) =>
          onSelect ? (
            <button
              key={related}
              type="button"
              onClick={() => onSelect(related)}
              className="rounded-full bg-surface px-3 py-1.5 text-sm text-on-surface-variant ring-1 ring-black/10 transition-colors hover:bg-surface-container hover:text-primary"
            >
              {related}
            </button>
          ) : (
            <span
              key={related}
              className="rounded-full bg-surface px-3 py-1.5 text-sm text-on-surface-variant ring-1 ring-black/10"
            >
              {related}
            </span>
          )
        )}
      </div>
      <p className="mt-3 text-xs text-outline">
        {onSelect
          ? "Pick one to see its job summary instead."
          : "Go back a step to plan for one of these instead."}
      </p>
    </section>
  );
}

/**
 * The photos the hero didn't use.
 *
 * Attribution isn't optional — most of these are CC BY-SA, which requires
 * crediting the author and naming the licence.
 */
function MorePhotos({ profile }: { profile: CareerProfile }) {
  // Images can 404 after we cached the profile, and a broken-image icon looks
  // like a bug. Hiding the individual failure keeps the rest of the strip.
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const usable = profile.photos.slice(1).filter((photo) => !broken[photo.src]);

  if (!usable.length) return null;

  return (
    <figure className={CARD}>
      <div className="grid gap-3 sm:grid-cols-2">
        {usable.map((photo) => (
          <img
            key={photo.src}
            src={photo.src}
            alt={photo.title}
            loading="lazy"
            onError={() => setBroken((b) => ({ ...b, [photo.src]: true }))}
            className="h-40 w-full rounded-lg bg-surface-container object-cover"
          />
        ))}
      </div>
      <PhotoCredit photos={usable} />
    </figure>
  );
}

function PhotoCredit({
  photos,
}: {
  photos: CareerProfile["photos"];
}) {
  return (
    <figcaption className="mt-2 text-xs leading-relaxed text-outline">
      {photos.map((photo, index) => (
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
  );
}

function Attribution({ profile }: { profile: CareerProfile }) {
  if (!profile.article) return null;

  return (
    <p className="px-2 text-xs leading-relaxed text-outline">
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
  );
}

function CardHeading({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-bold text-primary">{children}</h2>;
}

// --- Icons -----------------------------------------------------------------
//
// Inline rather than from a library: the project holds to five runtime
// dependencies, and these are eight paths.

function icon(children: ReactNode) {
  return (
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
      {children}
    </svg>
  );
}

function ClockIcon() {
  return icon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-3.5 w-3.5"
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function TaskIcon() {
  return icon(
    <>
      <path d="M9 6h11" />
      <path d="M9 12h11" />
      <path d="M9 18h11" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </>
  );
}

function BriefcaseIcon() {
  return icon(
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </>
  );
}

function CodeIcon() {
  return icon(
    <>
      <path d="m9 8-4 4 4 4" />
      <path d="m15 8 4 4-4 4" />
    </>
  );
}

function BugIcon() {
  return icon(
    <>
      <rect x="6" y="9" width="12" height="9" rx="5" />
      <path d="M9 9V7a3 3 0 0 1 6 0v2" />
      <path d="M4 12h2M18 12h2M6 16l-2 2M18 16l2 2" />
    </>
  );
}

function ClipboardCheckIcon() {
  return icon(
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="m9 13 2 2 4-4" />
    </>
  );
}

function BlueprintIcon() {
  return icon(
    <>
      <path d="M4 21V9l8-6 8 6v12" />
      <path d="M9 21v-7h6v7" />
    </>
  );
}

function BadgeIcon() {
  return icon(
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="m8.5 13.5-1 7 4.5-2.5 4.5 2.5-1-7" />
    </>
  );
}

function CertificateIcon() {
  return icon(
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M7 9h6M7 13h4" />
      <path d="M17 17v4l-2-1.5L13 21" />
    </>
  );
}

function ChartIcon() {
  return icon(
    <>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </>
  );
}

function PeopleIcon() {
  return icon(
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-1a6 6 0 0 1 12 0v1" />
      <path d="M17 11a3 3 0 1 0-2-5.2" />
      <path d="M18 20v-1a6 6 0 0 0-1.5-4" />
    </>
  );
}

function BookIcon() {
  return icon(
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" />
    </>
  );
}

function ExternalIcon() {
  return icon(
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  );
}
