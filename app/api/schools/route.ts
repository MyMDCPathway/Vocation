import { NextRequest, NextResponse } from "next/server";
import {
  listDirectorySchools,
  sortDirectorySchools,
  type SchoolSortKey,
} from "@/app/lib/schoolDirectory";
import { scorecardAvailable, scorecardMeta } from "@/app/lib/scorecard";
import type { SchoolKind } from "@/app/lib/floridaSchools";

// The list /schools renders: every Florida school, optionally filtered and
// sorted, with real distance and Scorecard figures folded in server-side —
// see schoolDirectory.ts for why this can't just be a client import of the
// catalogs (232 kB, per /plan's own known cost — HANDOFF §14).
//
// GET, not POST: this is a read with no side effects and no free-text model
// input to worry about smuggling into a body, so query params are the
// simpler and more cacheable shape.

const SORT_KEYS: readonly SchoolSortKey[] = ["distance", "earnings", "completion", "price", "name"];
const KINDS: readonly SchoolKind[] = ["state-college", "public-university", "private"];

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
    ? (kindParam as SchoolKind)
    : null;
  const catalogOnly = params.get("catalogOnly") === "1";
  const query = (params.get("q") ?? "").trim().toLowerCase();

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

  let schools = listDirectorySchools(origin);

  if (kind) schools = schools.filter((s) => s.kind === kind);
  if (catalogOnly) schools = schools.filter((s) => s.hasCatalog);
  if (query) schools = schools.filter((s) => s.name.toLowerCase().includes(query));

  const sorted = sortDirectorySchools(schools, sort);
  const page = sorted.slice(offset, offset + limit);

  return NextResponse.json({
    schools: page,
    total: sorted.length,
    scorecard: { available: scorecardAvailable(), ...scorecardMeta() },
  });
}
