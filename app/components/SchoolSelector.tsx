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
import { hasCatalog } from "@/app/lib/schoolCatalogs";
import { SchoolMark } from "@/app/components/SchoolMark";
import { useSelectedSchoolId } from "@/app/lib/useSelectedSchool";

// The chosen school is sent with every generate-pathway request and decides
// which catalog the pathway is built from. Pages other than this one read it
// through useSelectedSchool.
export { SCHOOL_STORAGE_KEY };

const GROUP_ORDER: SchoolKind[] = ["state-college", "public-university", "private"];

export default function SchoolSelector() {
  // Shares the same pre-paint-corrected read as the header and pathway page,
  // so this button and the rest of the chrome can never disagree about which
  // school is selected.
  const [selectedId, selectSchool] = useSelectedSchoolId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

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
    if (school.id === selectedId) {
      setOpen(false);
      setQuery("");
      return;
    }

    selectSchool(school.id);

    // The reload is what carries the new cookie to the server, so the next
    // render arrives with the right logo, colors, footer, and catalog already
    // baked into the HTML — rather than every consumer correcting itself after
    // the browser has painted.
    window.location.reload();
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

      {/* Only warn for schools we have no program catalog for. MDC and FIU
          both generate real pathways from their own catalogs. The default
          identity isn't a school at all, so it gets a prompt to choose one
          instead of a catalog complaint about "VOC". */}
      {selectedId === DEFAULT_SCHOOL_ID ? (
        <p className="mt-1 text-xs text-gray-500">
          Choose your school to get started.
        </p>
      ) : (
        !hasCatalog(selectedId) && (
          <p className="mt-1 text-xs text-amber-600">
            We don&apos;t have {selected.shortName}&apos;s program catalog yet, so
            pathways can&apos;t be generated for it.
          </p>
        )
      )}
    </div>
  );
}
