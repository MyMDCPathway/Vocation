"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_SCHOOL_ID,
  FLORIDA_SCHOOLS,
  SCHOOL_KIND_LABELS,
  getSchoolById,
  type School,
  type SchoolKind,
} from "@/app/lib/floridaSchools";
import { SCHOOL_STORAGE_KEY } from "@/app/lib/schoolStorage";
import { applySchoolTheme, ensureContrastWithWhite } from "@/app/lib/schoolTheme";

// Client-side only for now: nothing server-side reads the choice yet, because
// pathway generation is still built entirely on MDC's catalog. When per-school
// catalogs exist, read this same key when submitting a search.
export { SCHOOL_STORAGE_KEY };

const GROUP_ORDER: SchoolKind[] = ["state-college", "public-university", "private"];

/**
 * The school's logo when one exists, otherwise a monogram in brand color.
 *
 * Every logo file is pre-rendered onto the same 240x80 transparent canvas, so
 * a fixed 3:1 box here makes a one-word wordmark and a tall shield occupy
 * identical space. The monogram fallback centers inside the same box, keeping
 * the rows aligned whether or not a school has a logo yet.
 */
function SchoolMark({ school, size }: { school: School; size: "sm" | "lg" }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const box = size === "lg" ? "h-12 w-36" : "h-8 w-24";

  return (
    <span className={`${box} inline-flex items-center justify-center shrink-0`}>
      {school.logo && !logoFailed ? (
        <img
          src={school.logo}
          alt={`${school.name} logo`}
          className="max-h-full max-w-full object-contain"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <span
          aria-hidden="true"
          className={`${
            size === "lg" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs"
          } inline-flex items-center justify-center rounded-full font-bold text-white`}
          // Darkened where needed so the white monogram stays legible — several
          // brand colors (UCF gold, for one) are too light to carry white text.
          style={{ backgroundColor: ensureContrastWithWhite(school.color) }}
        >
          {school.shortName}
        </span>
      )}
    </span>
  );
}

export default function SchoolSelector() {
  const [selectedId, setSelectedId] = useState(DEFAULT_SCHOOL_ID);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // localStorage is read after mount so the server render (which can't see it)
  // matches the first client render.
  useEffect(() => {
    const stored = localStorage.getItem(SCHOOL_STORAGE_KEY);
    if (stored && getSchoolById(stored)) setSelectedId(stored);
  }, []);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();

    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const selected = getSchoolById(selectedId) ?? getSchoolById(DEFAULT_SCHOOL_ID)!;

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = FLORIDA_SCHOOLS.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.shortName.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q)
    );
    return GROUP_ORDER.map((kind) => ({
      kind,
      label: SCHOOL_KIND_LABELS[kind],
      schools: matches
        .filter((s) => s.kind === kind)
        .sort((a, b) => a.name.localeCompare(b.name)),
    })).filter((g) => g.schools.length > 0);
  }, [query]);

  const choose = (school: School) => {
    setSelectedId(school.id);
    localStorage.setItem(SCHOOL_STORAGE_KEY, school.id);
    // Retint immediately rather than waiting for a navigation; the pre-paint
    // script in the layout handles subsequent page loads.
    applySchoolTheme(school.color);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative flex flex-col items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Your school: ${selected.name}. Click to change.`}
        className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-100 transition"
        title="Change school"
      >
        <SchoolMark school={selected} size="lg" />
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search schools..."
              aria-label="Search schools"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-school-500"
            />
          </div>

          <ul role="listbox" aria-label="Select your school" className="max-h-80 overflow-y-auto py-1">
            {groups.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-500">No schools match.</li>
            )}
            {groups.map((group) => (
              <li key={group.kind}>
                <div className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {group.label}
                </div>
                <ul>
                  {group.schools.map((school) => (
                    <li key={school.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={school.id === selectedId}
                        onClick={() => choose(school)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-school-50 transition ${
                          school.id === selectedId ? "bg-school-50" : ""
                        }`}
                      >
                        <SchoolMark school={school} size="sm" />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-gray-800 truncate">
                            {school.name}
                          </span>
                          <span className="block text-xs text-gray-500">{school.city}</span>
                        </span>
                        {school.id === selectedId && (
                          <svg
                            className="ml-auto h-4 w-4 text-school-600 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedId !== DEFAULT_SCHOOL_ID && (
        <p className="mt-1 text-xs text-amber-600">
          Pathways are currently built with Miami Dade College programs — {selected.shortName}{" "}
          support is coming soon.
        </p>
      )}
    </div>
  );
}
