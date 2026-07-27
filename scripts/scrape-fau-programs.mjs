// Regenerates app/lib/programs/fau.ts from Florida Atlantic University's
// degree-programs catalog page.
//
//   npm run scrape:fau
//
// FAU is not Acalog or CourseLeaf — it's one long registrar page
// (degree-programs/) with one <h3> per degree type (e.g. "BACHELOR OF ARTS
// (B.A.)"), each followed by a list of majors. A major's only real link is
// to its COLLEGE's own catalog page (e.g. "(College of Science)") — FAU has
// no per-program page at all, so that college link IS the "school of
// interest" link for every major under it. No WAF blocks a plain fetch()
// here, unlike FAMU/FlPoly/USF's Acalog sites.
//
// The page's HTML is inconsistently hand-authored, which this parser has to
// route around:
//   - Some anchors wrap the college name in "(...)"; others don't.
//   - Co-listed majors (two colleges) sometimes close the <a> early and
//     continue the second college name as plain text before the real ")".
//   - Single-major degree types have no separate major-name line at all —
//     the heading text itself names the one major.
//   - A few stray empty anchors (<a href="..."><br/></a>) are copy-paste
//     debris with no content and must not be counted.
//   - "Combined degree" headings (e.g. "B.A./M.A.") mix two credential
//     levels under one heading and are skipped entirely — they don't map to
//     a single ProgramLevel.
//   - Undergraduate/Graduate "Minors" and "Certificates" follow the last
//     major list with no heading of their own, so a large detected gap (or a
//     "Graduate Certificates"/"Minors" marker) between one anchor and the
//     next ends the major list for that degree type.
//   - A.A. (no majors listed), B.S.E. (plain text, no link), and B.G.S.
//     (only a same-page "#bgs" anchor) have no real college link and are
//     skipped.
//   - A handful of majors are tagged "currently on suspension"/"not
//     accepting students" — excluded as not currently real options.
//
// Re-run this when FAU updates its catalog. If the total program count drops
// sharply, FAU changed something structural and the parsing below needs
// updating.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL = "https://www.fau.edu/registrar/university-catalog/catalog/degree-programs/";
const ORIGIN = "https://www.fau.edu";

const MIN_EXPECTED_BACHELOR = 50;
const MIN_EXPECTED_GRADUATE = 50;

const GAP_LIMIT = 600;
const SECTION_END_MARKER =
  /\b(graduate certificates?|undergraduate certificates?|graduate minors?|honors-in-the-major)\b/i;
const SUSPENDED = /\b(currently on suspension|not accepting students|not admitting students|suspended)\b/i;
const SMALL_WORDS = new Set(["of", "and", "in", "the", "for", "a", "an", "to"]);

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "'")
    .trim();

const stripTags = (s) => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

const cleanName = (s) => s.replace(/^with major in(?: (?:one of )?the following)?:\s*/i, "").trim();

function creditFromHeading(text) {
  const m = text.match(/\(([^)]+)\)\s*$/);
  return m ? m[1] : null;
}

function headingMajorName(heading) {
  return decode(heading.replace(/\s*\([^)]*\)\s*$/, "").trim());
}

function titleCaseWord(w) {
  return w ? w.charAt(0).toUpperCase() + w.slice(1) : w;
}

function titleCase(s) {
  return s
    .toLowerCase()
    .split(" ")
    .map((w, i) => {
      if (w.includes("/")) return w.split("/").map(titleCaseWord).join("/");
      return i > 0 && SMALL_WORDS.has(w) ? w : titleCaseWord(w);
    })
    .join(" ");
}

