"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { IntakeAnswers } from "@/app/lib/intake";
import { distanceMiles } from "@/app/lib/geography";
import { hasUsableCoordinates, type SchoolRef } from "@/app/lib/schoolRef";
import { ContinueButton, StepShell } from "@/app/components/intake/StepShell";
import { SchoolMap } from "@/app/components/intake/SchoolMap";
import { archetypeProfile } from "@/app/lib/routeArchetype";

// Which of these schools do you already have in mind?
//
// Map on the left, list on the right, nearest first. The two are one thing:
// hovering a row lifts its pin and pans to it, clicking either selects, and
// the pin colour says where the school's data came from.
//
// The list is fetched for the student's city AND their career, so it's
// schools that could actually get them there rather than whatever happens to
// be nearby. Two provenances land in the same list and are labelled
// differently, because the difference is real:
//
//   "Full catalog"  We scraped this school's entire program list. Its plan is
//                   built from real programs and cannot contain an invented
//                   degree. Green pin.
//   "AI-sourced"    Everything else. The plan is generated and its program
//                   links are verified by fetching them, which is weaker.
//
// The search box does two jobs. It filters what's loaded as you type, and if
// you're after a school we didn't suggest — Harvard, from Miami — it looks
// that one up by name and adds it. A student who already knows where they
// want to go shouldn't be limited to our eight suggestions.

interface Props {
  answers: IntakeAnswers;
  stepNumber: number;
  stepCount: number;
  onBack: () => void;
  onDone: (picked: SchoolRef[], discovered: SchoolRef[]) => void;
}

function money(school: SchoolRef): string | null {
  const t = school.tuition;
  if (!t || (!t.low && !t.high)) return null;
  const format = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: t.currency || "USD",
      maximumFractionDigits: 0,
    }).format(n);
  return t.low === t.high
    ? `${format(t.high)}/yr`
    : `${format(t.low)} – ${format(t.high)}/yr`;
}

