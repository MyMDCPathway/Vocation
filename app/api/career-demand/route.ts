import { NextRequest, NextResponse } from "next/server";
import { getCached, setCached, cacheKey } from "@/app/lib/apiCache";
import { getDurable, setDurable } from "@/app/lib/durableCache";
import { resolveCareer } from "@/app/lib/careerCanonical";
import { matchOccupation } from "@/app/lib/blsOccupations";
import { fetchStateDemand, type StateDemandMap } from "@/app/lib/blsStats";

// Where in the country a job actually is, state by state.
//
// SEPARATE FROM /api/career-profile ON PURPOSE, for two reasons.
//
// It's the most expensive BLS call the app makes — 102 series, three requests
// with a registration key — and the career summary is a page students wait on.
// Folding this in would make every summary slower for a panel most of them
// scroll past. So the summary renders first and the map fills in behind it.
//
// And unlike every other figure on that page, this one has NOTHING to do with
// where the student lives. The concentration of software developers across the
// fifty states is the same fact for a visitor in Miami and a visitor in Boise,
// so it caches on the occupation alone and is shared by everyone who ever asks
// about that job. That's what makes an otherwise costly call cheap in practice.

export interface CareerDemandResponse {
  demand: StateDemandMap | null;
  status: "ok" | "unmatched" | "unavailable";
}

export async function POST(request: NextRequest) {
  try {
    const { career, socCode } = await request.json();

    if (!career || typeof career !== "string" || !career.trim()) {
      return NextResponse.json({ error: "A career is required." }, { status: 400 });
    }

    const occupation = matchOccupation(
      resolveCareer(career).canonical,
      typeof socCode === "string" ? socCode : undefined
    );
    if (!occupation) {
      return NextResponse.json({ demand: null, status: "unmatched" });
    }

    // No area in the key. That's the whole point — see the header comment.
    const key = cacheKey("demand", occupation.code);

    const cached = getCached<CareerDemandResponse>(key);
    if (cached) return NextResponse.json(cached);

    const durable = await getDurable<CareerDemandResponse>(key);
    if (durable) {
      setCached(key, durable);
      return NextResponse.json(durable);
    }

    const demand = await fetchStateDemand(occupation.code);
    const payload: CareerDemandResponse = {
      demand,
      status: demand ? "ok" : "unavailable",
    };

    // Only a success is worth keeping, for the same reason /api/labor-stats
    // only keeps successes: caching "unavailable" freezes a spent rate limit
    // into the answer for as long as the cache lives.
    if (demand) {
      setCached(key, payload);
      await setDurable(key, payload);
    }

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("Error loading career demand:", error);
    return NextResponse.json(
      { error: "Failed to load demand data." },
      { status: 500 }
    );
  }
}
