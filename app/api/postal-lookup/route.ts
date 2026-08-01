import { NextRequest, NextResponse } from "next/server";
import { getCached, setCached, cacheKey } from "@/app/lib/apiCache";
import { getDurable, setDurable } from "@/app/lib/durableCache";
import { getCountry } from "@/app/lib/countries";
import {
  normalizePostalCode,
  postalVariants,
  type PostalPlace,
} from "@/app/lib/postalCode";

// Turn a postal code into a place and a pair of coordinates.
//
// WHY THIS EXISTS RATHER THAN JUST STORING THE STRING. Before this, distance
// to a school could only be computed inside Florida, because the only
// coordinates the app held were its own SCHOOL_COORDINATES table and the
// student's location was matched by city NAME. Everyone outside Florida got
// "closest to home" ranked by whatever order discovery happened to return.
//
// A resolved postal code gives a real latitude and longitude anywhere the
// service covers, so great-circle distance works worldwide. That is the whole
// justification for asking — a field we collect and never use would be worse
// than not asking at all.
//
// SERVICE CHOICE. api.zippopotam.us: free, no key, no account, no rate-limit
// policy to comply with, and it returns place + region + coordinates in one
// call. It covers roughly sixty countries; anything else 404s and the student
// simply keeps the city they typed. Alternatives considered:
//
//   Google Places   The industry default, and what most checkout flows use.
//                   Needs a billing account and an API key, which this project
//                   deliberately doesn't have (three runtime dependencies, no
//                   paid services).
//   Nominatim/OSM   Free, but its usage policy caps you at one request a
//                   second and asks you not to build on it at volume. It also
//                   missed UK and Canadian partial codes in testing that
//                   Zippopotam resolved correctly.
//   GeoNames        Good data, but needs a registered username and throttles
//                   the free tier aggressively.
//
// If this ever needs to be bulletproof, a GeoNames postal dump shipped as
// static data is the upgrade — no third party in the request path at all.

const ZIPPOPOTAM = "https://api.zippopotam.us";
const TIMEOUT_MS = 4000;

export async function POST(request: NextRequest) {
  try {
    const { countryCode, postalCode } = await request.json();

    const country = getCountry(String(countryCode ?? ""));
    if (!country) {
      return NextResponse.json({ error: "A country is required." }, { status: 400 });
    }

    const code = normalizePostalCode(String(postalCode ?? ""));
    if (!code) {
      return NextResponse.json({ error: "A postal code is required." }, { status: 400 });
    }

    // Postal codes never change what they resolve to, so this caches forever
    // and a popular city costs one upstream call in the app's lifetime.
    const key = cacheKey("postal", `${country.code}|${code}`);

    const cached = getCached<PostalPlace | { notFound: true }>(key);
    if (cached) return respond(cached);

    const durable = await getDurable<PostalPlace | { notFound: true }>(key);
    if (durable) {
      setCached(key, durable);
      return respond(durable);
    }

    // Try what they typed, then progressively coarser truncations of it. UK,
    // Canadian and Dutch data is keyed on the first segment only, so someone
    // who types their full, correct postcode misses where a partial hits.
    let transient = false;

    for (const candidate of [code, ...postalVariants(code)]) {
      const attempt = await lookup(country.code, candidate);

      if (attempt.kind === "found") {
        setCached(key, attempt.place);
        await setDurable(key, attempt.place);
        return respond(attempt.place);
      }
      // Remember an upstream wobble so it isn't cached as a definitive miss.
      if (attempt.kind === "transient") transient = true;
    }

    if (transient) {
      return NextResponse.json({ notFound: true, transient: true });
    }

    // Nothing matched and nothing errored, so this really isn't in their data.
    // Caching that stops us re-asking on every keystroke-triggered retry.
    const miss = { notFound: true as const };
    setCached(key, miss);
    await setDurable(key, miss);
    return respond(miss);
  } catch (error: any) {
    // Never fail the location step over this. The postal code is optional and
    // the student's typed city still works without it.
    console.error("Postal lookup failed:", error?.message ?? error);
    return NextResponse.json({ notFound: true, transient: true });
  }
}

function respond(value: PostalPlace | { notFound: true }) {
  return NextResponse.json("notFound" in value ? value : { place: value });
}

type LookupResult =
  | { kind: "found"; place: PostalPlace }
  | { kind: "missing" }
  | { kind: "transient" };

/** One request to the postal service for one exact code. */
async function lookup(countryCode: string, code: string): Promise<LookupResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(
      `${ZIPPOPOTAM}/${countryCode.toLowerCase()}/${encodeURIComponent(code)}`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "Vocation/2.0 (career pathway planner)",
          Accept: "application/json",
        },
      }
    );

    if (response.status === 404) return { kind: "missing" };
    if (!response.ok) return { kind: "transient" };

    const data = await response.json();
    const place = data?.places?.[0];
    if (!place) return { kind: "missing" };

    const latitude = Number(place.latitude);
    const longitude = Number(place.longitude);

    // Coordinates are the entire point of asking. An entry without usable ones
    // is a miss even though the service answered.
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { kind: "missing" };
    }

    return {
      kind: "found",
      place: {
        city: place["place name"] ?? "",
        subdivision: place.state ?? "",
        latitude,
        longitude,
      },
    };
  } catch {
    // Timeout or network failure — not evidence the code is wrong.
    return { kind: "transient" };
  } finally {
    clearTimeout(timer);
  }
}
