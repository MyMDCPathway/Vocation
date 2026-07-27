// Regenerates app/lib/programs/miami.ts from the University of Miami's own
// academic bulletin.
//
//   npm run scrape:um
//
// UM's bulletin (bulletin.miami.edu) is a CourseLeaf site, no WAF. Its
// Program Index page (bulletin.miami.edu/program-index/) is a single, fully
// server-rendered table listing every program at the school — undergraduate,
// graduate, Law, and Medicine — each with a real per-program link, its
// school/college, an Undergraduate/Graduate/Law/Medicine level column, and a
// Plan column (Major, Minor, Certificate, Masters, Co-major, Course of
// Study). A plain fetch() returns the whole table already in the HTML; no
// browser or pagination workaround needed — the best-case shape seen in this
// batch so far (real per-program links, like UF/UNF/FAU/FAMU, but in one
// single page and one single fetch).
//
// Filtering: only the Plan values that are a real standalone degree are kept
// (Major, Masters, Major/Certificate) — Minor, Certificate, Co-major, and
// "Course of Study" (the one hit is "Adult Student Access Program", not a
// degree) are excluded, the same call UCF's scraper made for minors and
// certificates. Two rows have a blank Plan (Intensive English Program /
// Intensive Language Institute, both non-degree language programs) and are
// excluded by the same filter.
//
// Level: the table's own Undergraduate/Graduate column is usually
// unambiguous ("Undergraduate" -> bachelor; "Graduate", "Law", or "Medical"
// alone -> graduate — UM's JD/LLM/S.J.D. and M.D. programs are graduate, the
// same call FIU's and UCF's catalogs made for their own JD/MD entries). ~60
// rows are combined 5-year bachelor's+master's tracks and read
// "Undergraduate/Graduate" (a few misspelled "Gradaute" on UM's own site,
// handled the same way) — every single one of these already names an
// explicit graduate credential in its own title (e.g. "Biology B.S./M.S.",
// "BBA/BSBA - MSF Dual Degree Program"), so they're classified graduate
// outright rather than split into two entries with no second URL to give the
// bachelor's-only half.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL = "https://bulletin.miami.edu/program-index/";
const ORIGIN = "https://bulletin.miami.edu";

const KEEP_PLANS = new Set(["Major", "Masters", "Major/Certificate"]);

const MIN_EXPECTED_BACHELOR = 100;
const MIN_EXPECTED_GRADUATE = 150;

const decode = (s) =>
  s
    .replace(/&amp;amp;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[­​]/g, "") // soft hyphen / zero-width space littered in a few rows
    .replace(/\s+/g, " ")
    .trim();

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Vocation catalog scraper)" },
  });
  if (!response.ok) {
    throw new Error(`UM returned HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

// A row's level column is "Undergraduate", "Graduate", "Law", "Medical", a
// combination of those with "/" or " / " or " and ", or (rarely) UM's own
// typo "Gradaute". Only "Undergraduate" alone means bachelor's; anything
// else — pure graduate-family or a combo with undergraduate — is graduate,
// since every combo row's own name already carries an explicit graduate
// credential (see header).
function classifyLevel(rawLevel) {
  const hasUndergrad = /undergraduate/i.test(rawLevel);
  const rest = rawLevel.replace(/undergraduate/gi, "");
  const hasGraduateFamily = /graduate|gradaute|graduat\b|law|medic/i.test(rest);
  if (hasUndergrad && !hasGraduateFamily) return "bachelor";
  return "graduate";
}

// Two real anomalies on UM's own Program Index, not parsing bugs — found by
// programCatalogs.test.ts's round-trip check, the same way every other
// university's scraper in this batch found its own site's quirks:
//
// - The URL slug for this row ends "...-ms/" (matching every other
//   "X B.S./Industrial Engineering M.S." dual-degree row in the same
//   catalog), but the row's own display name is missing its trailing
//   "M.S." — a truncation on UM's side. Corrected here rather than left to
//   read as a bachelor's-only program it isn't.
const NAME_FIXES = new Map([
  [
    "/undergraduate-academic-programs/engineering/electrical-computer-engineering/software-engineering-bs-industrial-engineering-ms/",
    "Software Engineering B.S./Industrial Engineering M.S.",
  ],
]);

// - This is a graduate certificate. Its own non-online sibling is correctly
//   tagged Plan="Certificate" and excluded by KEEP_PLANS; this "(Online)"
//   variant is inconsistently tagged Plan="Major" on UM's site. Excluded to
//   match its sibling rather than trusting the mistagged Plan value.
const EXCLUDED_HREFS = new Set([
  "/graduate-academic-programs/engineering/construction-management/sustainable-construction-certificate-online/",
]);

function parse(html) {
  const rowRe =
    /<tr><td><a href="([^"]+)">([^<]+)<\/a><\/td><td>([^<]*)<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td><\/tr>/g;

  const programs = [];
  for (const m of html.matchAll(rowRe)) {
    const [, href, rawName, rawArea, rawLevel, rawPlan] = m;
    const plan = rawPlan.trim();
    if (!KEEP_PLANS.has(plan)) continue;
    if (EXCLUDED_HREFS.has(href)) continue;

    // Almost every row is a path relative to ORIGIN, but a couple of rows
    // link straight to an external department site (e.g. Meteorology and
    // Physical Oceanography's own mps.rsmas.miami.edu) or to
    // next-bulletin.miami.edu — both already absolute URLs that must not be
    // prefixed with ORIGIN too.
    const url = /^https?:\/\//.test(href) ? href : ORIGIN + href;

    programs.push({
      name: NAME_FIXES.get(href) ?? decode(rawName),
      url,
      level: classifyLevel(rawLevel),
      area: decode(rawArea),
    });
  }

  // A handful of dual-degree entries are listed twice (once from the
  // undergraduate section, once from the graduate section) with two
  // different real URLs for the same name+level. Keep the one whose own URL
  // path matches the assigned level; otherwise keep the first seen.
  const byKey = new Map();
  for (const p of programs) {
    const key = `${p.name}|${p.level}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, p);
      continue;
    }
    const wantsGradPath = p.level === "graduate";
    const existingMatches = existing.url.includes(
      wantsGradPath ? "/graduate-academic-programs/" : "/undergraduate-academic-programs/"
    );
    const candidateMatches = p.url.includes(
      wantsGradPath ? "/graduate-academic-programs/" : "/undergraduate-academic-programs/"
    );
    if (candidateMatches && !existingMatches) byKey.set(key, p);
  }

  return [...byKey.values()];
}

