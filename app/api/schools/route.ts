import { NextRequest, NextResponse } from "next/server";
import {
  listDirectorySchools,
  listDirectoryStates,
  sortDirectorySchools,
  type SchoolSortKey,
} from "@/app/lib/schoolDirectory";
import { scorecardAvailable, scorecardMeta } from "@/app/lib/scorecard";
import type { SchoolKindRef } from "@/app/lib/schoolRef";

// The list /schools renders: every Florida school by default, or (via
// `state`) every real school nationwide the US Dept. of Education's College
// Scorecard tracks — see schoolDirectory.ts for why this can't just be a
// client import of the catalogs (232 kB, per /plan's own known cost —
// HANDOFF §14).
//
// GET, not POST: this is a read with no side effects and no free-text model
// input to worry about smuggling into a body, so query params are the
// simpler and more cacheable shape.

const SORT_KEYS: readonly SchoolSortKey[] = ["distance", "earnings", "completion", "price", "name"];
const KINDS: readonly SchoolKindRef[] = [
  "state-college",
  "public-university",
  "private",
  "community-college",
  "unknown",
];

function parseSort(value: string | null): SchoolSortKey {
  return (SORT_KEYS as readonly string[]).includes(value ?? "")
    ? (value as SchoolSortKey)
    : "name";
}

function parseFloat2(value: string | null): number | undefined {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const sort = parseSort(params.get("sort"));
  const kindParam = params.get("kind");
  const kind = (KINDS as readonly string[]).includes(kindParam ?? "")
    ? (kindParam as SchoolKindRef)
    : null;
  const catalogOnly = params.get("catalogOnly") === "1";
  const query = (params.get("q") ?? "").trim().toLowerCase();
  // "FL" (default) is unchanged existing behavior; "ALL" or a two-letter
  // code opts into the national scope — see listDirectorySchools.
  const state = (params.get("state") ?? "FL").trim() || "FL";

  const lat = parseFloat2(params.get("lat"));
  const lng = parseFloat2(params.get("lng"));
  const origin = lat !== undefined && lng !== undefined ? { lat, lng } : undefined;

  // A distance sort with no origin would silently fall back to "every school
  // ties, order is whatever Array.sort leaves it in" — refuse rather than
  // pretend that's a real ranking.
  if (sort === "distance" && !origin) {
    return NextResponse.json(
      { error: "Sorting by distance requires lat and lng." },
      { status: 400 }
    );
  }

  const limitParam = Number(params.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 60;
  const offsetParam = Number(params.get("offset"));
  const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;

  let schools = listDirectorySchools(origin, state);

  if (kind) schools = schools.filter((s) => s.kind === kind);
  if (catalogOnly) schools = schools.filter((s) => s.hasCatalog);
  if (query) schools = schools.filter((s) => s.name.toLowerCase().includes(query));

  const sorted = sortDirectorySchools(schools, sort);
  const page = sorted.slice(offset, offset + limit);

  return NextResponse.json({
    schools: page,
    total: sorted.length,
    // The full national list of states, regardless of the current filter —
    // populates the state-picker dropdown, which needs every option even
    // while a single state is selected.
    states: listDirectoryStates(),
    scorecard: { available: scorecardAvailable(), ...scorecardMeta() },
  });
}
