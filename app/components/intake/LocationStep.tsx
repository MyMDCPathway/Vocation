"use client";

import { useEffect, useMemo, useState } from "react";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  flagEmoji,
  subdivisionLabel,
} from "@/app/lib/countries";
import type { StudentLocation } from "@/app/lib/intake";
import {
  normalizePostalCode,
  postalExample,
  postalLabel,
  usesPostalCode,
  type PostalPlace,
} from "@/app/lib/postalCode";
import { ContinueButton, StepShell } from "@/app/components/intake/StepShell";

// Where do you live — country, then region, then city.
//
// Three answers on one screen with progressive disclosure, rather than three
// separate questions, because they're one thought and splitting them would
// make the wizard feel twice as long as it is.
//
// The region list is fetched per country rather than shipped. Hand-typing ISO
// 3166-2 for 190 countries is ~5,000 rows entered from memory, and a wrong
// province is invisible until someone from there can't find where they live.
// The list is cached server-side, so each country costs one lookup ever.

interface Subdivision {
  name: string;
  largestCities: string[];
}

export function LocationStep({
  value,
  stepNumber,
  stepCount,
  onBack,
  onDone,
}: {
  value: StudentLocation | undefined;
  stepNumber: number;
  stepCount: number;
  onBack: () => void;
  onDone: (location: StudentLocation) => void;
}) {
  const [countryCode, setCountryCode] = useState(value?.countryCode ?? "");
  const [subdivision, setSubdivision] = useState(value?.subdivision ?? "");
  const [city, setCity] = useState(value?.city ?? "");
  const [postal, setPostal] = useState(value?.postalCode ?? "");

  const [subdivisions, setSubdivisions] = useState<Subdivision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryQuery, setCountryQuery] = useState("");

  // Resolved coordinates for the postal code, when one was entered and
  // recognised. Undefined means "not looked up or not found", which is a
  // perfectly fine end state — the field is optional.
  const [place, setPlace] = useState<PostalPlace | null>(null);
  const [postalState, setPostalState] = useState<"idle" | "looking" | "found" | "missing">(
    "idle"
  );

  const countries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    const matches = q
      ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(q))
      : COUNTRIES;
    if (q) return matches;
    // With no search, surface the country we hold real catalogs for first —
    // it's the only place the app has scraped program data, and burying it
    // under Afghanistan helps nobody.
    const preferred = COUNTRIES.filter((c) => c.code === DEFAULT_COUNTRY);
    return [...preferred, ...matches.filter((c) => c.code !== DEFAULT_COUNTRY)];
  }, [countryQuery]);

  useEffect(() => {
    if (!countryCode) return;
    let cancelled = false;

    setLoading(true);
    setError(null);
    setSubdivisions([]);

    (async () => {
      try {
        const response = await fetch("/api/regions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ countryCode }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Couldn't load regions.");
        if (!cancelled) setSubdivisions(body.subdivisions ?? []);
      } catch (err: any) {
        // Not fatal: the city field below still works, so someone can type
        // where they live even if we couldn't list their country's regions.
        if (!cancelled) setError(err.message || "Couldn't load regions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  // Look the postal code up once the student stops typing. Debounced because
  // otherwise every keystroke of "EH1 1YZ" is a request, and most prefixes of
  // a valid code are not themselves valid.
  useEffect(() => {
    const code = normalizePostalCode(postal);
    if (!countryCode || code.length < 3) {
      setPlace(null);
      setPostalState("idle");
      return;
    }

    let cancelled = false;
    setPostalState("looking");

    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/postal-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ countryCode, postalCode: code }),
        });
        const body = await response.json().catch(() => ({}));
        if (cancelled) return;

        if (body?.place) {
          setPlace(body.place);
          setPostalState("found");
          // Fill the city in if they haven't typed one. Never overwrite what
          // they did type — the postal code resolves to a delivery area, and
          // people know their own address better than a lookup table does.
          setCity((current) => current.trim() || body.place.city);
        } else {
          setPlace(null);
          setPostalState("missing");
        }
      } catch {
        if (!cancelled) {
          setPlace(null);
          setPostalState("missing");
        }
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [postal, countryCode]);

  const cities =
    subdivisions.find((s) => s.name === subdivision)?.largestCities ?? [];

  const showPostal = Boolean(countryCode) && usesPostalCode(countryCode);
  const ready = Boolean(countryCode && city.trim());

  return (
    <StepShell
      stepNumber={stepNumber}
      stepCount={stepCount}
      question="Where do you live?"
      help="This decides which schools you could realistically get to, and which tuition rate applies to you."
      onBack={onBack}
      footer={
        ready ? (
          <ContinueButton
            onClick={() =>
              onDone({
                countryCode,
                // A resolved postal code knows the region better than a
                // dropdown does, but only fills a gap — never overrides a
                // choice they made themselves.
                subdivision: subdivision.trim() || place?.subdivision || "",
                city: city.trim(),
                postalCode: normalizePostalCode(postal) || undefined,
                latitude: place?.latitude,
                longitude: place?.longitude,
              })
            }
          />
        ) : undefined
      }
    >
      {/* Country */}
      <div>
        <label
          htmlFor="country-search"
          className="block text-sm font-semibold text-gray-900"
        >
          Country
        </label>
        <input
          id="country-search"
          type="text"
          value={countryQuery}
          onChange={(e) => setCountryQuery(e.target.value)}
          placeholder="Search countries…"
          className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-school-500 focus:outline-none focus:ring-2 focus:ring-school-500"
        />
        <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white">
          {countries.length === 0 && (
            <p className="px-4 py-6 text-sm text-gray-500">No countries match that.</p>
          )}
          {countries.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => {
                setCountryCode(country.code);
                setSubdivision("");
                setCity("");
              }}
              aria-pressed={countryCode === country.code}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                countryCode === country.code
                  ? "bg-school-50 font-semibold text-school-800"
                  : "hover:bg-gray-50 text-gray-800"
              }`}
            >
              <span aria-hidden="true" className="text-lg leading-none">
                {flagEmoji(country.code)}
              </span>
              {country.name}
            </button>
          ))}
        </div>
      </div>

      {/* Region */}
      {countryCode && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-900">
            {subdivisionLabel(countryCode)}
          </h2>

          {loading && (
            <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-school-600 border-t-transparent" />
              Loading regions…
            </p>
          )}

          {error && (
            <p className="mt-2 text-sm text-amber-700">
              {error} You can still type your city below.
            </p>
          )}

          {!loading && subdivisions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {subdivisions.map((entry) => (
                <button
                  key={entry.name}
                  type="button"
                  onClick={() => {
                    setSubdivision(entry.name);
                    setCity("");
                  }}
                  aria-pressed={subdivision === entry.name}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                    subdivision === entry.name
                      ? "border-school-600 bg-school-600 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-school-400"
                  }`}
                >
                  {entry.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* City */}
      {countryCode && (
        <div className="mt-8">
          <label htmlFor="city" className="block text-sm font-semibold text-gray-900">
            City or town
          </label>
          {cities.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {cities.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCity(name)}
                  aria-pressed={city === name}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                    city === name
                      ? "border-school-600 bg-school-600 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-school-400"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
          {/* Free text, always. There are roughly four million cities on earth
              and any list we showed would exclude most people. */}
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value.slice(0, 80))}
            placeholder={cities.length ? "…or type somewhere else" : "Where do you live?"}
            className="mt-3 w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-school-500 focus:outline-none focus:ring-2 focus:ring-school-500"
          />
        </div>
      )}

      {/* Postal code — last, optional, and only where one exists. */}
      {showPostal && city.trim() && (
        <div className="mt-8">
          <label htmlFor="postal" className="block text-sm font-semibold text-gray-900">
            {postalLabel(countryCode)}{" "}
            <span className="font-normal text-gray-500">— optional</span>
          </label>
          <p className="mt-1 text-sm text-gray-600">
            Gets us your exact distance to each school. Skip it and we&apos;ll work
            from your city.
          </p>
          <input
            id="postal"
            type="text"
            value={postal}
            onChange={(e) => setPostal(e.target.value.slice(0, 12))}
            placeholder={postalExample(countryCode) ?? ""}
            autoComplete="postal-code"
            inputMode="text"
            className="mt-3 w-full max-w-xs rounded-lg border border-gray-200 px-4 py-3 uppercase focus:border-school-500 focus:outline-none focus:ring-2 focus:ring-school-500"
          />

          {postalState === "looking" && (
            <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-school-600 border-t-transparent" />
              Checking…
            </p>
          )}
          {postalState === "found" && place && (
            <p className="mt-2 text-sm text-green-700">
              Found {place.city}
              {place.subdivision ? `, ${place.subdivision}` : ""} — we&apos;ll measure
              distances from there.
            </p>
          )}
          {postalState === "missing" && (
            <p className="mt-2 text-sm text-gray-500">
              We couldn&apos;t look that one up, which is fine — plenty of countries
              aren&apos;t covered. We&apos;ll use your city instead.
            </p>
          )}
        </div>
      )}
    </StepShell>
  );
}
