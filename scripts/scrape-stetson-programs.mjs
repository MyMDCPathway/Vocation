// Regenerates app/lib/programs/stetson.ts from Stetson University's own
// academic catalog.
//
//   npm run scrape:stetson
//
// catalog.stetson.edu is CourseLeaf, no WAF — same platform as UM, but a
// different shape. UM had one flat Program Index table listing every
// program; Stetson has no such page. Its A-Z index (/azindex/) is almost
// entirely policy pages, not programs, so it's useless here. Programs are
// scattered across per-college pages instead, and the shape differs by
// level:
//
// - Undergraduate (3 real degree-granting colleges: College of Arts and
//   Sciences, School of Business Administration, School of Music — WORLD,
//   Discovery, and Honors are programs/centers, not degree-granting
//   colleges, confirmed by the absence of a "Majors" tab). Each college page
//   has a tabbed "Majors" section (`#majorstextcontainer`) with one
//   <h2>/<h3> heading per credential ("Bachelor of Arts", "Bachelor of
//   Business Administration", "Bachelor of Music", "Bachelor of Music
//   Education") followed by a <ul> of real per-program links. Music's link
//   text already states its own credential ("Bachelor Of Music in
//   Composition"); Arts & Sciences' and Business's link text is just the
//   subject ("American Studies", "Accounting") and needs the heading
//   appended to be a complete name.
//
// - Graduate (2 colleges offer it: Arts & Sciences, Business — Music has no
//   graduate programs). No tabbed "Majors" section here; each page is prose
//   with a heading per program area and a real link inside the paragraph
//   that follows. One heading ("Master of Science (MS)" under Arts &
//   Sciences' counselor-education section) turned out to be an umbrella
//   covering 4 genuinely distinct sub-programs (Clinical Mental Health
//   Counseling / Marriage, Couple, and Family Counseling, each with a
//   "with Advanced Studies" variant) each with its own real link and its
//   own fully-descriptive anchor text — using the heading alone would have
//   collapsed all 4 into one generic, wrong entry. The rule below handles
//   both shapes: when a heading's section contains 2+ links whose own text
//   already names a real credential, trust those over the heading; when it
//   contains exactly 1, use whichever of (heading text, anchor text) is
//   longer, since the longer one always turned out to be the more complete,
//   correct name in every case checked by hand.
//
// - Law (College of Law, Gulfport/Tampa). No listing page either — every
//   program was found by hand from the /law/ section's own nav links, then
//   confirmed via each page's own <title>, which is already the exact
//   correct display name ("Master of Jurisprudence in Aging, Law and
//   Policy | Stetson University Academic Catalog"). Concentrations (tracks
//   within the JD, not separate degrees) and the dual-degree overview page
//   (no catalog page of its own — points off-catalog to www.stetson.edu)
//   are excluded.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN = "https://catalog.stetson.edu";

const UNDERGRAD_COLLEGES = [
  { slug: "arts-sciences", area: "College of Arts and Sciences" },
  { slug: "business-administration", area: "School of Business Administration" },
  { slug: "music", area: "School of Music" },
];

const GRAD_COLLEGES = [
  { slug: "arts-sciences", area: "College of Arts and Sciences" },
  { slug: "business-administration", area: "School of Business Administration" },
];

// No listing page exists for Law — hand-collected from /law/'s own nav links
// (see header). Each name comes from the page's own <title> at scrape time,
// not hardcoded here, so a credential-title change on Stetson's site is
// still picked up.
const LAW_SLUGS = [
  "juris-doctor",
  "master-law",
  "master-law/elder-law-llm",
  "master-law/international-law-llm",
  "master-law/online-advocacy-llm",
  "mjur",
  "mjur/aging-law-policy",
  "mjur/healthcarecomp",
  "mjur/intl-comp-bus",
  "jd-llm",
  "jd-llm-elder",
];

const MIN_EXPECTED_BACHELOR = 50;
const MIN_EXPECTED_GRADUATE = 15; // includes Law

const GRADUATE_CREDENTIAL_RE =
  /^(the\s+)?(master|educational specialist|doctor|juris|ph\.?d)/i;

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

