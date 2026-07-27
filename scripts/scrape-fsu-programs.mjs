// Regenerates app/lib/programs/fsu.ts from Florida State University's own
// plain HTML program-listing pages.
//
//   npm run scrape:fsu
//
// FSU's real per-program data lives in a public Power BI dashboard embedded
// at admissions.fsu.edu/majors (550 majors, each with a real per-program AND
// per-college URL — the best-structured source found for this school). It
// isn't scrapable: the report renders only ~20 rows into the DOM at a time
// and resists every automated interaction tried (synthetic events, trusted
// clicks/keys at confirmed-correct coordinates, clipboard, calling the
// report's own re-render function, a blind in-memory search) — see
// HANDOFF.md §13 for the full investigation. Per the user's direction, this
// scraper does not attempt that report at all.
//
// Instead it pulls real program NAMES from four plain server-rendered pages
// (no WAF, no JS rendering needed) and points every single one at the
// admissions majors page as a shared "go look here" link, rather than
// inventing or guessing a per-program URL this scraper has no way to verify:
//   - Undergraduate: academic-guide.fsu.edu/all-programs — a clean Views
//     listing, one <h4>Name</h4> per major, no credential per entry.
//   - Master's / Doctoral / Specialist: gradschool.fsu.edu's own three
//     degree-programs pages — each is a department-contact directory (not a
//     program listing) where every entry happens to have a real title text;
//     read only that title, not the surrounding contact/phone/email fields.
//
// Credentials aren't stated cleanly enough to guess a specific abbreviation
// for most entries (unlike UCF/UF/FAU's per-program pages), so this catalog
// spells the level out ("Bachelor's" / "Master's" / "Doctoral" /
// "Specialist") rather than inventing "B.S."/"M.S." — the same call
// NCF's scraper made for its two unlabeled graduate programs.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SHARED_URL = "https://admissions.fsu.edu/majors";
const UNDERGRAD_URL = "https://academic-guide.fsu.edu/all-programs";
const GRAD_PAGES = [
  { url: "https://gradschool.fsu.edu/academics-research/degree-programs/masters-degree-programs", credential: "Master's" },
  { url: "https://gradschool.fsu.edu/Academics-Research/Degree-Programs/Doctoral-Degree-Programs", credential: "Doctoral" },
  { url: "https://gradschool.fsu.edu/Academics-Research/Degree-Programs/Specialist-Degree-Programs", credential: "Specialist" },
];

const MIN_EXPECTED_BACHELOR = 100;
const MIN_EXPECTED_GRADUATE = 80;

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "'")
    .trim();

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Vocation catalog scraper)" },
  });
  if (!response.ok) {
    throw new Error(`FSU returned HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

function parseUndergrad(html) {
  const re = /<span class="field-content"><h4>([^<]+)<small>[^<]*<\/small><\/h4>/g;
  return [...html.matchAll(re)].map((m) => ({
    name: decode(m[1]),
    level: "bachelor",
    credential: "Bachelor's",
  }));
}

// Each gradschool.fsu.edu degree page is a department-contact directory, not
// a program listing — every row has a photo, a name, a phone, an email, and
// (sometimes) a further list of specific named programs. Only the one real
// signal that names a discipline/program cleanly is the row's own title.
function parseGradPage(html, credential) {
  const re = /<div class="views-field views-field-title"><h4[^>]*><a[^>]*>([^<]+)<\/a><\/h4><\/div>/g;
  const seen = new Set();
  const out = [];
  for (const m of html.matchAll(re)) {
    const name = decode(m[1]);
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({ name, level: "graduate", credential });
  }
  return out;
}

function render(programs) {
  const today = new Date().toISOString().slice(0, 10);
  const bachelor = programs.filter((p) => p.level === "bachelor").length;
  const graduate = programs.length - bachelor;

  const rows = programs
    .map(
      (p) =>
        `  { name: ${JSON.stringify(p.name)}, url: ${JSON.stringify(SHARED_URL)}, ` +
        `level: ${JSON.stringify(p.level)}, credential: ${JSON.stringify(p.credential)} },`
    )
    .join("\n");

  return `// FSU degree catalog: program name -> the one page that actually lists it.
//
// GENERATED FILE — do not edit by hand. Regenerate with:
//   npm run scrape:fsu
//
// Source (undergraduate): ${UNDERGRAD_URL}
// Source (graduate):      ${GRAD_PAGES.map((p) => p.url).join("\n//                          ")}
// Scraped:    ${today}
// Programs:   ${programs.length} (${bachelor} bachelor, ${graduate} graduate)
//
// Every entry links to ${SHARED_URL} rather than a
// per-program page. FSU's real per-program (and per-college) links live in a
// Power BI dashboard on that page that this scraper cannot extract — see the
// header comment above and HANDOFF.md §13 for why. One shared, always-correct
// link beats a guessed or fabricated per-program URL.
//
// Credentials are spelled out ("Bachelor's"/"Master's"/"Doctoral"/
// "Specialist") rather than abbreviated, since the source pages don't state
// a clean per-program abbreviation for most entries — same call NCF's
// scraper made for its two unlabeled graduate programs.
//
// FSU is a four-year university (like FIU/UCF/UF/FGCU/UWF/NCF/UNF/FlPoly/
// USF/FAU/FAMU), so pathways start at the bachelor's rather than an
// associate degree.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const FSU_PROGRAMS: SchoolProgram[] = [
${rows}
];

// FSU is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const fsuCatalog = createProgramCatalog(FSU_PROGRAMS, { preferred: "bachelor" });
`;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "app", "lib", "programs", "fsu.ts");

async function main() {
  console.log(`Fetching ${UNDERGRAD_URL}`);
  const bachelor = parseUndergrad(await fetchHtml(UNDERGRAD_URL));

  const graduate = [];
  for (const page of GRAD_PAGES) {
    console.log(`Fetching ${page.url}`);
    graduate.push(...parseGradPage(await fetchHtml(page.url), page.credential));
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
