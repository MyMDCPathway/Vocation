// Regenerates app/lib/fiu-programs.ts from FIU's public degree finder.
//
//   npm run scrape:fiu
//
// FIU server-renders the whole program list into the page, so this is a plain
// fetch and parse — no browser needed. Each <li> carries the program name, its
// link, the degree level, the college, and the area of interest:
//
//   <li>
//     <a class="link" href="URL"><p class="program">Accounting (BACC)</p></a>
//     <p><strong>Degree type: </strong><span class="degree-type">Undergraduate</span>
//        <strong>College: </strong>...<span class="college">Business</span></p>
//     <span class="area-of-interest hide">Business and Economics</span>
//   </li>
//
// Re-run this when FIU updates its catalog. If the counts printed at the end
// drop sharply or "unparsed" is non-zero, FIU changed their markup and the
// selectors below need updating — don't commit a half-empty catalog.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL = "https://www.fiu.edu/academics/degrees-and-programs/index.html";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "app", "lib", "fiu-programs.ts");

// Below this, assume the page changed rather than that FIU cut its catalog.
const MIN_EXPECTED = 200;

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
    .trim();

const stripTags = (s) => decode(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));

// FIU appends its own campaign tracking to every link. It isn't part of the
// destination and would misattribute traffic arriving from this app.
function stripUtm(params) {
  for (const key of [...params.keys()]) {
    if (key.startsWith("utm_")) params.delete(key);
  }
  return params.toString();
}

function cleanUrl(raw) {
  try {
    const url = new URL(decode(raw));
    url.search = stripUtm(url.searchParams);

    // A few FIU links put the query AFTER the fragment
    // (".../index.html#section?utm_source=..."), which is malformed, so the
    // parser treats the whole tail as the hash and searchParams never sees it.
    if (url.hash.includes("?")) {
      const [fragment, query] = url.hash.split("?");
      const rest = stripUtm(new URLSearchParams(query));
      url.hash = rest ? `${fragment}?${rest}` : fragment;
    }

    return url.toString();
  } catch {
    return decode(raw);
  }
}

function parse(html) {
  const programs = [];
  let unparsed = 0;

  for (const chunk of html.split("<li>").slice(1)) {
    const block = chunk.split("</li>")[0];
    if (!/class="program"/.test(block)) continue;

    const link = block.match(/<a[^>]*class="link"[^>]*href="([^"]+)"/i);
    const name = block.match(/<p[^>]*class="program"[^>]*>([\s\S]*?)<\/p>/i);
    if (!link || !name) {
      unparsed++;
      continue;
    }

    const level = block.match(/class="degree-type"[^>]*>([\s\S]*?)<\/span>/i);
    const college = block.match(/class="college"[^>]*>([\s\S]*?)<\/span>/i);
    const area = block.match(/class="area-of-interest[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    const levelText = level ? stripTags(level[1]).toLowerCase() : "";

    programs.push({
      name: stripTags(name[1]),
      url: cleanUrl(link[1]),
      level: levelText.includes("under") ? "bachelor" : "graduate",
      college: college ? stripTags(college[1]) : "",
      areaOfInterest: area ? stripTags(area[1]) : "",
    });
  }

  // A program can be listed under more than one area of interest.
  const seen = new Map();
  for (const p of programs) {
    const key = `${p.name}|${p.url}`;
    if (!seen.has(key)) seen.set(key, p);
  }

  return {
    programs: [...seen.values()].sort((a, b) => a.name.localeCompare(b.name)),
    unparsed,
  };
}

