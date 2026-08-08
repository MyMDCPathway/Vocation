import { NextResponse } from "next/server";
import {
  fastestGrowingOccupations,
  mostNewJobsOccupations,
  projectionsMeta,
} from "@/app/lib/projections";

// The "trending occupations" data /insights renders — BLS's own committed
// snapshot (see app/lib/projections.ts for why this is a hand-transcribed
// file rather than a live fetch). No params: it's the same two tables for
// every visitor, so there is nothing here to filter or sort by request.

export async function GET() {
  return NextResponse.json({
    fastestGrowing: fastestGrowingOccupations(),
    mostNewJobs: mostNewJobsOccupations(),
    meta: projectionsMeta(),
  });
}
