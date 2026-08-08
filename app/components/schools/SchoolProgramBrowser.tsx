"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadIntake, saveIntake } from "@/app/lib/intakeStorage";

// "What do you want to study at [School]?" — the school-first flow's second
// screen. Search box with the school's own real program catalog underneath
// it, exactly like the plan asked: no separate "search up a career" page
// that throws away the school you just picked.
//
// A school with no scraped catalog gets its own real site links instead of
// a fabricated program list (Rule 1) — see /api/schools/[id]/programs.
//
// Picking a program moves to a third screen: the real occupations O*NET's
// CIP-SOC crosswalk links that program to (/api/program-careers). A program
// name that doesn't confidently match anything says so honestly rather than
// guessing — see programCareers.ts's MATCH_FLOOR.

interface Program {
  name: string;
  url: string;
  level: string | null;
}

interface Resource {
  label: string;
  url: string;
}

interface BrowserState {
  status: "loading" | "ok" | "error";
  schoolName: string;
  hasCatalog: boolean;
  programs: Program[];
  resources: Resource[];
}

interface Career {
  code: string;
  title: string;
}

interface CareersState {
  status: "loading" | "ok" | "no-match" | "error";
  matchedTitle: string;
  careers: Career[];
}

const LEVEL_LABELS: Record<string, string> = {
  certificate: "Certificate",
  associate: "Associate",
  bachelor: "Bachelor's",
  graduate: "Graduate",
};

export function SchoolProgramBrowser({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<BrowserState>({
    status: "loading",
    schoolName: "",
    hasCatalog: false,
    programs: [],
    resources: [],
  });

  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [careersState, setCareersState] = useState<CareersState | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, status: "loading" }));

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/schools/${schoolId}/programs?${params.toString()}`);
        const body = await response.json();
        if (!response.ok) throw new Error();
        if (!cancelled) {
          setState({
            status: "ok",
            schoolName: body.schoolName,
            hasCatalog: body.hasCatalog,
            programs: body.programs ?? [],
            resources: body.resources ?? [],
          });
        }
      } catch {
        if (!cancelled) setState((s) => ({ ...s, status: "error" }));
      }
    }, query ? 250 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [schoolId, query]);

  async function selectProgram(program: Program) {
    setSelectedProgram(program);
    setCareersState({ status: "loading", matchedTitle: "", careers: [] });
    try {
      const response = await fetch(`/api/program-careers?program=${encodeURIComponent(program.name)}`);
      const body = await response.json();
      if (!response.ok) throw new Error();
      if (!body.match) {
        setCareersState({ status: "no-match", matchedTitle: "", careers: [] });
      } else {
        setCareersState({ status: "ok", matchedTitle: body.match.cipTitle, careers: body.careers ?? [] });
      }
    } catch {
      setCareersState({ status: "error", matchedTitle: "", careers: [] });
    }
  }

  function planPathway(careerTitle: string) {
    saveIntake({ ...loadIntake(), career: { raw: careerTitle, resolved: careerTitle } });
    router.push("/start");
  }

  if (selectedProgram) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-10 md:px-16">
        <button
          type="button"
          onClick={() => {
            setSelectedProgram(null);
            setCareersState(null);
          }}
          className="text-sm font-medium text-secondary hover:text-secondary/80"
        >
          ← Back to programs
        </button>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-outline">
          {selectedProgram.name}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-4xl">
          Jobs this degree leads to
        </h1>

        {careersState?.status === "loading" && (
          <div className="mt-6 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-container" aria-hidden="true" />
            ))}
          </div>
        )}

        {careersState?.status === "error" && (
          <p className="mt-6 rounded-lg border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
            Couldn&apos;t look up careers for this program. Try again in a moment.
          </p>
        )}

        {careersState?.status === "no-match" && (
          <div className="mt-6 rounded-xl border border-outline-variant bg-surface-lowest p-6">
            <p className="text-on-surface-variant">
              We couldn&apos;t confidently match &quot;{selectedProgram.name}&quot; to a
              real occupation list, so we&apos;re not guessing.
            </p>
            <a
              href={selectedProgram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-medium text-secondary hover:text-secondary/80"
            >
              View the program page instead ↗
            </a>
          </div>
        )}

        {careersState?.status === "ok" && (
          <>
            <p className="mt-3 max-w-2xl text-on-surface-variant">
              Real occupations the US Bureau of Labor Statistics and O*NET
              link to this field of study. Pick one to start a pathway.
            </p>
            <ul className="mt-6 divide-y divide-outline-variant rounded-xl border border-outline-variant bg-surface-lowest">
              {careersState.careers.map((career) => (
                <li key={career.code}>
                  <button
                    type="button"
                    onClick={() => planPathway(career.title)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
                  >
                    {career.title}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-secondary"
                    >
                      <path d="M5 12h13" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
            <a
              href={selectedProgram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-medium text-secondary hover:text-secondary/80"
            >
              View the program page ↗
            </a>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 md:px-16">
      <p className="text-xs font-semibold uppercase tracking-wider text-outline">
        {state.schoolName || " "}
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-4xl">
        What do you want to study?
      </h1>
      <p className="mt-3 max-w-2xl text-on-surface-variant">
        {state.status === "ok" && state.hasCatalog
          ? "This school's own real program list — search it, or browse everything below. Pick one to see the jobs it leads to."
          : "We don't hold a scraped program list for this school. Here are its own real pages instead."}
      </p>

      {state.hasCatalog && (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search programs…"
          className="mt-6 w-full rounded-full border border-outline-variant bg-surface-lowest px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      )}

      {state.status === "loading" && (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-container" aria-hidden="true" />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <p className="mt-6 rounded-lg border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
          Couldn&apos;t load this school&apos;s programs. Try again in a moment.
        </p>
      )}

      {state.status === "ok" && state.hasCatalog && state.programs.length === 0 && (
        <p className="mt-6 text-on-surface-variant">No programs match &quot;{query}&quot;.</p>
      )}

      {state.status === "ok" && state.hasCatalog && state.programs.length > 0 && (
        <ul className="mt-6 divide-y divide-outline-variant rounded-xl border border-outline-variant bg-surface-lowest">
          {state.programs.map((program) => (
            <li key={program.url}>
              <button
                type="button"
                onClick={() => selectProgram(program)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
              >
                <span>{program.name}</span>
                {program.level && (
                  <span className="shrink-0 rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-semibold text-on-surface-variant">
                    {LEVEL_LABELS[program.level] ?? program.level}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {state.status === "ok" && !state.hasCatalog && (
        <ul className="mt-6 divide-y divide-outline-variant rounded-xl border border-outline-variant bg-surface-lowest">
          {state.resources.map((resource) => (
            <li key={resource.url}>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
              >
                {resource.label} ↗
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
