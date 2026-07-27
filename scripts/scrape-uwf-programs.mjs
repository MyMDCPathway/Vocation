// Regenerates app/lib/programs/uwf.ts from the University of West Florida's
// academic catalog.
//
//   npm run scrape:uwf
//
// UWF is CourseLeaf, like UF and FGCU, and (like both) has no WAF blocking a
// plain fetch(). Each catalog level (undergraduate, graduate) publishes an
// "A-Z Directory" page mixing real degree program links with policy/topic
// entries ("Admissions", "Tuition and Fees", ...) under the same markup. Real
// programs are the ones whose link text ends in a "Name, CREDENTIAL" pattern
// (e.g. "Accounting, B.S.B.A.", "Accountancy, M.Acc.") — policy entries never
// have a trailing credential, so that's the filter.
//
// Re-run this when UWF updates its catalog. If either count printed at the
// end drops sharply, UWF changed something structural and the parsing below
// needs updating.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const UNDERGRAD_URL = "https://catalog.uwf.edu/undergraduate/azindex/";
const GRAD_URL = "https://catalog.uwf.edu/graduate/azindex/";
const ORIGIN = "https://catalog.uwf.edu";

const MIN_EXPECTED_BACHELOR = 30;
const MIN_EXPECTED_GRADUATE = 20;

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Vocation catalog scraper)" },
  });
  if (!response.ok) {
    throw new Error(`UWF returned HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

function parse(html, { pathPrefix, level }) {
  const linkRe = new RegExp(`<a href="(${pathPrefix}[a-z0-9-]+/)">([^<]+)</a>`, "g");
  const credentialRe = /^(.+),\s*([A-Z][A-Za-z.]+\.)$/;

  const programs = [];
  const seen = new Set();
  for (const m of html.matchAll(linkRe)) {
    const text = decode(m[2]);
    const match = text.match(credentialRe);
    if (!match) continue; // policy/topic entries never end in a credential

    const key = m[1];
    if (seen.has(key)) continue; // the A-Z page repeats entries alphabetically
    seen.add(key);

    programs.push({
      name: match[1],
      url: new URL(m[1], ORIGIN).toString(),
      level,
      credential: match[2],
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

  return `// UWF degree catalog: program name -> official program page.
//
// GENERATED FILE — do not edit by hand. Regenerate with:
//   npm run scrape:uwf
//
// Source:     ${UNDERGRAD_URL}
//             ${GRAD_URL}
// Scraped:    ${today}
// Programs:   ${programs.length} (${bachelor} bachelor, ${graduate} graduate)
//
// UWF is a four-year university (like FIU/UCF/UF/FGCU), so pathways start at
// the bachelor's rather than an associate degree. Every entry's own
// credential (e.g. "B.S.B.A.", "M.Acc.") comes straight from UWF's A-Z
// directory pages, which list real degree programs as "Name, CREDENTIAL" —
// policy and topic entries on the same pages never have that suffix and are
// excluded.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const UWF_PROGRAMS: SchoolProgram[] = [
${rows}
];

// UWF is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const uwfCatalog = createProgramCatalog(UWF_PROGRAMS, { preferred: "bachelor" });
`;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "app", "lib", "programs", "uwf.ts");

async function main() {
  console.log(`Fetching ${UNDERGRAD_URL}`);
  const bachelor = parse(await fetchHtml(UNDERGRAD_URL), {
    pathPrefix: "/undergraduate/",
    level: "bachelor",
  });

  console.log(`Fetching ${GRAD_URL}`);
  const graduate = parse(await fetchHtml(GRAD_URL), {
    pathPrefix: "/graduate/",
    level: "graduate",
  });

  if (bachelor.length < MIN_EXPECTED_BACHELOR) {
    throw new Error(
      `Only found ${bachelor.length} bachelor's programs (expected at least ${MIN_EXPECTED_BACHELOR}). ` +
        `Refusing to overwrite the catalog with a likely-broken parse.`
    );
  }
  if (graduate.length < MIN_EXPECTED_GRADUATE) {
    throw new Error(
      `Only found ${graduate.length} graduate programs (expected at least ${MIN_EXPECTED_GRADUATE}). ` +
        `Refusing to overwrite the catalog with a likely-broken parse.`
    );
  }

  const programs = [...bachelor, ...graduate].sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync(OUT_FILE, render(programs), "utf8");

  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}`);
  console.log(`  ${programs.length} programs (${bachelor.length} bachelor, ${graduate.length} graduate)`);
}

main().catch((error) => {
  console.error(`\nScrape failed: ${error.message}`);
  process.exit(1);
});
