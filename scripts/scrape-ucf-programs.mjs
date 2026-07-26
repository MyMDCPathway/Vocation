// Regenerates app/lib/programs/ucf.ts from UCF's academic catalog.
//
//   npm run scrape:ucf
//
// UCF's catalog (catalog.ucf.edu, both undergraduate and graduate editions) is
// a Kuali Catalog instance — a JS single-page app that renders nothing without
// a browser, but backs onto a plain JSON REST API at ucf.kuali.co. This script
// hits that API directly instead of driving a browser, which is both faster
// and immune to whatever markup the SPA happens to render this month.
//
// Two separate catalogs (each with its own catalog id) back the undergraduate
// and graduate editions. A program's `pid` is what the SPA's hash router reads
// (#/programs/<pid>), so that's how the browsable URL is reconstructed.
//
// Re-run this when UCF updates its catalog (each Fall). If the counts printed
// at the end drop sharply, or a fetch fails, UCF changed something structural
// and the catalog ids or program-type filters below need updating.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const UNDERGRAD_CATALOG_ID = "66bcc88cf93938001c548373";
const GRAD_CATALOG_ID = "680f83ed108fd8c229965c69";
const API = "https://ucf.kuali.co/api/v1/catalog/programs";

const UNDERGRAD_URL_BASE = "https://www.ucf.edu/catalog/undergraduate/#/programs/";
const GRAD_URL_BASE = "https://www.ucf.edu/catalog/graduate/#/programs/";

// Only real, standalone degree programs — not minors (not a career pathway on
// their own), certificates (§13 of HANDOFF.md: this app's "bachelor"/"graduate"
// levels mean full degrees), or "Articulated A.S." (an associate-level dual
// enrollment track, not a UCF degree).
const UNDERGRAD_DEGREE_TYPES = new Set(["Major"]);
const GRAD_DEGREE_TYPES = new Set(["Master", "Doctoral", "Master of Fine Arts", "Specialist"]);

// Below this, assume the API changed shape rather than that UCF cut its catalog.
const MIN_EXPECTED_BACHELOR = 100;
const MIN_EXPECTED_GRADUATE = 100;

async function fetchCatalog(catalogId) {
  const url = `${API}/${catalogId}?q=`;
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Vocation catalog scraper)" },
  });
  if (!response.ok) {
    throw new Error(`UCF catalog API returned HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

function mapPrograms(entries, { typeField, allowedTypes, urlBase, level }) {
  const programs = [];
  for (const entry of entries) {
    const typeName = entry[typeField]?.name;
    if (!allowedTypes.has(typeName)) continue;
    if (!entry.pid || !entry.title) continue;

    programs.push({
      name: entry.title.trim(),
      url: `${urlBase}${entry.pid}`,
      level,
      area: entry.groupFilter1?.name ?? "",
    });
  }

  // The same title can appear more than once across catalog revisions.
  const seen = new Map();
  for (const p of programs) {
    const key = `${p.name}|${p.level}`;
    if (!seen.has(key)) seen.set(key, p);
  }
  return [...seen.values()];
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

  return `// UCF degree catalog: program name -> official program page.
//
// GENERATED FILE — do not edit by hand. Regenerate with:
//   npm run scrape:ucf
//
// Source:     https://ucf.kuali.co/api/v1/catalog/programs/${UNDERGRAD_CATALOG_ID}
//             https://ucf.kuali.co/api/v1/catalog/programs/${GRAD_CATALOG_ID}
// Scraped:    ${today}
// Programs:   ${programs.length} (${bachelor} bachelor, ${graduate} graduate)
//
// UCF is a four-year university (like FIU), so pathways start at the
// bachelor's rather than an associate degree — see universitySystemPrompt in
// app/lib/pathwayPrompts.ts. Only "Major" (undergrad) and
// "Master"/"Doctoral"/"Master of Fine Arts"/"Specialist" (grad) program types
// are included; minors, certificates, and the associate-level "Articulated
// A.S." track are excluded because they aren't a degree pathway on their own.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const UCF_PROGRAMS: SchoolProgram[] = [
${rows}
];

// UCF is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the master's of the same name.
export const ucfCatalog = createProgramCatalog(UCF_PROGRAMS, { preferred: "bachelor" });
`;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "app", "lib", "programs", "ucf.ts");

async function main() {
  console.log(`Fetching UCF undergraduate catalog (${UNDERGRAD_CATALOG_ID})`);
  const undergradData = await fetchCatalog(UNDERGRAD_CATALOG_ID);
  const bachelor = mapPrograms(undergradData, {
    typeField: "programTypeUndergrad",
    allowedTypes: UNDERGRAD_DEGREE_TYPES,
    urlBase: UNDERGRAD_URL_BASE,
    level: "bachelor",
  });

  console.log(`Fetching UCF graduate catalog (${GRAD_CATALOG_ID})`);
  const gradData = await fetchCatalog(GRAD_CATALOG_ID);
  const graduate = mapPrograms(gradData, {
    typeField: "programTypeGrad",
    allowedTypes: GRAD_DEGREE_TYPES,
    urlBase: GRAD_URL_BASE,
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
  console.log(`  ${new Set(programs.map((p) => p.area)).size} colleges`);
}

main().catch((error) => {
  console.error(`\nScrape failed: ${error.message}`);
  process.exit(1);
});
