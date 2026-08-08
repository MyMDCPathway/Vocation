"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  DEFAULT_COUNTRY,
  US_SUBDIVISIONS,
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

// Where exactly do you live — ideally one field, not four screens.
//
// This has been through three shapes. It started as country/region/city/postal
// on one scrolling page, which read as a form rather than a question. It became
// four separate screens, which read right but meant three questions stood
// between "what career do you want" and the first useful answer.
//
// Now the COUNTRY isn't asked at all. It was briefly a chip in the corner of
// the opening screen; that came out because a locale switcher on a page about
// one job is a control almost nobody touches and everybody has to look past.
// The country defaults (DEFAULT_COUNTRY) and this step leads with the postal
// code — because a
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

/**
 * One entry from /api/regions, for the countries that still use it.
 *
 * `largestCities` is still in the payload and no longer read: the city screen
 * it fed is gone. Kept on the type so the shape matches what the route
 * actually returns rather than quietly diverging from it.
 */
interface Subdivision {
  name: string;
  largestCities: string[];
}

type LocalStep = "postal" | "region";

export function LocationStep({
  value,
  savedLocation,
  stepNumber,
  onBack,
  onDone,
  rail,
}: {
  value: StudentLocation | undefined;
  /**
   * The signed-in account's stored postal code, if it has one.
   *
   * A convenience only, and deliberately a seed for the field rather than an
   * answer given on the student's behalf: the question is still asked, still
   * shown, and still editable. Signed-out visitors pass nothing here and see
   * exactly what they always have — which is what keeps career research
   * working with no account at all.
   */
  savedLocation?: { postalCode: string | null; countryCode: string | null };
  stepNumber: number;
  onBack: () => void;
  onDone: (location: StudentLocation) => void;
  rail?: ReactNode;
}) {
  // Chosen on the opening screen. Defaulted here too so this step still works
  // if it's somehow reached without one, rather than rendering a question with
  // no country to ask it about.
  const countryCode =
    value?.countryCode || savedLocation?.countryCode || DEFAULT_COUNTRY;
  const asksPostal = usesPostalCode(countryCode);

  const [subdivision, setSubdivision] = useState(value?.subdivision ?? "");
  const [postal, setPostal] = useState(
    value?.postalCode ?? savedLocation?.postalCode ?? ""
  );

  // Coming back into this step (the student pressed "Back" from the next
  // question) should land on the field they'd answered rather than march them
  // through it again. Countries with no postal system only ever have the one
  // screen to land on.
  const [subStep, setSubStep] = useState<LocalStep>(
    asksPostal ? "postal" : "region"
  );

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

  // The US list ships with the app (US_SUBDIVISIONS) — no request, no spinner,
  // no model call. Everywhere else still asks /api/regions, which is the right
  // trade for ~190 countries and the wrong one for the country most visitors
  // live in.
  const isUS = countryCode.toUpperCase() === DEFAULT_COUNTRY;
  const regions: string[] = isUS
    ? US_SUBDIVISIONS
    : subdivisions.map((entry) => entry.name);
  const needsRegions = !isUS && subStep === "region";

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

  const finish = (
    finalCity: string,
    resolved?: PostalPlace | null,
    /**
     * The state just clicked, passed in rather than read from state.
     *
     * setSubdivision doesn't apply until the next render, so a finish() called
     * in the same handler still sees the OLD subdivision — which was empty.
     * That shipped a location of {subdivision: "", city: ""} for everyone who
     * picked from the list instead of typing a postal code, and an intake with
     * neither fails isComplete and bounces the student off /plan.
     */
    chosenSubdivision?: string
  ) => {
    const from = resolved ?? place;
    onDone({
      countryCode,
      // A resolved postal code knows the region better than a dropdown does,
      // but only fills a gap — never overrides a choice the student made.
      subdivision: (chosenSubdivision ?? subdivision).trim() || from?.subdivision || "",
      city: finalCity.trim(),
      postalCode: normalizePostalCode(postal) || undefined,
      latitude: from?.latitude,
      longitude: from?.longitude,
    });
  };

  /**
   * The one-field path: a resolved code carries town, region and coordinates,
   * so there is nothing left to ask. Anything else drops to picking a state,
   * rather than finishing with a location we couldn't place.
   */
  const continueFromPostal = () => {
    if (place) {
      finish(place.city, place);
      return;
    }
    setSubStep("region");
  };

  /**
   * Picking a state ends the question.
   *
   * There used to be a city screen after this one. It's gone: between a postal
   * code and a state there is nothing left worth asking, and a free-text city
   * box was the worst of both — it couldn't be validated, it didn't narrow the
   * wage figures (BLS publishes by metro, not by town, and the metro comes
   * from the postal code), and it stood between the student and their plan.
   *
   * The honest cost is that a state-only answer gets state wage figures rather
   * than metro ones. That's a real downgrade and the panels say which they're
   * showing, which is the trade: one less question for a slightly coarser
   * number, chosen openly rather than by making people type a town we then
   * only half-used.
   */
  const selectRegion = (name: string) => {
    setSubdivision(name);
    finish("", null, name);
  };

  const back = () => {
    if (subStep === "region" && asksPostal) setSubStep("postal");
    else onBack();
  };

  // --- Postal code, the fast path ------------------------------------------

  if (subStep === "postal") {
    const label = postalLabel(countryCode);

    return (
      <StepShell
        stepNumber={stepNumber}
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
          className="w-full max-w-xs rounded-full border border-outline-variant px-4 py-3 text-lg uppercase focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {postalState === "looking" && (
          <p className="mt-3 flex items-center gap-2 text-sm text-outline">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
          className="mt-6 block text-sm text-outline underline hover:text-primary"
        >
          I&apos;d rather pick my area
        </button>
      </StepShell>
    );
  }

  // --- State, the pick-from-a-list path ------------------------------------
  //
  // The last screen either way. A postal code that resolved never reaches
  // here; one that didn't, or a student who chose to pick instead, ends the
  // question by choosing from this list.

  return (
    <StepShell
      stepNumber={stepNumber}
      question={`Which ${subdivisionLabel(countryCode).toLowerCase()} are you in?`}
      help="Pick the one closest to where you live."
      onBack={back}
      rail={rail}
    >
      {loading && (
        <p className="flex items-center gap-2 text-sm text-outline">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading {subdivisionLabel(countryCode).toLowerCase()}s…
        </p>
      )}

      {error && <p className="text-sm text-amber-700">{error}</p>}

      {!loading && regions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {regions.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => selectRegion(name)}
              aria-pressed={subdivision === name}
              className="rounded-full border border-outline-variant bg-surface-lowest px-3.5 py-1.5 text-sm text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </StepShell>
  );
}
