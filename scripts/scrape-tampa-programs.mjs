// Regenerates app/lib/programs/tampa.ts from the University of Tampa's own
// academic catalog.
//
//   npm run scrape:tampa
//
// UT's catalog (ut.smartcatalogiq.com) runs SmartCatalogIQ — the third
// catalog platform seen in this project after CourseLeaf and Acalog, and
// (unlike every Acalog site hit so far) not WAF-blocked. No single flat
// listing page covers every program the way UM's Program Index or ERAU's
// academic-programs page did, so undergraduate and graduate are scraped two
// different ways:
//
// - Undergraduate: no dedicated program-list page exists, but the site's own
//   `/site-map` page is a complete, clean, nested link tree of the whole
//   catalog with real display text on every link (not just raw hrefs). Real
//   major pages all live under one of UT's four undergraduate colleges
//   (Arts and Letters, Natural and Health Sciences, Social Sciences/
//   Mathematics/Education, Sykes College of Business) and their own link
//   text either contains the word "Major" ("Actuarial Science Major",
//   "History Major with Global History, Culture, and Geography
//   Concentration") or starts with "Bachelor of" (Art/Music/Museum Studies
//   programs, which don't use the word "Major" at all). Filtering the
//   sitemap down to links under those four college paths matching either
//   pattern is what separates real program pages from the sitemap's many
//   policy/financial-aid/admissions pages — including a few real false
//   positives that also contain the word "major" outside those four college
//   paths ("Double Majors", "Declaring/Changing Your Advisor or Major",
//   "Spartan Studies Major Overlap" — all policy pages, correctly excluded
//   by the college-path restriction alone).
//
// - Graduate: UT maintains a single hand-curated "Graduate Degree Programs"
//   page, grouped by `<strong>College Name</strong>` heading with real
//   per-program links whose own anchor text already states the complete
//   credential ("Master of Science in Business Analytics") — no name
//   synthesis needed, the heading is only used for the `area` field. One
//   self-referential breadcrumb-style link back to the parent page is
//   excluded.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN = "https://ut.smartcatalogiq.com";
const SITEMAP_URL = `${ORIGIN}/en/current/catalog/site-map`;
const GRAD_URL = `${ORIGIN}/en/current/catalog/graduate-catalog/graduate-academic-programs/graduate-degree-programs`;

const UNDERGRAD_COLLEGES = {
  "college-of-arts-and-letters": "College of Arts and Letters",
  "college-of-natural-and-health-sciences": "College of Natural and Health Sciences",
  "college-of-social-sciences-mathematics-and-education":
    "College of Social Sciences, Mathematics and Education",
  "sykes-college-of-business": "Sykes College of Business",
};

const MIN_EXPECTED_BACHELOR = 50;
const MIN_EXPECTED_GRADUATE = 15;

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
    throw new Error(`UT returned HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

function parseUndergrad(html) {
  const programs = [];
  const linkRe = /<a href="(\/en\/current\/catalog\/undergraduate-catalog\/[^"]+)">([^<]+)<\/a>/g;
  for (const m of html.matchAll(linkRe)) {
    const href = m[1];
    const text = decode(m[2]);
    const segments = href.split("/");
    const collegeSlug = segments[5];
    const area = UNDERGRAD_COLLEGES[collegeSlug];
    if (!area) continue; // not under one of the 4 degree-granting colleges

    const isMajor = /major/i.test(text);
    const isBachelorNamed = /^Bachelor of/.test(text);
    if (!isMajor && !isBachelorNamed) continue;

    // A handful of accelerated "Bachelor of X.../3+2 Master of Y..." combo
    // tracks name both credentials in one title. programCatalog.ts's own
    // matcher checks for a graduate hint before a bachelor's one, so storing
    // these as "bachelor" makes them permanently unfindable — the same
    // combo-degree shape UM's catalog hit. Classify as graduate to match how
    // the app's own matcher reads the name.
    const level = /\b(master|doctor|ph\.?d)\b/i.test(text) ? "graduate" : "bachelor";

    programs.push({ name: text, url: ORIGIN + href, level, area });
  }
  return programs;
}

function parseGraduate(html) {
  const start = html.indexOf('id="main"');
  const end = html.indexOf('id="footer', start);
  const section = html.slice(start, end === -1 ? undefined : end);

  const headingRe = /<p><strong>([^<]+)<\/strong><\/p>/g;
  const headings = [...section.matchAll(headingRe)].map((m) => ({
    index: m.index,
    text: decode(m[1]),
  }));

  const programs = [];
  for (const m of section.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)) {
    const href = m[1];
    if (!href.includes("/graduate-study-in-the-college")) continue; // skip the self-referential breadcrumb link
    const name = decode(m[2]);
    const heading = [...headings].reverse().find((h) => h.index < m.index);
    programs.push({
      name,
      url: href.startsWith("http") ? href : ORIGIN + href,
      level: "graduate",
      area: heading?.text ?? "Graduate Studies",
    });
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

  return `// University of Tampa degree catalog: program name -> official bulletin page.
//
// GENERATED FILE — do not edit by hand. Regenerate with:
//   npm run scrape:tampa
//
// Source (undergraduate): ${SITEMAP_URL}
// Source (graduate):      ${GRAD_URL}
// Scraped:    ${today}
// Programs:   ${programs.length} (${bachelor} bachelor, ${graduate} graduate)
//
// UT is a four-year private university (like UM/Stetson/ERAU/FIU/UCF/...),
// so pathways start at the bachelor's rather than an associate degree — see
// universitySystemPrompt in app/lib/pathwayPrompts.ts.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const TAMPA_PROGRAMS: SchoolProgram[] = [
${rows}
];

// UT is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const tampaCatalog = createProgramCatalog(TAMPA_PROGRAMS, { preferred: "bachelor" });
`;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "app", "lib", "programs", "tampa.ts");

async function main() {
  console.log(`Fetching ${SITEMAP_URL}`);
  const bachelor = parseUndergrad(await fetchHtml(SITEMAP_URL));

  console.log(`Fetching ${GRAD_URL}`);
  const graduate = parseGraduate(await fetchHtml(GRAD_URL));

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
