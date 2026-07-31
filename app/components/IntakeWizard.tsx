"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BUDGET_PRIORITIES,
  EDUCATION_LEVELS,
  INCOME_BANDS,
  MOBILITY_OPTIONS,
  NO_MOBILITY,
  SUPPORT_SITUATIONS,
  type BudgetPriority,
  type EducationLevel,
  type IncomeBand,
  type IntakeAnswers,
  type SupportSituation,
  type WorkMobility,
} from "@/app/lib/intake";
import { ELSEWHERE_REGION_ID, FLORIDA_REGIONS } from "@/app/lib/geography";
import { FLORIDA_SCHOOLS, SCHOOL_KIND_LABELS, type SchoolKind } from "@/app/lib/floridaSchools";
import { hasCatalog } from "@/app/lib/schoolCatalogs";
import { loadIntake, saveIntake } from "@/app/lib/intakeStorage";
import { ContinueButton, OptionCard, StepShell } from "@/app/components/intake/StepShell";

// The 2.0 intake, front to back.
//
// One question per screen. The order is not arbitrary: career first because
// it's the only question the student came here already knowing the answer to,
// and money last-but-one because asking a stranger about their family's income
// before you've shown them anything useful is how you get an abandoned form.

interface RefineOption {
  label: string;
  detail: string;
  commitment: string;
}

interface Refinement {
  career: string;
  needsSpecifics: boolean;
  question: string;
  helpText: string;
  options: RefineOption[];
  mobilityNote: string;
}

type Step =
  | "career"
  | "specifics"
  | "location"
  | "education"
  | "finances"
  | "schools"
  | "priority"
  | "mobility";

const CAREER_EXAMPLES = [
  "doctor",
  "BCBA",
  "mechanical engineer",
  "police officer",
  "nurse",
  "architect",
];

const SCHOOL_GROUP_ORDER: SchoolKind[] = [
  "state-college",
  "public-university",
  "private",
];

