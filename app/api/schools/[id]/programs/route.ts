import { NextRequest, NextResponse } from "next/server";
import { catalogFor, scrapedCatalogIds } from "@/app/lib/programCatalogs";
import {
  MDC_BACHELORS_URL_MAPPING,
  MDC_ASSOCIATE_ARTS_URL_MAPPING,
  MDC_ASSOCIATE_SCIENCE_URL_MAPPING,
} from "@/app/lib/mdc-programs";
import { getDirectorySchoolById, type DirectorySchool } from "@/app/lib/schoolDirectory";
import { getSchoolInfo, hasSchoolInfo } from "@/app/lib/schoolInfo";
import type { ProgramLevel } from "@/app/lib/programCatalog";
import { careersForProgram } from "@/app/lib/programCareers";
import { matchedInterestLabel } from "@/app/lib/interests";

// One school's real program list — the school-first flow's second screen:
// "What do you want to study at Miami Dade College?" with the school's own
// catalog underneath the search box, not a fabricated one.
//
// Same catalog sources /api/schools/search-programs already reads (MDC's own
// bespoke tables plus programCatalogs.ts for everyone else) — no new data,
// just scoped to one school and exposed with the school's real resource
// links as a fallback for a school we hold no catalog for at all, per Rule 1
// (never invent a program list). Resolves both curated Florida schools and
// synthesized national ones (getDirectorySchoolById) — a synthesized school
// never has a scraped catalog or a curated schoolInfo.ts entry, so its
// fallback is the one real link Scorecard actually gives us: its own website.
//
// The optional `interests` query param — the signed-in user's stored
// interest slugs — pushes programs whose real CIP-to-SOC crosswalk lands in
// one of those interests to the top. Reuses careersForProgram() exactly as
// the "jobs this degree leads to" screen does, so a program that gets no
// badge here is the same program that would show no career list there —
// there's no separate, weaker matching path invented just for sorting.

interface ProgramEntry {
  name: string;
  url: string;
  level: ProgramLevel | null;
  matchedInterest: string | null;
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
      entries.push({ name, url, level, matchedInterest: null });
    }
  }
  return entries;
}

/** Real links for a school with no scraped catalog — a curated resource
 *  list where one exists, or the school's own real website (from Scorecard)
 *  as the last, still-real fallback. Never an invented catalog. */
function fallbackResources(schoolId: string, school: DirectorySchool) {
  if (hasSchoolInfo(schoolId)) return getSchoolInfo(schoolId).resources;
  if (school.website) {
    const url = /^https?:\/\//.test(school.website) ? school.website : `https://${school.website}`;
    return [{ label: `${school.name}'s website`, url }];
  }
  return [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const schoolId = params.id;
  const school = getDirectorySchoolById(schoolId);
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
      programs = catalog.programs.map((p) => ({
        name: p.name,
        url: p.url,
        level: p.level,
        matchedInterest: null,
      }));
    }
  }

  if (query) {
    programs = programs.filter((p) => p.name.toLowerCase().includes(query));
  }
  programs.sort((a, b) => a.name.localeCompare(b.name));

  const interestSlugs = (request.nextUrl.searchParams.get("interests") ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);

  if (interestSlugs.length) {
    for (const program of programs) {
      const result = careersForProgram(program.name);
      if (!result) continue;
      for (const career of result.careers) {
        const label = matchedInterestLabel(career.code, interestSlugs);
        if (label) {
          program.matchedInterest = label;
          break;
        }
      }
    }
    // Stable sort: preserves the alphabetical order already applied within
    // both the matched and unmatched groups.
    programs.sort((a, b) => (a.matchedInterest ? 0 : 1) - (b.matchedInterest ? 0 : 1));
  }

  return NextResponse.json({
    schoolId,
    schoolName: school.name,
    hasCatalog,
    programs,
    // Real site links for a school we hold no catalog for — never a
    // fabricated program list standing in for one we don't have.
    resources: hasCatalog ? [] : fallbackResources(schoolId, school),
    // The rest of the school's real identity — lets the client seed
    // desiredSchools (via directorySchoolToRef) so picking a program here
    // actually carries the school into the intake, not just the career.
    school: {
      id: school.id,
      name: school.name,
      city: school.city,
      state: school.state,
      kind: school.kind,
      hasCatalog: school.hasCatalog,
      website: school.website,
      latitude: school.latitude,
      longitude: school.longitude,
    },
  });
}
