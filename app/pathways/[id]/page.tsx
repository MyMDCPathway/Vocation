"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { icons } from "@/app/lib/icons";
import type { PathwayOption, PathwayStep, SavedPathwayData } from "@/app/lib/types";
import { PathwayFlow } from "@/app/components/plan/PathwayFlow";
import { ConfidenceBanner } from "@/app/components/plan/ConfidenceBanner";
import { CostPanel } from "@/app/components/plan/CostPanel";

// A saved plan: the actual generated pathway page, saved — not just its step
// list. A row saved with `data.school` (every row saved since this existed)
// gets the real preview below: the same PathwayFlow timeline, confidence
// banner, and cost breakdown /plan showed when it was generated, live-synced
// to whatever editing below has done to the steps. A row saved before this
// existed has no `data.school` and falls back to the plain step list that's
// all this page has ever rendered — never a broken or half-populated preview.
//
// Reorder, remove, annotate, reset-to-original — all real, all wired to
// /api/pathways/[id], and unchanged by any of the above: the same StepCard
// editor works on the same draftSteps regardless of which preview sits above
// it. Deliberately NOT here: adding a new step. A student typing in a
// program name that sounds plausible is exactly the failure §2 of the whole
// app exists to prevent (HANDOFF's core insight: constrain the model's
// output space, don't trust free text). Removing and reordering only ever
// subtract from or reshuffle what the generator already verified — never
// introduces anything new.

interface SavedPathwayRow {
  id: string;
  career: string;
  schoolId: string;
  schoolName: string;
  data: SavedPathwayData;
  edits: { steps: PathwayStep[] } | null;
  notes: string | null;
  archived: boolean;
  updatedAt: string;
}

function Wordmark() {
  return <span className="text-lg font-bold tracking-tight text-primary">Vocation</span>;
}

