"use client";

import type { ReactNode } from "react";

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
  rail,
  corner,
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
  /**
   * A control pinned to the top-right, level with the wordmark.
   *
   * Only the country switcher uses this, and only on the hero. It's a setting
   * rather than a question, so it sits in the corner the way every storefront
   * puts its locale picker — not as a screen the student has to get past.
   */
  corner?: ReactNode;
  children: ReactNode;
}) {
  const percent = Math.round((stepNumber / stepCount) * 100);
  // The rail needs room beside the reading column, so a step that has one is
  // widened even when it didn't ask to be.
  const column = wide || rail ? "max-w-6xl" : "max-w-3xl";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-surface">
      {/* Pinned to the PAGE corner, not the reading column — a locale switcher
          that floats 280px in from the edge doesn't read as chrome, it reads
          as part of the form. Outside the centred column entirely, so the
          wordmark stays optically centred rather than being pushed left by
          half the chip's width.

          z-30 clears the content below: the popover has to open over the
          heading beneath it. */}
      {corner && (
        <div className="absolute right-5 top-8 z-30 md:right-8 md:top-11">
          {corner}
        </div>
      )}

      <div className={`relative z-10 mx-auto w-full ${column} px-6 pt-10 md:pt-14`}>
        <p className="text-center">
          <span className="text-lg font-bold tracking-tight text-primary">
            Vocation
          </span>
        </p>

        {/* The hero has nothing to be N-of-M about — it's the first thing you
            see, and a progress bar there says "this is a form" before you've
            typed anything. */}
        {!hero && (
          <div className="mx-auto mt-8 max-w-md">
            <div className="h-1.5 w-full rounded-full bg-surface-container" aria-hidden="true">
              <div
                className="h-1.5 rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-center text-xs font-medium text-outline">
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
                  ? "text-2xl font-extrabold leading-[1.15] tracking-[-0.02em] text-primary sm:text-5xl md:text-6xl"
                  : "text-2xl font-bold leading-tight tracking-[-0.01em] text-primary md:text-[32px]"
              }
            >
              {question}
            </h1>
            {help && (
              <p
                className={`mt-4 text-on-surface-variant ${
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
