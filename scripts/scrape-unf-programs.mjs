// Regenerates app/lib/programs/unf.ts from the University of North Florida's
// catalog.
//
//   npm run scrape:unf
//
// UNF's whole "Programs of Study" page (unf.edu/catalog/programs/index.html)
// is a single, large, server-rendered page listing every program across both
// levels and all colleges, each with a real per-program link and its own
// credential code in parens — e.g. "Health Science - Interdisciplinary
// Health Studies (BSH)". The link's path prefix ("ug/" or "gr/") states the
// level directly, so no separate graduate source is needed the way UF's was.
//
// The credential code's first letter is the level signal: "B..." is a
// bachelor's, "C..." is a certificate (CB/CM/CU — excluded), and no
// credential at all means a minor (also excluded). Everything else (D..., M...,
// PHD, EDD) is graduate.
//
// Re-run this when UNF updates its catalog. If either count printed at the
// end drops sharply, UNF changed something structural and the parsing below
// needs updating.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL = "https://www.unf.edu/catalog/programs/index.html";
const ORIGIN = "https://www.unf.edu/catalog/programs/";

const MIN_EXPECTED_BACHELOR = 100;
const MIN_EXPECTED_GRADUATE = 80;

const COLLEGE_NAMES = {
  brooks: "Brooks College of Health",
  coggin: "Coggin College of Business",
  coas: "College of Arts and Sciences",
  ccec: "College of Computing, Engineering and Construction",
  coehs: "Silverfield College of Education and Human Services",
  univ: "University",
};

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
    throw new Error(`UNF returned HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

function parse(html) {
  const linkRe = /<a href="(ug|gr)\/([a-z]+)\/([^"]+\.html)">([\s\S]*?)<\/a>/g;

  const programs = [];
  const seen = new Set();
  for (const m of html.matchAll(linkRe)) {
    const [, levelPath, collegeCode, file, rawText] = m;
    const key = `${levelPath}/${collegeCode}/${file}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const text = decode(rawText.replace(/<span[^>]*class="hidden"[^>]*>[\s\S]*?<\/span>/, ""));
    const credentialMatch = text.match(/\(([^)]+)\)\s*$/);
    if (!credentialMatch) continue; // minors have no credential code — excluded

    const credential = credentialMatch[1];
    if (credential.startsWith("C")) continue; // certificate codes (CB/CM/CU)

    programs.push({
      name: text.slice(0, credentialMatch.index).trim(),
      url: new URL(`${levelPath}/${collegeCode}/${file}`, ORIGIN).toString(),
      level: credential.startsWith("B") ? "bachelor" : "graduate",
      credential,
      area: COLLEGE_NAMES[collegeCode] ?? "",
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
        `level: ${JSON.stringify(p.level)}, credential: ${JSON.stringify(p.credential)}, ` +
        `area: ${JSON.stringify(p.area)} },`
    )
    .join("\n");

  return `// UNF degree catalog: program name -> official program page.
//
// GENERATED FILE — do not edit by hand. Regenerate with:
//   npm run scrape:unf
//
// Source:     ${SOURCE_URL}
// Scraped:    ${today}
// Programs:   ${programs.length} (${bachelor} bachelor, ${graduate} graduate)
//
// UNF is a four-year university (like FIU/UCF/UF/FGCU/UWF/NCF), so pathways
// start at the bachelor's rather than an associate degree. Every entry's own
// credential (e.g. "BSH", "MPH", "PHD") comes straight from UNF's combined
// Programs of Study page; minors (no credential shown) and certificates
// (credential starting with "C") are excluded.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const UNF_PROGRAMS: SchoolProgram[] = [
${rows}
];

// UNF is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const unfCatalog = createProgramCatalog(UNF_PROGRAMS, { preferred: "bachelor" });
`;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "app", "lib", "programs", "unf.ts");

async function main() {
  console.log(`Fetching ${SOURCE_URL}`);
  const programs = parse(await fetchHtml(SOURCE_URL));

  const bachelor = programs.filter((p) => p.level === "bachelor");
  const graduate = programs.filter((p) => p.level === "graduate");

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

  const sorted = [...programs].sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync(OUT_FILE, render(sorted), "utf8");

  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}`);
  console.log(`  ${sorted.length} programs (${bachelor.length} bachelor, ${graduate.length} graduate)`);
}

main().catch((error) => {
  console.error(`\nScrape failed: ${error.message}`);
  process.exit(1);
});
