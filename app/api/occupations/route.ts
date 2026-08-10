import { NextRequest, NextResponse } from "next/server";
import occupationTable from "@/data/bls-occupations.json";
import type { Occupation } from "@/app/lib/blsOccupations";

// Search across all 830 BLS occupations by title, unscoped to any interest
// group — /api/interests/[slug] only searches within one interest's pool.
// Onboarding's career-goals screen uses this so a goal outside the suggested
// list (drawn from the interests just picked) is still just a search away,
// same GET-with-q-and-pagination shape as that route.

const OCCUPATIONS = occupationTable as Occupation[];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();

  const limitParam = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 60;
  const offsetParam = Number(searchParams.get("offset"));
  const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;

  const filtered = query
    ? OCCUPATIONS.filter((job) => job.title.toLowerCase().includes(query))
    : OCCUPATIONS;

  return NextResponse.json({
    jobs: filtered.slice(offset, offset + limit),
    total: filtered.length,
  });
}
