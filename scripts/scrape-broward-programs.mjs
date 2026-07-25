// Regenerates app/lib/programs/broward.ts from Broward College's catalog.
//
//   npm run scrape:broward
//
// SOURCE CHOICE: Broward's academics pages (associate-arts.html,
// associate-science.html, bachelors.html) render programs as duplicated <h5>
// accordion headers interleaved with "Career outlook" blocks and A–Z letter
// dividers — parseable, but fragile. Their CourseLeaf catalog publishes the
// same programs as one clean list with a stable structure:
//
//   <li class="item filter_4 filter_14">
//     <a href="/programs-study/accounting-technology-as/">
//       <span class="title">Accounting Technology (AS) - 2100</span>
//       <span class="keyword">Business</span>
//       <span class="keyword">Associate of Science (AS)</span>
//
// So this reads the Degree Finder instead. Two quirks it has to handle:
//
//   1. Keyword ORDER is inconsistent — most rows are [area, degree], a handful
//      are [degree, area]. The degree is therefore taken from the title, which
//      always carries it, and the area is whichever keyword isn't a credential.
//   2. The Degree Finder OMITS the plain Associate of Arts, listing only the
//      Honors variant. The A.A. is the single most common transfer degree at a
//      state college, so it's added explicitly below from Broward's own A.A.
//      page. If it ever appears in the finder, the dedupe keeps one copy.

import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CATALOG = "https://catalog.broward.edu";
const SOURCE_URL = `${CATALOG}/degree-finder/`;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "app", "lib", "programs", "broward.ts");

const MIN_EXPECTED = 150;

// Broward's credential abbreviations, as they appear in "(AS)" within a title.
const CREDENTIALS = {
  AA: "associate",
  AS: "associate",
  AAS: "associate",
  BS: "bachelor",
  BAS: "bachelor",
  BSN: "bachelor",
  TC: "certificate",
  VC: "certificate",
  ATD: "certificate",
  ATC: "certificate",
  CCC: "certificate",
};

const CODE_RE = new RegExp(`\\((${Object.keys(CREDENTIALS).join("|")})\\)`, "g");

// Absent from the Degree Finder; see note 2 above.
const MANUAL_PROGRAMS = [
  {
    name: "Associate of Arts",
    credential: "AA",
    level: "associate",
    area: "Transfer",
    url: `${CATALOG}/programs-study/aa-general-education-graduation-requirements/`,
  },
];

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/\s+/g, " ")
    .trim();

const isCredentialLabel = (keyword) =>
  Object.keys(CREDENTIALS).some((c) => keyword.endsWith(`(${c})`));

function parse(html) {
  const main = (html.match(/<main[\s\S]*?<\/main>/i) || [html])[0];
  const items = [...main.matchAll(/<li\b[^>]*class="item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi)];

  const programs = [];
  const unparsed = [];

  for (const [, block] of items) {
    const href = block.match(/<a\b[^>]*href="([^"]+)"/i);
    const titleRaw = block.match(/<span[^>]*class="title"[^>]*>([\s\S]*?)<\/span>/i);
    if (!href || !titleRaw) {
      unparsed.push("missing href or title");
      continue;
    }

    const title = decode(titleRaw[1]);
    const codes = [...title.matchAll(CODE_RE)].map((m) => m[1]);
    const credential = codes.length ? codes[codes.length - 1] : null;
    if (!credential) {
      unparsed.push(title);
      continue;
    }

    const cut = title.lastIndexOf(`(${credential})`);
    const name = title.slice(0, cut).replace(/[\s-]+$/, "").trim();
    if (!name) {
      unparsed.push(title);
      continue;
    }

    const keywords = [
      ...block.matchAll(/<span[^>]*class="keyword[^"]*"[^>]*>([\s\S]*?)<\/span>/gi),
    ].map((m) => decode(m[1]));

    programs.push({
      name,
      url: new URL(href[1], CATALOG).toString(),
      level: CREDENTIALS[credential],
      credential,
      area: keywords.find((k) => !isCredentialLabel(k)) ?? "",
    });
  }

  for (const manual of MANUAL_PROGRAMS) programs.push({ ...manual });

  const seen = new Map();
  for (const p of programs) {
    const key = `${p.name.toLowerCase()}|${p.credential}`;
    if (!seen.has(key)) seen.set(key, p);
  }

  return {
    programs: [...seen.values()].sort((a, b) => a.name.localeCompare(b.name)),
    unparsed,
  };
}

function render(programs) {
  const today = new Date().toISOString().slice(0, 10);
  const counts = programs.reduce((acc, p) => ((acc[p.level] = (acc[p.level] || 0) + 1), acc), {});

  const rows = programs
    .map(
      (p) =>
        `  { name: ${JSON.stringify(p.name)}, url: ${JSON.stringify(p.url)}, ` +
        `level: ${JSON.stringify(p.level)}, credential: ${JSON.stringify(p.credential)}, ` +
        `area: ${JSON.stringify(p.area)} },`
    )
    .join("\n");

  return `// Broward College program catalog.
//
// GENERATED FILE — do not edit by hand. Regenerate with:
//   npm run scrape:broward
//
// Source:   ${SOURCE_URL}
// Scraped:  ${today}
// Programs: ${programs.length} (${Object.entries(counts)
    .sort()
    .map(([k, v]) => `${v} ${k}`)
    .join(", ")})
//
// The plain Associate of Arts is added by the scraper: Broward's Degree Finder
// lists only the Honors variant, and the general A.A. is the degree most
// transfer students actually take.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const BROWARD_PROGRAMS: SchoolProgram[] = [
${rows}
];

// A state college's pathways start at an associate degree, so an unqualified
// program name should resolve there rather than to a bachelor's.
export const browardCatalog = createProgramCatalog(BROWARD_PROGRAMS, {
  preferred: "associate",
});
`;
}

async function main() {
  console.log(`Fetching ${SOURCE_URL}`);
  const response = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (Vocation catalog scraper)" },
  });
  if (!response.ok) throw new Error(`Broward returned HTTP ${response.status}`);

  const { programs, unparsed } = parse(await response.text());

  if (unparsed.length) {
    throw new Error(
      `${unparsed.length} entries could not be parsed (e.g. "${unparsed[0]}") — ` +
        `Broward's markup or credential list changed.`
    );
  }
  if (programs.length < MIN_EXPECTED) {
    throw new Error(
      `Only found ${programs.length} programs (expected at least ${MIN_EXPECTED}). ` +
        `Refusing to overwrite the catalog with a likely-broken parse.`
    );
  }

  mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, render(programs), "utf8");

  const counts = programs.reduce((acc, p) => ((acc[p.level] = (acc[p.level] || 0) + 1), acc), {});
  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}`);
  console.log(`  ${programs.length} programs`);
  for (const [level, n] of Object.entries(counts).sort()) console.log(`    ${n} ${level}`);
  console.log(`  ${new Set(programs.map((p) => p.area)).size} career areas`);
}

main().catch((error) => {
  console.error(`\nScrape failed: ${error.message}`);
  process.exit(1);
});
