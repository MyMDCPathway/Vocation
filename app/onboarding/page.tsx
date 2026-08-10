"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ContinueButton, OptionCard, StepShell } from "@/app/components/intake/StepShell";

// PRD §2's "Interests & Goals: tag-based selection" — rebuilt from two
// free-text tag inputs on one screen into its own two-screen picker, each
// backed by real data instead of a blank box:
//
//   1. Interests — the same six curated interests /interests uses on the
//      homepage (real SOC major groups, real job counts).
//   2. Career goals — real BLS occupations drawn from the interests just
//      picked (via /api/interests/[slug]), or BLS's own fastest-growing/
//      most-new-jobs projections if interests were skipped, plus a search
//      box over the full 830-occupation table (/api/occupations) for
//      anything not in the suggested list.
//
// The privacy step is gone. It offered "Private / Mentors Only / Public",
// but nothing on the site renders another user's profile, so all three
// options were inert — the same class of promised-but-missing capability as
// the fabricated mentor panel removed from the pathway redesign. The column
// stays; every save just writes the DB default ("private") so nothing else
// that reads it breaks.

interface CuratedInterest {
  slug: string;
  label: string;
  description: string;
  jobCount: number;
}

interface Occupation {
  code: string;
  title: string;
}

interface GoalSuggestion {
  title: string;
  meta?: string;
}

