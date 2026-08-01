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
import type { SchoolRef } from "@/app/lib/schoolRef";
import type { RouteArchetype } from "@/app/lib/routeArchetype";
import type { OutlineStep } from "@/app/lib/pathOutline";
import { loadIntake, saveIntake } from "@/app/lib/intakeStorage";
import { ContinueButton, OptionCard, StepShell } from "@/app/components/intake/StepShell";
import { LocationStep } from "@/app/components/intake/LocationStep";
import { SchoolsStep } from "@/app/components/intake/SchoolsStep";
import { CareerProfileStep } from "@/app/components/intake/CareerProfileStep";
import { PathRail } from "@/app/components/intake/PathRail";

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
  /** How people actually get into this job — steers every later question. */
  routeArchetype?: RouteArchetype;
  routeReason?: string;
  outline?: OutlineStep[];
}

type Step =
  | "career"
  | "specifics"
  | "location"
  | "profile"
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
  // once, after mount â€” sessionStorage doesn't exist during the server render.
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
    // Order matters twice over. The profile sits after any NARROWING, so it
    // describes the specific job they settled on rather than figures spanning
    // a GP and a neurosurgeon. And it sits after LOCATION, so the pay and
    // demand on it are for their own market rather than a default one.
    list.push("location", "profile", "education", "finances", "schools", "priority", "mobility");
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
        patch({
          career: {
            raw,
            resolved: "",
            question: result.question,
            routeArchetype: result.routeArchetype,
            routeReason: result.routeReason,
            outline: result.outline,
          },
        });
        goTo("specifics");
      } else {
        // Already specific enough to plan against â€” no follow-up worth asking.
        patch({
          career: {
            raw,
            resolved: result.career || raw,
            routeArchetype: result.routeArchetype,
            routeReason: result.routeReason,
            outline: result.outline,
          },
        });
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
      // "location", not "profile". This path skipped the location question
      // outright, which left the plan with no country — so the profile quoted
      // a default market and /plan bounced the student home for an incomplete
      // intake. It survived the step reorder because it sits one indent level
      // deeper than the success path that was rewritten alongside it.
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

  // The route sketch, from the career question onward. Passed to every step
  // that renders its own StepShell; the steps that own their shell get it as
  // a prop instead. Absent on the career screen itself, since there is no
  // career yet to sketch.
  const rail = answers.career?.outline?.length ? <PathRail answers={answers} /> : undefined;

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
              label={busy ? "Looking that upâ€¦" : "Continue"}
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
        rail={rail}
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
            patch({
              career: {
                raw,
                resolved: refinement.career || raw,
                routeArchetype: refinement.routeArchetype,
                routeReason: refinement.routeReason,
                outline: refinement.outline,
              },
            });
            goTo("location");
          }}
          className="mt-6 text-sm text-gray-500 underline hover:text-gray-800"
        >
          None of these â€” plan for &ldquo;{refinement.career}&rdquo; generally
        </button>
      </StepShell>
    );
  }

  if (step === "profile" && answers.career?.resolved) {
    return (
      <CareerProfileStep
        rail={rail}
        career={answers.career.resolved}
        // Always known by now — location is the step before this one, which is
        // the whole reason it was moved. Pay is quoted in their market's own
        // currency instead of defaulting to US dollars.
        countryCode={answers.location?.countryCode}
        stepNumber={stepNumber}
        stepCount={stepCount}
        onBack={back}
        onNext={advance}
      />
    );
  }

  if (step === "location") {
    return (
      <LocationStep
        rail={rail}
        value={answers.location}
        stepNumber={stepNumber}
        stepCount={stepCount}
        onBack={back}
        onDone={(location) => {
          patch({ location });
          advance();
        }}
      />
    );
  }

  if (step === "education") {
    return (
      <StepShell
        stepNumber={stepNumber}
        stepCount={stepCount}
        question="Where are you in school right now?"
        rail={rail}
        help="There's no point planning an associate degree for someone who already has one."
        onBack={back}
        footer={
          answers.educationLevel ? <ContinueButton onClick={advance} /> : undefined
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {EDUCATION_LEVELS.map((level) => (
            <OptionCard
              key={level.id}
              label={level.label}
              detail={level.detail}
              selected={answers.educationLevel === level.id}
              onClick={() => patch({ educationLevel: level.id as EducationLevel })}
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
        rail={rail}
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
              A rough band is enough â€” we use it to estimate grant aid, not to
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
        rail={rail}
        answers={answers}
        stepNumber={stepNumber}
        stepCount={stepCount}
        onBack={back}
        onDone={(picked: SchoolRef[], discovered: SchoolRef[]) => {
          patch({
            desiredSchools: picked,
            discoveredSchools: discovered,
            schoolsAnswered: true,
          });
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
        rail={rail}
        help="We'll still show you every route â€” this just decides which one leads."
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
        rail={rail}
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
          None of these â€” I want to stay where I am
        </button>
      </StepShell>
    );
  }

  return null;
}
