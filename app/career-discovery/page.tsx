"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

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
    type: "multiple",
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
    type: "multiple",
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
    type: "single",
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
    type: "multiple",
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
    type: "single",
    options: [
      "Very important - I want regular hours",
      "Moderately important - Some flexibility is fine",
      "Not a priority - I'm willing to work long hours",
    ],
  },
  {
    id: 6,
    question: "What type of work do you enjoy?",
    type: "multiple",
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
    type: "single",
    options: [
      "Independently",
      "In a team",
      "Both equally",
    ],
  },
  {
    id: 8,
    question: "What motivates you most in a career?",
    type: "multiple",
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
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  const handleAnswerSelect = (option: string) => {
    const currentQuestion = QUESTIONS[currentStep];
    
    if (currentQuestion.type === "single") {
      setSelectedAnswers([option]);
    } else {
      // Multiple selection
      if (selectedAnswers.includes(option)) {
        setSelectedAnswers(selectedAnswers.filter((a) => a !== option));
      } else {
        setSelectedAnswers([...selectedAnswers, option]);
      }
    }
  };

  const handleNext = () => {
    if (selectedAnswers.length === 0) return;

    const currentQuestion = QUESTIONS[currentStep];
    const newAnswer: QuizAnswer = {
      question: currentQuestion.question,
      answer: currentQuestion.type === "single" ? selectedAnswers[0] : selectedAnswers,
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      // Fade out current question
      setFadeIn(false);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setSelectedAnswers([]);
        // Fade in next question
        setTimeout(() => setFadeIn(true), 50);
      }, 300);
    } else {
      // Last question - submit quiz
      handleSubmit(newAnswers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      // Fade out current question
      setFadeIn(false);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        // Restore previous answer
        const prevAnswer = answers[currentStep - 1];
        if (prevAnswer) {
          setSelectedAnswers(
            Array.isArray(prevAnswer.answer)
              ? prevAnswer.answer
              : [prevAnswer.answer]
          );
        } else {
          setSelectedAnswers([]);
        }
        // Remove the last answer from answers array
        setAnswers(answers.slice(0, -1));
        // Fade in previous question
        setTimeout(() => setFadeIn(true), 50);
      }, 300);
    }
  };

  const handleSubmit = async (finalAnswers: QuizAnswer[]) => {
    setLoading(true);
    try {
      const response = await fetch("/api/career-assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers: finalAnswers }),
      });

      if (!response.ok) {
        throw new Error("Failed to get career recommendations");
      }

      const data = await response.json();
      setCareers(data.careers || []);
      setShowResults(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to get career recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers([]);
    setSelectedAnswers([]);
    setCareers([]);
    setShowResults(false);
    setLoading(false);
  };

  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  // Fade in on mount and step changes
  useEffect(() => {
    setFadeIn(true);
  }, [currentStep]);

  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Bar - Centered Logo */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center">
            <Link href="/">
              <img
                src="https://mdcwap.mdc.edu/apply/assets/mdc-logo.png"
                alt="Miami Dade College Logo"
                className="h-10 w-auto cursor-pointer"
              />
            </Link>
          </div>
        </header>

        {/* Results */}
        <section className="px-6 md:px-8 pt-12 md:pt-16 pb-24 md:pb-32">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Your Career Matches
              </h1>
              <p className="text-lg text-gray-700 mb-8">
                Based on your answers, here are careers that align with your interests and preferences.
              </p>
              <button
                onClick={handleRestart}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Take the quiz again
              </button>
            </div>

            {careers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {careers.map((career, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {career.title}
                    </h3>
                    {career.description && (
                      <p className="text-sm text-gray-600 mb-4">
                        {career.description}
                      </p>
                    )}
                    {career.matchReason && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-md">
                        <p className="text-xs font-medium text-blue-900 mb-1">
                          Why this matches you:
                        </p>
                        <p className="text-xs text-blue-800">
                          {career.matchReason}
                        </p>
                      </div>
                    )}
                    <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                      {career.salary && (
                        <div className="flex items-center gap-2">
                          <i className="fas fa-dollar-sign text-green-600 text-xs"></i>
                          <span className="text-sm font-medium text-gray-700">
                            {career.salary}
                          </span>
                        </div>
                      )}
                      {career.jobOutlook && (
                        <div className="flex items-center gap-2">
                          <i className="fas fa-chart-line text-blue-600 text-xs"></i>
                          <span className="text-sm text-gray-600">
                            {career.jobOutlook}
                          </span>
                        </div>
                      )}
                      {career.competitiveness && (
                        <div className="flex items-center gap-2">
                          <i className="fas fa-trophy text-purple-600 text-xs"></i>
                          <span className="text-sm text-gray-600">
                            {career.competitiveness}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/pathway?career=${encodeURIComponent(career.title)}`}
                        className="inline-block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        View Career Pathway
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  No career matches found. Please try again.
                </p>
                <button
                  onClick={handleRestart}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Restart Quiz
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Bar - Centered Logo */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center">
            <Link href="/">
              <img
                src="https://mdcwap.mdc.edu/apply/assets/mdc-logo.png"
                alt="Miami Dade College Logo"
                className="h-10 w-auto cursor-pointer"
              />
            </Link>
          </div>
        </header>

        {/* Loading State */}
        <section className="px-6 md:px-8 pt-24 md:pt-32 pb-24 md:pb-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <svg
                className="w-8 h-8 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient
                    id="gemini-gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="url(#gemini-gradient)"
                />
              </svg>
              <span className="text-green-600 font-medium text-xl">
                Analyzing your answers...
              </span>
            </div>
            <p className="text-gray-600">
              We're finding the perfect careers for you based on your responses.
            </p>
          </div>
        </section>
      </div>
    );
  }

  const currentQuestion = QUESTIONS[currentStep];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar - Centered Logo */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <Link href="/">
            <img
              src="https://mdcwap.mdc.edu/apply/assets/mdc-logo.png"
              alt="Miami Dade College Logo"
              className="h-10 w-auto cursor-pointer"
            />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <section className="px-6 md:px-8 pt-12 md:pt-16 pb-24 md:pb-32">
        <div className="max-w-3xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Question {currentStep + 1} of {QUESTIONS.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(progress)}% complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div
            className={`bg-white rounded-lg border border-gray-200 p-8 md:p-12 shadow-sm mb-6 transition-opacity duration-300 ${
              fadeIn ? "opacity-100" : "opacity-0"
            }`}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              {currentQuestion.question}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswers.includes(option);
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option}</span>
                      {isSelected && (
                        <i className="fas fa-check-circle text-blue-600"></i>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {currentQuestion.type === "multiple" && (
              <p className="mt-4 text-sm text-gray-500">
                Select all that apply
              </p>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                currentStep === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={selectedAnswers.length === 0}
              className={`px-8 py-3 rounded-md font-medium transition-colors ${
                selectedAnswers.length === 0
                  ? "bg-blue-200 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {currentStep === QUESTIONS.length - 1 ? "See Results" : "Next"}
              <i className="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