// A few anchors on Stetson's site close their parenthetical outside the <a>
// tag ("...(With Advanced Studies" — the ")" is plain text right after
// </a>), so an anchor-text-only extraction can end up missing it.
const balanceParens = (s) => {
  const open = (s.match(/\(/g) || []).length;
  const close = (s.match(/\)/g) || []).length;
  return open > close ? s + ")".repeat(open - close) : s;
};

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Vocation catalog scraper)" },
  });
  if (!response.ok) {
    throw new Error(`Stetson returned HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

function sectionBetween(html, startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  if (start === -1) return "";
  const end = endMarker ? html.indexOf(endMarker, start) : -1;
  return end === -1 ? html.slice(start) : html.slice(start, end);
}

// Undergraduate: heading-delimited <li><a> lists inside #majorstextcontainer.
function parseUndergradCollege(html, area) {
  const section = sectionBetween(
    html,
    'id="majorstextcontainer"',
    'id="minorstextcontainer"'
  );
  if (!section) return [];

  // Every heading (h2 or h3, optionally wrapping its text in a <span>) and
  // every <li> in document order, so each <li> can find the nearest
  // preceding heading as its credential context.
  const headingRe = /<h[23][^>]*>(?:<span[^>]*>)?([^<]+)/g;
  const headings = [...section.matchAll(headingRe)].map((m) => ({
    index: m.index,
    text: decode(m[1]),
  }));

  const liRe = /<li>([\s\S]*?)<\/li>/g;
  const programs = [];
  for (const m of section.matchAll(liRe)) {
    const inner = m[1];
    const heading = [...headings].reverse().find((h) => h.index < m.index);
    if (!heading) continue;

    // Two anchors sharing the same href is a copy-paste split (a program
    // name broken across two <a> tags) — concatenate their text rather than
    // treating it as two programs or losing the second half.
    const anchors = [...inner.matchAll(/<a href="([^"]+)"[^>]*>([^<]*)<\/a>/g)];
    if (!anchors.length) continue;
    const href = anchors[0][1].split("#")[0];
    const text = decode(anchors.map((a) => a[2]).join(""));
    if (!text) continue;

    const name = /bachelor/i.test(text) ? text : `${text} (${heading.text})`;
    programs.push({ name, url: ORIGIN + href, level: "bachelor", area });
  }
  return programs;
}

// Graduate: prose sections, one heading per program area, with 1 or more
// real per-program links inside. See header comment for the "longer text
// wins" / "2+ links means trust the links" rule.
function parseGradCollege(html, area) {
  const section = sectionBetween(html, 'id="textcontainer"', "<!--end #textcontainer");
  if (!section) return [];

  const headingRe = /<h2[^>]*>(?:<span[^>]*>)?([^<]+)/g;
  const headingMatches = [...section.matchAll(headingRe)];

  const programs = [];
  for (let i = 0; i < headingMatches.length; i++) {
    const heading = decode(headingMatches[i][1]);
    const chunkStart = headingMatches[i].index;
    const chunkEnd = i + 1 < headingMatches.length ? headingMatches[i + 1].index : section.length;
    const chunk = section.slice(chunkStart, chunkEnd);

    const anchors = [...chunk.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)]
      .map((m) => ({ href: m[1].split("#")[0], text: balanceParens(decode(m[2])) }))
      .filter((a) => GRADUATE_CREDENTIAL_RE.test(a.text));

    if (anchors.length >= 2) {
      for (const a of anchors) {
        programs.push({
          name: a.text,
          url: a.href.startsWith("http") ? a.href : ORIGIN + a.href,
          level: "graduate",
          area,
        });
      }
    } else if (anchors.length === 1) {
      const name = balanceParens(heading).length >= anchors[0].text.length ? balanceParens(heading) : anchors[0].text;
      const href = anchors[0].href;
      programs.push({
        name,
        url: href.startsWith("http") ? href : ORIGIN + href,
        level: "graduate",
        area,
      });
    }
    // 0 anchors: a heading with no real program link (e.g. "Technology
    // Requirements") — nothing to record.
  }
  return programs;
}

async function fetchLawPrograms() {
  const programs = [];
  for (const slug of LAW_SLUGS) {
    const url = `${ORIGIN}/law/${slug}/`;
    const html = await fetchHtml(url);
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (!titleMatch) continue;
    const name = decode(titleMatch[1]).replace(/\s*\|\s*Stetson University Academic Catalog\s*$/i, "");
    programs.push({ name, url, level: "graduate", area: "College of Law" });
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

  return `// Stetson University degree catalog: program name -> official bulletin page.
//
// GENERATED FILE — do not edit by hand. Regenerate with:
//   npm run scrape:stetson
//
// Source: catalog.stetson.edu, scraped from 3 undergraduate college pages
// (Arts & Sciences, Business Administration, Music), 2 graduate college
// pages (Arts & Sciences, Business Administration), and 11 hand-identified
// College of Law pages (no listing page exists for Law — see the scraper's
// header comment).
// Scraped:    ${today}
// Programs:   ${programs.length} (${bachelor} bachelor, ${graduate} graduate)
//
// Stetson is a four-year private university (like UM/FIU/UCF/...), so
// pathways start at the bachelor's rather than an associate degree — see
// universitySystemPrompt in app/lib/pathwayPrompts.ts.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const STETSON_PROGRAMS: SchoolProgram[] = [
${rows}
];

// Stetson is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const stetsonCatalog = createProgramCatalog(STETSON_PROGRAMS, { preferred: "bachelor" });
`;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "app", "lib", "programs", "stetson.ts");

async function main() {
  const all = [];

  for (const { slug, area } of UNDERGRAD_COLLEGES) {
    const url = `${ORIGIN}/undergraduate/${slug}/`;
    console.log(`Fetching ${url}`);
    all.push(...parseUndergradCollege(await fetchHtml(url), area));
  }

  for (const { slug, area } of GRAD_COLLEGES) {
    const url = `${ORIGIN}/graduate/${slug}/`;
    console.log(`Fetching ${url}`);
    all.push(...parseGradCollege(await fetchHtml(url), area));
  }

  console.log(`Fetching ${LAW_SLUGS.length} College of Law pages`);
  all.push(...(await fetchLawPrograms()));

  const programs = dedupe(all).sort((a, b) =>
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
