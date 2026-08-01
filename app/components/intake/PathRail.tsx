"use client";

import { useState } from "react";
import type { IntakeAnswers } from "@/app/lib/intake";
import {
  clearedFraction,
  enrichOutline,
  outlineDurationHint,
  type EnrichedStep,
  type OutlineStepKind,
} from "@/app/lib/pathOutline";
import { archetypeProfile } from "@/app/lib/routeArchetype";

// The path, visible while the questions are still being answered.
//
// The point is that the student is never answering into a void. From the
// moment they name a career there is something concrete on screen, and each
// answer they give visibly sharpens it — the training step picks up their
// city, then the provider they chose; steps they've already completed grey
// out. That turns the remaining questions from a toll into something they can
// see the effect of.
//
// It is explicitly a sketch, and says so. The real plan — costed, with named
// programs and verified links — is still generated at the end.

const KIND_DOT: Record<OutlineStepKind, string> = {
  education: "bg-school-600",
  training: "bg-amber-500",
  credential: "bg-purple-600",
  experience: "bg-green-600",
  work: "bg-gray-800",
};

export function PathRail({ answers }: { answers: IntakeAnswers }) {
  const [open, setOpen] = useState(false);

  const outline = answers.career?.outline ?? [];
  if (!outline.length) return null;

  const steps = enrichOutline(outline, answers);
  const profile = archetypeProfile(answers.career?.routeArchetype);
  const remaining = outlineDurationHint(steps);
  const done = clearedFraction(steps);

  return (
    <aside
      aria-label="Your route so far"
      className="rounded-xl border border-gray-200 bg-white p-5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Your route
        </h2>
        {/* Mobile gets a collapsed rail: on a phone the path would otherwise
            push the actual question below the fold, which defeats the point. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs text-gray-500 underline hover:text-gray-800 lg:hidden"
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>

      <p className="mt-1 text-sm font-medium text-gray-900">{profile.label}</p>
      {answers.career?.routeReason && (
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          {answers.career.routeReason}
        </p>
      )}

      <div className={`${open ? "block" : "hidden"} lg:block`}>
        <ol className="mt-5 space-y-4">
          {steps.map((step, index) => (
            <Step key={`${step.label}-${index}`} step={step} last={index === steps.length - 1} />
          ))}
        </ol>

        {/* No "roughly" in the sentence below — outlineDurationHint already
            returns "about N years", and stacking the two hedges read as
            "Roughly about 9 years". */}
        {remaining && (
          <p className="mt-5 border-t border-gray-100 pt-4 text-xs text-gray-500">
            <strong className="text-gray-700 first-letter:uppercase">{remaining}</strong>{" "}
            of this left from where you are now.
          </p>
        )}

        {done > 0 && (
          <p className="mt-1 text-xs text-green-700">
            You&apos;ve already cleared {Math.round(done * 100)}% of it.
          </p>
        )}

        <p className="mt-4 text-xs leading-relaxed text-gray-400">
          A sketch, sharpening as you answer. The full plan at the end has real
          programs, costs, and checked links.
        </p>
      </div>
    </aside>
  );
}

function Step({ step, last }: { step: EnrichedStep; last: boolean }) {
  const cleared = step.status === "cleared";
  const next = step.status === "next";

  return (
    <li className="relative flex gap-3">
      {/* The connector stops at the last step so the list doesn't trail off
          into a line pointing at nothing. */}
      {!last && (
        <span
          aria-hidden="true"
          className="absolute left-[5px] top-4 h-full w-px bg-gray-200"
        />
      )}

      <span
        aria-hidden="true"
        className={`relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
          cleared ? "bg-gray-300" : KIND_DOT[step.kind] ?? "bg-gray-400"
        } ${next ? "ring-4 ring-school-100" : ""}`}
      />

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-semibold ${
            cleared ? "text-gray-400 line-through" : "text-gray-900"
          }`}
        >
          {step.label}
        </p>

        {step.duration && !cleared && (
          <p className="text-xs text-gray-500">{step.duration}</p>
        )}

        {next && (
          <p className="mt-1 text-xs leading-relaxed text-gray-600">{step.detail}</p>
        )}

        {cleared && <p className="text-xs text-gray-400">Already done</p>}

        {step.notes.map((note) => (
          <p key={note} className="mt-1 text-xs font-medium text-school-700">
            {note}
          </p>
        ))}
      </div>
    </li>
  );
}
