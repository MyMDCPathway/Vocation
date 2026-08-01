"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DEFAULT_COUNTRY, subdivisionLabel } from "@/app/lib/countries";
import type { StudentLocation } from "@/app/lib/intake";
import {
  normalizePostalCode,
  postalExample,
  postalLabel,
  usesPostalCode,
  type PostalPlace,
} from "@/app/lib/postalCode";
import { ContinueButton, StepShell } from "@/app/components/intake/StepShell";

// Where exactly do you live — ideally one field, not four screens.
//
// This has been through three shapes. It started as country/region/city/postal
// on one scrolling page, which read as a form rather than a question. It became
// four separate screens, which read right but meant three questions stood
// between "what career do you want" and the first useful answer.
//
// Now the COUNTRY is a corner control on the opening screen (see CountryChip)
// rather than a question, and this step leads with the postal code — because a
// postal code resolves to a town, a region AND coordinates in one lookup. For a
// US student that's the whole location step: type a ZIP, done. The
// region-then-city screens are still here, but only as the fallback for someone
// whose code didn't resolve, who'd rather not give one, or who lives in one of
// the ~60 countries with no postal system at all.
//
// The region list is fetched per country rather than shipped. Hand-typing ISO
// 3166-2 for 190 countries is ~5,000 rows entered from memory, and a wrong
// province is invisible until someone from there can't find where they live.
// The list is cached server-side, so each country costs one lookup ever.

interface Subdivision {
  name: string;
  largestCities: string[];
}

type LocalStep = "postal" | "region" | "city";

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
  // Chosen on the opening screen. Defaulted here too so this step still works
  // if it's somehow reached without one, rather than rendering a question with
  // no country to ask it about.
  const countryCode = value?.countryCode || DEFAULT_COUNTRY;
  const asksPostal = usesPostalCode(countryCode);

  const [subdivision, setSubdivision] = useState(value?.subdivision ?? "");
  const [city, setCity] = useState(value?.city ?? "");
  const [postal, setPostal] = useState(value?.postalCode ?? "");

  // Coming back into this step (the student pressed "Back" from the next
  // question) should land on the last thing they answered rather than march
  // them through it again.
  const [subStep, setSubStep] = useState<LocalStep>(() => {
    if (value?.city) return asksPostal ? "postal" : "city";
    return asksPostal ? "postal" : "region";
  });

  const [subdivisions, setSubdivisions] = useState<Subdivision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolved coordinates for the postal code, when one was entered and
  // recognised. Null means "not looked up or not found", which is a perfectly
  // fine end state — the fallback screens cover it.
  const [place, setPlace] = useState<PostalPlace | null>(null);
  const [postalState, setPostalState] = useState<"idle" | "looking" | "found" | "missing">(
    "idle"
  );

  // Only fetch the region list if the student actually needs it — most won't,
  // now that a postal code answers the whole question.
  const needsRegions = subStep === "region" || subStep === "city";

  useEffect(() => {
    if (!needsRegions || subdivisions.length > 0) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsRegions, countryCode]);

  // Look the postal code up once the student stops typing. Debounced because
  // otherwise every keystroke of "EH1 1YZ" is a request, and most prefixes of
  // a valid code are not themselves valid.
  useEffect(() => {
    const code = normalizePostalCode(postal);
    if (code.length < 3) {
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

  const finish = (finalCity: string, resolved?: PostalPlace | null) => {
    const from = resolved ?? place;
    onDone({
      countryCode,
      // A resolved postal code knows the region better than a dropdown does,
      // but only fills a gap — never overrides a choice the student made.
      subdivision: subdivision.trim() || from?.subdivision || "",
      city: finalCity.trim(),
      postalCode: normalizePostalCode(postal) || undefined,
      latitude: from?.latitude,
      longitude: from?.longitude,
    });
  };

  /**
   * The one-field path: a resolved code carries town, region and coordinates,
   * so there is nothing left to ask. Anything else drops to picking an area,
   * rather than finishing with a location we couldn't place.
   */
  const continueFromPostal = () => {
    if (place) {
      finish(city.trim() || place.city, place);
      return;
    }
    setSubStep("region");
  };

  const selectRegion = (name: string) => {
    setSubdivision(name);
    setCity("");
    setSubStep("city");
  };

  const back = () => {
    if (subStep === "city") setSubStep("region");
    else if (subStep === "region" && asksPostal) setSubStep("postal");
    else onBack();
  };

  // --- Postal code, the fast path ------------------------------------------

  if (subStep === "postal") {
    const label = postalLabel(countryCode);

    return (
      <StepShell
        stepNumber={stepNumber}
        stepCount={stepCount}
        question={`What's your ${label.toLowerCase()}?`}
        help="It's the only location question we need — it gets us your town and your exact distance to each school."
        onBack={onBack}
        rail={rail}
        footer={
          <ContinueButton
            onClick={continueFromPostal}
            disabled={postalState === "looking"}
          />
        }
      >
        <input
          id="postal"
          type="text"
          value={postal}
          onChange={(e) => setPostal(e.target.value.slice(0, 12))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              continueFromPostal();
            }
          }}
          placeholder={postalExample(countryCode) ?? ""}
          aria-label={label}
          autoComplete="postal-code"
          inputMode="text"
          autoFocus
          className="w-full max-w-xs rounded-xl border border-black/10 px-4 py-3 text-lg uppercase focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink"
        />

        {postalState === "looking" && (
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-faint">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink border-t-transparent" />
            Checking…
          </p>
        )}
        {postalState === "found" && place && (
          <p className="mt-3 text-sm font-medium text-green-700">
            {place.city}
            {place.subdivision ? `, ${place.subdivision}` : ""} — that&apos;s
            everything we need.
          </p>
        )}
        {postalState === "missing" && (
          <p className="mt-3 text-sm text-amber-700">
            We couldn&apos;t place that one. Continue and we&apos;ll ask which
            area you&apos;re in instead.
          </p>
        )}

        <button
          type="button"
          onClick={() => setSubStep("region")}
          className="mt-6 block text-sm text-ink-faint underline hover:text-ink"
        >
          I&apos;d rather pick my area
        </button>
      </StepShell>
    );
  }

  // --- Region ---------------------------------------------------------------

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
          <p className="flex items-center gap-2 text-sm text-ink-faint">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink border-t-transparent" />
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
                className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-sm text-ink-soft transition-colors hover:border-ink/40"
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
            className="mt-6 text-sm text-ink-faint underline hover:text-ink"
          >
            {subdivisions.length > 0
              ? "Not sure — skip this"
              : "Skip this and just tell us your city"}
          </button>
        )}
      </StepShell>
    );
  }

  // --- City -----------------------------------------------------------------

  return (
    <StepShell
      stepNumber={stepNumber}
      stepCount={stepCount}
      question="Which city or town?"
      help="This decides which schools you could realistically get to."
      onBack={back}
      rail={rail}
      footer={
        city.trim() ? <ContinueButton onClick={() => finish(city)} /> : undefined
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
                  ? "border-ink bg-ink text-white"
                  : "border-black/10 bg-white text-ink-soft hover:border-ink/40"
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
            if (city.trim()) finish(city);
          }
        }}
        placeholder={cities.length ? "…or type somewhere else" : "Where do you live?"}
        aria-label="Your city or town"
        autoFocus
        className="w-full rounded-xl border border-black/10 px-4 py-3 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink"
      />
    </StepShell>
  );
}
