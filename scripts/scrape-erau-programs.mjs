// Regenerates app/lib/programs/erau.ts from Embry-Riddle Aeronautical
// University's own academic catalog (Daytona Beach campus).
//
//   npm run scrape:erau
//
// catalog.erau.edu is CourseLeaf, no WAF. ERAU runs four separate campus
// catalogs (Daytona Beach, Prescott, Worldwide, Asia); floridaSchools.ts
// lists ERAU at "Daytona Beach", so this scraper only pulls that campus's
// edition — the other three are out of scope for a Florida-schools catalog.
//
// Unlike UM (one flat table needing separate level classification) or
// Stetson (loose prose needing a heading appended for a full name), the
// Daytona Beach campus's academic-programs page is the best-structured
// source seen in this project: a single page, one <h2> heading per
// credential level (Associates / Bachelors / Masters / Combined Program
// Pathways / Dual Masters / Certificates / Doctoral / Ph.D. Programs), each
// followed by a <ul> of real per-program links whose OWN anchor text already
// states its complete credential ("B.S. in Aerospace Engineering", "B.S. in
// Aeronautical Science/Master of Business Administration") — no name
// synthesis needed at all, just a level bucket per heading.
//
// Associates (2 programs) and Certificates (1 program) are excluded — the
// same call UCF's scraper made for its own associate-level "Articulated
// A.S." track and certificates: this app's university template starts every
// pathway at the bachelor's, so a level below that isn't a fit for the
// shape, not a real omission of accredited data.
//
// "Combined Program Pathways" (90 entries) and "Dual Masters" (14 entries)
// are real, individually named, individually linked accelerated/dual-degree
// tracks — ERAU's Business and Aviation programs pair with several specific
// graduate programs each, which is why these sections are so much larger
// than "Masters" itself. Every entry states its own full credential
// (typically both halves of the combo, e.g. "...and M.S. in Aviation
// Finance"), so GRADUATE_HINT's "master"/"m.s." matching correctly resolves
// all of them as graduate.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL = "https://catalog.erau.edu/daytona-beach/academic-programs/";
const ORIGIN = "https://catalog.erau.edu";

// Heading text -> level. Associates and Certificates are deliberately
// omitted (see header) so their <li> entries are simply skipped.
const HEADING_LEVELS = {
  Bachelors: "bachelor",
  Masters: "graduate",
  "Combined Program Pathways": "graduate",
  "Dual Masters": "graduate",
  Doctoral: "graduate",
  "Ph.D. Programs": "graduate",
};

// The URL's second path segment (after /daytona-beach/) names the offering
// college — used for a readable `area` rather than one flat label.
const COLLEGE_NAMES = {
  aviation: "College of Aviation",
  business: "College of Business",
  engineering: "College of Engineering",
  "arts-sciences": "College of Arts and Sciences",
};

const MIN_EXPECTED_BACHELOR = 20;
const MIN_EXPECTED_GRADUATE = 50;

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[­​]/g, "") // soft hyphen / zero-width space seen in a couple of entries
    .replace(/\s+/g, " ")
    .trim();

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Vocation catalog scraper)" },
  });
  if (!response.ok) {
    throw new Error(`ERAU returned HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

function areaFor(href) {
  const slug = href.split("/").filter(Boolean)[1]; // ["daytona-beach", "<college>", ...]
  return COLLEGE_NAMES[slug] ?? "Embry-Riddle Aeronautical University";
}

function parse(html) {
  const start = html.indexOf('id="textcontainer"');
  const end = html.indexOf("<!--end #textcontainer", start);
  const section = html.slice(start, end === -1 ? undefined : end);

  // Headings sometimes wrap their text in <strong> or <span>.
  const headingRe = /<h2>(?:<(?:strong|span)>)?([^<]+)/g;
  const headings = [...section.matchAll(headingRe)].map((m) => ({
    index: m.index,
    text: decode(m[1]),
  }));

  const programs = [];
  for (let i = 0; i < headings.length; i++) {
    const level = HEADING_LEVELS[headings[i].text];
    if (!level) continue; // Degrees (intro), Associates, Certificates

    const chunkStart = headings[i].index;
    const chunkEnd = i + 1 < headings.length ? headings[i + 1].index : section.length;
    const chunk = section.slice(chunkStart, chunkEnd);

    for (const li of chunk.matchAll(/<li>([\s\S]*?)<\/li>/g)) {
      const anchors = [...li[1].matchAll(/<a href="([^"]+)"[^>]*>([^<]*)<\/a>/g)];
      if (!anchors.length) continue;
      // A couple of dual-masters entries split their name across two <a>
      // tags pointing at the same href (a copy-paste artifact, the same
      // shape seen on UM's and Stetson's sites) — concatenate rather than
      // treat as two programs or lose the second half.
      const href = anchors[0][1].split("#")[0];
      const name = decode(anchors.map((a) => a[2]).join(""));
      if (!name) continue;

      programs.push({
        name,
        url: href.startsWith("http") ? href : ORIGIN + href,
        level,
        area: areaFor(href),
      });
    }
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

  return `// Embry-Riddle Aeronautical University (Daytona Beach campus) degree
// catalog: program name -> official bulletin page.
//
// GENERATED FILE — do not edit by hand. Regenerate with:
//   npm run scrape:erau
//
// Source:     ${SOURCE_URL}
// Scraped:    ${today}
// Programs:   ${programs.length} (${bachelor} bachelor, ${graduate} graduate)
//
// ERAU runs separate catalogs per campus (Daytona Beach / Prescott /
// Worldwide / Asia); this catalog is Daytona Beach only, matching
// floridaSchools.ts. "Combined Program Pathways" and "Dual Masters" are real
// individually-linked accelerated/dual-degree tracks, not duplicates — see
// the scraper's header comment. Associate-level and certificate programs are
// excluded, the same call UCF's scraper made for its own associate track.
//
// ERAU is a four-year private university (like UM/Stetson/FIU/UCF/...), so
// pathways start at the bachelor's rather than an associate degree — see
// universitySystemPrompt in app/lib/pathwayPrompts.ts.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const ERAU_PROGRAMS: SchoolProgram[] = [
${rows}
];

// ERAU is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const erauCatalog = createProgramCatalog(ERAU_PROGRAMS, { preferred: "bachelor" });
`;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "app", "lib", "programs", "erau.ts");

async function main() {
  console.log(`Fetching ${SOURCE_URL}`);
  const html = await fetchHtml(SOURCE_URL);
  const programs = dedupe(parse(html)).sort((a, b) =>
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
