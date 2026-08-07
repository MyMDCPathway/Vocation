"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { SchoolCard } from "@/app/components/schools/SchoolCard";
import type { DirectorySchool, SchoolSortKey } from "@/app/lib/schoolDirectory";
import type { SchoolKind } from "@/app/lib/floridaSchools";
import type { SchoolRef } from "@/app/lib/schoolRef";

// The Schools browser: every Florida school we know, on a map and in a
// sortable grid, with a program search that answers "which schools teach X"
// rather than making a student guess a school name first.
//
// The map is loaded lazily and client-only (ssr: false) — it touches
// `window` at import time (see SchoolMap.tsx's own header), the same reason
// SchoolsStep does this in the intake.
const SchoolMap = dynamic(
  () => import("@/app/components/shared/SchoolMap").then((m) => m.SchoolMap),
  { ssr: false }
);

const SORT_OPTIONS: { key: SchoolSortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "distance", label: "Distance" },
  { key: "earnings", label: "Median earnings" },
  { key: "completion", label: "Completion rate" },
  { key: "price", label: "Lowest net price" },
];

const KIND_OPTIONS: { value: SchoolKind | "all"; label: string }[] = [
  { value: "all", label: "All kinds" },
  { value: "state-college", label: "Florida College System" },
  { value: "public-university", label: "State universities" },
  { value: "private", label: "Private" },
];

interface ScorecardMeta {
  available: boolean;
  fetchedAt: string | null;
  source: string;
  scope: string;
  count: number;
}

interface ProgramSearchResult {
  schoolId: string;
  schoolName: string;
  totalMatches: number;
}

function toSchoolRef(school: DirectorySchool): SchoolRef {
  return {
    id: school.id,
    name: school.name,
    city: school.city,
    subdivision: "Florida",
    countryCode: "US",
    kind: school.kind,
    source: school.hasCatalog ? "catalog" : "ai",
    latitude: school.latitude,
    longitude: school.longitude,
    distanceMiles: school.distanceMiles,
  };
}

