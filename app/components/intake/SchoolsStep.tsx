"use client";

import { useEffect, useState } from "react";
import type { IntakeAnswers } from "@/app/lib/intake";
import type { SchoolRef } from "@/app/lib/schoolRef";
import { ContinueButton, StepShell } from "@/app/components/intake/StepShell";

// Which of these schools do you already have in mind?
//
// The list is fetched for the student's city AND their career, so it's schools
// that could actually get them there rather than whatever happens to be
// nearby. Two provenances land in the same list and are labelled differently,
// because the difference is real:
//
//   "Full catalog"  We scraped this school's entire program list. Its plan is
//                   built from real programs and cannot contain an invented
//                   degree.
//   "AI-sourced"    Everything else. The plan is generated and its program
//                   links are verified by fetching them, which is weaker.

interface Props {
  answers: IntakeAnswers;
  stepNumber: number;
  stepCount: number;
  onBack: () => void;
  onDone: (picked: SchoolRef[], discovered: SchoolRef[]) => void;
}

function money(school: SchoolRef): string | null {
  const t = school.tuition;
  if (!t || (!t.low && !t.high)) return null;
  const format = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: t.currency || "USD",
      maximumFractionDigits: 0,
    }).format(n);
  return t.low === t.high
    ? `${format(t.high)}/yr`
    : `${format(t.low)} – ${format(t.high)}/yr`;
}

export function SchoolsStep({ answers, stepNumber, stepCount, onBack, onDone }: Props) {
  const [schools, setSchools] = useState<SchoolRef[]>([]);
  const [picked, setPicked] = useState<SchoolRef[]>(answers.desiredSchools ?? []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/find-schools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            career: answers.career?.resolved,
            countryCode: answers.location?.countryCode,
            subdivision: answers.location?.subdivision,
            city: answers.location?.city,
            // Present when a postal code resolved. Turns "closest to home"
            // from a city-name guess into an actual distance.
            latitude: answers.location?.latitude,
            longitude: answers.location?.longitude,
          }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Couldn't find schools.");
        if (!cancelled) setSchools(body.schools ?? []);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Couldn't find schools.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [answers.career?.resolved, answers.location?.countryCode, answers.location?.subdivision, answers.location?.city]);

  const toggle = (school: SchoolRef) =>
    setPicked((current) =>
      current.some((s) => s.id === school.id)
        ? current.filter((s) => s.id !== school.id)
        : [...current, school]
    );

  return (
    <StepShell
      stepNumber={stepNumber}
      stepCount={stepCount}
      question="Any of these you already have in mind?"
      help={`Schools near ${answers.location?.city || "you"} that could lead to ${
        answers.career?.resolved?.toLowerCase() ?? "this career"
      }. Pick any, or skip and we'll choose for you.`}
      onBack={onBack}
      footer={
        <ContinueButton
          onClick={() => onDone(picked, schools)}
          label={picked.length ? `Continue with ${picked.length}` : "Continue"}
        />
      }
    >
      {loading && (
        <p className="flex items-center gap-3 text-gray-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-school-600 border-t-transparent" />
          Finding schools near {answers.location?.city}…
        </p>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error} You can continue without picking one — we&apos;ll still work out
          routes for you.
        </div>
      )}

      {!loading && schools.length > 0 && (
        <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
          {schools.map((school) => {
            const selected = picked.some((s) => s.id === school.id);
            const price = money(school);
            return (
              <button
                key={school.id}
                type="button"
                onClick={() => toggle(school)}
                aria-pressed={selected}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  selected
                    ? "border-school-600 bg-school-50 ring-2 ring-school-600"
                    : "border-gray-200 bg-white hover:border-school-400 hover:shadow-md"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-gray-900">{school.name}</span>
                  {price && (
                    <span className="text-sm font-medium text-gray-700">{price}</span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-gray-500">
                  {[school.city, school.subdivision].filter(Boolean).join(", ")}
                  {typeof school.distanceMiles === "number" &&
                    ` · ${Math.round(school.distanceMiles)} mi`}
                </p>
                {school.note && (
                  <p className="mt-2 text-sm text-gray-600">{school.note}</p>
                )}
                <span
                  className={`mt-3 inline-block rounded px-2 py-0.5 text-xs font-medium ${
                    school.source === "catalog"
                      ? "bg-green-50 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {school.source === "catalog"
                    ? "Full program catalog"
                    : "AI-sourced · links get checked"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!loading && (
        <button
          type="button"
          onClick={() => onDone([], schools)}
          className="mt-6 text-sm text-gray-500 underline hover:text-gray-800"
        >
          I don&apos;t have a preference — pick for me
        </button>
      )}
    </StepShell>
  );
}
