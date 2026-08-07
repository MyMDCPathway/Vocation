"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AuthControls } from "@/app/components/AuthControls";

/**
 * The intake's top bar.
 *
 * Through 2.0 there was deliberately no nav here — the argument was that a row
 * of links on a form is an invitation to leave. It's back because the intake
 * stopped being a form you get through and became a place you read: the career
 * summary is a page students land on, sit with, and want to leave without
 * hitting the browser's back button six times.
 *
 * Only real destinations. An "Insights" tab that goes nowhere and a bell with
 * no notifications behind it cost nothing to draw and cost a student their
 * trust the first time they click one.
 */
const NAV = [
  { label: "Pathways", href: "/pathways" },
  { label: "Career quiz", href: "/career-discovery" },
];

function TopBar({ active }: { active?: string }) {
  return (
    <header className="border-b border-outline-variant/60 bg-surface-lowest">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-8 px-6">
        <Link
          href="/"
          className="shrink-0 text-lg font-bold tracking-tight text-primary transition-colors hover:text-primary-container"
        >
          Vocation
        </Link>

        {/* Every item sits at the bar's own centred height, with its OWN
            border-bottom a couple pixels under its own text — not the full
            height of the bar. Stretching items to bar height put the border
            at the bar's bottom edge, a visible gap below the label rather
            than a tight underline. */}
        <nav className="flex items-center gap-6">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="border-b-2 border-transparent pb-1 text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
          {active && (
            // The current screen, as a tab you can see you're on. Not a link:
            // it goes where you already are. Secondary rather than primary —
            // primary is black in this palette, and the active tab needs to
            // read as "selected", which on this page means the same teal-green
            // the rest of the intake already uses for a positive, active state.
            <span
              aria-current="page"
              className="border-b-2 border-secondary pb-1 text-sm font-semibold text-secondary"
            >
              {active}
            </span>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {/* The only one of the four that goes anywhere. The landing page IS
              the career search, so this is a real destination rather than a
              magnifying glass that opens nothing. */}
          <Link
            href="/"
            aria-label="Search careers"
            title="Search careers"
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
          >
            <SearchIcon />
          </Link>

          {/* Notifications/Settings/Account, and Log in vs Sign out — one
              shared component so this header and the landing page's don't
              drift into two different answers for "am I signed in". */}
          <AuthControls />
        </div>
      </div>
    </header>
  );
}

function barIcon(children: ReactNode) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-[18px] w-[18px]"
    >
      {children}
    </svg>
  );
}

function SearchIcon() {
  return barIcon(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  );
}

/**
 * Discrete steps rather than a filling bar.
 *
 * A bar answers "how far along am I" with a smear. Segments answer it with a
 * count, which is the question people actually ask on question four of seven.
 */
