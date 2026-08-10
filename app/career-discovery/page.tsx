"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StepShell, OptionCard, ContinueButton } from "@/app/components/intake/StepShell";
import { loadIntake, saveIntake } from "@/app/lib/intakeStorage";

// The "not sure yet" quiz, on the same visual language as the intake it feeds
// into. This used to be its own world — SchoolHeader, gray-950/school-600
// Tailwind classes DESIGN.md never defined, FontAwesome <i> icons the app
// never actually loads (see HANDOFF rule 8: five runtime dependencies, and
// FontAwesome isn't one), and a results screen that linked into /pathway,
// the classic 1.0 page. None of the quiz LOGIC changes here — same eight
// questions, same /api/career-assessment call — only what it looks like and
// where a result sends you.

interface Career {
  title: string;
  description: string;
  salary: string;
  jobOutlook: string;
  competitiveness: string;
  matchReason: string;
}

interface QuizAnswer {
  question: string;
  answer: string | string[];
}

const QUESTIONS = [
  {
    id: 1,
    question: "What interests you most?",
    type: "multiple" as const,
    options: [
      "Technology & Software",
      "Healthcare & Medicine",
      "Business & Finance",
      "Education & Teaching",
      "Arts & Creative",
      "Engineering & Construction",
      "Law & Legal Services",
      "Science & Research",
      "Hospitality & Tourism",
      "Social Services & Counseling",
    ],
  },
  {
    id: 2,
    question: "What work environment do you prefer?",
    type: "multiple" as const,
    options: [
      "Office setting",
      "Remote work",
      "Outdoor/Field work",
      "Hospital/Clinical",
      "Travel frequently",
      "Laboratory",
      "Classroom",
      "Workshop/Factory",
    ],
  },
  {
    id: 3,
    question: "What salary range are you aiming for?",
    type: "single" as const,
    options: [
      "$30,000 - $50,000",
      "$50,000 - $75,000",
      "$75,000 - $100,000",
      "$100,000 - $150,000",
      "$150,000+",
      "Salary is not my primary concern",
    ],
  },
  {
    id: 4,
    question: "What education level are you willing to pursue?",
    type: "multiple" as const,
    options: [
      "High school diploma or equivalent",
      "Associate's degree",
      "Bachelor's degree",
      "Master's degree",
      "Doctoral degree",
      "Professional certification",
    ],
  },
  {
    id: 5,
    question: "How important is work-life balance to you?",
    type: "single" as const,
    options: [
      "Very important - I want regular hours",
      "Moderately important - Some flexibility is fine",
      "Not a priority - I'm willing to work long hours",
    ],
  },
  {
    id: 6,
    question: "What type of work do you enjoy?",
    type: "multiple" as const,
    options: [
      "Problem-solving & analysis",
      "Creative & design work",
      "Helping & serving others",
      "Leading & managing teams",
      "Building & creating things",
      "Research & discovery",
      "Teaching & training",
      "Sales & communication",
    ],
  },
  {
    id: 7,
    question: "How do you prefer to work?",
    type: "single" as const,
    options: ["Independently", "In a team", "Both equally"],
  },
  {
    id: 8,
    question: "What motivates you most in a career?",
    type: "multiple" as const,
    options: [
      "High salary & financial security",
      "Making a positive impact",
      "Creative expression",
      "Intellectual challenge",
      "Job stability",
      "Career growth opportunities",
      "Recognition & prestige",
    ],
  },
];

