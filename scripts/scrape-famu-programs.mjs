// Regenerates app/lib/programs/famu.ts from Florida A&M University's own
// academic pages (NOT catalog.famu.edu, which is Acalog behind AWS WAF and
// has no Program entities at all — see HANDOFF.md §13).
//
//   npm run scrape:famu
//
// FAMU's real catalog lives in two different places, one per level:
//
//   Undergraduate: www.famu.edu/academics/undergraduate-academics/index.php
//   One long page, one <strong>COLLEGE NAME</strong> + one college link per
//   section, followed by a plain-text list of "Bachelor of ..." majors with
//   no per-major links at all — FAMU has no per-program undergrad page, so
//   every major in a section gets that section's single college link (the
//   same "school of interest" pattern used for FAU).
//
//   Graduate: graduateschool.famu.edu/graduate-programs/graduate-programs-<slug>.php
//   One page per college (11 total), each a clean grid of real per-program
//   links with their own credential badge (MS, PhD, ...) and title — better
//   structured than the undergraduate page, much like UCF/UF's catalogs.
//
// No WAF blocks either site (unlike catalog.famu.edu).
//
// The undergraduate page's HTML needs two fixes past a naive parse:
//   - FAMU uses stray formatting-only <strong><br><br></strong> tags between
//     a college's own link and its major list. A heading regex that doesn't
//     require real letters inside the <strong> mistakes these for a new
//     heading and steals the NEXT real college's link (and loses that
//     college's name in the process) — headings are found in two decoupled
//     passes (find real <strong> text first, then look forward for its own
//     nearest link) specifically to avoid this.
//   - Several majors are listed as "Bachelor of X/Bachelor of Y in Z" (one
//     major, two credential options) — split only on a "Bachelor of" that
//     ISN'T immediately preceded by "/", so the combo doesn't get cut into a
//     bogus "Bachelor of Science/" fragment plus a stray second major.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const UNDERGRAD_URL = "https://www.famu.edu/academics/undergraduate-academics/index.php";
const GRAD_ORIGIN = "https://graduateschool.famu.edu";
const GRAD_SLUGS = [
  "cafs", "coe", "pharmacy", "csat", "cssah", "engineering",
  "ahealth", "saet", "sbi", "son", "soe",
];

const MIN_EXPECTED_BACHELOR = 30;
const MIN_EXPECTED_GRADUATE = 30;

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "'")
    .trim();

const stripTags = (s) => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

