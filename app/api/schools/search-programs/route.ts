import { NextRequest, NextResponse } from "next/server";
import { catalogFor, scrapedCatalogIds } from "@/app/lib/programCatalogs";
import {
  MDC_BACHELORS_URL_MAPPING,
  MDC_ASSOCIATE_ARTS_URL_MAPPING,
  MDC_ASSOCIATE_SCIENCE_URL_MAPPING,
} from "@/app/lib/mdc-programs";
import { getSchoolById } from "@/app/lib/floridaSchools";
import type { ProgramLevel } from "@/app/lib/programCatalog";

// "Which schools teach X" — search across every real, scraped program name in
// the app (5,173+ programs across 38 files, per HANDOFF's TL;DR), grouped by
// school so /schools' program-search filter can show "12 schools teach
// Nursing" rather than a flat list a student has to cross-reference by hand.
//
// MDC is folded in separately because its catalog isn't in programCatalogs.ts
// at all — it predates that abstraction and keeps its own bespoke
// name-to-URL mapping tables (mdc-programs.ts), split by credential level.
// See HANDOFF §7: "MDC is deliberately inconsistent with the others... this
// is not an oversight."
//
// Server-only search over data that already lives in the server bundle for
// pathway generation — no new fetch, no new source of truth, just a text
// filter over programs that are already real.

const MAX_MATCHES_PER_SCHOOL = 10;
const MAX_SCHOOLS = 40;
const MIN_QUERY_LENGTH = 2;

interface ProgramMatch {
  name: string;
  url: string;
  level: ProgramLevel | null;
}

interface SchoolMatches {
  schoolId: string;
  schoolName: string;
  matches: ProgramMatch[];
  /** True total before MAX_MATCHES_PER_SCHOOL truncates the list below. */
  totalMatches: number;
}

function searchMdc(query: string): ProgramMatch[] {
  const tables: [Record<string, string>, ProgramLevel][] = [
    [MDC_BACHELORS_URL_MAPPING, "bachelor"],
    [MDC_ASSOCIATE_ARTS_URL_MAPPING, "associate"],
    [MDC_ASSOCIATE_SCIENCE_URL_MAPPING, "associate"],
  ];

  const matches: ProgramMatch[] = [];
  const seenUrls = new Set<string>();
  for (const [table, level] of tables) {
    for (const [name, url] of Object.entries(table)) {
      if (!name.includes(query)) continue;
      // The same MDC program legitimately appears under several aliased
      // keys ("rn to bsn" and "bachelor of science in nursing (rn to bsn)"
      // both point at /bsn/, seen in mdc-programs.ts) — dedupe by URL so one
      // real program doesn't count as several matches.
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);
      matches.push({ name, url, level });
    }
  }
  return matches;
}

export async function POST(request: NextRequest) {
  const { query: rawQuery } = await request.json().catch(() => ({}));

  if (typeof rawQuery !== "string" || rawQuery.trim().length < MIN_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Query must be at least ${MIN_QUERY_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const query = rawQuery.trim().toLowerCase();
  const results: SchoolMatches[] = [];

  for (const schoolId of scrapedCatalogIds()) {
    const catalog = catalogFor(schoolId);
    if (!catalog) continue;

    const found = catalog.programs.filter((p) => p.name.toLowerCase().includes(query));
    if (!found.length) continue;

    const school = getSchoolById(schoolId);
    results.push({
      schoolId,
      schoolName: school?.name ?? schoolId,
      matches: found
        .slice(0, MAX_MATCHES_PER_SCHOOL)
        .map((p) => ({ name: p.name, url: p.url, level: p.level })),
      totalMatches: found.length,
    });
  }

  const mdcMatches = searchMdc(query);
  if (mdcMatches.length) {
    results.push({
      schoolId: "mdc",
      schoolName: getSchoolById("mdc")?.name ?? "Miami Dade College",
      matches: mdcMatches.slice(0, MAX_MATCHES_PER_SCHOOL),
      totalMatches: mdcMatches.length,
    });
  }

  // Most-relevant schools first — a school with many matching programs is a
  // stronger signal than one with a single loosely-matching name.
  results.sort((a, b) => b.totalMatches - a.totalMatches);

  let capped = results.slice(0, MAX_SCHOOLS);

  // MDC is the app's home institution, not just another catalog — see this
  // file's header on why it's carried separately at all. Ranking purely by
  // match count let it drop off the cap entirely once enough other schools'
  // catalogs (each naming several credential-level variants of the same
  // program) outranked MDC's own, more consolidated listing. A search for
  // "nursing" that finds 40 other schools and not the one the app is built
  // around is a worse answer than one that's one slot longer, so MDC is
  // pinned into the capped list whenever it has any real match at all.
  const mdcRank = results.findIndex((r) => r.schoolId === "mdc");
  if (mdcRank >= MAX_SCHOOLS) {
    capped = [...capped.slice(0, MAX_SCHOOLS - 1), results[mdcRank]];
  }

  return NextResponse.json({
    query: rawQuery.trim(),
    results: capped,
    schoolsSearched: scrapedCatalogIds().length + 1, // +1 for MDC
  });
}
