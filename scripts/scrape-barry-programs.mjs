// Regenerates app/lib/programs/barry.ts from Barry University's own
// academic catalog.
//
//   npm run scrape:barry
//
// barry.smartcatalogiq.com is SmartCatalogIQ (the same platform as UT), not
// WAF-blocked. Unlike UT, Barry has a dedicated, purpose-built
// "Programs of Study" page for each catalog level
// (`.../undergraduate-catalog/programs-of-study`,
// `.../graduate-catalog/programs-of-study`) — a SmartCatalogIQ built-in
// widget (`id="sc-program-links"`) listing every linked program on one page,
// so no sitemap-filtering trick like UT's was needed. Worth checking for
// this exact page shape on any future SmartCatalogIQ school before falling
// back to UT's sitemap approach.
//
// Both pages mix real degree programs with policy pages, bare
// specialization/concentration tracks that don't carry their own credential
// ("Biochemistry Specialization", "Forensic Psychology Specialization"), and
// certificates — none of which have a credential code in their own title,
// which is what separates them from every real program page. Filtering on
// "does the title contain a real credential token" is what keeps only real,
// standalone, credentialed programs:
//   - Undergraduate page: keep titles containing a bachelor's-family token
//     (B.A./B.S./B.F.A./B.S.W./B.P.A./"Bachelor").
//   - Graduate page: keep titles containing a graduate-family token
//     (Master/Doctor(al/ate)/Ph.D./M.A./M.S./MBA/DNP/DSW/D.Min/MPH/J.D./
//     Ed.S). "Doctor\w*" rather than a bare "doctor" is needed because
//     "Juris Doctorate Program" doesn't contain the standalone word "doctor"
//     — \bdoctor\b doesn't match inside "Doctorate".
//
// A handful of undergraduate entries are themselves accelerated "B.S. ...
// to M.S. ..." combo tracks (e.g. "Kinesiology and Sport Sciences (B.S.
// KHPUS to M.S. KHPS SEPPG Seamless)") — the same combo-degree shape UM's
// and UT's catalogs hit. Since these also contain a graduate token, and
// programCatalog.ts's own matcher checks for a graduate hint before a
// bachelor's one, they're classified graduate here to match how the app
// actually reads them, not left as "bachelor" where they'd never resolve.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN = "https://barry.smartcatalogiq.com";
const UG_URL = `${ORIGIN}/en/2025-2026/undergraduate-catalog/programs-of-study`;
const GR_URL = `${ORIGIN}/en/2025-2026/graduate-catalog/programs-of-study`;

const UNDERGRAD_CREDENTIAL_RE = /\b(b\.?a\.?|b\.?s\.?|b\.?f\.?a\.?|b\.?s\.?w\.?|b\.?p\.?a\.?|bachelor)\b/i;
const GRADUATE_CREDENTIAL_RE =
  /\b(master|doctor\w*|ph\.?d|m\.?a\.?|m\.?s\.?|mba|dnp|dsw|d\.?min\.?|mph|j\.?d\.?|ed\.?s)\b/i;

const MIN_EXPECTED_BACHELOR = 30;
const MIN_EXPECTED_GRADUATE = 30;

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Vocation catalog scraper)" },
  });
  if (!response.ok) {
    throw new Error(`Barry returned HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

// The href's immediate parent folder names the offering department/school,
// e.g. ".../college-of-health-professions-and-medical-sciences/school-of-
// nursing/bachelor-of-science-in-nursing-program" -> "School of Nursing".
// Humanized rather than hand-mapped, since Barry (unlike ERAU's 4 colleges)
// has dozens of department folders.
const SMALL_WORDS = new Set(["of", "and", "the", "in", "for"]);
function areaFor(href) {
  const segments = href.split("/").filter(Boolean);
  const parent = segments[segments.length - 2] ?? "";
  const words = parent.replace(/^department-of-/, "department of ").split(/[- ]/).filter(Boolean);
  return words
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w.toLowerCase()) ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function parseProgramLinks(html) {
  const idx = html.indexOf('id="sc-program-links"');
  const section = html.slice(idx, idx + 80000);
  return [...section.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)].map((m) => ({
    href: m[1],
    name: decode(m[2]),
  }));
}

function parseUndergrad(html) {
  const programs = [];
  for (const { href, name } of parseProgramLinks(html)) {
    if (!UNDERGRAD_CREDENTIAL_RE.test(name)) continue;
    const level = GRADUATE_CREDENTIAL_RE.test(name) ? "graduate" : "bachelor";
    programs.push({ name, url: ORIGIN + href, level, area: areaFor(href) });
  }
  return programs;
}

function parseGraduate(html) {
  const programs = [];
  for (const { href, name } of parseProgramLinks(html)) {
    if (!GRADUATE_CREDENTIAL_RE.test(name)) continue;
    programs.push({ name, url: ORIGIN + href, level: "graduate", area: areaFor(href) });
  }
  return programs;
}

function dedupe(programs) {
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

  return `// Barry University degree catalog: program name -> official bulletin page.
//
// GENERATED FILE — do not edit by hand. Regenerate with:
//   npm run scrape:barry
//
// Source (undergraduate): ${UG_URL}
// Source (graduate):      ${GR_URL}
// Scraped:    ${today}
// Programs:   ${programs.length} (${bachelor} bachelor, ${graduate} graduate)
//
// Barry is a four-year private university (like UM/Stetson/ERAU/UT/FIU/
// UCF/...), so pathways start at the bachelor's rather than an associate
// degree — see universitySystemPrompt in app/lib/pathwayPrompts.ts.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const BARRY_PROGRAMS: SchoolProgram[] = [
${rows}
];

// Barry is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const barryCatalog = createProgramCatalog(BARRY_PROGRAMS, { preferred: "bachelor" });
`;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "app", "lib", "programs", "barry.ts");

async function main() {
  console.log(`Fetching ${UG_URL}`);
  const bachelor = parseUndergrad(await fetchHtml(UG_URL));

  console.log(`Fetching ${GR_URL}`);
  const graduate = parseGraduate(await fetchHtml(GR_URL));

  const programs = dedupe([...bachelor, ...graduate]).sort((a, b) =>
    a.level === b.level ? a.name.localeCompare(b.name) : a.level === "bachelor" ? -1 : 1
  );

  const bachelorCount = programs.filter((p) => p.level === "bachelor").length;
  const graduateCount = programs.length - bachelorCount;

  if (bachelorCount < MIN_EXPECTED_BACHELOR) {
    throw new Error(
      `Only found ${bachelorCount} bachelor's programs (expected at least ${MIN_EXPECTED_BACHELOR}). ` +
        `Refusing to overwrite the catalog with a likely-broken parse.`
    );
  }
  if (graduateCount < MIN_EXPECTED_GRADUATE) {
    throw new Error(
      `Only found ${graduateCount} graduate programs (expected at least ${MIN_EXPECTED_GRADUATE}). ` +
        `Refusing to overwrite the catalog with a likely-broken parse.`
    );
  }

  writeFileSync(OUT_FILE, render(programs), "utf8");

  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}`);
  console.log(`  ${programs.length} programs (${bachelorCount} bachelor, ${graduateCount} graduate)`);
}

main().catch((error) => {
  console.error(`\nScrape failed: ${error.message}`);
  process.exit(1);
});
