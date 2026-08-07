"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthControls } from "@/app/components/AuthControls";
import { LaborStatsPanel, NoStatsNote } from "@/app/components/LaborStatsPanel";
import { DemandMap } from "@/app/components/shared/DemandMap";
import type { LaborStats } from "@/app/lib/blsStats";
import type { StatsStatus } from "@/app/lib/careerProfileTypes";

// The real destination for "Insights" — a labour-market lookup, not a link
// to the career quiz duplicating the hero's own quiz link.
//
// Everything on this page is US Bureau of Labor Statistics survey data. No
// Gemini call, no AI judgement, nothing to label as an estimate — that's the
// whole point of what "Insights" should mean versus a generated pathway.
// National figures only: resolveAreas({countryCode:"US"}) with no
// subdivision/city cleanly returns national-only areas (see blsAreas.ts), so
// this page needs no location picker of its own. A student who wants their
// own metro's figures already gets them mid-intake, after the location step —
// this page is the quick, no-commitment lookup before that.

const EXAMPLE_CAREERS = ["Registered Nurse", "Electrician", "Software Engineer", "Welder"];

// StatsStatus itself includes "ok" as a member, so pairing it unmodified
// with a literal { status: "ok" } variant breaks TypeScript's discriminated
// union narrowing — Exclude keeps this branch to the genuine non-ok cases.
type ResultState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; stats: LaborStats }
  | { status: Exclude<StatsStatus, "ok">; market: string };

function Wordmark() {
  return <span className="text-lg font-bold tracking-tight text-primary">Vocation</span>;
}

export default function InsightsPage() {
  const [career, setCareer] = useState("");
  const [submittedCareer, setSubmittedCareer] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState>({ status: "idle" });

  async function search(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;

    setSubmittedCareer(trimmed);
    setResult({ status: "loading" });

    try {
      const response = await fetch("/api/labor-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ career: trimmed, countryCode: "US" }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error();

      if (body.status === "ok" && body.stats) {
        setResult({ status: "ok", stats: body.stats });
      } else {
        setResult({ status: body.status ?? "unavailable", market: "the United States" });
      }
    } catch {
      setResult({ status: "unavailable", market: "the United States" });
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 py-4 md:px-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="shrink-0 rounded">
              <Wordmark />
            </Link>
            <nav className="hidden items-center gap-5 sm:flex">
              <Link href="/pathways" className="text-sm font-medium text-primary transition-colors hover:text-primary-container">
                Pathways
              </Link>
              <Link href="/schools" className="text-sm font-medium text-primary transition-colors hover:text-primary-container">
                Schools
              </Link>
              <Link href="/insights" className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80">
                Insights
              </Link>
            </nav>
          </div>
          <AuthControls />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 md:px-16">
        <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-4xl">
          Real labour-market data
        </h1>
        <p className="mt-3 text-on-surface-variant">
          Type a career and see what the US Bureau of Labor Statistics
          actually reports — pay, spread, and where the work is concentrated.
          Nothing here is AI-generated.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void search(career);
          }}
          className="mt-6 flex gap-2"
        >
          <input
            type="text"
            value={career}
            onChange={(e) => setCareer(e.target.value)}
            placeholder="e.g. Registered Nurse"
            className="flex-1 rounded-full border border-outline-variant bg-surface-lowest px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90"
          >
            Look up
          </button>
        </form>

        {result.status === "idle" && (
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLE_CAREERS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setCareer(example);
                  void search(example);
                }}
                className="rounded-full border border-outline-variant bg-surface-lowest px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
              >
                {example}
              </button>
            ))}
          </div>
        )}

        {result.status === "loading" && (
          <p className="mt-10 flex items-center gap-3 text-on-surface-variant">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Checking the Bureau of Labor Statistics…
          </p>
        )}

        {result.status === "ok" && (
          <div className="mt-8 space-y-6">
            <LaborStatsPanel stats={result.stats} />
            <DemandMap career={result.stats.occupation.title} socCode={result.stats.occupation.code} />
            <p className="text-sm text-on-surface-variant">
              Want figures for your own metro instead of the national number?{" "}
              <Link href="/start" className="font-medium text-secondary hover:text-secondary/80">
                Plan a route
              </Link>{" "}
              and tell us where you are.
            </p>
          </div>
        )}

        {(result.status === "unmatched" ||
          result.status === "unavailable" ||
          result.status === "outside-us") && (
          <div className="mt-10 rounded-xl border border-outline-variant bg-surface-lowest p-6">
            <p className="font-semibold text-on-surface">
              No official figures for &quot;{submittedCareer}&quot;
            </p>
            <div className="mt-2">
              <NoStatsNote status={result.status} market={result.market} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
