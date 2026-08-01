"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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

// Where do you live — one question at a time: country, then region, then
// city, then (optionally) a postal code.
//
// This used to be all four on one scrolling screen, in the name of "it's one
// thought." Real feedback was that it didn't read that way — it read as a
// form, out of step with every other screen in the wizard asking exactly one
// thing. So it's four small screens now, each with its own back button,
// nested inside this one wizard step rather than four separate entries in the
// outer step list — the outer "Step X of Y" counter doesn't need to know
// there are four of them, any more than it needs to know the schools step has
// its own internal search box.
//
// The region list is fetched per country rather than shipped. Hand-typing ISO
// 3166-2 for 190 countries is ~5,000 rows entered from memory, and a wrong
// province is invisible until someone from there can't find where they live.
// The list is cached server-side, so each country costs one lookup ever.

interface Subdivision {
  name: string;
  largestCities: string[];
}

type LocalStep = "country" | "region" | "city" | "postal";

/** Which sub-questions apply once a country is known. */
function subStepsFor(countryCode: string): LocalStep[] {
  if (!countryCode) return ["country"];
  const steps: LocalStep[] = ["country", "region", "city"];
  if (usesPostalCode(countryCode)) steps.push("postal");
  return steps;
}

export function LocationStep({
  value,
  stepNumber,
  stepCount,
  onBack,
  onDone,
  rail,
}: {
  value: StudentLocation | undefined;
  stepNumber: number;
  stepCount: number;
  onBack: () => void;
  onDone: (location: StudentLocation) => void;
  rail?: ReactNode;
}) {
  const [countryCode, setCountryCode] = useState(value?.countryCode ?? "");
  const [subdivision, setSubdivision] = useState(value?.subdivision ?? "");
  const [city, setCity] = useState(value?.city ?? "");
  const [postal, setPostal] = useState(value?.postalCode ?? "");

  // Landing back on this step (the student pressed "Back" from the next
  // question) should return them to the last thing they answered, not march
  // them through country/region/city again. A fresh, empty intake starts at
  // the first question as normal.
  const [subStep, setSubStep] = useState<LocalStep>(() => {
    if (!value?.countryCode || !value?.city) return "country";
    const applicable = subStepsFor(value.countryCode);
    return applicable[applicable.length - 1];
  });

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
        // Not fatal: the city question still works, so someone can type where
        // they live even if we couldn't list their country's regions.
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

  const finish = (finalCity: string) => {
    onDone({
      countryCode,
      // A resolved postal code knows the region better than a dropdown does,
      // but only fills a gap — never overrides a choice the student made.
      subdivision: subdivision.trim() || place?.subdivision || "",
      city: finalCity.trim(),
      postalCode: normalizePostalCode(postal) || undefined,
      latitude: place?.latitude,
      longitude: place?.longitude,
    });
  };

  const selectCountry = (code: string) => {
    setCountryCode(code);
    setSubdivision("");
    setCity("");
    // A postal code from the previous country means nothing here.
    setPostal("");
    setPlace(null);
    setPostalState("idle");
    setSubStep("region");
  };

  const selectRegion = (name: string) => {
    setSubdivision(name);
    setCity("");
    setSubStep("city");
  };

  const continueFromCity = () => {
    if (!city.trim()) return;
    if (showPostal) {
      setSubStep("postal");
    } else {
      finish(city);
    }
  };

  const back = () => {
    if (subStep === "region") setSubStep("country");
    else if (subStep === "city") setSubStep("region");
    else if (subStep === "postal") setSubStep("city");
    else onBack();
  };

  // --- Country ---------------------------------------------------------

  if (subStep === "country") {
    return (
      <StepShell
        stepNumber={stepNumber}
        stepCount={stepCount}
        question="Which country do you live in?"
        help="This decides which schools we can plan a route through, and which tuition rate applies to you."
        onBack={onBack}
      rail={rail}
      >
        <input
          id="country-search"
          type="text"
          value={countryQuery}
          onChange={(e) => setCountryQuery(e.target.value)}
          placeholder="Search countries…"
          aria-label="Search countries"
          className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-school-500 focus:outline-none focus:ring-2 focus:ring-school-500"
        />
        <div className="mt-3 max-h-[50vh] overflow-y-auto rounded-xl border border-gray-200 bg-white">
          {countries.length === 0 && (
            <p className="px-4 py-6 text-sm text-gray-500">No countries match that.</p>
          )}
          {countries.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => selectCountry(country.code)}
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
      </StepShell>
    );
  }

  // --- Region ------------------------------------------------------------

  if (subStep === "region") {
    return (
      <StepShell
        stepNumber={stepNumber}
        stepCount={stepCount}
        question={`Which ${subdivisionLabel(countryCode).toLowerCase()} are you in?`}
        help="Pick the one closest to where you live."
        onBack={back}
      rail={rail}
      >
        {loading && (
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-school-600 border-t-transparent" />
            Loading {subdivisionLabel(countryCode).toLowerCase()}s…
          </p>
        )}

        {error && (
          <p className="text-sm text-amber-700">
            {error} You can skip this and just tell us your city.
          </p>
        )}

        {!loading && subdivisions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {subdivisions.map((entry) => (
              <button
                key={entry.name}
                type="button"
                onClick={() => selectRegion(entry.name)}
                aria-pressed={subdivision === entry.name}
                className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm text-gray-700 transition-colors hover:border-school-400"
              >
                {entry.name}
              </button>
            ))}
          </div>
        )}

        {!loading && (
          <button
            type="button"
            onClick={() => setSubStep("city")}
            className="mt-6 text-sm text-gray-500 underline hover:text-gray-800"
          >
            {subdivisions.length > 0
              ? "Not sure — skip this"
              : "Skip this and just tell us your city"}
          </button>
        )}
      </StepShell>
    );
  }

  // --- City ----------------------------------------------------------------

  if (subStep === "city") {
    return (
      <StepShell
        stepNumber={stepNumber}
        stepCount={stepCount}
        question="Which city or town?"
        help="This decides which schools you could realistically get to."
        onBack={back}
      rail={rail}
        footer={
          city.trim() ? <ContinueButton onClick={continueFromCity} /> : undefined
        }
      >
        {cities.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              continueFromCity();
            }
          }}
          placeholder={cities.length ? "…or type somewhere else" : "Where do you live?"}
          aria-label="Your city or town"
          autoFocus
          className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-school-500 focus:outline-none focus:ring-2 focus:ring-school-500"
        />
      </StepShell>
    );
  }

  // --- Postal code -----------------------------------------------------

  return (
    <StepShell
      stepNumber={stepNumber}
      stepCount={stepCount}
      question={`What's your ${postalLabel(countryCode).toLowerCase()}?`}
      help="Optional — it gets us your exact distance to each school. Skip it and we'll work from your city."
      onBack={back}
      rail={rail}
      footer={<ContinueButton onClick={() => finish(city)} />}
    >
      <input
        id="postal"
        type="text"
        value={postal}
        onChange={(e) => setPostal(e.target.value.slice(0, 12))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            finish(city);
          }
        }}
        placeholder={postalExample(countryCode) ?? ""}
        aria-label={postalLabel(countryCode)}
        autoComplete="postal-code"
        inputMode="text"
        autoFocus
        className="w-full max-w-xs rounded-lg border border-gray-200 px-4 py-3 uppercase focus:border-school-500 focus:outline-none focus:ring-2 focus:ring-school-500"
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
    </StepShell>
  );
}