function stepsEqual(a: PathwayStep[], b: PathwayStep[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function StepCard({
  step,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  step: PathwayStep;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl bg-surface-lowest p-5 shadow-card">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
        {icons[step.type]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-outline">
          {step.level || step.type}
        </p>
        <p className="mt-0.5 font-semibold text-on-surface">{step.name}</p>
        {step.description && (
          <p className="mt-1 text-sm text-on-surface-variant">{step.description}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          aria-label="Move step up"
          className="rounded p-1 text-outline transition-colors hover:bg-surface-container hover:text-primary disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          aria-label="Move step down"
          className="rounded p-1 text-outline transition-colors hover:bg-surface-container hover:text-primary disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove step"
          className="rounded p-1 text-outline transition-colors hover:bg-error-container/40 hover:text-error"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function SavedPathwayPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { status } = useSession();

  const [pathway, setPathway] = useState<SavedPathwayRow | null>(null);
  const [draftSteps, setDraftSteps] = useState<PathwayStep[] | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/pathways");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/pathways/${params.id}`);
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Couldn't load this pathway.");
        if (cancelled) return;
        setPathway(body.pathway);
        setDraftSteps(body.pathway.edits?.steps ?? body.pathway.data.steps);
        setNotesDraft(body.pathway.notes ?? "");
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Couldn't load this pathway.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, params.id]);

  async function patch(body: Record<string, unknown>) {
    const response = await fetch(`/api/pathways/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "That change didn't save.");
    return result.pathway as SavedPathwayRow;
  }

  function moveStep(index: number, direction: -1 | 1) {
    setDraftSteps((current) => {
      if (!current) return current;
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeStep(index: number) {
    setDraftSteps((current) => (current ? current.filter((_, i) => i !== index) : current));
  }

  async function saveSteps() {
    if (!pathway || !draftSteps) return;
    setSaving(true);
    setError(null);
    try {
      // Back to exactly the original order/contents clears `edits` entirely
      // rather than storing a redundant copy of `data` — a saved plan with
      // no edits should read as "unedited", not "edited to match itself".
      const isOriginal = stepsEqual(draftSteps, pathway.data.steps);
      const updated = await patch({ edits: isOriginal ? null : { steps: draftSteps } });
      setPathway(updated);
      setSavedMessage("Saved.");
    } catch (err: any) {
      setError(err.message || "That change didn't save.");
    } finally {
      setSaving(false);
    }
  }

  async function resetToOriginal() {
    if (!pathway) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await patch({ edits: null });
      setPathway(updated);
      setDraftSteps(updated.data.steps);
      setSavedMessage("Reset to the original route.");
    } catch (err: any) {
      setError(err.message || "Couldn't reset this pathway.");
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    setSaving(true);
    setError(null);
    try {
      const updated = await patch({ notes: notesDraft.trim() || null });
      setPathway(updated);
      setSavedMessage("Note saved.");
    } catch (err: any) {
      setError(err.message || "That note didn't save.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleArchived() {
    if (!pathway) return;
    setSaving(true);
    try {
      const updated = await patch({ archived: !pathway.archived });
      setPathway(updated);
    } catch (err: any) {
      setError(err.message || "Couldn't update this pathway.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePathway() {
    if (!confirm("Delete this saved pathway? This can't be undone.")) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/pathways/${params.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Couldn't delete this pathway.");
      router.push("/pathways");
    } catch (err: any) {
      setError(err.message || "Couldn't delete this pathway.");
      setSaving(false);
    }
  }

  const hasEdits = pathway && draftSteps ? !stepsEqual(draftSteps, pathway.data.steps) : false;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-outline-variant bg-surface px-5 py-4 md:px-16">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight text-primary">
            <Wordmark />
          </Link>
          <Link href="/pathways" className="text-sm text-outline transition-colors hover:text-primary">
            ← Your pathways
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 md:px-16">
        {error && (
          <p className="mb-6 rounded-lg border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
            {error}
          </p>
        )}

        {!pathway || !draftSteps ? (
          <p className="text-on-surface-variant">Loading…</p>
        ) : (
          <>
            <span className="inline-flex w-fit items-center rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-on-primary">
              {pathway.career}
            </span>
            <h1 className="mt-3 text-2xl font-bold text-primary sm:text-3xl">{pathway.data.title}</h1>
            <p className="mt-1 text-on-surface-variant">{pathway.schoolName}</p>

            {pathway.data.school && (
              <>
                <ConfidenceBanner
                  school={pathway.data.school}
                  verification={pathway.data.verification}
                />
                <div className="mt-6">
                  <PathwayFlow
                    pathway={
                      {
                        title: pathway.data.title,
                        isPrimary: true,
                        steps: draftSteps,
                      } satisfies PathwayOption
                    }
                    school={pathway.data.school}
                    showStepCosts
                  />
                </div>
                {draftSteps.length > 0 && (
                  <div className="mt-8">
                    <CostPanel
                      pathway={{ title: pathway.data.title, isPrimary: true, steps: draftSteps }}
                      school={pathway.data.school}
                      incomeBand={pathway.data.costInputs?.incomeBand}
                      countryCode={pathway.data.costInputs?.countryCode}
                      dependencyFlags={pathway.data.costInputs?.dependencyFlags}
                      householdSize={pathway.data.costInputs?.householdSize}
                    />
                  </div>
                )}
              </>
            )}

            <h2 className="mt-10 text-lg font-semibold text-primary">Edit this route</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Reorder or remove steps — the route above updates as you do.
            </p>
            <div className="mt-4 space-y-4">
              {draftSteps.map((step, index) => (
                <StepCard
                  key={index}
                  step={step}
                  index={index}
                  total={draftSteps.length}
                  onMoveUp={() => moveStep(index, -1)}
                  onMoveDown={() => moveStep(index, 1)}
                  onRemove={() => removeStep(index)}
                />
              ))}
              {draftSteps.length === 0 && (
                <p className="rounded-lg border border-dashed border-outline-variant px-4 py-6 text-center text-sm text-on-surface-variant">
                  Every step has been removed. Reset to bring the original route back.
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveSteps}
                disabled={saving || !hasEdits}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                Save changes
              </button>
              {(hasEdits || pathway.edits) && (
                <button
                  type="button"
                  onClick={resetToOriginal}
                  disabled={saving}
                  className="rounded-full border border-outline-variant px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-container disabled:opacity-40"
                >
                  Reset to original
                </button>
              )}
              {savedMessage && <span className="text-sm text-on-surface-variant">{savedMessage}</span>}
            </div>

            <div className="mt-10 rounded-xl bg-surface-lowest p-5 shadow-card">
              <label htmlFor="notes" className="text-sm font-semibold text-on-surface">
                Your notes
              </label>
              <textarea
                id="notes"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={4}
                placeholder="Deadlines, questions for an advisor, anything worth remembering…"
                className="mt-2 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="button"
                onClick={saveNotes}
                disabled={saving || notesDraft === (pathway.notes ?? "")}
                className="mt-3 rounded-full border border-outline-variant px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-container disabled:opacity-40"
              >
                Save note
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-outline-variant pt-6">
              <button
                type="button"
                onClick={toggleArchived}
                disabled={saving}
                className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
              >
                {pathway.archived ? "Unarchive" : "Archive"}
              </button>
              <button
                type="button"
                onClick={deletePathway}
                disabled={saving}
                className="text-sm font-medium text-error transition-colors hover:text-error/80"
              >
                Delete
              </button>
            </div>

            <p className="mt-8 text-xs leading-relaxed text-outline">
              <strong>Heads up:</strong> this is a saved snapshot of a
              generated pathway. Confirm program details, deadlines, and
              costs with the school and an academic advisor before acting on
              it.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