const SMALL_WORDS = new Set(["of", "and", "in", "the", "for", "a", "an", "to", "&"]);
function titleCaseWord(w) {
  return w ? w.charAt(0).toUpperCase() + w.slice(1) : w;
}
function titleCase(s) {
  return s
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w) ? w : titleCaseWord(w)))
    .join(" ");
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Vocation catalog scraper)" },
  });
  if (!response.ok) {
    throw new Error(`FAMU returned HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

const BACHELOR_CRED = { Science: "B.S.", Arts: "B.A.", Architecture: "B.Arch." };

function parseBachelorTitle(full) {
  let m = full.match(/^Bachelor of (Science|Arts|Architecture)\/Bachelor of (Science|Arts|Architecture) in (.+)$/);
  if (m) return { name: m[3].trim(), credential: `${BACHELOR_CRED[m[1]]}/${BACHELOR_CRED[m[2]]}` };
  m = full.match(/^Bachelor of (Science|Arts|Architecture) in (.+)$/);
  if (m) return { name: m[2].trim(), credential: BACHELOR_CRED[m[1]] };
  m = full.match(/^Bachelor of (Science|Arts|Architecture)$/);
  if (m) return { name: m[1].trim(), credential: BACHELOR_CRED[m[1]] };
  return null;
}

function parseUndergrad(html) {
  const startIdx = html.indexOf("<h2>Undergraduate Degree Programs</h2>");
  const endIdx = html.indexOf("<!--  -->", startIdx);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error("Could not find the undergraduate degree programs region — page structure changed.");
  }
  const region = html.slice(startIdx, endIdx);

  // A real heading has letters in it; FAMU's stray "<br><br>"-only <strong>
  // tags do not and must not be mistaken for one.
  const strongRe = /<strong>([\s\S]*?)<\/strong>/g;
  const strongs = [...region.matchAll(strongRe)]
    .map((m) => ({ idx: m.index, end: m.index + m[0].length, text: stripTags(m[1]) }))
    .filter((s) => /[A-Za-z]{3,}/.test(s.text));

  // Pair each real heading with the nearest link AFTER it — independent of
  // where the next heading falls, so a stray formatting tag in between can
  // never steal the following college's link out from under it.
  const anchorRe = /<a href="([^"]+)"[^>]*>[^<]*<\/a>/g;
  const heads = strongs.map((s) => {
    anchorRe.lastIndex = s.end;
    const m = anchorRe.exec(region);
    return { idx: s.idx, end: m ? m.index + m[0].length : s.end, college: s.text, url: m ? m[1] : null };
  });

  const programs = [];
  for (let i = 0; i < heads.length; i++) {
    const h = heads[i];
    if (!h.url) continue;
    const chunkEnd = i + 1 < heads.length ? heads[i + 1].idx : region.length;
    const text = stripTags(region.slice(h.end, chunkEnd));
    const parts = text.split(/(?<!\/)(?=Bachelor of )/).map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (!part.startsWith("Bachelor of")) continue;
      const parsed = parseBachelorTitle(part);
      if (!parsed) continue;
      programs.push({
        name: parsed.name,
        url: h.url.startsWith("http") ? h.url : new URL(h.url, "https://www.famu.edu").toString(),
        level: "bachelor",
        credential: parsed.credential,
        area: titleCase(h.college),
      });
    }
  }
  return programs;
}

const boxRe =
  /<div class="programs-section__box[^"]*"><a href="([^"]+)">[\s\S]*?<li class="color--\w+">([^<]+)<\/li>\s*<\/ul><span class="programs-section__title">([^<]+)<\/span>/g;

function parseGradPage(html) {
  const h1Match = html.match(/<h1>([^<]+)<\/h1>/);
  const college = h1Match ? decode(h1Match[1]).replace(/\s*Graduate Programs\s*$/i, "") : "";
  return [...html.matchAll(boxRe)]
    .map((m) => ({
      name: decode(m[3]),
      url: m[1],
      level: "graduate",
      credential: decode(m[2]),
      area: college,
    }))
    // A handful of programs are announced but not live yet — FAMU marks these
    // "(coming soon)" and points the card at a bare "/index.php" placeholder
    // instead of a real page. Recommending an unclickable link is worse than
    // one fewer listing, so both signals (name and non-absolute url) exclude it.
    .filter((p) => !/\(coming soon\)/i.test(p.name) && /^https?:\/\//.test(p.url));
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

  return `// FAMU degree catalog: program name -> its official program (graduate) or
// college (undergraduate) page.
//
// GENERATED FILE — do not edit by hand. Regenerate with:
//   npm run scrape:famu
//
// Source (undergraduate): ${UNDERGRAD_URL}
// Source (graduate):      ${GRAD_ORIGIN}/graduate-programs/graduate-programs-<slug>.php
//                          (${GRAD_SLUGS.join(", ")})
// Scraped:    ${today}
// Programs:   ${programs.length} (${bachelor} bachelor, ${graduate} graduate)
//
// catalog.famu.edu (Acalog) is a dead end for this school — it's WAF-blocked
// AND has no Program entities at all. The real catalog lives on famu.edu's
// own pages instead. Undergraduate has no per-major page, so every major
// links to its college's page instead (same pattern as FAU); graduate has a
// real per-program page for every entry.
//
// FAMU is a four-year university (like FIU/UCF/UF/FGCU/UWF/NCF/UNF/FlPoly/
// USF/FAU), so pathways start at the bachelor's rather than an associate
// degree.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const FAMU_PROGRAMS: SchoolProgram[] = [
${rows}
];

// FAMU is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const famuCatalog = createProgramCatalog(FAMU_PROGRAMS, { preferred: "bachelor" });
`;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "app", "lib", "programs", "famu.ts");

async function main() {
  console.log(`Fetching ${UNDERGRAD_URL}`);
  const bachelor = parseUndergrad(await fetchHtml(UNDERGRAD_URL));

  const graduate = [];
  for (const slug of GRAD_SLUGS) {
    const url = `${GRAD_ORIGIN}/graduate-programs/graduate-programs-${slug}.php`;
    console.log(`Fetching ${url}`);
    graduate.push(...parseGradPage(await fetchHtml(url)));
  }

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

  const programs = [...bachelor, ...graduate].sort((a, b) =>
    a.level === b.level ? a.name.localeCompare(b.name) : a.level === "bachelor" ? -1 : 1
  );

  writeFileSync(OUT_FILE, render(programs), "utf8");

  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}`);
  console.log(`  ${programs.length} programs (${bachelor.length} bachelor, ${graduate.length} graduate)`);
}

main().catch((error) => {
  console.error(`\nScrape failed: ${error.message}`);
  process.exit(1);
});
