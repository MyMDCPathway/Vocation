"use client";

import type { ReactNode } from "react";
import { Confetti, QUIET_BLOBS } from "@/app/components/Confetti";

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
  rail,
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
   * The evolving route, shown beside the question.
   *
   * Lives here rather than in each step so every question gets it without
   * wiring, and so the heading can't drift a few pixels between screens.
   */
  rail?: ReactNode;
  children: ReactNode;
}) {
  const percent = Math.round((stepNumber / stepCount) * 100);
  // The rail needs room beside the reading column, so a step that has one is
  // widened even when it didn't ask to be.
  const column = wide || rail ? "max-w-6xl" : "max-w-3xl";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <Confetti blobs={hero ? undefined : QUIET_BLOBS} />

      {/* z-10 across the content: the confetti sits at z-0 and must never be
          able to take a click meant for the form. */}
      <div className={`relative z-10 mx-auto w-full ${column} px-6 pt-10 md:pt-14`}>
        <p className="text-center">
          <span className="display text-[26px] font-black tracking-[-0.045em] text-ink">
            Vocation
          </span>
        </p>

        {/* The hero has nothing to be N-of-M about — it's the first thing you
            see, and a progress bar there says "this is a form" before you've
            typed anything. */}
        {!hero && (
          <div className="mx-auto mt-8 max-w-md">
            <div className="h-1.5 w-full rounded-full bg-sand-deep" aria-hidden="true">
              <div
                className="h-1.5 rounded-full bg-ink transition-all duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-center text-xs font-medium text-ink-faint">
              Step {stepNumber} of {stepCount}
            </p>
          </div>
        )}
      </div>

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
          <div className={`min-w-0 ${hero ? "text-center" : ""}`}>
            <h1
              className={
                hero
                  ? "text-[44px] font-black leading-[1.02] text-ink sm:text-6xl md:text-7xl"
                  : "text-3xl font-extrabold text-ink md:text-[42px]"
              }
            >
              {question}
            </h1>
            {help && (
              <p
                className={`mt-4 text-ink-soft ${
                  hero ? "mx-auto max-w-xl text-lg md:text-xl" : "md:text-lg"
                }`}
              >
                {help}
              </p>
            )}

            <div className={hero ? "mt-10" : "mt-8"}>{children}</div>
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
              className="text-sm font-medium text-ink-faint transition-colors hover:text-ink"
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
 * `selected` drives a solid ink border and a tinted fill rather than a colour
 * wash, so a multi-select screen reads as "these three are on" at a glance
 * without the page turning into a block of colour.
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
      className={`w-full rounded-2xl border-2 p-5 text-left transition-all duration-150 ${
        selected
          ? "border-ink bg-white shadow-[0_6px_0_0_var(--ink)]"
          : "border-transparent bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md"
      }`}
    >
      <span className="block font-bold text-ink">{label}</span>
      {detail && (
        <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{detail}</span>
      )}
      {meta && (
        <span className="mt-3 inline-block rounded-full bg-sand-deep px-3 py-1 text-xs font-semibold text-ink-soft">
          {meta}
        </span>
      )}
    </button>
  );
}

/** The primary "move on" button. Solid ink, generous radius. */
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
      className="rounded-xl bg-ink px-8 py-4 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-ink-faint/40 disabled:shadow-none"
    >
      {label}
    </button>
  );
}
