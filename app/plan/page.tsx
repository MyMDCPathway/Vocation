"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { isComplete, summarize, type IntakeAnswers } from "@/app/lib/intake";
import { clearIntake, loadIntake } from "@/app/lib/intakeStorage";
import { savePending } from "@/app/lib/pendingSaveStorage";
import { resolveTracks } from "@/app/lib/planTracks";
import { TRACK_BADGES, type PlanTrack, type ResolvedTracks } from "@/app/lib/planTypes";
import { isOpenSchool, type SchoolRef } from "@/app/lib/schoolRef";
import type { PathwayData, PathwayOption } from "@/app/lib/types";
import { estimatePlanCost, formatCostRangeShort } from "@/app/lib/planCost";
import { PathwayFlow } from "@/app/components/plan/PathwayFlow";
import { CostPanel } from "@/app/components/plan/CostPanel";
import { ConfidenceBanner } from "@/app/components/plan/ConfidenceBanner";
import { LocalPayPanel } from "@/app/components/plan/LocalPayPanel";

type SaveState = "idle" | "saving" | "saved" | "error";

// The payoff screen: the same career, planned up to three ways.
//
// Two provenances reach this page and the difference is shown, not hidden:
//
//   catalog  Florida schools whose entire program list we scraped. The prompt
//            could only pick from real programs.
//   ai       Everywhere else. The model proposed programs and the URLs it
//            thinks they live at, and the server FETCHED those URLs before
//            this page rendered. A step whose page 404s says so.
//
// Each track calls /api/generate-pathway once, which is what keeps
// canonicalization, all three cache layers, and rate limiting intact.

type TrackState =
  | { status: "pending" }
  | { status: "done"; data: PathwayData; selected: number }
  | { status: "error"; message: string };

