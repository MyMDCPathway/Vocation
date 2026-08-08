"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Every SOC major group BLS defines, not just the six curated tiles on the
// homepage — the "browse more" destination /page.tsx links to. A visitor
// whose interest isn't STEM/Healthcare/Skilled Trades/Business/Creative
// Arts/Education still has a real door in, not a dead end past the six.

interface Industry {
  slug: string;
  label: string;
  jobCount: number;
}

export function IndustryBrowser() {
  const [industries, setIndustries] = useState<Industry[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/interests")
      .then((r) => r.json())
      .then((body) => {
        if (!cancelled) setIndustries(body.allIndustries ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = industries?.filter((i) =>
    i.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 md:px-16">
      <p className="text-xs font-semibold uppercase tracking-wider text-outline">Browse by interest</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-4xl">
        Every industry
      </h1>
      <p className="mt-3 max-w-2xl text-on-surface-variant">
        The US Bureau of Labor Statistics' full occupational classification —
        22 major groups, covering every job it tracks. Pick one to see its
        real occupations.
      </p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search industries…"
        className="mt-6 w-full rounded-full border border-outline-variant bg-surface-lowest px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      {!industries && (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-container" aria-hidden="true" />
          ))}
        </div>
      )}

      {industries && filtered && filtered.length === 0 && (
        <p className="mt-6 text-on-surface-variant">No industry matches &quot;{query}&quot;.</p>
      )}

      {filtered && filtered.length > 0 && (
        <ul className="mt-6 divide-y divide-outline-variant rounded-xl border border-outline-variant bg-surface-lowest">
          {filtered.map((industry) => (
            <li key={industry.slug}>
              <Link
                href={`/interests/${industry.slug}`}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
              >
                <span>{industry.label}</span>
                <span className="shrink-0 text-xs text-on-surface-variant">
                  {industry.jobCount} occupations
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