function render(programs) {
  const today = new Date().toISOString().slice(0, 10);
  const bachelor = programs.filter((p) => p.level === "bachelor").length;
  const graduate = programs.length - bachelor;

  const rows = programs
    .map(
      (p) =>
        `  { name: ${JSON.stringify(p.name)}, url: ${JSON.stringify(p.url)}, ` +
        `level: ${JSON.stringify(p.level)}, area: ${JSON.stringify(p.area)} },`
    )
    .join("\n");

  return `// University of Miami degree catalog: program name -> official bulletin page.
//
// GENERATED FILE — do not edit by hand. Regenerate with:
//   npm run scrape:um
//
// Source:     ${SOURCE_URL}
// Scraped:    ${today}
// Programs:   ${programs.length} (${bachelor} bachelor, ${graduate} graduate)
//
// UM is a four-year private university (like FIU/UCF/UF/...), so pathways
// start at the bachelor's rather than an associate degree — see
// universitySystemPrompt in app/lib/pathwayPrompts.ts. Only "Major",
// "Masters", and "Major/Certificate" Plan rows are included; Minor,
// Certificate, Co-major, and "Course of Study" rows are excluded because
// they aren't a degree pathway on their own. JD/LLM/S.J.D. (Law) and M.D.
// (Medicine) programs are included at level "graduate", the same call FIU's
// and UCF's catalogs made for their own JD/MD entries. ~60 combined
// bachelor's+master's five-year tracks (level column "Undergraduate/
// Graduate") are classified graduate outright — every one of them already
// names an explicit graduate credential in its own title.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const UM_PROGRAMS: SchoolProgram[] = [
${rows}
];

// UM is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the master's of the same name.
export const umCatalog = createProgramCatalog(UM_PROGRAMS, { preferred: "bachelor" });
`;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "app", "lib", "programs", "miami.ts");

async function main() {
  console.log(`Fetching ${SOURCE_URL}`);
  const html = await fetchHtml(SOURCE_URL);
  const programs = parse(html)
    .sort((a, b) =>
      a.level === b.level ? a.name.localeCompare(b.name) : a.level === "bachelor" ? -1 : 1
    );

  const bachelor = programs.filter((p) => p.level === "bachelor").length;
  const graduate = programs.length - bachelor;

  if (bachelor < MIN_EXPECTED_BACHELOR) {
    throw new Error(
      `Only found ${bachelor} bachelor's programs (expected at least ${MIN_EXPECTED_BACHELOR}). ` +
        `Refusing to overwrite the catalog with a likely-broken parse.`
    );
  }
  if (graduate < MIN_EXPECTED_GRADUATE) {
    throw new Error(
      `Only found ${graduate} graduate programs (expected at least ${MIN_EXPECTED_GRADUATE}). ` +
        `Refusing to overwrite the catalog with a likely-broken parse.`
    );
  }

  writeFileSync(OUT_FILE, render(programs), "utf8");

  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}`);
  console.log(`  ${programs.length} programs (${bachelor} bachelor, ${graduate} graduate)`);
}

main().catch((error) => {
  console.error(`\nScrape failed: ${error.message}`);
  process.exit(1);
});