export default function IntakeWizard() {
  const router = useRouter();

  const [answers, setAnswers] = useState<IntakeAnswers>({});
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<Step>("career");
  const [refinement, setRefinement] = useState<Refinement | null>(null);
  const [careerInput, setCareerInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore a half-finished intake so a refresh doesn't cost six answers. Runs
  // once, after mount — sessionStorage doesn't exist during the server render.
  useEffect(() => {
    const stored = loadIntake();
    setAnswers(stored);
    if (stored.career?.raw) setCareerInput(stored.career.raw);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveIntake(answers);
  }, [answers, hydrated]);

  useEffect(() => {
    if (step === "career") inputRef.current?.focus();
  }, [step]);

  const steps = useMemo<Step[]>(() => {
    const list: Step[] = ["career"];
    if (refinement?.needsSpecifics) list.push("specifics");
    list.push("location", "education", "finances", "schools", "priority", "mobility");
    return list;
  }, [refinement]);

  const stepNumber = Math.max(1, steps.indexOf(step) + 1);

  const goTo = (next: Step) => {
    setError(null);
    setStep(next);
  };

  const advance = () => {
    const index = steps.indexOf(step);
    const next = steps[index + 1];
    if (next) goTo(next);
  };

  const back = () => {
    const index = steps.indexOf(step);
    const previous = steps[index - 1];
    if (previous) goTo(previous);
  };

  const patch = (changes: Partial<IntakeAnswers>) =>
    setAnswers((current) => ({ ...current, ...changes }));

  // --- Career step ---------------------------------------------------------

  const submitCareer = async () => {
    const raw = careerInput.trim();
    if (!raw) {
      setError("Type a career to get started.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/refine-career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ career: raw }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${response.status})`);
      }

      const result = (await response.json()) as Refinement;
      setRefinement(result);

      if (result.needsSpecifics) {
        patch({ career: { raw, resolved: "", question: result.question } });
        goTo("specifics");
      } else {
        // Already specific enough to plan against — no follow-up worth asking.
        patch({ career: { raw, resolved: result.career || raw } });
        goTo("location");
      }
    } catch (err: any) {
      // A failure here must not dead-end the student. The narrowing question
      // is an improvement to the plan, not a prerequisite for one, so fall
      // through with what they typed and say so quietly.
      console.error("refine-career failed:", err);
      setRefinement(null);
      patch({ career: { raw, resolved: raw } });
      setError(
        "We couldn't load follow-up options just now, so we'll plan against exactly what you typed."
      );
      goTo("location");
    } finally {
      setBusy(false);
    }
  };

  const restartCareer = () => {
    // Changing the career invalidates the follow-up question that was built
    // from the old one, so drop it rather than showing doctor specialties to
    // someone who now wants to be an electrician.
    setRefinement(null);
    patch({ career: undefined });
    goTo("career");
  };

  // --- Finishing -----------------------------------------------------------

  const finish = (mobility: WorkMobility) => {
    const complete: IntakeAnswers = { ...answers, mobility };
    setAnswers(complete);
    saveIntake(complete);
    router.push("/plan");
  };

  if (!hydrated) {
    // Rendering the career step before sessionStorage is read would flash an
    // empty input over a restored answer.
    return <div className="min-h-[calc(100vh-73px)]" />;
  }

  const stepCount = steps.length;

  // --- Steps ---------------------------------------------------------------

  if (step === "career") {
    return (
      <StepShell
        stepNumber={1}
        stepCount={stepCount}
        question="What career do you want?"
        help="Anything from a job title to a rough idea. We'll narrow it down together."
      >
        <div>
          <input
            ref={inputRef}
            type="text"
            value={careerInput}
            onChange={(e) => setCareerInput(e.target.value.slice(0, 60))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitCareer();
              }
            }}
            placeholder="doctor"
            aria-label="The career you want"
            disabled={busy}
            className="w-full border-0 border-b-2 border-gray-200 bg-transparent pb-3 text-3xl md:text-5xl text-gray-900 placeholder:text-gray-300 focus:border-school-600 focus:outline-none focus:ring-0 transition-colors"
          />

          <div className="mt-6 flex flex-wrap gap-2">
            {CAREER_EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setCareerInput(example)}
                disabled={busy}
                className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-600 hover:border-school-400 hover:text-school-700 transition-colors disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>

          {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

          <div className="mt-10">
            <ContinueButton
              onClick={submitCareer}
              disabled={busy || !careerInput.trim()}
              label={busy ? "Looking that up…" : "Continue"}
            />
          </div>
        </div>
      </StepShell>
    );
  }

  if (step === "specifics" && refinement) {
    return (
      <StepShell
        stepNumber={stepNumber}
        stepCount={stepCount}
        question={refinement.question}
        help={refinement.helpText}
        onBack={restartCareer}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {refinement.options.map((option) => (
            <OptionCard
              key={option.label}
              label={option.label}
              detail={option.detail}
              meta={option.commitment}
              selected={answers.career?.resolved === option.label}
              onClick={() => {
                patch({
                  career: {
                    raw: answers.career?.raw ?? careerInput,
                    resolved: option.label,
                    question: refinement.question,
                  },
                });
                goTo("location");
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            const raw = answers.career?.raw ?? careerInput;
            patch({ career: { raw, resolved: refinement.career || raw } });
            goTo("location");
          }}
          className="mt-6 text-sm text-gray-500 underline hover:text-gray-800"
        >
          None of these — plan for &ldquo;{refinement.career}&rdquo; generally
        </button>
      </StepShell>
    );
  }

  if (step === "location") {
    return (
      <StepShell
        stepNumber={stepNumber}
        stepCount={stepCount}
        question="Where do you live?"
        help="This decides which schools you could actually commute to, and whether you'd pay in-state tuition."
        onBack={back}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FLORIDA_REGIONS.map((region) => (
            <OptionCard
              key={region.id}
              label={region.label}
              detail={region.examples}
              selected={answers.regionId === region.id}
              onClick={() => {
                patch({ regionId: region.id });
                advance();
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            patch({ regionId: ELSEWHERE_REGION_ID });
            advance();
          }}
          className={`mt-4 w-full rounded-xl border p-4 text-left transition-all ${
            answers.regionId === ELSEWHERE_REGION_ID
              ? "border-school-600 ring-2 ring-school-600 bg-school-50"
              : "border-gray-200 bg-white hover:border-school-400"
          }`}
        >
          <span className="block font-semibold text-gray-900">
            I&apos;m not in Florida
          </span>
          <span className="mt-1 block text-sm text-gray-600">
            Vocation only holds Florida program catalogs right now, so you&apos;ll
            still get real routes — just not a local one, and out-of-state
            tuition would run higher than the figures we show.
          </span>
        </button>
      </StepShell>
    );
  }

  if (step === "education") {
    return (
      <StepShell
        stepNumber={stepNumber}
        stepCount={stepCount}
        question="Where are you in school right now?"
        help="There's no point planning an associate degree for someone who already has one."
        onBack={back}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {EDUCATION_LEVELS.map((level) => (
            <OptionCard
              key={level.id}
              label={level.label}
              detail={level.detail}
              selected={answers.educationLevel === level.id}
              onClick={() => {
                patch({ educationLevel: level.id as EducationLevel });
                advance();
              }}
            />
          ))}
        </div>
      </StepShell>
    );
  }

  if (step === "finances") {
    const situation = SUPPORT_SITUATIONS.find((s) => s.id === answers.support);

    return (
      <StepShell
        stepNumber={stepNumber}
        stepCount={stepCount}
        question="How are you covering costs right now?"
        help="This only affects the aid estimate. Nothing you enter is stored on a server or attached to you."
        onBack={back}
        footer={
          situation && answers.incomeBand ? (
            <ContinueButton onClick={advance} />
          ) : undefined
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {SUPPORT_SITUATIONS.map((option) => (
            <OptionCard
              key={option.id}
              label={option.label}
              detail={option.detail}
              selected={answers.support === option.id}
              onClick={() =>
                patch({ support: option.id as SupportSituation })
              }
            />
          ))}
        </div>

        {situation && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-gray-900">
              {situation.incomeLabel}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              A rough band is enough — we use it to estimate grant aid, not to
              verify anything.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {INCOME_BANDS.map((band) => (
                <OptionCard
                  key={band.id}
                  label={band.label}
                  selected={answers.incomeBand === band.id}
                  onClick={() => patch({ incomeBand: band.id as IncomeBand })}
                />
              ))}
            </div>
          </div>
        )}
      </StepShell>
    );
  }

  if (step === "schools") {
    return (
      <SchoolsStep
        answers={answers}
        stepNumber={stepNumber}
        stepCount={stepCount}
        onBack={back}
        onDone={(ids) => {
          patch({ desiredSchoolIds: ids, schoolsAnswered: true });
          advance();
        }}
      />
    );
  }

  if (step === "priority") {
    return (
      <StepShell
        stepNumber={stepNumber}
        stepCount={stepCount}
        question="What matters most to you?"
        help="We'll still show you every route — this just decides which one leads."
        onBack={back}
      >
        <div className="grid gap-3">
          {BUDGET_PRIORITIES.map((priority) => (
            <OptionCard
              key={priority.id}
              label={priority.label}
              detail={priority.detail}
              selected={answers.budgetPriority === priority.id}
              onClick={() => {
                patch({ budgetPriority: priority.id as BudgetPriority });
                advance();
              }}
            />
          ))}
        </div>
      </StepShell>
    );
  }

  if (step === "mobility") {
    const career = answers.career?.resolved ?? "this career";
    const mobility = answers.mobility ?? NO_MOBILITY;
    const toggle = (key: keyof WorkMobility) =>
      patch({ mobility: { ...mobility, [key]: !mobility[key] } });

    return (
      <StepShell
        stepNumber={stepNumber}
        stepCount={stepCount}
        question={`Once you're qualified, where would you work as a ${career.toLowerCase()}?`}
        help={
          refinement?.mobilityNote ||
          "Pick everything you'd genuinely consider. Ruling nothing out opens up faster routes in."
        }
        onBack={back}
        footer={<ContinueButton onClick={() => finish(mobility)} label="See my plan" />}
      >
        <div className="grid gap-3">
          {MOBILITY_OPTIONS.map((option) => (
            <OptionCard
              key={option.id}
              label={option.label}
              detail={option.detail}
              selected={mobility[option.id]}
              onClick={() => toggle(option.id)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => finish(NO_MOBILITY)}
          className="mt-6 text-sm text-gray-500 underline hover:text-gray-800"
        >
          None of these — I want to stay where I am
        </button>
      </StepShell>
    );
  }

  return null;
}

// --- Schools step ----------------------------------------------------------

/**
 * Split out because it's the only step with its own search state, and leaving
 * that state in the parent would reset the query every time an answer changed.
 */
function SchoolsStep({
  answers,
  stepNumber,
  stepCount,
  onBack,
  onDone,
}: {
  answers: IntakeAnswers;
  stepNumber: number;
  stepCount: number;
  onBack: () => void;
  onDone: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>(answers.desiredSchoolIds ?? []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = FLORIDA_SCHOOLS.filter(
      (school) =>
        !q ||
        school.name.toLowerCase().includes(q) ||
        school.shortName.toLowerCase().includes(q) ||
        school.city.toLowerCase().includes(q)
    );
    return SCHOOL_GROUP_ORDER.map((kind) => ({
      kind,
      label: SCHOOL_KIND_LABELS[kind],
      schools: matches
        .filter((school) => school.kind === kind)
        .sort((a, b) => a.name.localeCompare(b.name)),
    })).filter((group) => group.schools.length > 0);
  }, [query]);

  const toggle = (id: string) =>
    setPicked((current) =>
      current.includes(id)
        ? current.filter((existing) => existing !== id)
        : [...current, id]
    );

  return (
    <StepShell
      stepNumber={stepNumber}
      stepCount={stepCount}
      question="Any schools you already have in mind?"
      help="Pick as many as you like, or skip — we'll suggest schools either way."
      onBack={onBack}
      footer={
        <ContinueButton
          onClick={() => onDone(picked)}
          label={picked.length ? `Continue with ${picked.length}` : "Continue"}
        />
      }
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or city…"
        aria-label="Search schools"
        className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-school-500 focus:outline-none focus:ring-2 focus:ring-school-500"
      />

      <div className="mt-4 max-h-[45vh] overflow-y-auto rounded-xl border border-gray-200 bg-white">
        {groups.length === 0 && (
          <p className="px-4 py-6 text-sm text-gray-500">No schools match that.</p>
        )}
        {groups.map((group) => (
          <div key={group.kind}>
            <p className="sticky top-0 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {group.label}
            </p>
            {group.schools.map((school) => {
              const selected = picked.includes(school.id);
              const planable = hasCatalog(school.id);
              return (
                <button
                  key={school.id}
                  type="button"
                  onClick={() => toggle(school.id)}
                  aria-pressed={selected}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    selected ? "bg-school-50" : "hover:bg-gray-50"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      selected
                        ? "border-school-600 bg-school-600 text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {selected && (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-800">
                      {school.name}
                    </span>
                    <span className="block text-xs text-gray-500">{school.city}</span>
                  </span>
                  {/* Naming a school we hold no catalog for is allowed, but it
                      can't be planned against, and finding that out on the
                      results page would feel like a bug. */}
                  {!planable && (
                    <span className="shrink-0 rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                      No catalog yet
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onDone([])}
        className="mt-6 text-sm text-gray-500 underline hover:text-gray-800"
      >
        I don&apos;t have a preference — pick for me
      </button>
    </StepShell>
  );
}
