"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadIntake, saveIntake } from "@/app/lib/intakeStorage";
import { normalizeCareer } from "@/app/lib/careerCanonical";
import { blockedCareer, BLOCKED_CAREER_MESSAGE } from "@/app/lib/careerPolicy";

/**
 * The landing page's career field — the real entry to the intake.
 *
 * It doesn't ask which school you attend. That was the 1.0 opening question
 * and it's the one most visitors can't answer yet: you pick a career and then
 * work out where to study, not the other way round. So the only thing this
 * asks for is the career, and every school question is derived from it later.
 *
 * On submit it seeds the stored intake and routes to /start. IntakeWizard
 * reads that store on mount and, finding the career already answered, skips
 * its own career question entirely — the student lands on the job summary.
 * Asking again there, with their answer pre-filled, read as the app losing
 * track of what it had just been told.
 */
export function CareerSearch({ examples }: { examples: string[] }) {
  const [career, setCareer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function start(value: string) {
    const raw = value.trim();
    if (!raw) return;

    // Answered here rather than a page later. The server refuses this anyway —
    // careerPolicy is the same module /api/refine-career consults, so the two
    // can't disagree — but routing to /start only to bounce back would read as
    // the app losing the answer it had just been given.
    if (blockedCareer(normalizeCareer(raw))) {
      setError(BLOCKED_CAREER_MESSAGE);
      return;
    }

    setError(null);
    // Merge rather than replace: a returning visitor may already have answers
    // stored, and blowing them away because they retyped a career would throw
    // away a half-finished intake.
    saveIntake({ ...loadIntake(), career: { raw, resolved: raw } });
    router.push("/start");
  }

  return (
    <div className="rounded-xl bg-surface-lowest p-8 shadow-raised">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          start(career);
        }}
      >
        <label
          htmlFor="career"
          className="block text-sm font-medium tracking-[0.05em] text-on-surface-variant"
        >
          What career are you aiming for?
        </label>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              id="career"
              name="career"
              type="text"
              value={career}
              onChange={(event) => {
                setCareer(event.target.value);
                setError(null);
              }}
              placeholder="e.g. Registered Nurse"
              autoComplete="off"
              className="w-full rounded-full border border-outline-variant bg-surface-lowest py-3 pl-10 pr-4 text-base text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={!career.trim()}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-secondary px-8 py-3 text-sm font-medium tracking-[0.05em] text-on-secondary transition-colors hover:bg-secondary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:bg-outline-variant disabled:text-outline"
          >
            Map the route
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
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-red-600">
            {error}
          </p>
        )}
      </form>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-outline">
          Try
        </span>
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setCareer(example);
              setError(null);
            }}
            className="rounded-full bg-surface-low px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
