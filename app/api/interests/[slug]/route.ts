import { NextRequest, NextResponse } from "next/server";
import { getInterestDetail } from "@/app/lib/interests";

// One interest's (or, from the browse-all page, one raw SOC group's) real
// job pool — see getInterestDetail for why both origins share this route.
//
// GET, not POST: a read with no side effects, same call /api/schools makes.

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const detail = getInterestDetail(params.slug);
  if (!detail) {
    return NextResponse.json({ error: "Unknown interest." }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();

  const limitParam = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 60;
  const offsetParam = Number(searchParams.get("offset"));
  const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;

  const filtered = query
    ? detail.jobs.filter((job) => job.title.toLowerCase().includes(query))
    : detail.jobs;

  return NextResponse.json({
    slug: detail.slug,
    label: detail.label,
    description: detail.description,
    jobs: filtered.slice(offset, offset + limit),
    total: filtered.length,
  });
}