function render(programs) {
  const today = new Date().toISOString().slice(0, 10);
  const undergrad = programs.filter((p) => p.level === "bachelor").length;

  const rows = programs
    .map(
      (p) =>
        `  { name: ${JSON.stringify(p.name)}, url: ${JSON.stringify(p.url)}, ` +
        `level: ${JSON.stringify(p.level)}, college: ${JSON.stringify(p.college)}, ` +
        `areaOfInterest: ${JSON.stringify(p.areaOfInterest)}, area: ${JSON.stringify(p.areaOfInterest)} },`
    )
    .join("\n");

  return `// FIU degree catalog: program name -> official program page.
//
// GENERATED FILE — do not edit by hand. Regenerate with:
//   npm run scrape:fiu
//
// Source:     ${SOURCE_URL}
// Scraped:    ${today}
// Programs:   ${programs.length} (${undergrad} bachelor, ${programs.length - undergrad} graduate)
//
// This mirrors what app/lib/mdc-programs.ts does for Miami Dade College, so a
// generated pathway can link the transfer and bachelor's steps to the real FIU
// page instead of guessing a URL. FIU restructures its site periodically; if
// links start 404ing, re-run the scraper.

import {
  createProgramCatalog,
  type ProgramLevel,
  type SchoolProgram,
} from "@/app/lib/programCatalog";

export type FIUProgramLevel = Extract<ProgramLevel, "bachelor" | "graduate">;

export interface FIUProgram extends SchoolProgram {
  level: FIUProgramLevel;
  /** FIU college the program sits in, e.g. "Business". */
  college: string;
  /** FIU's own browse category, e.g. "Business and Economics". */
  areaOfInterest: string;
}

export const FIU_PROGRAMS: FIUProgram[] = [
${rows}
];

// FIU is a four-year university, so an unqualified program name should resolve
// to the bachelor's rather than the master's of the same name.
export const fiuCatalog = createProgramCatalog(FIU_PROGRAMS, { preferred: "bachelor" });
const catalog = fiuCatalog;

/**
 * Resolves a free-text program name to an FIU program.
 *
 * See app/lib/programCatalog.ts for the matching rules — in particular that a
 * query naming a credential matches STRICTLY, returning nothing rather than a
 * program at the wrong level.
 */
export function findFIUProgram(
  programName: string,
  levelHint?: string
): FIUProgram | undefined {
  return catalog.find(programName, levelHint) as FIUProgram | undefined;
}

export function getFIUProgramUrl(
  programName: string,
  levelHint?: string
): string | null {
  return catalog.getUrl(programName, levelHint);
}

export function isFIUProgram(programName: string, levelHint?: string): boolean {
  return catalog.has(programName, levelHint);
}

/** Every distinct college, for grouping or filtering in the UI. */
export function fiuColleges(): string[] {
  return [...new Set(FIU_PROGRAMS.map((p) => p.college))].filter(Boolean).sort();
}

/** Every distinct area of interest, for grouping or filtering in the UI. */
export function fiuAreasOfInterest(): string[] {
  return [...new Set(FIU_PROGRAMS.map((p) => p.areaOfInterest))]
    .filter(Boolean)
    .sort();
}
`;
}

async function main() {
  console.log(`Fetching ${SOURCE_URL}`);
  const response = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (Vocation catalog scraper)" },
  });
  if (!response.ok) {
    throw new Error(`FIU returned HTTP ${response.status}`);
  }

  const { programs, unparsed } = parse(await response.text());

  if (unparsed > 0) {
    throw new Error(
      `${unparsed} list entries had a program name but no link — FIU's markup changed.`
    );
  }
  if (programs.length < MIN_EXPECTED) {
    throw new Error(
      `Only found ${programs.length} programs (expected at least ${MIN_EXPECTED}). ` +
        `Refusing to overwrite the catalog with a likely-broken parse.`
    );
  }

  writeFileSync(OUT_FILE, render(programs), "utf8");

  const undergrad = programs.filter((p) => p.level === "bachelor").length;
  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}`);
  console.log(`  ${programs.length} programs (${undergrad} bachelor, ${programs.length - undergrad} graduate)`);
  console.log(`  ${new Set(programs.map((p) => p.college)).size} colleges`);
  console.log(`  ${new Set(programs.map((p) => p.areaOfInterest)).size} areas of interest`);
}

main().catch((error) => {
  console.error(`\nScrape failed: ${error.message}`);
  process.exit(1);
});