export default function CareerDiscoveryPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = QUESTIONS[currentStep];

  function handleAnswerSelect(option: string) {
    if (currentQuestion.type === "single") {
      setSelectedAnswers([option]);
    } else if (selectedAnswers.includes(option)) {
      setSelectedAnswers(selectedAnswers.filter((a) => a !== option));
    } else {
      setSelectedAnswers([...selectedAnswers, option]);
    }
  }

  function handleNext() {
    if (selectedAnswers.length === 0) return;

    const newAnswer: QuizAnswer = {
      question: currentQuestion.question,
      answer: currentQuestion.type === "single" ? selectedAnswers[0] : selectedAnswers,
    };
    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedAnswers([]);
    } else {
      void handleSubmit(newAnswers);
    }
  }

  function handleBack() {
    if (currentStep === 0) return;
    const prevAnswer = answers[currentStep - 1];
    setSelectedAnswers(
      prevAnswer ? (Array.isArray(prevAnswer.answer) ? prevAnswer.answer : [prevAnswer.answer]) : []
    );
    setAnswers(answers.slice(0, -1));
    setCurrentStep(currentStep - 1);
  }

  async function handleSubmit(finalAnswers: QuizAnswer[]) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/career-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers }),
      });
      if (!response.ok) throw new Error("Couldn't get career recommendations.");
      const data = await response.json();
      setCareers(data.careers || []);
      setShowResults(true);
    } catch {
      setError("Something went wrong getting your recommendations. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleRestart() {
    setCurrentStep(0);
    setAnswers([]);
    setSelectedAnswers([]);
    setCareers([]);
    setShowResults(false);
    setError(null);
  }

  // Same seed-then-route CareerSearch uses on the landing page — the intake
  // reads the stored career on mount and skips its own career question, so a
  // quiz result lands straight on the job summary rather than asking again.
  function planPathway(title: string) {
    saveIntake({ ...loadIntake(), career: { raw: title, resolved: title } });
    router.push("/start");
  }

  if (loading) {
    return (
      <StepShell stepNumber={1} question="" landmark>
        <div className="flex flex-col items-center py-16 text-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-lg font-medium text-primary">Analyzing your answers…</p>
          <p className="mt-1 text-on-surface-variant">
            Finding careers that fit what you told us.
          </p>
        </div>
      </StepShell>
    );
  }

  if (showResults) {
    return (
      <StepShell stepNumber={1} question="" landmark>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary md:text-4xl">Your Career Matches</h1>
          <p className="mt-3 text-on-surface-variant">
            Based on your answers, here are careers that align with what you're looking for.
          </p>
          <button
            type="button"
            onClick={handleRestart}
            className="mt-3 text-sm font-medium text-secondary hover:text-secondary/80"
          >
            Take the quiz again
          </button>
        </div>

        {careers.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {careers.map((career) => (
              /* Grid items already stretch to equal height; the buttons used
                 to land at different heights only because nothing claimed the
                 leftover space, so a card with a short title and a two-line
                 match reason simply ran out of content sooner. The title
                 reserves two lines, the description absorbs the slack, and
                 the footer is pinned with mt-auto — every button lands on one
                 line across the row no matter how much text a card has. */
              <div
                key={career.title}
                className="flex flex-col rounded-xl bg-surface-lowest p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <h2 className="min-h-[3.5rem] text-lg font-semibold leading-snug text-on-surface">
                  {career.title}
                </h2>
                {career.description && (
                  <p className="mt-2 flex-1 text-sm text-on-surface-variant">{career.description}</p>
                )}
                {career.matchReason && (
                  <div className="mt-3 rounded-lg bg-surface-container p-3">
                    <p className="text-xs font-semibold text-primary">Why this matches you</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">{career.matchReason}</p>
                  </div>
                )}
                <div className="mt-auto pt-4">
                  <div className="space-y-1.5 border-t border-outline-variant pt-4 text-sm text-on-surface-variant">
                    {career.salary && <p>{career.salary}</p>}
                    {career.jobOutlook && <p>{career.jobOutlook}</p>}
                    {career.competitiveness && <p>{career.competitiveness}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => planPathway(career.title)}
                    className="mt-5 w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90"
                  >
                    Plan this pathway
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center">
            <p className="text-on-surface-variant">No career matches found — try again.</p>
            <button
              type="button"
              onClick={handleRestart}
              className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary/90"
            >
              Restart quiz
            </button>
          </div>
        )}
      </StepShell>
    );
  }

  return (
    <StepShell
      landmark
      stepNumber={currentStep + 1}
      question={currentQuestion.question}
      help={currentQuestion.type === "multiple" ? "Select all that apply." : undefined}
      onBack={currentStep > 0 ? handleBack : undefined}
      footer={
        <ContinueButton
          onClick={handleNext}
          disabled={selectedAnswers.length === 0}
          label={currentStep === QUESTIONS.length - 1 ? "See results" : "Continue"}
        />
      }
    >
      {error && (
        <p className="mb-4 rounded-lg border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}
      <div className="space-y-3">
        {currentQuestion.options.map((option) => (
          <OptionCard
            key={option}
            label={option}
            selected={selectedAnswers.includes(option)}
            onClick={() => handleAnswerSelect(option)}
          />
        ))}
      </div>
    </StepShell>
  );
}
