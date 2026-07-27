// Regenerates app/lib/programs/ncf.ts from New College of Florida's own site.
//
//   npm run scrape:ncf
//
// NCF isn't structured like the other universities scraped so far, because
// it genuinely isn't: NCF confers exactly one undergraduate degree — the
// Bachelor of Arts — across 49 "areas of concentration" (its term for what
// other schools call majors), all listed with real per-concentration links at
// ncf.edu/programs/. Since every one of them leads to the same B.A., setting
// credential: "B.A." for all 49 is a documented fact about the school, not a
// guess.
//
// Graduate is the opposite problem: there is no index page at all, just three
// individually-announced named programs (Marine Mammal Science, Applied Data
// Science, and an M.Ed. in Educational Leadership) scattered across NCF's own
// site. Hardcoded below with their real, verified URLs rather than invented —
// see HANDOFF.md §13 for why this is preferable to guessing at a nonexistent
// listing page.
//
// Re-run this when NCF updates its site. If the undergraduate count printed
// at the end drops sharply, NCF changed something structural and the parsing
// below needs updating. The three hardcoded graduate URLs should be spot
// checked by hand — there's no page listing them to verify against.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const UNDERGRAD_URL = "https://www.ncf.edu/programs/";

const MIN_EXPECTED_BACHELOR = 40;

const decode = (s) =>
  s
    .replace(/&#038;|&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .trim();

// Verified by hand against ncf.edu (2026-07-26) — no index page lists these,
// so unlike everything above this is not scraped, just kept accurate here.
// NCF's own program pages call the first two "Master's in X" without ever
// stating a specific credential abbreviation (no "M.S." or "M.A." appears on
// either page) — so "Master's" is used rather than guessing one. The third
// names its own credential in the program title itself.
const GRADUATE_PROGRAMS = [
  {
    name: "Marine Mammal Science",
    url: "https://www.ncf.edu/departments/mimms/",
    level: "graduate",
    credential: "Master's",
  },
  {
    name: "Applied Data Science",
    url: "https://www.ncf.edu/academics/ms-applied-data-science/",
    level: "graduate",
    credential: "Master's",
  },
  {
    name: "Educational Leadership",
    url: "https://www.ncf.edu/academics/master-of-education-in-educational-leadership/",
    level: "graduate",
    credential: "M.Ed.",
  },
];

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Vocation catalog scraper)" },
  });
  if (!response.ok) {
    throw new Error(`NCF returned HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

function parseUndergrad(html) {
  const re =
    /<a href="(https:\/\/www\.ncf\.edu\/programs\/[a-z0-9-]+\/)">\s*<span class="ncf-entity-item-title-text">([^<]+)<\/span>/g;

  const programs = [];
  const seen = new Set();
  for (const m of html.matchAll(re)) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    programs.push({
      name: decode(m[2]),
      url: m[1],
      level: "bachelor",
      // NCF's only undergraduate degree — every concentration leads here.
      credential: "B.A.",
    });
  }
  return programs;
}

function render(programs) {
  const today = new Date().toISOString().slice(0, 10);
  const bachelor = programs.filter((p) => p.level === "bachelor").length;
  const graduate = programs.length - bachelor;

  const rows = programs
    .map(
      (p) =>
        `  { name: ${JSON.stringify(p.name)}, url: ${JSON.stringify(p.url)}, ` +
        `level: ${JSON.stringify(p.level)}, credential: ${JSON.stringify(p.credential)} },`
    )
    .join("\n");

  return `// NCF degree catalog: program name -> official program page.
//
// GENERATED FILE — the bachelor's entries below are re-scraped by
//   npm run scrape:ncf
// The three graduate entries are hand-verified, not scraped — see the
// scraper's header comment for why NCF has no listing page for them.
//
// Source:     ${UNDERGRAD_URL} (bachelor's); hand-verified individual pages (graduate)
// Scraped:    ${today}
// Programs:   ${programs.length} (${bachelor} bachelor, ${graduate} graduate)
//
// NCF is a four-year university (like FIU/UCF/UF/FGCU/UWF), so pathways start
// at the bachelor's rather than an associate degree. Unlike every other
// school here, NCF confers only ONE undergraduate degree (B.A.) across all of
// its "areas of concentration" — that's why every bachelor's entry shares the
// same credential.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const NCF_PROGRAMS: SchoolProgram[] = [
${rows}
];

// NCF is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const ncfCatalog = createProgramCatalog(NCF_PROGRAMS, { preferred: "bachelor" });
`;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "app", "lib", "programs", "ncf.ts");

async function main() {
  console.log(`Fetching ${UNDERGRAD_URL}`);
  const bachelor = parseUndergrad(await fetchHtml(UNDERGRAD_URL));

  if (bachelor.length < MIN_EXPECTED_BACHELOR) {
    throw new Error(
      `Only found ${bachelor.length} bachelor's programs (expected at least ${MIN_EXPECTED_BACHELOR}). ` +
        `Refusing to overwrite the catalog with a likely-broken parse.`
    );
  }

  const programs = [...bachelor, ...GRADUATE_PROGRAMS].sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync(OUT_FILE, render(programs), "utf8");

  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}`);
  console.log(`  ${programs.length} programs (${bachelor.length} bachelor, ${GRADUATE_PROGRAMS.length} graduate)`);
}

main().catch((error) => {
  console.error(`\nScrape failed: ${error.message}`);
  process.exit(1);
});