export function SchoolsStep({ answers, stepNumber, stepCount, onBack, onDone }: Props) {
  const [schools, setSchools] = useState<SchoolRef[]>([]);
  const [picked, setPicked] = useState<SchoolRef[]>(answers.desiredSchools ?? []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchNote, setSearchNote] = useState<string | null>(null);

  const rowRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const origin = answers.location;
  // The route decides the vocabulary. Asking a would-be electrician which
  // "schools" they have in mind is the wrong question in the wrong words.
  const profile = archetypeProfile(answers.career?.routeArchetype);

  useEffect(() => {
    let cancelled = false;

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
        if (!response.ok) throw new Error(body.error || "Couldn't find schools.");
        if (!cancelled) setSchools(body.schools ?? []);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Couldn't find schools.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    answers.career?.resolved,
    answers.location?.countryCode,
    answers.location?.subdivision,
    answers.location?.city,
    answers.location?.latitude,
    answers.location?.longitude,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter(
      (school) =>
        school.name.toLowerCase().includes(q) ||
        school.city.toLowerCase().includes(q) ||
        school.subdivision.toLowerCase().includes(q)
    );
  }, [schools, query]);

  const toggle = (school: SchoolRef) =>
    setPicked((current) =>
      current.some((s) => s.id === school.id)
        ? current.filter((s) => s.id !== school.id)
        : [...current, school]
    );

  /** Look up a school we didn't suggest, and fold it into the list. */
  const searchByName = async () => {
    const search = query.trim();
    if (search.length < 3 || searching) return;

    setSearching(true);
    setSearchNote(null);

    try {
      const response = await fetch("/api/school-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: search, career: answers.career?.resolved }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Couldn't look that up.");

      const matches: SchoolRef[] = body.matches ?? [];
      if (!matches.length) {
        setSearchNote(`We couldn't find a school called "${search}".`);
        return;
      }

      // The lookup route doesn't know where the student is, so it returns no
      // distance. Measure here, where we do — otherwise a searched-for school
      // sorts to the bottom of a nearest-first list regardless of where it is.
      const measured = matches.map((school) => ({
        ...school,
        distanceMiles:
          typeof origin?.latitude === "number" &&
          typeof origin?.longitude === "number" &&
          hasUsableCoordinates(school)
            ? distanceMiles(
                { lat: origin.latitude, lng: origin.longitude },
                { lat: school.latitude, lng: school.longitude }
              )
            : null,
      }));

      setSchools((current) => {
        const known = new Set(current.map((s) => s.id));
        const additions = measured.filter((s) => !known.has(s.id));
        if (!additions.length) {
          setSearchNote("That one's already in the list.");
          return current;
        }
        return [...current, ...additions].sort(
          (a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity)
        );
      });

      // Clearing the query is what makes the new school visible — leaving it
      // filtered to the search text would hide everything else and make it
      // look like the list was replaced rather than added to.
      setQuery("");
      setFocusedId(measured[0].id);
      rowRefs.current
        .get(measured[0].id)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } catch (err: any) {
      setSearchNote(err.message || "Couldn't look that up.");
    } finally {
      setSearching(false);
    }
  };

  const canSearchByName = query.trim().length >= 3;

  return (
    <StepShell
      stepNumber={stepNumber}
      stepCount={stepCount}
      question={profile.providerQuestion}
      help={`${profile.providerHelp} Pick any, or skip and we'll choose for you.`}
      onBack={onBack}
      footer={
        <ContinueButton
          onClick={() => onDone(picked, schools)}
          label={picked.length ? `Continue with ${picked.length}` : "Continue"}
        />
      }
      wide
    >
      {loading && (
        <p className="flex items-center gap-3 text-gray-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-school-600 border-t-transparent" />
          Finding {profile.providerNounPlural} near {answers.location?.city}…
        </p>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error} You can continue without picking one — we&apos;ll still work out
          routes for you.
        </div>
      )}

      {!loading && schools.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <SchoolMap
            schools={filtered}
            selectedIds={picked.map((s) => s.id)}
            focusedId={focusedId}
            onToggle={toggle}
            origin={origin}
          />

          <div className="flex flex-col">
            <label htmlFor="school-search" className="sr-only">
              Search schools
            </label>
            <div className="flex gap-2">
              <input
                id="school-search"
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchNote(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (filtered.length === 0) searchByName();
                  }
                }}
                placeholder={`Search, or name any ${profile.providerNoun}…`}
                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-school-500 focus:outline-none focus:ring-2 focus:ring-school-500"
              />
              {canSearchByName && (
                <button
                  type="button"
                  onClick={searchByName}
                  disabled={searching}
                  className="shrink-0 rounded-lg bg-school-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-school-700 disabled:bg-gray-300"
                >
                  {searching ? "Looking…" : "Find it"}
                </button>
              )}
            </div>

            {searchNote && <p className="mt-2 text-sm text-amber-700">{searchNote}</p>}

            {filtered.length === 0 && !searchNote && (
              <p className="mt-3 text-sm text-gray-500">
                None of the suggestions match &ldquo;{query}&rdquo;.{" "}
                {canSearchByName
                  ? "Press Find it to look it up anywhere in the world."
                  : "Type a bit more to search for it by name."}
              </p>
            )}

            <div className="mt-3 max-h-[500px] flex-1 space-y-3 overflow-y-auto pr-1">
              {filtered.map((school) => {
                const selected = picked.some((s) => s.id === school.id);
                const price = money(school);
                return (
                  <button
                    key={school.id}
                    ref={(node) => {
                      if (node) rowRefs.current.set(school.id, node);
                      else rowRefs.current.delete(school.id);
                    }}
                    type="button"
                    onClick={() => toggle(school)}
                    onMouseEnter={() => setFocusedId(school.id)}
                    onFocus={() => setFocusedId(school.id)}
                    onMouseLeave={() => setFocusedId(null)}
                    aria-pressed={selected}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      selected
                        ? "border-school-600 bg-school-50 ring-2 ring-school-600"
                        : "border-gray-200 bg-white hover:border-school-400 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-gray-900">{school.name}</span>
                      <span
                        aria-hidden="true"
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                          school.source === "catalog" ? "bg-green-600" : "bg-school-600"
                        }`}
                      />
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {[school.city, school.subdivision].filter(Boolean).join(", ")}
                      {typeof school.distanceMiles === "number" &&
                        ` · ${Math.round(school.distanceMiles)} mi`}
                    </p>
                    {price && (
                      <p className="mt-1 text-sm font-medium text-gray-700">{price}</p>
                    )}
                    {school.note && (
                      <p className="mt-2 text-sm text-gray-600">{school.note}</p>
                    )}
                    <span
                      className={`mt-3 inline-block rounded px-2 py-0.5 text-xs font-medium ${
                        school.source === "catalog"
                          ? "bg-green-50 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {school.source === "catalog"
                        ? "Full program catalog"
                        : "AI-sourced · links get checked"}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onDone([], schools)}
              className="mt-4 self-start text-sm text-gray-500 underline hover:text-gray-800"
            >
              I don&apos;t have a preference — pick for me
            </button>
          </div>
        </div>
      )}
    </StepShell>
  );
}