export function SchoolsBrowser() {
  const [schools, setSchools] = useState<DirectorySchool[]>([]);
  const [total, setTotal] = useState(0);
  const [scorecardMeta, setScorecardMeta] = useState<ScorecardMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sort, setSort] = useState<SchoolSortKey>("name");
  const [kind, setKind] = useState<SchoolKind | "all">("all");
  const [catalogOnly, setCatalogOnly] = useState(false);
  const [nameQuery, setNameQuery] = useState("");

  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const [programQuery, setProgramQuery] = useState("");
  const [programResults, setProgramResults] = useState<ProgramSearchResult[] | null>(null);
  const [programSearching, setProgramSearching] = useState(false);

  const [focusedId, setFocusedId] = useState<string | null>(null);

  // --- Fetch the directory whenever a filter/sort changes -------------------

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const params = new URLSearchParams();
      // Distance without an origin 400s server-side — fall back to name
      // until "Use my location" actually resolves one.
      params.set("sort", sort === "distance" && !origin ? "name" : sort);
      if (kind !== "all") params.set("kind", kind);
      if (catalogOnly) params.set("catalogOnly", "1");
      if (nameQuery.trim()) params.set("q", nameQuery.trim());
      if (origin) {
        params.set("lat", String(origin.lat));
        params.set("lng", String(origin.lng));
      }
      params.set("limit", "200");

      try {
        const response = await fetch(`/api/schools?${params.toString()}`);
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Couldn't load schools.");
        if (!cancelled) {
          setSchools(body.schools ?? []);
          setTotal(body.total ?? 0);
          setScorecardMeta(body.scorecard ?? null);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Couldn't load schools.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sort, kind, catalogOnly, nameQuery, origin]);

  // --- Program search ---------------------------------------------------

  useEffect(() => {
    const query = programQuery.trim();
    if (query.length < 2) {
      setProgramResults(null);
      return;
    }
    let cancelled = false;
    setProgramSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch("/api/schools/search-programs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const body = await response.json().catch(() => ({}));
        if (!cancelled && response.ok) {
          setProgramResults(
            (body.results ?? []).map((r: any) => ({
              schoolId: r.schoolId,
              schoolName: r.schoolName,
              totalMatches: r.totalMatches,
            }))
          );
        }
      } finally {
        if (!cancelled) setProgramSearching(false);
      }
    }, 300); // debounced — one request per pause in typing, not per keystroke

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [programQuery]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocateError("This browser can't share your location.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude });
        setSort("distance");
        setLocating(false);
      },
      () => {
        setLocateError("Location wasn't shared — pick a sort instead.");
        setLocating(false);
      },
      { timeout: 10_000 }
    );
  }

  // --- Merge program search into the displayed list --------------------

  const programMatchById = useMemo(() => {
    if (!programResults) return null;
    return new Map(programResults.map((r) => [r.schoolId, r.totalMatches]));
  }, [programResults]);

  const displayed = useMemo(() => {
    if (!programMatchById) return schools;
    // A program search narrows to schools that actually teach it, ranked by
    // how many matching programs they offer — search rank by program, not
    // just "does this school appear in the list at all".
    return schools
      .filter((s) => programMatchById.has(s.id))
      .sort((a, b) => (programMatchById.get(b.id) ?? 0) - (programMatchById.get(a.id) ?? 0));
  }, [schools, programMatchById]);

  const mapSchools = useMemo(() => displayed.map(toSchoolRef), [displayed]);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 py-10 md:px-16">
      <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-4xl">
        Every Florida school we know
      </h1>
      <p className="mt-3 max-w-2xl text-on-surface-variant">
        {total || "61"} institutions — state colleges, state universities, and
        SACSCOC-accredited private schools. "Full catalog" schools have a real,
        scraped program list; every other school's plan is generated and its
        program links are verified before you see them.
      </p>

      {scorecardMeta && !scorecardMeta.available && (
        <p className="mt-4 rounded-lg border border-outline-variant bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
          Ranking figures (earnings, completion rate, net price) aren&apos;t
          loaded yet — they come from a real US Dept. of Education dataset
          that hasn&apos;t been fetched in this environment. Distance and
          program search still work fully.
        </p>
      )}

      {/* Filter rail */}
      <div className="mt-8 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-on-surface-variant">Search by name</span>
          <input
            type="text"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder="e.g. Miami Dade"
            className="w-56 rounded-lg border border-outline-variant bg-surface-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-on-surface-variant">Search by program</span>
          <input
            type="text"
            value={programQuery}
            onChange={(e) => setProgramQuery(e.target.value)}
            placeholder="e.g. Nursing"
            className="w-56 rounded-lg border border-outline-variant bg-surface-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-on-surface-variant">Kind</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as SchoolKind | "all")}
            className="rounded-lg border border-outline-variant bg-surface-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {KIND_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-on-surface-variant">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SchoolSortKey)}
            className="rounded-lg border border-outline-variant bg-surface-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 pb-2 text-sm text-on-surface-variant">
          <input
            type="checkbox"
            checked={catalogOnly}
            onChange={(e) => setCatalogOnly(e.target.checked)}
            className="h-4 w-4 rounded border-outline-variant"
          />
          Full catalog only
        </label>

        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="mb-0 rounded-full border border-outline-variant bg-surface-lowest px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-container disabled:opacity-60"
        >
          {locating ? "Locating…" : origin ? "Location set" : "Use my location"}
        </button>
      </div>

      {locateError && <p className="mt-2 text-sm text-error">{locateError}</p>}
      {programSearching && (
        <p className="mt-2 text-sm text-on-surface-variant">Searching programs…</p>
      )}
      {programResults && programResults.length === 0 && !programSearching && (
        <p className="mt-2 text-sm text-on-surface-variant">
          No school in our catalogs teaches a program matching &quot;{programQuery}&quot;.
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-lg border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      {/* Map + grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <SchoolMap
            schools={mapSchools}
            selectedIds={[]}
            focusedId={focusedId}
            onToggle={(school) => setFocusedId(school.id)}
          />
        </div>

        <div>
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-xl bg-surface-container"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <p className="text-on-surface-variant">No schools match these filters.</p>
          ) : (
            <div
              className="grid grid-cols-1 gap-6 sm:grid-cols-2"
              onMouseLeave={() => setFocusedId(null)}
            >
              {displayed.map((school) => (
                <div key={school.id} onMouseEnter={() => setFocusedId(school.id)}>
                  <SchoolCard school={school} programMatchCount={programMatchById?.get(school.id)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