type Step = "interests" | "goals";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("interests");

  const [interests, setInterests] = useState<CuratedInterest[]>([]);
  const [interestsLoading, setInterestsLoading] = useState(true);
  const [interestsError, setInterestsError] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsSource, setSuggestionsSource] = useState<"interests" | "projections" | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Occupation[]>([]);
  const [searching, setSearching] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/interests");
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error();
        if (!cancelled) setInterests(body.curated ?? []);
      } catch {
        if (!cancelled) {
          setInterestsError("Couldn't load interests — you can still search for career goals on the next screen.");
        }
      } finally {
        if (!cancelled) setInterestsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Suggested goals load once the goals screen opens: real jobs from the
  // interests just picked, or BLS's own projections if none were picked.
  useEffect(() => {
    if (step !== "goals") return;
    let cancelled = false;
    setSuggestionsLoading(true);

    (async () => {
      try {
        if (selectedInterests.length > 0) {
          const perInterest = Math.max(6, Math.ceil(24 / selectedInterests.length));
          const responses = await Promise.all(
            selectedInterests.map((slug) =>
              fetch(`/api/interests/${slug}?limit=${perInterest}`).then((r) => r.json())
            )
          );
          const seen = new Set<string>();
          const merged: GoalSuggestion[] = [];
          for (const body of responses) {
            for (const job of (body.jobs ?? []) as Occupation[]) {
              if (seen.has(job.title)) continue;
              seen.add(job.title);
              merged.push({ title: job.title });
            }
          }
          if (!cancelled) {
            setSuggestions(merged.slice(0, 24));
            setSuggestionsSource("interests");
          }
        } else {
          const response = await fetch("/api/projections");
          const body = await response.json().catch(() => ({}));
          const seen = new Set<string>();
          const merged: GoalSuggestion[] = [];
          for (const row of [...(body.fastestGrowing ?? []), ...(body.mostNewJobs ?? [])]) {
            if (seen.has(row.occupation)) continue;
            seen.add(row.occupation);
            const detail =
              "growthRatePercent" in row
                ? `+${row.growthRatePercent}% projected growth`
                : `${row.newJobs.toLocaleString()} new jobs projected`;
            merged.push({
              title: row.occupation,
              meta: `${money.format(row.medianPay2024)} median · ${detail}`,
            });
          }
          if (!cancelled) {
            setSuggestions(merged.slice(0, 24));
            setSuggestionsSource("projections");
          }
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [step, selectedInterests]);

  // Search across all 830 BLS occupations, debounced — same shape as
  // JobPoolBrowser's search, just unscoped to one interest.
  useEffect(() => {
    if (step !== "goals" || !query.trim()) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/occupations?q=${encodeURIComponent(query.trim())}&limit=10`);
        const body = await response.json().catch(() => ({}));
        if (!cancelled) setSearchResults(body.jobs ?? []);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [step, query]);

  function toggleInterest(slug: string) {
    setSelectedInterests((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  function toggleGoal(title: string) {
    setSelectedGoals((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  }

  async function finish() {
    setSubmitting(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interests: selectedInterests,
        goals: selectedGoals,
        privacyVisibility: "private",
      }),
    });
    router.push("/");
  }

  if (step === "interests") {
    return (
      <StepShell
        stepNumber={1}
        question="What are you interested in?"
        help="Pick as many as fit — we'll suggest real career goals from these next. Skip it and we'll show what's growing fastest instead."
        footer={<ContinueButton onClick={() => setStep("goals")} label="Continue" />}
      >
        {interestsLoading && (
          <div className="grid gap-3 sm:grid-cols-2" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-surface-container" />
            ))}
          </div>
        )}

        {interestsError && !interestsLoading && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {interestsError}
          </p>
        )}

        {!interestsLoading && !interestsError && (
          <div className="grid gap-3 sm:grid-cols-2">
            {interests.map((interest) => (
              <OptionCard
                key={interest.slug}
                label={interest.label}
                detail={interest.description}
                meta={`${interest.jobCount} jobs`}
                selected={selectedInterests.includes(interest.slug)}
                onClick={() => toggleInterest(interest.slug)}
              />
            ))}
          </div>
        )}
      </StepShell>
    );
  }

  return (
    <StepShell
      stepNumber={2}
      question="Any career goals in mind?"
      help={
        suggestionsSource === "interests"
          ? "Picked from what you're interested in — select any that fit, or search for something else."
          : "Nobody picked yet, so here's what's growing fastest right now. Search covers all 830 BLS-tracked occupations."
      }
      onBack={() => setStep("interests")}
      footer={
        <ContinueButton
          onClick={finish}
          disabled={submitting}
          label={submitting ? "Saving…" : "Finish setup"}
        />
      }
    >
      <div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any career — e.g. Registered Nurse"
          className="w-full rounded-full border border-outline-variant bg-surface-lowest px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
        />

        {query.trim() && (
          <div className="mt-2 divide-y divide-outline-variant rounded-lg border border-outline-variant bg-surface-lowest">
            {searching && (
              <p className="px-4 py-3 text-sm text-on-surface-variant">Searching…</p>
            )}
            {!searching && searchResults.length === 0 && (
              <p className="px-4 py-3 text-sm text-on-surface-variant">
                No matches for &quot;{query}&quot;.
              </p>
            )}
            {!searching &&
              searchResults.map((job) => {
                const added = selectedGoals.includes(job.title);
                return (
                  <button
                    key={job.code}
                    type="button"
                    onClick={() => toggleGoal(job.title)}
                    aria-pressed={added}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                      added ? "text-secondary" : "text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    {job.title}
                    <span className="text-xs font-semibold uppercase tracking-wide text-outline">
                      {added ? "Added" : "Add"}
                    </span>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {selectedGoals.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {selectedGoals.map((title) => (
            <span
              key={title}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-secondary"
            >
              {title}
              <button
                type="button"
                onClick={() => toggleGoal(title)}
                aria-label={`Remove ${title}`}
                className="text-secondary/70 hover:text-secondary"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-6">
        {suggestionsLoading && (
          <div className="grid gap-3 sm:grid-cols-2" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-surface-container" />
            ))}
          </div>
        )}

        {!suggestionsLoading && suggestions.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {suggestions.map((suggestion) => (
              <OptionCard
                key={suggestion.title}
                label={suggestion.title}
                meta={suggestion.meta}
                selected={selectedGoals.includes(suggestion.title)}
                onClick={() => toggleGoal(suggestion.title)}
              />
            ))}
          </div>
        )}

        {!suggestionsLoading && suggestions.length === 0 && (
          <p className="text-sm text-on-surface-variant">
            Nothing to suggest right now — search above for a career goal instead.
          </p>
        )}
      </div>
    </StepShell>
  );
}
