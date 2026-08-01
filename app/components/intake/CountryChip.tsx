"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES, DEFAULT_COUNTRY, flagEmoji, getCountry } from "@/app/lib/countries";

// Which country's rules apply, picked in the corner rather than asked for.
//
// This used to be question one of a four-part location step, which put three
// screens between "what career do you want" and anything useful coming back.
// But it isn't really a question — it's a setting, the same way every
// storefront and docs site keeps a locale switcher in the corner. Ninety-odd
// percent of visitors never touch it, and the ones who need it find it where
// they already expect it to be.
//
// Moving it here is what lets the career summary run second: the country is
// known before the first API call, so wage figures come back for the right
// market instead of a default one. The finer-grained question — which metro —
// is still asked, but as one field after the summary rather than three before
// it.
//
// SHOWN ON THE OPENING SCREEN ONLY. Changing country halfway through would
// invalidate the summary the student is reading and the schools they've been
// shown, and a control that quietly does that is worse than one that isn't
// there. Going back to the first screen to change it is the honest path.

/** Countries common enough to be worth a shortcut above the full list. */
const QUICK_PICKS = ["US", "CA", "GB", "IE", "AU", "NZ", "IN", "DE", "FR", "JP"];

export function CountryChip({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (countryCode: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const code = (value || DEFAULT_COUNTRY).toUpperCase();
  const country = getCountry(code);

  // Click-away and Escape both close it. A popover that can only be dismissed
  // by picking something is a popover people feel trapped by.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
    else setQuery("");
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      return COUNTRIES.filter(
        (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q
      );
    }
    // No search: the handful people actually pick, in the order they'd expect,
    // then everything else alphabetically.
    const quick = QUICK_PICKS.map((pick) => getCountry(pick)).filter(
      (c): c is NonNullable<typeof c> => Boolean(c)
    );
    const rest = COUNTRIES.filter((c) => !QUICK_PICKS.includes(c.code));
    return [...quick, ...rest];
  }, [query]);

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Country: ${country?.name ?? code}. Change`}
        className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-sm font-semibold text-ink-soft ring-1 ring-black/10 transition-all hover:text-ink hover:ring-ink/30"
      >
        <span aria-hidden="true">{flagEmoji(code)}</span>
        <span>{code}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3.5 w-3.5 text-ink-faint transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl bg-white text-left shadow-xl ring-1 ring-black/10">
          <div className="border-b border-black/5 p-2">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search countries…"
              aria-label="Search countries"
              className="w-full rounded-xl bg-sand px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-ink/20"
            />
          </div>

          <ul role="listbox" className="max-h-72 overflow-y-auto py-1">
            {results.length === 0 && (
              <li className="px-4 py-3 text-sm text-ink-faint">
                No countries match that.
              </li>
            )}
            {results.map((option) => (
              <li key={option.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.code === code}
                  onClick={() => choose(option.code)}
                  className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors hover:bg-sand ${
                    option.code === code ? "font-semibold text-ink" : "text-ink-soft"
                  }`}
                >
                  <span aria-hidden="true">{flagEmoji(option.code)}</span>
                  <span className="min-w-0 flex-1 truncate">{option.name}</span>
                  <span className="text-xs text-ink-faint">{option.code}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
