"use client";

import type { ReactNode } from "react";

/**
 * The frame every intake question renders inside.
 *
 * One question per screen, centered, with the progress bar and the back
 * control in fixed positions. Keeping that chrome here rather than in each
 * step is what stops the heading from shifting a few pixels between questions
 * — which reads as the page reloading rather than advancing.
 */
export function StepShell({
  stepNumber,
  stepCount,
  question,
  help,
  onBack,
  footer,
  children,
}: {
  stepNumber: number;
  stepCount: number;
  question: string;
  help?: string;
  onBack?: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const percent = Math.round((stepNumber / stepCount) * 100);

  return (
    <div className="min-h-[calc(100vh-73px)] flex flex-col">
      {/* Progress. aria-hidden on the bar itself because the label below it
          already says the same thing to a screen reader. */}
      <div className="w-full max-w-3xl mx-auto px-6 pt-8">
        <div className="h-1 w-full rounded-full bg-gray-200" aria-hidden="true">
          <div
            className="h-1 rounded-full bg-school-600 transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Question {stepNumber} of {stepCount}
        </p>
      </div>

      <div className="flex-1 w-full max-w-3xl mx-auto px-6 py-10 md:py-14">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
          {question}
        </h1>
        {help && <p className="mt-3 text-gray-600 md:text-lg">{help}</p>}

        <div className="mt-8">{children}</div>
      </div>

      <div className="w-full max-w-3xl mx-auto px-6 pb-10 flex items-center gap-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
        )}
        <div className="ml-auto">{footer}</div>
      </div>
    </div>
  );
}

/**
 * A selectable answer card.
 *
 * `selected` drives a ring rather than a fill so that multi-select steps read
 * as "these three are on" at a glance without the page turning into a block of
 * school color.
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
      className={`w-full text-left rounded-xl border p-4 transition-all ${
        selected
          ? "border-school-600 ring-2 ring-school-600 bg-school-50"
          : "border-gray-200 bg-white hover:border-school-400 hover:shadow-md"
      }`}
    >
      <span className="block font-semibold text-gray-900">{label}</span>
      {detail && <span className="mt-1 block text-sm text-gray-600">{detail}</span>}
      {meta && (
        <span className="mt-2 block text-xs font-medium text-school-700">{meta}</span>
      )}
    </button>
  );
}

/** The primary "move on" button, disabled until the step has an answer. */
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
      className="px-8 py-3 rounded-lg font-semibold text-white bg-school-600 hover:bg-school-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
    >
      {label}
    </button>
  );
}