function Steps({ current, total }: { current: number; total: number }) {
  return (
    <div className="mx-auto mt-8 max-w-md">
      <ol className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => {
          const step = index + 1;
          const done = step < current;
          const here = step === current;
          return (
            <li
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                done ? "bg-primary/40" : here ? "bg-primary" : "bg-surface-container"
              }`}
            />
          );
        })}
      </ol>
      <p className="mt-2 text-center text-xs font-medium text-outline">
        Step {current} of {total}
      </p>
    </div>
  );
}

/**
 * The frame every intake question renders inside.
 *
 * One question per screen, with the wordmark, progress and back control in
 * fixed positions. Keeping that chrome here rather than in each step is what
 * stops the heading from shifting a few pixels between questions — which
 * reads as the page reloading rather than advancing.
 *
 * There is no nav bar anywhere in the intake. The wordmark below is the only
 * branding, centred, because the page has exactly one job and a row of links
 * is an invitation to leave.
 *
 * No decorative shapes here (there were, in an earlier world — DESIGN.md now
 * lists confetti as an anti-reference). The friendliness in this world comes
 * from the blue-tinted canvas and the round geometry, not from scattered
 * illustration.
 */
export function StepShell({
  stepNumber,
  stepCount,
  question,
  help,
  onBack,
  footer,
  wide,
  hero,
  hideSteps,
  rail,
  navLabel,
  children,
}: {
  stepNumber: number;
  stepCount: number;
  question: string;
  help?: string;
  onBack?: () => void;
  footer?: ReactNode;
  /**
   * Widen the column for a step that genuinely needs it.
   *
   * Only the schools step sets this: a map beside a list doesn't fit in the
   * reading-width column the questions use. The chrome — progress bar,
   * heading, back button — widens with it so the step still reads as the same
   * frame rather than a different page.
   */
  wide?: boolean;
  /**
   * The opening screen. Centres everything, drops the progress bar, and turns
   * the confetti up — this is the only screen a first-time visitor sees
   * before deciding whether to bother, so it gets to be a hero rather than
   * question one of eight.
   */
  hero?: boolean;
  /**
   * Drop the step counter without going full hero.
   *
   * Only the career summary sets this. It's not a question with an N-of-M to
   * report — it's the one screen in the intake a student is meant to read
   * rather than answer, and "Step 2 of 8" over a page of prose says "you're
   * behind schedule" about a page that isn't a form at all. The top bar's
   * "Insights" tab already says where they are; the step count would be
   * saying it twice, and saying it wrong.
   */
  hideSteps?: boolean;
  /**
   * The evolving route, shown beside the question.
   *
   * Lives here rather than in each step so every question gets it without
   * wiring, and so the heading can't drift a few pixels between screens.
   */
  rail?: ReactNode;
  /**
   * Names this screen as the active tab in the top bar.
   *
   * Only screens a student would think of as a destination set it. A question
   * in the middle of a form isn't one, and tabbing it would suggest they can
   * navigate back to question four.
   */
  navLabel?: string;
  children: ReactNode;
}) {
  // The rail needs room beside the reading column, so a step that has one is
  // widened even when it didn't ask to be.
  const column = wide || rail ? "max-w-6xl" : "max-w-3xl";

  return (
    <div className="relative flex min-h-screen flex-col bg-surface">
      <TopBar active={navLabel} />

      {/* The hero has nothing to be N-of-M about — it's the first thing you
          see, and a step counter there says "this is a form" before you've
          typed anything. hideSteps drops it for the same reason on a
          different screen; see its doc comment above. */}
      {!hero && !hideSteps && (
        <div className={`relative z-10 mx-auto w-full ${column} px-6 pt-2`}>
          <Steps current={stepNumber} total={stepCount} />
        </div>
      )}

      <div
        className={`relative z-10 mx-auto w-full flex-1 ${column} px-6 ${
          hero ? "pb-16 pt-10 md:pt-16" : "py-10 md:py-14"
        }`}
      >
        <div
          className={
            rail && !wide
              ? "grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]"
              : undefined
          }
        >
          <div
            key={`${stepNumber}-${question}`}
            className={`reveal reveal-visible min-w-0 ${hero ? "text-center" : ""}`}
          >
            {/* key={stepNumber+question} remounts this block on every step
                change, replaying the .reveal-visible entrance (globals.css)
                fresh each time — the same keyframe scroll-reveal sections use
                elsewhere, just always-played here instead of scroll-gated,
                since a step's content is already on screen the moment it
                appears. Gives every screen built on StepShell (the whole
                intake, the career quiz) a step transition for free. */}
            {/* Empty when a step draws its own title — an <h1> with nothing in
                it still takes its line-height and pushes the content down by a
                heading it never showed. */}
            {question && (
              <h1
                className={
                  hero
                    ? "text-2xl font-extrabold leading-[1.15] tracking-[-0.02em] text-primary sm:text-5xl md:text-6xl"
                    : "text-2xl font-bold leading-tight tracking-[-0.01em] text-primary md:text-[32px]"
                }
              >
                {question}
              </h1>
            )}
            {help && (
              <p
                className={`mt-4 text-on-surface-variant ${
                  hero ? "mx-auto max-w-xl text-lg md:text-xl" : "md:text-lg"
                }`}
              >
                {help}
              </p>
            )}

            <div className={hero ? "mt-10" : question ? "mt-8" : ""}>
              {children}
            </div>
          </div>

          {/* Sticky so the path stays put while a long option list scrolls
              past it. Order-first on mobile would bury the question, so it
              sits after and collapses itself. */}
          {rail && !wide && (
            <div className="lg:sticky lg:top-8 lg:self-start">{rail}</div>
          )}
        </div>

        {/* A wide step (the map) has no room for a side rail, so it goes
            underneath rather than being dropped. */}
        {rail && wide && <div className="mt-10 max-w-md">{rail}</div>}
      </div>

      {(onBack || footer) && (
        <div
          className={`relative z-10 mx-auto flex w-full ${column} items-center gap-4 px-6 pb-12`}
        >
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-sm font-medium text-outline transition-colors hover:text-primary"
            >
              ← Back
            </button>
          )}
          <div className="ml-auto">{footer}</div>
        </div>
      )}
    </div>
  );
}

/**
 * A selectable answer card.
 *
 * `selected` used to mean a hard offset shadow (DESIGN.md's previous world).
 * This world has no such rule, so selection reads through a solid blue border
 * plus a soft blue-tinted fill instead — still unmistakable at a glance across
 * a multi-select screen, without a shadow vocabulary this system doesn't have.
 */
export function OptionCard({
  label,
  detail,
  meta,
  selected,
  onClick,
}: {
  label: string;
  detail?: string;
  meta?: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full rounded-lg border-2 p-5 text-left transition-all duration-150 ${
        selected
          ? "border-primary bg-primary-fixed shadow-card"
          : "border-transparent bg-surface-lowest shadow-card hover:-translate-y-0.5 hover:shadow-lift"
      }`}
    >
      <span className="block font-bold text-on-surface">{label}</span>
      {detail && (
        <span className="mt-1 block text-sm leading-relaxed text-on-surface-variant">
          {detail}
        </span>
      )}
      {meta && (
        <span className="mt-3 inline-block rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
          {meta}
        </span>
      )}
    </button>
  );
}

/** The primary "move on" button. Solid blue, fully round. */
export function ContinueButton({
  onClick,
  disabled,
  label = "Continue",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-primary px-8 py-4 text-base font-bold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-container hover:shadow-lift disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-outline-variant disabled:text-outline disabled:shadow-none"
    >
      {label}
    </button>
  );
}