export default function PlanPage() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();

  const [answers, setAnswers] = useState<IntakeAnswers | null>(null);
  const [schools, setSchools] = useState<SchoolRef[] | null>(null);
  const [states, setStates] = useState<Record<string, TrackState>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});

  useEffect(() => {
    const stored = loadIntake();
    if (!isComplete(stored)) {
      router.replace("/");
      return;
    }
    setAnswers(stored);
  }, [router]);

  // --- Find the schools ------------------------------------------------------

  useEffect(() => {
    if (!answers) return;
    let cancelled = false;

    // The schools step already ran this exact query and carried the result
    // forward. Repeating it would spend a second Gemini call and add seconds
    // to a screen the student is already waiting on. Only an intake restored
    // from before that field existed needs the fetch.
    if (answers.discoveredSchools?.length) {
      setSchools(answers.discoveredSchools);
      return;
    }

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
            latitude: answers.location?.latitude,
            longitude: answers.location?.longitude,
            // Decides whether this returns universities, union halls, or a
            // recruiter. Without it every route defaults to degree-shaped.
            routeArchetype: answers.career?.routeArchetype,
          }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
        if (!cancelled) setSchools(body.schools ?? []);
      } catch (err: any) {
        if (!cancelled) setFatal(err.message || "Something went wrong.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [answers]);

  // Track resolution is pure now — /api/find-schools already returned schools
  // relevant to this career, so there's nothing left that needs a catalog.
  const resolved: ResolvedTracks | null = useMemo(
    () => (answers && schools ? resolveTracks(answers, schools) : null),
    [answers, schools]
  );

  useEffect(() => {
    if (resolved && !activeId && resolved.tracks.length) {
      setActiveId(resolved.tracks[0].school.id);
    }
  }, [resolved, activeId]);

  // --- Generate one pathway per track ---------------------------------------

  const career = answers?.career?.resolved ?? "";

  const generate = useCallback(
    async (track: PlanTrack) => {
      const id = track.school.id;
      setStates((current) => ({ ...current, [id]: { status: "pending" } }));

      try {
        const response = await fetch("/api/generate-pathway", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            career,
            school: id,
            // An AI-discovered school exists in no table the server ships, so
            // the record travels with the request or the route can't plan it.
            schoolRef: isOpenSchool(id) ? track.school : undefined,
            // Without this an apprenticeship plan comes back as a degree
            // ladder, undoing the classification two steps earlier.
            routeArchetype: answers?.career?.routeArchetype,
          }),
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);

        const data: PathwayData =
          "pathways" in body
            ? body
            : {
                title: body.title ?? career,
                pathways: [
                  { title: body.title ?? career, isPrimary: true, steps: body.steps ?? [] },
                ],
              };

        const primary = data.pathways.findIndex((p) => p.isPrimary);
        setStates((current) => ({
          ...current,
          [id]: { status: "done", data, selected: primary >= 0 ? primary : 0 },
        }));
      } catch (err: any) {
        setStates((current) => ({
          ...current,
          [id]: { status: "error", message: err.message || "Couldn't generate this route." },
        }));
      }
    },
    [career, answers?.career?.routeArchetype]
  );

  useEffect(() => {
    if (!resolved || !career) return;
    resolved.tracks.forEach((track) => void generate(track));
  }, [resolved, career, generate]);

  // --- Derived ---------------------------------------------------------------

  const activeTrack = useMemo(
    () => resolved?.tracks.find((t) => t.school.id === activeId) ?? null,
    [resolved, activeId]
  );
  const activeState = activeId ? states[activeId] : undefined;

  const selectPathway = (id: string, index: number) =>
    setStates((current) => {
      const state = current[id];
      if (state?.status !== "done") return current;
      return { ...current, [id]: { ...state, selected: index } };
    });

  const startOver = () => {
    clearIntake();
    router.push("/");
  };

  // Signed-in saves immediately. Signed-out stashes the exact same payload
  // (pendingSaveStorage.ts) and sends the student to sign up rather than
  // discarding the click — PendingSaveAdopter (Providers.tsx) posts it the
  // moment a session exists, the same "don't throw away what they already
  // did" call intakeAdoption.ts makes for the intake itself.
  const saveTrack = async (track: PlanTrack) => {
    const state = states[track.school.id];
    // Reachable only once the render below has already confirmed answers is
    // non-null (there's no save control before then) — guarded again here
    // because TypeScript can't see across that closure boundary.
    if (state?.status !== "done" || !career || !answers) return;

    const option = state.data.pathways[state.selected];
    const payload = {
      career,
      schoolId: track.school.id,
      schoolName: track.school.name,
      data: {
        title: option.title,
        steps: option.steps,
        confidence: state.data.confidence,
        verification: state.data.verification,
        // The exact school this route was built against, and the answers
        // CostPanel needs — together, enough to re-render the actual
        // generated pathway page later rather than just its step list.
        school: track.school,
        costInputs: {
          incomeBand: answers.incomeBand,
          countryCode: answers.location?.countryCode,
          dependencyFlags: answers.dependencyFlags,
          householdSize: answers.householdSize,
        },
      },
    };

    if (sessionStatus !== "authenticated") {
      savePending(payload);
      router.push("/signup");
      return;
    }

    setSaveStates((current) => ({ ...current, [track.school.id]: "saving" }));
    try {
      const response = await fetch("/api/pathways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error();
      setSaveStates((current) => ({ ...current, [track.school.id]: "saved" }));
    } catch {
      setSaveStates((current) => ({ ...current, [track.school.id]: "error" }));
    }
  };

  if (!answers) return null;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* No border, no nav — the intake has no header either, and the plan
          shouldn't suddenly grow one. Just the wordmark and a way back. */}
      <header className="px-6 pt-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight text-primary">
            Vocation
          </Link>
          <button
            type="button"
            onClick={startOver}
            className="text-sm text-outline transition-colors hover:text-primary"
          >
            Start over
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <p className="text-sm font-medium uppercase tracking-wide text-outline">Your plan</p>
        <h1 className="mt-1 text-3xl font-bold text-primary md:text-4xl">
          Becoming {article(career)} {career}
        </h1>
        <p className="mt-2 text-on-surface-variant">
          From {[answers.location?.city, answers.location?.subdivision].filter(Boolean).join(", ")}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {summarize(answers).map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-surface-lowest px-3 py-1 text-xs text-on-surface-variant ring-1 ring-black/10"
            >
              {chip}
            </span>
          ))}
        </div>

        {/* Above the routes, because every cost below is only meaningful
            against this number — and a payoff shown after the price reads as
            justification rather than information. */}
        <LocalPayPanel
          career={career}
          location={answers.location}
          socCode={answers.career?.socCode}
        />

        {fatal && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="font-semibold text-red-800">We couldn&apos;t build your plan.</p>
            <p className="mt-1 text-sm text-red-700">{fatal}</p>
            <button
              type="button"
              onClick={startOver}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Start over
            </button>
          </div>
        )}

        {resolved?.notes.map((note) => (
          <p
            key={note}
            className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900"
          >
            {note}
          </p>
        ))}

        {!resolved && !fatal && (
          <p className="mt-10 flex items-center gap-3 text-outline">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Finding schools that could get you there…
          </p>
        )}

        {resolved && resolved.tracks.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {resolved.tracks.map((track) => (
              <TrackCard
                key={track.school.id}
                track={track}
                state={states[track.school.id]}
                active={track.school.id === activeId}
                onSelect={() => setActiveId(track.school.id)}
              />
            ))}
          </div>
        )}

        {activeTrack && (
          <section className="mt-12">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-primary">{activeTrack.school.name}</h2>
                <p className="mt-2 max-w-3xl text-on-surface-variant">{activeTrack.why}</p>
              </div>

              {activeState?.status === "done" && (
                <SaveButton
                  state={saveStates[activeTrack.school.id] ?? "idle"}
                  onSave={() => void saveTrack(activeTrack)}
                />
              )}
            </div>

            {activeState?.status === "pending" && (
              <div className="mt-8 flex items-center gap-3 text-outline">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                {isOpenSchool(activeTrack.school.id)
                  ? "Generating this route and checking its program pages…"
                  : "Generating this route…"}
              </div>
            )}

            {activeState?.status === "error" && (
              <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6">
                <p className="font-semibold text-red-800">
                  This route couldn&apos;t be generated.
                </p>
                <p className="mt-1 text-sm text-red-700">{activeState.message}</p>
              </div>
            )}

            {activeState?.status === "done" && (
              <>
                <ConfidenceBanner
                  school={activeTrack.school}
                  verification={activeState.data.verification}
                />

                {activeState.data.pathways.length > 1 && (
                  <nav
                    className="mt-6 flex gap-1 overflow-x-auto border-b border-outline-variant"
                    aria-label="Alternative routes at this school"
                  >
                    {activeState.data.pathways.map((option, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectPathway(activeTrack.school.id, index)}
                        className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                          activeState.selected === index
                            ? "border-primary text-on-surface"
                            : "border-transparent text-outline hover:border-primary/20 hover:text-on-surface-variant"
                        }`}
                      >
                        {option.isPrimary && (
                          <span className="mr-2 rounded bg-surface-container px-2 py-0.5 text-xs text-on-surface">
                            Recommended
                          </span>
                        )}
                        {option.title}
                      </button>
                    ))}
                  </nav>
                )}

                <div className="mt-6">
                  <PathwayFlow
                    pathway={activeState.data.pathways[activeState.selected]}
                    school={activeTrack.school}
                    showStepCosts
                  />
                </div>

                <div className="mt-8">
                  <CostPanel
                    pathway={activeState.data.pathways[activeState.selected]}
                    school={activeTrack.school}
                    incomeBand={answers.incomeBand}
                    countryCode={answers.location?.countryCode}
                    dependencyFlags={answers.dependencyFlags}
                    householdSize={answers.householdSize}
                  />
                </div>
              </>
            )}
          </section>
        )}
      </main>

      <footer className="border-t border-outline-variant bg-surface-lowest">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-outline">
            <Link href="/privacy" className="transition-colors hover:text-primary">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-primary">
              Terms
            </Link>
            <Link href="/team" className="transition-colors hover:text-primary">
              Meet the team
            </Link>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-outline">
            <strong>Disclaimer:</strong> pathways and costs are AI-generated
            estimates. Where we hold a school&apos;s program catalog the programs
            are real; elsewhere they are the model&apos;s best attempt with their
            pages checked. Verify programs, requirements, and prices with an
            academic advisor and the school&apos;s own site before making decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}

function article(career: string): "a" | "an" {
  return /^[aeiou]/i.test(career.trim()) ? "an" : "a";
}

function SaveButton({ state, onSave }: { state: SaveState; onSave: () => void }) {
  if (state === "saved") {
    return (
      <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-sm font-medium text-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
          <path d="m4 12 5 5L20 6" />
        </svg>
        Saved to your pathways
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onSave}
      disabled={state === "saving"}
      className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
    >
      {state === "saving" ? "Saving…" : state === "error" ? "Try saving again" : "Save this plan"}
    </button>
  );
}

function TrackCard({
  track,
  state,
  active,
  onSelect,
}: {
  track: PlanTrack;
  state: TrackState | undefined;
  active: boolean;
  onSelect: () => void;
}) {
  const pathway: PathwayOption | null =
    state?.status === "done" ? state.data.pathways[state.selected] : null;
  const cost = pathway
    ? estimatePlanCost(pathway.steps, track.school.id, track.school.tuition)
    : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`rounded-xl border p-5 text-left transition-all ${
        active
          ? "border-primary bg-surface-lowest ring-2 ring-primary"
          : "border-outline-variant bg-surface-lowest hover:border-primary/40 hover:shadow-md"
      }`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-semibold text-primary">
          {TRACK_BADGES[track.kind]}
        </span>
        {track.alsoCovers.map((kind) => (
          <span
            key={kind}
            className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-medium text-on-surface-variant"
          >
            {TRACK_BADGES[kind]}
          </span>
        ))}
      </div>

      <p className="mt-3 font-bold text-primary">{track.school.name}</p>
      <p className="mt-0.5 text-sm text-outline">
        {typeof track.school.distanceMiles === "number"
          ? `${track.title} · ${Math.round(track.school.distanceMiles)} mi`
          : track.title}
      </p>

      <div className="mt-4 border-t border-outline-variant/50 pt-4">
        {state?.status === "pending" && (
          <span className="text-sm text-outline">Generating…</span>
        )}
        {state?.status === "error" && (
          <span className="text-sm text-red-600">Couldn&apos;t generate</span>
        )}
        {cost && (
          <>
            <p className="text-2xl font-bold text-primary">
              {formatCostRangeShort(cost.total)}
            </p>
            <p className="text-xs text-outline">
              tuition &amp; fees · ~{cost.years} yrs
            </p>
          </>
        )}
      </div>
    </button>
  );
}
