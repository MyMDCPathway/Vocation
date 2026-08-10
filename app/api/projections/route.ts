import { NextRequest, NextResponse } from "next/server";
import {
  fastestGrowingOccupations,
  mostNewJobsOccupations,
  projectionsMeta,
} from "@/app/lib/projections";
import { matchOccupation } from "@/app/lib/blsOccupations";
import { matchedInterestLabel } from "@/app/lib/interests";

// The "trending occupations" data /insights renders — BLS's own committed
// snapshot (see app/lib/projections.ts for why this is a hand-transcribed
// file rather than a live fetch). Same two tables for every visitor; the
// only per-request variation is the optional `interests` query param, which
// /insights passes as the signed-in user's stored interest slugs so each row
// can be flagged "in your X interest" without the client needing to know
// anything about the SOC taxonomy that decides it.

export async function GET(request: NextRequest) {
  const interestParam = request.nextUrl.searchParams.get("interests") ?? "";
  const slugs = interestParam
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);

  function annotate<T extends { occupation: string }>(rows: T[]): (T & { matchedInterest: string | null })[] {
    return rows.map((row) => {
      if (!slugs.length) return { ...row, matchedInterest: null };
      // Same conservative matcher careerProfile/labor-stats already trust —
      // it refuses rather than guesses, so a row it can't resolve just gets
      // no badge instead of a wrong one.
      const match = matchOccupation(row.occupation);
      return { ...row, matchedInterest: match ? matchedInterestLabel(match.code, slugs) : null };
    });
  }

  return NextResponse.json({
    fastestGrowing: annotate(fastestGrowingOccupations()),
    mostNewJobs: annotate(mostNewJobsOccupations()),
    meta: projectionsMeta(),
  });
}
