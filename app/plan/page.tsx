"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isComplete, summarize, type IntakeAnswers } from "@/app/lib/intake";
import { clearIntake, loadIntake } from "@/app/lib/intakeStorage";
import { resolveTracks } from "@/app/lib/planTracks";
import { TRACK_BADGES, type PlanTrack, type ResolvedTracks } from "@/app/lib/planTypes";
import { isOpenSchool, type SchoolRef } from "@/app/lib/schoolRef";
import type { PathwayData, PathwayOption } from "@/app/lib/types";
import { estimatePlanCost, formatCostRangeShort } from "@/app/lib/planCost";
import { PathwayFlow } from "@/app/components/plan/PathwayFlow";
import { CostPanel } from "@/app/components/plan/CostPanel";
import { ConfidenceBanner } from "@/app/components/plan/ConfidenceBanner";

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

  const [answers, setAnswers] = useState<IntakeAnswers | null>(null);
  const [schools, setSchools] = useState<SchoolRef[] | null>(null);
  const [states, setStates] = useState<Record<string, TrackState>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);

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

  if (!answers) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-school-600">
            Vocation
          </Link>
          <button
            type="button"
            onClick={startOver}
            className="text-sm text-gray-500 transition-colors hover:text-gray-800"
          >
            Start over
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Your plan</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900 md:text-4xl">
          Becoming {article(career)} {career}
        </h1>
        <p className="mt-2 text-gray-600">
          From {[answers.location?.city, answers.location?.subdivision].filter(Boolean).join(", ")}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {summarize(answers).map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-white px-3 py-1 text-xs text-gray-600 ring-1 ring-gray-200"
            >
              {chip}
            </span>
          ))}
        </div>

        {fatal && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="font-semibold text-red-800">We couldn&apos;t build your plan.</p>
            <p className="mt-1 text-sm text-red-700">{fatal}</p>
            <button
              type="button"
              onClick={startOver}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Start over
            </button>
          </div>
        )}

        {resolved?.notes.map((note) => (
          <p
            key={note}
            className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900"
          >
            {note}
          </p>
        ))}

        {!resolved && !fatal && (
          <p className="mt-10 flex items-center gap-3 text-gray-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-school-600 border-t-transparent" />
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
            <h2 className="text-2xl font-bold text-gray-900">{activeTrack.school.name}</h2>
            <p className="mt-2 max-w-3xl text-gray-600">{activeTrack.why}</p>

            {activeState?.status === "pending" && (
              <div className="mt-8 flex items-center gap-3 text-gray-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-school-600 border-t-transparent" />
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
                    className="mt-6 flex gap-1 overflow-x-auto border-b border-gray-200"
                    aria-label="Alternative routes at this school"
                  >
                    {activeState.data.pathways.map((option, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectPathway(activeTrack.school.id, index)}
                        className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                          activeState.selected === index
                            ? "border-school-500 text-school-600"
                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        }`}
                      >
                        {option.isPrimary && (
                          <span className="mr-2 rounded bg-school-100 px-2 py-0.5 text-xs text-school-700">
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
                  />
                </div>
              </>
            )}
          </section>
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
            <Link href="/privacy" className="transition-colors hover:text-school-600">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-school-600">
              Terms
            </Link>
            <Link href="/team" className="transition-colors hover:text-school-600">
              Meet the team
            </Link>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-gray-500">
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
          ? "border-school-600 bg-white ring-2 ring-school-600"
          : "border-gray-200 bg-white hover:border-school-400 hover:shadow-md"
      }`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-school-100 px-2.5 py-0.5 text-xs font-semibold text-school-700">
          {TRACK_BADGES[track.kind]}
        </span>
        {track.alsoCovers.map((kind) => (
          <span
            key={kind}
            className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
          >
            {TRACK_BADGES[kind]}
          </span>
        ))}
      </div>

      <p className="mt-3 font-bold text-gray-900">{track.school.name}</p>
      <p className="mt-0.5 text-sm text-gray-500">
        {typeof track.school.distanceMiles === "number"
          ? `${track.title} · ${Math.round(track.school.distanceMiles)} mi`
          : track.title}
      </p>

      <div className="mt-4 border-t border-gray-100 pt-4">
        {state?.status === "pending" && (
          <span className="text-sm text-gray-400">Generating…</span>
        )}
        {state?.status === "error" && (
          <span className="text-sm text-red-600">Couldn&apos;t generate</span>
        )}
        {cost && (
          <>
            <p className="text-2xl font-bold text-gray-900">
              {formatCostRangeShort(cost.total)}
            </p>
            <p className="text-xs text-gray-500">
              tuition &amp; fees · ~{cost.years} yrs
            </p>
          </>
        )}
      </div>
    </button>
  );
}