// A degree-type name (e.g. "Bachelor Of Arts") isn't itself a program title,
// so a single-major heading's fallback name strips the leading credential
// phrase, leaving just the major (e.g. "Computer Science").
const CRED_TYPE_PREFIX =
  /^(bachelor|master|doctor|specialist|associate) of( arts| science| fine arts| business administration| architecture| urban design| urban and regional planning| professional studies| public management| public safety administration| music education| social work| medicine| nursing practice| education| health administration| nonprofit management| public administration| taxation| accounting| early care and education)?( in)?\s*/i;

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Vocation catalog scraper)" },
  });
  if (!response.ok) {
    throw new Error(`FAU returned HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

function findSections(html) {
  const headingRe = /<h3>\s*(?:<br\s*\/?>)?\s*([^<]+)<\/h3>/g;
  const heads = [...html.matchAll(headingRe)].map((m) => ({
    idx: m.index,
    end: m.index + m[0].length,
    text: m[1].trim().replace(/\s+/g, " "),
  }));

  return heads.map((h, i) => {
    const cred = creditFromHeading(h.text);
    const end = i + 1 < heads.length ? heads[i + 1].idx : html.length;
    return { heading: h.text, cred, start: h.end, end };
  });
}

function extractMajors(html, sec) {
  const chunk = html.slice(sec.start, sec.end);
  const anchorOpenRe = /<a href="([^"]+)"[^>]*>/g;
  const rawAnchors = [];
  let m;
  while ((m = anchorOpenRe.exec(chunk))) {
    const tagEnd = m.index + m[0].length;
    const nearClose = chunk.indexOf("</a>", tagEnd);
    const innerEnd = nearClose === -1 ? Math.min(chunk.length, tagEnd + 200) : nearClose;
    const inner = stripTags(chunk.slice(tagEnd, innerEnd));
    if (!inner) continue; // bogus placeholder anchor, e.g. <a href="..."><br/></a>
    rawAnchors.push({ url: m[1], idx: m.index, tagEnd, nearClose });
  }
  if (rawAnchors.length === 0) return [];

  // A college's closing ")" almost always appears before the next anchor
  // starts, but some anchors omit the parens entirely ("College of Business"
  // with no wrapper). Cap the search at the next anchor so a missing ")"
  // can never bleed into the following major's name/college text; fall back
  // to this anchor's own </a> when no in-bounds ")" exists.
  for (let i = 0; i < rawAnchors.length; i++) {
    const a = rawAnchors[i];
    const cap = i + 1 < rawAnchors.length ? rawAnchors[i + 1].idx : chunk.length;
    const closeIdx = chunk.indexOf(")", a.tagEnd);
    if (closeIdx !== -1 && closeIdx < cap) {
      a.collegeEnd = closeIdx + 1;
    } else if (a.nearClose !== -1 && a.nearClose < cap) {
      a.collegeEnd = a.nearClose + 4; // length of "</a>"
    } else {
      a.collegeEnd = cap;
    }
  }

  const anchors = [];
  let prevEnd = 0;
  for (const a of rawAnchors) {
    if (a.idx - prevEnd > GAP_LIMIT) break; // left the major list into unheaded trailing prose
    const nameZone = chunk.slice(prevEnd, a.idx);
    if (SECTION_END_MARKER.test(nameZone)) break;
    anchors.push(a);
    prevEnd = a.collegeEnd;
  }
  if (anchors.length === 0) return [];

  const majors = [];
  for (let i = 0; i < anchors.length; i++) {
    const prevBoundary = i === 0 ? 0 : anchors[i - 1].collegeEnd;
    const nameZone = chunk.slice(prevBoundary, anchors[i].idx);
    let name = cleanName(stripTags(nameZone));
    let fromHeading = false;
    if (!name) {
      name = headingMajorName(sec.heading);
      fromHeading = true;
    }
    const collegeZone = chunk.slice(anchors[i].tagEnd, anchors[i].collegeEnd);
    const college = stripTags(collegeZone).replace(/^\(/, "").replace(/\)$/, "").trim();
    majors.push({ name, college, url: anchors[i].url, cred: sec.cred, fromHeading });
  }
  return majors;
}

function parse(html) {
  const sections = findSections(html);
  const clean = sections.filter((s) => s.cred && !s.cred.includes("/"));

  let majors = clean.flatMap((sec) => extractMajors(html, sec));
  majors = majors.filter((mj) => !SUSPENDED.test(mj.name) && !mj.url.startsWith("#"));

  for (const mj of majors) {
    if (mj.fromHeading) {
      const cased = titleCase(mj.name);
      mj.name = cased.replace(CRED_TYPE_PREFIX, "").trim() || cased;
    }
  }

  return majors.map((mj) => ({
    name: mj.name,
    url: new URL(mj.url, ORIGIN).toString(),
    level: mj.cred.startsWith("B.") ? "bachelor" : "graduate",
    credential: mj.cred,
    area: mj.college,
  }));
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

  return `// FAU degree catalog: program name -> the program's COLLEGE catalog page.
//
// GENERATED FILE — do not edit by hand. Regenerate with:
//   npm run scrape:fau
//
// Source:     ${SOURCE_URL}
// Scraped:    ${today}
// Programs:   ${programs.length} (${bachelor} bachelor, ${graduate} graduate)
//
// FAU has no per-program catalog page at all — every major on this page
// links only to its COLLEGE's catalog page (e.g. "(College of Science)"), so
// that college link is what every program here points to. No WAF blocks
// this site, unlike FAMU/FlPoly/USF's Acalog catalogs.
//
// Excluded: "combined degree" headings (e.g. "B.A./M.A.") that mix two
// credential levels under one heading; A.A., B.S.E., and B.G.S. (no real
// college link); majors tagged suspended/not-accepting-students.
//
// FAU is a four-year university (like FIU/UCF/UF/FGCU/UWF/NCF/UNF/FlPoly/USF),
// so pathways start at the bachelor's rather than an associate degree.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const FAU_PROGRAMS: SchoolProgram[] = [
${rows}
];

// FAU is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const fauCatalog = createProgramCatalog(FAU_PROGRAMS, { preferred: "bachelor" });
`;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "app", "lib", "programs", "fau.ts");

async function main() {
  console.log(`Fetching ${SOURCE_URL}`);
  const html = await fetchHtml(SOURCE_URL);
  const programs = parse(html)
    .sort((a, b) => (a.level === b.level ? a.name.localeCompare(b.name) : a.level === "bachelor" ? -1 : 1));

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
