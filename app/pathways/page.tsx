"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AuthControls } from "@/app/components/AuthControls";
import type { SavedPathwayData } from "@/app/lib/types";

// The saved-plan collection. Nav "Pathways" points here now — not /start,
// which is the intake wizard's route and has nothing to do with a
// collection. This is what "Pathways" should have always meant: what YOU
// saved, not a door into asking the question again.

interface SavedPathwayRow {
  id: string;
  career: string;
  schoolId: string;
  schoolName: string;
  data: SavedPathwayData;
  notes: string | null;
  archived: boolean;
  updatedAt: string;
}

function Wordmark() {
  return <span className="text-lg font-bold tracking-tight text-primary">Vocation</span>;
}

function SignedOutPrompt() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <h1 className="text-2xl font-bold text-primary">Your saved pathways live here</h1>
      <p className="mt-3 text-on-surface-variant">
        Plan a route on any career, save the one that fits, and come back to
        it any time — edit the steps, add a note, or start over. Saving needs
        an account so nothing you build gets lost with the tab.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/signup"
          className="rounded-full bg-secondary px-5 py-2.5 text-sm font-medium text-on-secondary transition-colors hover:bg-secondary/90"
        >
          Sign up
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-outline-variant px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-surface-container"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <h1 className="text-2xl font-bold text-primary">No saved pathways yet</h1>
      <p className="mt-3 text-on-surface-variant">
        Plan a route on any career, then save the option that fits — it'll
        show up here, editable any time.
      </p>
      <Link
        href="/start"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90"
      >
        Plan a route
      </Link>
    </div>
  );
}

function PathwayCard({ pathway }: { pathway: SavedPathwayRow }) {
  const stepCount = pathway.data.steps.length;
  return (
    <Link
      href={`/pathways/${pathway.id}`}
      className="flex flex-col rounded-xl bg-surface-lowest p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <span className="inline-flex w-fit items-center rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-on-primary">
        {pathway.career}
      </span>
      <p className="mt-3 text-lg font-semibold text-on-surface">{pathway.data.title}</p>
      <p className="mt-1 text-sm text-on-surface-variant">{pathway.schoolName}</p>
      <p className="mt-3 text-xs text-outline">
        {stepCount} step{stepCount === 1 ? "" : "s"} ·{" "}
        {pathway.data.confidence === "catalog" ? "Full catalog" : "AI-sourced"}
      </p>
    </Link>
  );
}

export default function PathwaysPage() {
  const { status } = useSession();
  const [pathways, setPathways] = useState<SavedPathwayRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/pathways");
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Couldn't load your pathways.");
        if (!cancelled) setPathways(body.pathways ?? []);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Couldn't load your pathways.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 py-4 md:px-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="shrink-0 rounded">
              <Wordmark />
            </Link>
            <nav className="hidden items-center gap-5 sm:flex">
              <Link href="/pathways" className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80">
                Pathways
              </Link>
              <Link href="/schools" className="text-sm font-medium text-primary transition-colors hover:text-primary-container">
                Schools
              </Link>
              <Link href="/insights" className="text-sm font-medium text-primary transition-colors hover:text-primary-container">
                Insights
              </Link>
            </nav>
          </div>
          <AuthControls />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-10 md:px-16">
        {status === "loading" ? null : status !== "authenticated" ? (
          <SignedOutPrompt />
        ) : error ? (
          <p className="mt-10 rounded-lg border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
            {error}
          </p>
        ) : pathways === null ? (
          <p className="mt-10 text-on-surface-variant">Loading your pathways…</p>
        ) : pathways.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              Your pathways
            </h1>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pathways.map((pathway) => (
                <PathwayCard key={pathway.id} pathway={pathway} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
