// Regenerates app/lib/programs/uf.ts from the University of Florida's catalog.
//
//   npm run scrape:uf
//
// Two separate CourseLeaf sites, two different shapes:
//
// - Undergraduate (catalog.ufl.edu/UGRD/programs/) server-renders a filterable
//   card grid. Each card carries a title, a type ("major" / "minor" /
//   "certificate", optionally suffixed "| UF Online"), and a real per-program
//   "learn more" link. Only "major" cards are real bachelor's programs.
//   Department attribution comes from the card's filter_<id> classes, resolved
//   against the page's own "Department" filter-category checkbox list (the
//   only reliable place that id -> department name mapping exists).
//
// - Graduate (gradcatalog.ufl.edu/graduate/programs-college/) is a flat
//   "majors by college" sitemap: one real link per major, grouped under an
//   <h2> college heading. A major's own page can combine multiple graduate
//   credentials (e.g. Agronomy offers both an M.S. and a Ph.D. on one page) —
//   that's fine here, since this app's ProgramLevel only distinguishes
//   "bachelor" from "graduate", not individual graduate credentials.
//
// Re-run this when UF updates its catalog (each summer). If either count
// printed at the end drops sharply, or a fetch fails, UF changed something
// structural and the parsing below needs updating.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Mirrors normalizeProgramName in app/lib/programCatalog.ts (duplicated
// rather than imported — that file is TypeScript and this is a plain Node
// script). Used only to join UF's two catalog pages by major name, so minor
// copy-editing drift between them (e.g. "Family, Youth and Community
// Sciences" vs "Family, Youth, and Community Sciences" — an Oxford comma UF
// itself is inconsistent about) doesn't silently drop a real credential.
function normalizeProgramName(value) {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const UNDERGRAD_URL = "https://catalog.ufl.edu/UGRD/programs/";
const UNDERGRAD_ORIGIN = "https://catalog.ufl.edu";
const GRAD_URL = "https://gradcatalog.ufl.edu/graduate/programs-college/";
const GRAD_ORIGIN = "https://gradcatalog.ufl.edu";
const GRAD_DEGREE_TABLE_URL = "https://gradcatalog.ufl.edu/graduate/degrees/table/";

const MIN_EXPECTED_BACHELOR = 100;
const MIN_EXPECTED_GRADUATE = 100;

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
    throw new Error(`UF returned HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

function parseUndergrad(html) {
  // Build filter_<id> -> department name from the "Department" filter category.
  // Every filter category (Department, Curriculum Type, UF Online, AI at UF,
  // Interest) shares the same filter_<id> checkbox markup; only "Department"
  // is what we want for area attribution.
  const deptMap = new Map();
  const catRe = /<h2 class="cat-title">([^<]+)<\/h2><ul id="cat\d+list">([\s\S]*?)<\/ul>/g;
  for (const cm of html.matchAll(catRe)) {
    if (cm[1] !== "Department") continue;
    const itemRe =
      /id="filter_(\d+)"[^>]*\/><span class="checkbox"><\/span><label for="filter_\d+">([^<]+)<\/label>/g;
    for (const im of cm[2].matchAll(itemRe)) deptMap.set(im[1], im[2]);
  }

  const programs = [];
  const seen = new Set();
  const itemRe = /<li id="isotope-item\d+" class="item ([^"]+)">([\s\S]*?)<\/li>/g;
  for (const m of html.matchAll(itemRe)) {
    const classes = m[1].split(" ");
    const block = m[2];
    const titleM = block.match(/<span class="title">([^<]+)<\/span>/);
    const typeM = block.match(/<span class="type">([^<]+)<\/span>/);
    const linkM = block.match(/<a class="learn-more" href="([^"]+)">/);
    if (!titleM || !typeM || !linkM) continue;
    if (!typeM[1].startsWith("major")) continue; // skip minors/certificates

    const key = `${titleM[1]}|${linkM[1]}`;
    if (seen.has(key)) continue; // the grid markup can repeat a card block
    seen.add(key);

    const area = classes
      .map((c) => c.replace("filter_", ""))
      .map((id) => deptMap.get(id))
      .find(Boolean);

    programs.push({
      name: decode(titleM[1]),
      url: new URL(linkM[1], UNDERGRAD_ORIGIN).toString(),
      level: "bachelor",
      area: area ? decode(area) : "",
    });
  }
  return programs;
}

// Verified by hand (not detectable from the listing pages this scraper reads):
// still listed in the majors-by-college sitemap, but its own page says
// "Admission to this program has been suspended" and it's absent from the
// active Graduate Degree Table for that reason. Recommending a pathway step
// a student can't actually enroll in is worse than one fewer program listed.
const SUSPENDED_GRADUATE_MAJORS = new Set(["religion"]);

function parseGraduate(html, credentials) {
  const programs = [];
  const blockRe = /<h2 class="introtext">([^<]+)<\/h2>\s*<div class="sitemap">([\s\S]*?)<\/div>/g;
  for (const bm of html.matchAll(blockRe)) {
    const college = bm[1].trim();
    const linkRe = /<li><a href="([^"]+)">([^<]+)<\/a><\/li>/g;
    for (const lm of bm[2].matchAll(linkRe)) {
      const name = decode(lm[2]);
      const key = normalizeProgramName(name);
      if (SUSPENDED_GRADUATE_MAJORS.has(key)) continue;

      const categories = credentials.get(key);
      programs.push({
        name,
        url: new URL(lm[1], GRAD_ORIGIN).toString(),
        level: "graduate",
        area: decode(college),
        ...(categories ? { credential: [...categories].sort().join(", ") } : {}),
      });
    }
  }
  return programs;
}

// The degree table groups majors under degree-type headings ("Master's
// Degrees", "Doctoral Degrees") rather than exposing a credential per major
// directly. A major appearing under "Master of Accounting (M.Acc.)" gets
// credential category "Master"; one offered as both an M.S. and a Ph.D. (e.g.
// Agronomy) gets both. This is real UF data — just the degree-TYPE word, not
// a fabricated level marker — and "master"/"doctor"/"specialist" are already
// (or become, for "specialist") recognized level hints, so it disambiguates
// UF's many same-named bachelor's/graduate majors without inventing anything.
function parseGraduateCredentials(html) {
  const majorToCategories = new Map();
  const headingRe =
    /<h3 class="toggle"><strong><a id="[^"]*" name="[^"]*"><\/a>([^<]+)(?:<sup>[^<]*<\/sup>)?<\/strong><\/h3>/g;
  const headings = [...html.matchAll(headingRe)].map((m) => ({
    index: m.index,
    end: m.index + m[0].length,
    text: decode(m[1]),
  }));

  for (let i = 0; i < headings.length; i++) {
    const category = /^Master/i.test(headings[i].text)
      ? "Master"
      : /^Doctor/i.test(headings[i].text)
        ? "Doctor"
        : /^Specialist/i.test(headings[i].text)
          ? "Specialist"
          : null;
    if (!category) continue;

    const chunkEnd = i + 1 < headings.length ? headings[i + 1].index : html.length;
    const chunk = html.slice(headings[i].end, chunkEnd);
    // Top-level majors only — a concentration nested under a major is always
    // italicized (<em>), which this negative lookahead excludes.
    // Almost always <li>Name<sup>T/N</sup></li>, but at least one entry
    // (Health Education and Behavior) wraps the sup in a stray <em> with no
    // actual nested concentration list — tolerate that shape too.
    const majorRe = /<li>(?!<em>)([^<]+?)\s*(?:<em>)?<sup>/g;
    for (const mm of chunk.matchAll(majorRe)) {
      const key = normalizeProgramName(decode(mm[1]));
      const categories = majorToCategories.get(key) ?? new Set();
      categories.add(category);
      majorToCategories.set(key, categories);
    }
  }
  return majorToCategories;
}

function render(programs) {
  const today = new Date().toISOString().slice(0, 10);
  const bachelor = programs.filter((p) => p.level === "bachelor").length;
  const graduate = programs.length - bachelor;

  const rows = programs
    .map(
      (p) =>
        `  { name: ${JSON.stringify(p.name)}, url: ${JSON.stringify(p.url)}, ` +
        `level: ${JSON.stringify(p.level)}, area: ${JSON.stringify(p.area)}` +
        (p.credential ? `, credential: ${JSON.stringify(p.credential)}` : "") +
        ` },`
    )
    .join("\n");

  return `// UF degree catalog: program name -> official program page.
//
// GENERATED FILE — do not edit by hand. Regenerate with:
//   npm run scrape:uf
//
// Source:     ${UNDERGRAD_URL}
//             ${GRAD_URL}
// Scraped:    ${today}
// Programs:   ${programs.length} (${bachelor} bachelor, ${graduate} graduate)
//
// UF is a four-year university (like FIU/UCF), so pathways start at the
// bachelor's rather than an associate degree. Undergraduate entries are
// "major"-type cards only (minors/certificates excluded). Graduate entries
// come from the majors-by-college sitemap; a major's own page can list more
// than one graduate credential (e.g. both an M.S. and a Ph.D.), which is fine
// since this app's ProgramLevel doesn't distinguish between them.
//
// Many UF majors share an IDENTICAL name between the bachelor's and graduate
// catalogs (e.g. "Accounting" is both), unlike FIU/UCF where the credential is
// embedded in the name itself. Graduate entries get a credential field joined
// from the Graduate Degree Table ("Master", "Doctor", "Specialist") so
// programCatalog.ts's matcher can tell them apart — see programCatalogs.test.ts.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const UF_PROGRAMS: SchoolProgram[] = [
${rows}
];

// UF is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of same name.
export const ufCatalog = createProgramCatalog(UF_PROGRAMS, { preferred: "bachelor" });
`;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "app", "lib", "programs", "uf.ts");

async function main() {
  console.log(`Fetching ${UNDERGRAD_URL}`);
  const bachelor = parseUndergrad(await fetchHtml(UNDERGRAD_URL));

  console.log(`Fetching ${GRAD_URL}`);
  console.log(`Fetching ${GRAD_DEGREE_TABLE_URL}`);
  const [gradHtml, degreeTableHtml] = await Promise.all([
    fetchHtml(GRAD_URL),
    fetchHtml(GRAD_DEGREE_TABLE_URL),
  ]);
  const credentials = parseGraduateCredentials(degreeTableHtml);
  const graduate = parseGraduate(gradHtml, credentials);

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
  console.log(`  ${new Set(programs.map((p) => p.area)).size} areas`);
}

main().catch((error) => {
  console.error(`\nScrape failed: ${error.message}`);
  process.exit(1);
});
