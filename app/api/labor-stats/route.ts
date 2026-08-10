import { NextRequest, NextResponse } from "next/server";
import { getCached, setCached, cacheKey } from "@/app/lib/apiCache";
import { getDurable, setDurable } from "@/app/lib/durableCache";
import { resolveCareer } from "@/app/lib/careerCanonical";
import {
  BLOCKED_CAREER_MESSAGE,
  MAX_CAREER_INPUT,
  TOO_LONG_MESSAGE,
} from "@/app/lib/careerPolicy";
import { matchOccupation } from "@/app/lib/blsOccupations";
import { resolveAreas } from "@/app/lib/blsAreas";
import { checkIpLimit, clientIp } from "@/app/lib/rateLimit";
import { RATE_LIMIT_CONFIG } from "@/app/api/rate-limit-config";
import { fetchLaborStats, type LaborStats } from "@/app/lib/blsStats";
import type { StatsStatus } from "@/app/lib/careerProfileTypes";

// The wage figures on their own, for somewhere we didn't know about earlier.
//
// WHY THIS ISN'T JUST /api/career-profile AGAIN. The profile caches as one
// object keyed on career AND area, so asking it for the same career in a
// different area is a cache miss — and a cache miss there means a fresh Gemini
// call to regenerate a summary, a day-to-day list and a set of practitioner
// themes that are identical to the ones we already have. None of that varies
// by metro. Only the numbers do.
//
// So the plan page calls this instead: same BLS lookup, same cache layers, no
// model call at all. A student who saw national figures on the summary gets
// their own metro's here for the cost of one BLS request.
//
// The occupation match is passed in as `socCode` when the caller has one,
// because the profile already resolved it against the model's hint and we want
// the SAME occupation described in both places. It's still validated against
// BLS's published table before use — see matchOccupation.

export interface LaborStatsResponse {
  stats: LaborStats | null;
  status: StatsStatus;
}

export async function POST(request: NextRequest) {
  try {
    const { career, countryCode, subdivision, city, socCode } = await request.json();

    if (!career || typeof career !== "string" || !career.trim()) {
      return NextResponse.json({ error: "A career is required." }, { status: 400 });
    }

    if (career.length > MAX_CAREER_INPUT) {
      return NextResponse.json({ error: TOO_LONG_MESSAGE }, { status: 400 });
    }

    const resolved = resolveCareer(career);

    // No Gemini call behind this one, but the same refusal: a career we won't
    // plan a route to shouldn't get a wage table either.
    if (resolved.blocked) {
      return NextResponse.json(
        { error: BLOCKED_CAREER_MESSAGE, blocked: true },
        { status: 400 }
      );
    }

    const canonicalCareer = resolved.canonical;

    const areas = resolveAreas({
      countryCode: typeof countryCode === "string" ? countryCode : "",
      subdivision: typeof subdivision === "string" ? subdivision : "",
      city: typeof city === "string" ? city : "",
    });

    if (!areas) {
      return NextResponse.json({ stats: null, status: "outside-us" });
    }

    const occupation = matchOccupation(
      canonicalCareer,
      typeof socCode === "string" ? socCode : undefined
    );
    if (!occupation) {
      return NextResponse.json({ stats: null, status: "unmatched" });
    }

    // Keyed on the occupation rather than the career text, so two careers that
    // resolve to the same BLS occupation share one entry.
    const areaKey = areas.metro?.code ?? areas.state?.code ?? "us";
    const key = cacheKey("labor", `${occupation.code}|${areaKey}`);

    const cached = getCached<LaborStatsResponse>(key);
    if (cached) return NextResponse.json(cached);

    const durable = await getDurable<LaborStatsResponse>(key);
    if (durable) {
      setCached(key, durable);
      return NextResponse.json(durable);
    }

    // Past here costs a request against BLS's registration key, which is
    // capped at 500/day for the whole app — not per visitor. The cache key is
    // (occupation, area), a large but walkable space, so an unauthenticated
    // caller could force a miss on every request and burn the day's allowance.
    // When it's gone blsStats.ts swallows the failure and the whole site
    // quietly falls back to model estimates until midnight.
    //
    // Deliberately after both cache layers: reading an already-fetched
    // occupation stays free and unthrottled, exactly as generate-pathway
    // orders its own limiter.
    const ipLimit = checkIpLimit(
      `bls:${clientIp(request)}`,
      RATE_LIMIT_CONFIG.maxBlsLookupsPerIP
    );
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many labor-statistics lookups. Try again in a few minutes." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds ?? 60) } }
      );
    }

    const stats = await fetchLaborStats(occupation, areas);
    const payload: LaborStatsResponse = {
      stats,
      status: stats ? "ok" : "unavailable",
    };

    // Only a success is worth keeping. Caching "unavailable" would freeze an
    // exhausted rate limit into the answer for as long as the cache lives,
    // which is the same trap healStats exists to get the profile out of.
    if (stats) {
      setCached(key, payload);
      await setDurable(key, payload);
    }

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("Error loading labor stats:", error);
    return NextResponse.json(
      { error: "Failed to load wage data." },
      { status: 500 }
    );
  }
}
