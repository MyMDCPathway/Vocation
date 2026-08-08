import { NextRequest, NextResponse } from "next/server";
import { catalogFor, scrapedCatalogIds } from "@/app/lib/programCatalogs";
import {
  MDC_BACHELORS_URL_MAPPING,
  MDC_ASSOCIATE_ARTS_URL_MAPPING,
  MDC_ASSOCIATE_SCIENCE_URL_MAPPING,
} from "@/app/lib/mdc-programs";
import { getSchoolById } from "@/app/lib/floridaSchools";
import { getSchoolInfo, hasSchoolInfo } from "@/app/lib/schoolInfo";
import type { ProgramLevel } from "@/app/lib/programCatalog";

// One school's real program list — the school-first flow's second screen:
// "What do you want to study at Miami Dade College?" with the school's own
// catalog underneath the search box, not a fabricated one.
//
// Same catalog sources /api/schools/search-programs already reads (MDC's own
// bespoke tables plus programCatalogs.ts for everyone else) — no new data,
// just scoped to one school and exposed with the school's real resource
// links as a fallback for a school we hold no catalog for at all, per Rule 1
// (never invent a program list).

interface ProgramEntry {
  name: string;
  url: string;
  level: ProgramLevel | null;
}

function mdcPrograms(): ProgramEntry[] {
  const tables: [Record<string, string>, ProgramLevel][] = [
    [MDC_BACHELORS_URL_MAPPING, "bachelor"],
    [MDC_ASSOCIATE_ARTS_URL_MAPPING, "associate"],
    [MDC_ASSOCIATE_SCIENCE_URL_MAPPING, "associate"],
  ];

  const entries: ProgramEntry[] = [];
  const seenUrls = new Set<string>();
  for (const [table, level] of tables) {
    for (const [name, url] of Object.entries(table)) {
      // The same program legitimately appears under several aliased keys
      // ("rn to bsn" and "bachelor of science in nursing (rn to bsn)" both
      // point at /bsn/) — dedupe by URL so one real program isn't listed twice.
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);
      entries.push({ name, url, level });
    }
  }
  return entries;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const schoolId = params.id;
  const school = getSchoolById(schoolId);
  if (!school) {
    return NextResponse.json({ error: "Unknown school." }, { status: 404 });
  }

  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();

  const hasCatalog = schoolId === "mdc" || scrapedCatalogIds().includes(schoolId);

  let programs: ProgramEntry[] = [];
  if (schoolId === "mdc") {
    programs = mdcPrograms();
  } else {
    const catalog = catalogFor(schoolId);
    if (catalog) {
      programs = catalog.programs.map((p) => ({ name: p.name, url: p.url, level: p.level }));
    }
  }

  if (query) {
    programs = programs.filter((p) => p.name.toLowerCase().includes(query));
  }
  programs.sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({
    schoolId,
    schoolName: school.name,
    hasCatalog,
    programs,
    // Real site links for a school we hold no catalog for — never a
    // fabricated program list standing in for one we don't have.
    resources: hasCatalog || !hasSchoolInfo(schoolId) ? [] : getSchoolInfo(schoolId).resources,
  });
}
