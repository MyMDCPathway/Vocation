"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { IntakeAnswers } from "@/app/lib/intake";
import type { DirectorySchool } from "@/app/lib/schoolDirectory";
import { directorySchoolToRef, type SchoolRef } from "@/app/lib/schoolRef";
import { usStateName } from "@/app/lib/usStates";
import { ContinueButton, StepShell } from "@/app/components/intake/StepShell";
import { SchoolMark } from "@/app/components/SchoolMark";

// "Have a school in mind?" — reachable only when the student didn't already
// name one via the school-first flow (/schools/[id] → SchoolProgramBrowser,
// which now seeds desiredSchools itself; see IntakeWizard's `steps` memo for
// the skip condition). Deliberately built as a directory browse — map left,
// list right, same shape /schools itself uses — rather than reviving the old
// (deleted in b9a6ddb) SchoolsStep's AI-discovery call: the ask here is
// "let them pick from what we actually know," not "guess which schools suit
// this career."
//
// Picking is optional. Nothing downstream requires a named school —
// resolveTracks() already falls back to its own Closest/Cheapest picks via
// /api/find-schools when desiredSchools is empty, exactly as it does today.

const SchoolMap = dynamic(
  () => import("@/app/components/shared/SchoolMap").then((m) => m.SchoolMap),
  { ssr: false }
);

interface Props {
  answers: IntakeAnswers;
  stepNumber: number;
  onBack: () => void;
  onDone: (school: SchoolRef | null) => void;
  rail?: ReactNode;
}

function SchoolPickerRow({
  school,
  selected,
  onSelect,
  onFocus,
}: {
  school: DirectorySchool;
  selected: boolean;
  onSelect: () => void;
  onFocus: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onFocus}
      aria-pressed={selected}
      className={`flex w-full items-start gap-3 rounded-lg border-2 p-4 text-left transition-all ${
        selected
          ? "border-primary bg-primary-fixed"
          : "border-transparent bg-surface-lowest hover:bg-surface-container"
      }`}
    >
      <SchoolMark school={school} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-on-surface">{school.name}</p>
        <p className="mt-0.5 text-sm text-on-surface-variant">
          {[school.city, school.state].filter(Boolean).join(", ")}
          {typeof school.distanceMiles === "number" && ` · ${Math.round(school.distanceMiles)} mi`}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
          school.hasCatalog
            ? "bg-primary text-on-primary"
            : "border border-outline-variant text-on-surface-variant"
        }`}
      >
        {school.hasCatalog ? "Full catalog" : "AI-sourced"}
      </span>
    </button>
  );
}

export function SchoolPickerStep({ answers, stepNumber, onBack, onDone, rail }: Props) {
  const [schools, setSchools] = useState<DirectorySchool[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState("FL");
  const [query, setQuery] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Already known from the location step, if it resolved coordinates —
  // reused here rather than asking again, the same "don't re-ask what we
  // already have" call the wizard makes elsewhere.
  const origin = useMemo(() => {
    const { latitude, longitude } = answers.location ?? {};
    return typeof latitude === "number" && typeof longitude === "number"
      ? { lat: latitude, lng: longitude }
      : undefined;
  }, [answers.location]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("state", state);
    params.set("sort", origin ? "distance" : "name");
    if (query.trim()) params.set("q", query.trim());
    if (origin) {
      params.set("lat", String(origin.lat));
      params.set("lng", String(origin.lng));
    }
    params.set("limit", "200");

    const timeout = setTimeout(
      async () => {
        try {
          const response = await fetch(`/api/schools?${params.toString()}`);
          const body = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(body.error || "Couldn't load schools.");
          if (!cancelled) {
            setSchools(body.schools ?? []);
            setStates(body.states ?? []);
          }
        } catch (err: any) {
          if (!cancelled) setError(err.message || "Couldn't load schools.");
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      query ? 250 : 0
    );

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [state, query, origin?.lat, origin?.lng]);

  const picked = schools.find((s) => s.id === pickedId) ?? null;
  const mapSchools = useMemo(
    () => schools.map((s) => directorySchoolToRef(s, s.state ? usStateName(s.state) : "")),
    [schools]
  );

  function toggle(id: string) {
    setPickedId((current) => (current === id ? null : id));
  }

  function finish() {
    if (!picked) {
      onDone(null);
      return;
    }
    onDone(directorySchoolToRef(picked, picked.state ? usStateName(picked.state) : ""));
  }

  return (
    <StepShell
      stepNumber={stepNumber}
      question="Have a school in mind?"
      help="Pick one to plan around, or skip and we'll suggest a few automatically based on your other answers."
      rail={rail}
      onBack={onBack}
      wide
      footer={
        <ContinueButton
          onClick={finish}
          label={picked ? `Continue with ${picked.shortName || picked.name}` : "Skip — choose for me"}
        />
      }
    >
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-on-surface-variant">State</span>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-44 rounded-lg border border-outline-variant bg-surface-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="FL">Florida</option>
            <option value="ALL">All states</option>
            {states
              .filter((code) => code !== "FL")
              .map((code) => (
                <option key={code} value={code}>
                  {usStateName(code)}
                </option>
              ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-on-surface-variant">Search by name</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Miami Dade"
            className="w-56 rounded-lg border border-outline-variant bg-surface-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="lg:sticky lg:top-8 lg:self-start">
          <SchoolMap
            schools={mapSchools}
            selectedIds={picked ? [picked.id] : []}
            focusedId={focusedId}
            onToggle={(school) => toggle(school.id)}
            origin={origin ? { latitude: origin.lat, longitude: origin.lng } : undefined}
          />
        </div>

        <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
          {loading && (
            <div className="space-y-2" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-[72px] animate-pulse rounded-lg bg-surface-container" />
              ))}
            </div>
          )}

          {!loading && schools.length === 0 && (
            <p className="text-sm text-on-surface-variant">No schools match these filters.</p>
          )}

          {!loading &&
            schools.map((school) => (
              <SchoolPickerRow
                key={school.id}
                school={school}
                selected={school.id === pickedId}
                onSelect={() => toggle(school.id)}
                onFocus={() => setFocusedId(school.id)}
              />
            ))}
        </div>
      </div>
    </StepShell>
  );
}
