"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// PRD §2: "Profile Completion... Interests & Goals: tag-based selection for
// industries and specific career goals... Privacy Controls: initial setup for
// profile visibility (Private, Mentors Only, Public)."
//
// Free-text tags, not a fixed taxonomy — same call as the interests/goals
// columns being string[] in prisma/schema.prisma rather than a lookup table.
// A closed list of "industries" would need someone to maintain it and would
// be wrong for anyone whose interest doesn't fit a preset category.
const PRIVACY_OPTIONS = [
  { id: "private", label: "Private", detail: "Only you can see your profile." },
  { id: "mentors_only", label: "Mentors Only", detail: "Visible to mentors you connect with." },
  { id: "public", label: "Public", detail: "Visible to anyone on Vocation." },
] as const;

function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  function addTag() {
    const tag = draft.trim();
    if (tag && !values.includes(tag)) onChange([...values, tag]);
    setDraft("");
  }

  return (
    <div>
      <label className="block text-sm font-medium text-on-surface-variant">{label}</label>
      <div className="mt-1 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded border border-outline-variant bg-surface-lowest px-3 py-2 text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          onClick={addTag}
          className="rounded-md border border-outline-variant px-4 text-sm font-medium text-on-surface hover:bg-surface-container"
        >
          Add
        </button>
      </div>
      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-secondary"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(values.filter((v) => v !== tag))}
                aria-label={`Remove ${tag}`}
                className="text-secondary/70 hover:text-secondary"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState<(typeof PRIVACY_OPTIONS)[number]["id"]>("private");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function finish() {
    setSubmitting(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interests, goals, privacyVisibility: privacy }),
    });
    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-5 py-16">
      <div className="w-full max-w-lg rounded-lg border border-outline-variant bg-surface-lowest p-8 shadow-card">
        <h1 className="text-2xl font-semibold text-primary">Set up your profile</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          A couple of quick things, then you're in.
        </p>

        <div className="mt-6 space-y-6">
          <TagInput
            label="Interests"
            values={interests}
            onChange={setInterests}
            placeholder="e.g. Healthcare, Technology"
          />
          <TagInput
            label="Career goals"
            values={goals}
            onChange={setGoals}
            placeholder="e.g. Become a Registered Nurse"
          />

          <div>
            <p className="text-sm font-medium text-on-surface-variant">Who can see your profile?</p>
            <div className="mt-2 space-y-2">
              {PRIVACY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPrivacy(option.id)}
                  aria-pressed={privacy === option.id}
                  className={`w-full rounded-md border p-3 text-left transition-colors ${
                    privacy === option.id
                      ? "border-secondary bg-secondary/10"
                      : "border-outline-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="block text-sm font-semibold text-on-surface">{option.label}</span>
                  <span className="block text-xs text-on-surface-variant">{option.detail}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={finish}
            disabled={submitting}
            className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Finish setup"}
          </button>
        </div>
      </div>
    </div>
  );
}
