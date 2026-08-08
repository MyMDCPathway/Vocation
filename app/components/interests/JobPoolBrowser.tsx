"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadIntake, saveIntake } from "@/app/lib/intakeStorage";

// One interest's (or, from the browse-all page, one raw SOC group's) real
// job pool, from /api/interests/[slug]. Picking a job seeds the intake and
// routes to /start — the same seed-then-route planPathway() pattern
// career-discovery/page.tsx uses for its quiz results, so a job picked here
// lands exactly the way a quiz result does: on the job summary, not asked
// the career question again.

interface Job {
  code: string;
  title: string;
}

interface PoolState {
  status: "loading" | "ok" | "not-found" | "error";
  label: string;
  description: string;
  jobs: Job[];
  total: number;
}

export function JobPoolBrowser({ slug }: { slug: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<PoolState>({
    status: "loading",
    label: "",
    description: "",
    jobs: [],
    total: 0,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, status: "loading" }));

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    params.set("limit", "200");

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/interests/${slug}?${params.toString()}`);
        if (response.status === 404) {
          if (!cancelled) setState((s) => ({ ...s, status: "not-found" }));
          return;
        }
        const body = await response.json();
        if (!response.ok) throw new Error();
        if (!cancelled) {
          setState({
            status: "ok",
            label: body.label,
            description: body.description,
            jobs: body.jobs ?? [],
            total: body.total ?? 0,
          });
        }
      } catch {
        if (!cancelled) setState((s) => ({ ...s, status: "error" }));
      }
    }, query ? 250 : 0); // debounce typing, not the initial load

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [slug, query]);

  function planPathway(title: string) {
    saveIntake({ ...loadIntake(), career: { raw: title, resolved: title } });
    router.push("/start");
  }

  if (state.status === "not-found") {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-16 text-center md:px-16">
        <p className="text-lg font-semibold text-on-surface">We don&apos;t know that interest.</p>
        <Link href="/interests" className="mt-3 inline-block text-sm font-medium text-secondary hover:text-secondary/80">
          Browse every industry
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 md:px-16">
      <p className="text-xs font-semibold uppercase tracking-wider text-outline">Browse by interest</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-4xl">
        {state.label || " "}
      </h1>
      {state.description && (
        <p className="mt-3 max-w-2xl text-on-surface-variant">{state.description}</p>
      )}
      <p className="mt-1 text-sm text-on-surface-variant">
        {state.total} real occupations, from the US Bureau of Labor Statistics&apos; own
        classification. Pick one to start a pathway.
      </p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search this list…"
        className="mt-6 w-full rounded-full border border-outline-variant bg-surface-lowest px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      {state.status === "loading" && (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-container" aria-hidden="true" />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <p className="mt-6 rounded-lg border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
          Couldn&apos;t load this list. Try again in a moment.
        </p>
      )}

      {state.status === "ok" && state.jobs.length === 0 && (
        <p className="mt-6 text-on-surface-variant">No jobs in this list match &quot;{query}&quot;.</p>
      )}

      {state.status === "ok" && state.jobs.length > 0 && (
        <ul className="mt-6 divide-y divide-outline-variant rounded-xl border border-outline-variant bg-surface-lowest">
          {state.jobs.map((job) => (
            <li key={job.code}>
              <button
                type="button"
                onClick={() => planPathway(job.title)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
              >
                {job.title}
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
      )}
    </div>
  );
}
