"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  BUDGET_PRIORITIES,
  DEPENDENCY_CRITERIA,
  EDUCATION_LEVELS,
  HOUSEHOLD_SIZES,
  INCOME_BANDS,
  MOBILITY_OPTIONS,
  NO_MOBILITY,
  householdQuestion,
  incomeQuestion,
  isIndependent,
  type BudgetPriority,
  type DependencyFlag,
  type EducationLevel,
  type IncomeBand,
  type IntakeAnswers,
  type WorkMobility,
} from "@/app/lib/intake";
import { DEFAULT_COUNTRY } from "@/app/lib/countries";
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

// Chosen to advertise the range of ROUTES, not just a list of jobs: a
// degree, a trade, a credential, a certification, a talent path. Someone who
// thinks this is a college-finder should see otherwise before they type.
const CAREER_EXAMPLES = [
  "doctor",
  "electrician",
  "nurse",
  "welder",
  "cloud engineer",
  "graphic designer",
];

export default function IntakeWizard() {
  const router = useRouter();

  const [answers, setAnswers] = useState<IntakeAnswers>({});
  const [hydrated, setHydrated] = useState(false);
  const { status } = useSession();
  // The account's stored postal code, once fetched. Null covers signed-out,
  // request-failed, and signed-in-but-never-saved-one alike, because the
  // location step does the same thing in all three cases: ask.
  const [savedLocation, setSavedLocation] = useState<{
    postalCode: string | null;
    countryCode: string | null;
  } | null>(null);
  const [step, setStep] = useState<Step>("career");
  const [refinement, setRefinement] = useState<Refinement | null>(null);
  const [careerInput, setCareerInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // True when we arrived with a career already typed on the landing page, so
  // the career question never renders. See the hydration effect below.
  const [skipCareer, setSkipCareer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // StrictMode runs mount effects twice in development. Without this the
  // skipped-career resolve fires /api/refine-career twice on every dev load.
  const seedResolved = useRef(false);

  // Restore a half-finished intake so a refresh doesn't cost six answers. Runs
  // once, after mount â€” sessionStorage doesn't exist during the server render.
  useEffect(() => {
    const stored = loadIntake();
    setAnswers(stored);
    const seeded = stored.career?.raw;
    if (seeded && !seedResolved.current) {
      seedResolved.current = true;
      setCareerInput(seeded);
      // The landing page ALREADY asked for the career. Re-rendering the same
      // question here with their answer pre-filled read as a bug: you type
      // "software engineer", press go, and get a page asking what career you
      // want. So resolve it immediately and open on the career summary. The
      // question below still exists for anyone who reached /start from a bare
      // "Plan your route" link with nothing stored.
      setSkipCareer(true);
      void resolveCareer(seeded);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveIntake(answers);
  }, [answers, hydrated]);

  // Pull the account's saved postal code, if there is an account and it has
  // one. Fired at mount rather than when the location step opens, because it's
  // the fourth question and this way it has three questions' worth of time to
  // land before anyone can see it.
  //
  // Everything about this is best-effort. It seeds a field; it does not answer
  // anything, and a signed-out visitor or a failed request simply gets the
  // question as it has always been asked.
  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/profile/location");
        if (!response.ok) return;
        const body = await response.json();
        if (!cancelled && body.postalCode) setSavedLocation(body);
      } catch {
        // Not worth surfacing: the fallback is the question itself.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (step === "career") inputRef.current?.focus();
  }, [step]);

  const steps = useMemo<Step[]>(() => {
    // Skipped when the landing page already collected the career — it isn't a
    // step the student takes here, so it shouldn't inflate the step count
    // either ("Step 1 of 7", not "Step 2 of 8").
    const list: Step[] = skipCareer ? [] : ["career"];
    if (refinement?.needsSpecifics) list.push("specifics");
    // The profile sits immediately after the career — right after any
    // NARROWING, so it describes the specific job they settled on rather than
    // figures spanning a GP and a neurosurgeon, but BEFORE anything else.
    //
    // It's the first thing the student gets back rather than the fourth, which
    // is the point: it's the screen most likely to change their mind, and the
    // questions after it all cost effort. The trade is that it runs before we
    // know where they live, so its wage figures are national. See
    // resolveAreas — no location means national-only, never a metro figure
    // labelled as theirs.
    list.push("profile", "location", "education", "finances", "schools", "priority", "mobility");
    return list;
  }, [refinement, skipCareer]);

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
    if (previous) {
      goTo(previous);
    } else {
      // First screen of the wizard. When the career came from the landing
      // page, that page IS the previous step — going back has to leave, or the
      // button is dead on the very screen students most want to back out of.
      router.push("/");
    }
  };

  const patch = (changes: Partial<IntakeAnswers>) =>
    setAnswers((current) => ({ ...current, ...changes }));

  // --- Career step ---------------------------------------------------------

  // Takes the career explicitly rather than reading careerInput: the hydration
  // effect calls this with the stored answer, before that state has settled.
  const resolveCareer = async (career: string) => {
    const raw = career.trim();
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
        goTo("profile");
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
      // This path has bitten twice now — it sits one indent level deeper than
      // the success path above, so both previous reorders rewrote that one and
      // left this one pointing at the old step. It must go wherever the
      // success path goes, or a student whose refine call failed skips a
      // question and /plan bounces them home for an incomplete intake.
      goTo("profile");
    } finally {
      setBusy(false);
    }
  };

  const submitCareer = () => resolveCareer(careerInput);

  const restartCareer = () => {
    // Changing the career invalidates the follow-up question that was built
    // from the old one, so drop it rather than showing doctor specialties to
    // someone who now wants to be an electrician.
    setRefinement(null);
    patch({ career: undefined });
    // When the career question was skipped there's nothing to go back TO here
    // — retyping it happens on the landing page.
    if (skipCareer) router.push("/");
    else goTo("career");
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

  if (skipCareer && step === "career") {
    // Mid-skip: /api/refine-career is still deciding whether this career needs
    // narrowing, so we don't yet know which screen comes first. Hold the
    // student on the summary they're expecting rather than flashing the
    // question we just removed. Deliberately the same skeleton
    // CareerProfileStep uses, under the career they typed, so the handover
    // between the two is invisible.
    return (
      <StepShell
        stepNumber={1}
        stepCount={stepCount}
        question={careerInput}
        help="Pulling together what this job is really like…"
        onBack={() => router.push("/")}
        // Matches the label CareerProfileStep itself uses once it takes over,
        // so the active tab doesn't visibly change the moment loading finishes.
        navLabel="Insights"
        hideSteps
        wide
      >
        <div className="space-y-4" aria-live="polite">
          <div className="h-48 animate-pulse rounded-xl bg-surface-container" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-surface-container" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-surface-container" />
        </div>
      </StepShell>
    );
  }

  if (step === "career") {
    return (
      <StepShell
        stepNumber={1}
        stepCount={stepCount}
        question="What career do you want?"
        help="Anything from a job title to a rough idea. We'll work out the route together — and it isn't always a degree."
        hero
      >
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl bg-surface-lowest p-2 shadow-raised">
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
              placeholder="electrician"
              aria-label="The career you want"
              disabled={busy}
              className="w-full rounded-lg border-0 bg-transparent px-6 py-5 text-center text-2xl font-bold text-on-surface placeholder:font-normal placeholder:text-outline/60 focus:outline-none focus:ring-0 md:text-3xl"
            />
          </div>

          <div className="mt-8">
            <ContinueButton
              onClick={submitCareer}
              disabled={busy || !careerInput.trim()}
              label={busy ? "Looking that up…" : "Start your plan"}
            />
          </div>

          {error && <p className="mt-5 text-sm font-medium text-red-600">{error}</p>}

          <p className="mt-12 text-sm font-semibold uppercase tracking-widest text-outline">
            Or try one of these
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2.5">
            {CAREER_EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setCareerInput(example)}
                disabled={busy}
                className="rounded-full bg-surface-lowest px-5 py-2.5 text-sm font-semibold text-on-surface-variant shadow-card transition-all hover:-translate-y-0.5 hover:text-primary hover:shadow-lift disabled:opacity-50"
              >
                {example}
              </button>
            ))}
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
                goTo("profile");
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
            goTo("profile");
          }}
          className="mt-6 text-sm text-outline underline hover:text-primary"
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
        // DEFAULT_COUNTRY until the location step answers, which is the screen
        // after this one. Passing undefined instead reads to resolveAreas as
        // "not in the US" and drops the BLS figures entirely — so a student
        // who hasn't reached the location question yet would get estimates on
        // a page that could have shown them survey data.
        countryCode={answers.location?.countryCode || DEFAULT_COUNTRY}
        // Usually empty here — the metro is asked for on the NEXT screen, so
        // these figures are national until then, and the panel says so.
        subdivision={answers.location?.subdivision}
        city={answers.location?.city}
        stepNumber={stepNumber}
        stepCount={stepCount}
        onBack={back}
        onNext={advance}
        // Remember which BLS occupation this career resolved to, so the plan
        // page's wage panel describes the same one.
        onLoaded={(profile) => {
          if (!profile.socCode || answers.career?.socCode === profile.socCode) return;
          patch({
            career: { ...answers.career!, socCode: profile.socCode },
          });
        }}
        // A related-career chip is just another way of answering the career
        // question, so it takes the same path a typed answer does: refine,
        // then land back on this same step with the new career's summary.
        onSelectRelated={resolveCareer}
      />
    );
  }

  if (step === "location") {
    return (
      <LocationStep
        rail={rail}
        value={answers.location}
        savedLocation={savedLocation ?? undefined}
        stepNumber={stepNumber}
        stepCount={stepCount}
        onBack={back}
        onDone={(location) => {
          patch({ location });
          // Remember it on the account so the next visit starts from it.
          // Fire-and-forget: the answer is already in `answers` either way,
          // and a student shouldn't wait on a write whose only benefit lands
          // next time.
          if (status === "authenticated") {
            void fetch("/api/profile/location", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                postalCode: location.postalCode ?? null,
                countryCode: location.countryCode,
              }),
            }).catch(() => {});
          }
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
    const flags = answers.dependencyFlags ?? [];
    const independent = isIndependent(flags);
    // Declining to give an income switches off the only thing household size
    // feeds, so the question stops being asked rather than sitting there as a
    // required field with nothing behind it.
    const declinedIncome = answers.incomeBand === "prefer-not-to-say";

    // Toggling any criterion is an answer; so is explicitly saying none apply.
    // Both set `dependencyAnswered`, because an empty list is a real result
    // here and can't be told from "hasn't looked at this yet" on its own.
    const toggleFlag = (id: DependencyFlag) =>
      patch({
        dependencyFlags: flags.includes(id)
          ? flags.filter((f) => f !== id)
          : [...flags, id],
        dependencyAnswered: true,
      });

    return (
      <StepShell
        stepNumber={stepNumber}
        stepCount={stepCount}
        question="Let's estimate your financial aid"
        rail={rail}
        help="Three quick questions. They only feed the estimate — this isn't a FAFSA, and nothing here is verified or checked against anything."
        onBack={back}
        footer={
          answers.dependencyAnswered &&
          answers.incomeBand &&
          (declinedIncome || answers.householdSize) ? (
            <ContinueButton onClick={advance} />
          ) : undefined
        }
      >
        {/* Deriving dependency rather than asking for it. "Are you a dependent
            or an independent student?" sounds like the simpler question and is
            the one people get wrong — supporting yourself famously does NOT
            make you independent, and a student who mis-picks it gets an
            estimate wrong by thousands. See DEPENDENCY_CRITERIA. */}
        <h2 className="text-lg font-semibold text-primary">
          Do any of these describe you?
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Tick everything that applies. For most people still in or just out of
          high school the answer is none of them, which is normal.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {DEPENDENCY_CRITERIA.map((criterion) => (
            <OptionCard
              key={criterion.id}
              label={criterion.label}
              detail={criterion.detail}
              selected={flags.includes(criterion.id)}
              onClick={() => toggleFlag(criterion.id)}
            />
          ))}
        </div>
        <div className="mt-3">
          <OptionCard
            label="None of these apply to me"
            detail="You'll be counted as a dependent student, like most people under 24"
            selected={Boolean(answers.dependencyAnswered) && flags.length === 0}
            onClick={() =>
              patch({ dependencyFlags: [], dependencyAnswered: true })
            }
          />
        </div>

        {answers.dependencyAnswered && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-primary">
              {incomeQuestion(flags)}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {independent
                ? "Your own income, before tax. A rough band is enough."
                : "Your parents' or guardians' income, before tax — that's whose the formula counts for a dependent student. A rough band is enough."}
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

        {/* Last, because it's what makes the income figure mean anything, and
            it only reads as a sensible question once you've said whose income
            it was. */}
        {answers.dependencyAnswered && answers.incomeBand && !declinedIncome && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-primary">
              {householdQuestion(flags)}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Aid is scored against the poverty line for a household your size,
              so this moves the estimate about as much as the income does.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {HOUSEHOLD_SIZES.map((size) => (
                <OptionCard
                  key={size.value}
                  label={size.label}
                  selected={answers.householdSize === size.value}
                  onClick={() => patch({ householdSize: size.value })}
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
          className="mt-6 text-sm text-outline underline hover:text-primary"
        >
          None of these â€” I want to stay where I am
        </button>
      </StepShell>
    );
  }

  return null;
}
