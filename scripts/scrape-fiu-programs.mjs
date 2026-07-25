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
      level: levelText.includes("under") ? "undergraduate" : "graduate",
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
  const undergrad = programs.filter((p) => p.level === "undergraduate").length;

  const rows = programs
    .map(
      (p) =>
        `  { name: ${JSON.stringify(p.name)}, url: ${JSON.stringify(p.url)}, ` +
        `level: ${JSON.stringify(p.level)}, college: ${JSON.stringify(p.college)}, ` +
        `areaOfInterest: ${JSON.stringify(p.areaOfInterest)} },`
    )
    .join("\n");

  return `// FIU degree catalog: program name -> official program page.
//
// GENERATED FILE — do not edit by hand. Regenerate with:
//   npm run scrape:fiu
//
// Source:     ${SOURCE_URL}
// Scraped:    ${today}
// Programs:   ${programs.length} (${undergrad} undergraduate, ${programs.length - undergrad} graduate)
//
// This mirrors what app/lib/mdc-programs.ts does for Miami Dade College, so a
// generated pathway can link the transfer and bachelor's steps to the real FIU
// page instead of guessing a URL. FIU restructures its site periodically; if
// links start 404ing, re-run the scraper.

export type FIUProgramLevel = "undergraduate" | "graduate";

export interface FIUProgram {
  /** Program title exactly as FIU lists it, including its degree code. */
  name: string;
  url: string;
  level: FIUProgramLevel;
  college: string;
  areaOfInterest: string;
}

export const FIU_PROGRAMS: FIUProgram[] = [
${rows}
];

// Matching has to survive the gap between how FIU names a program
// ("Accounting (BACC)") and how a generated pathway names it ("Bachelor of
// Science in Accounting"). Normalizing strips case, punctuation, the
// parenthetical degree code, and the common degree prefixes.

const DEGREE_PREFIX =
  /^(bachelor|master|doctor)(s)?( of| in)?( science| arts| applied science| business administration| fine arts| public administration)?( in| of)?\\s+/;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\\([^)]*\\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\\s+/g, " ");
}

function matchKey(value: string): string {
  return normalize(value).replace(DEGREE_PREFIX, "").trim();
}

const BY_KEY = new Map<string, FIUProgram[]>();
for (const program of FIU_PROGRAMS) {
  for (const key of new Set([normalize(program.name), matchKey(program.name)])) {
    if (!key) continue;
    const bucket = BY_KEY.get(key);
    if (bucket) bucket.push(program);
    else BY_KEY.set(key, [program]);
  }
}

const GRADUATE_HINT =
  /\\b(master|masters|m\\.?s\\.?|m\\.?a\\.?|mba|macc|m\\.?b\\.?a|ph\\.?d|doctor|doctoral|graduate)\\b/i;

const UNDERGRADUATE_HINT =
  /\\b(bachelor|bachelors|b\\.?s\\.?|b\\.?a\\.?|b\\.?b\\.?a|b\\.?f\\.?a|b\\.?a\\.?s|undergraduate)\\b/i;

/**
 * Resolves a free-text program name to an FIU program.
 *
 * Many titles exist at both levels — "Accounting" is both a BACC and a MACC.
 * Undergraduate wins unless a graduate credential is named, because the app's
 * pathways reach FIU as a transfer destination for a bachelor's degree.
 *
 * \`levelHint\` carries a pathway step's level field ("B.S.", "M.B.A. / M.S.
 * (Optional)"), which often states the credential when the program name alone
 * doesn't. It is only consulted for choosing between levels, never for
 * matching, so it can't cause a false match.
 */
export function findFIUProgram(
  programName: string,
  levelHint?: string
): FIUProgram | undefined {
  if (!programName) return undefined;

  const candidates =
    BY_KEY.get(normalize(programName)) ?? BY_KEY.get(matchKey(programName));
  if (!candidates?.length) return undefined;

  const hints = \`\${programName} \${levelHint ?? ""}\`;

  // When the caller states a credential, the match is STRICT: return nothing
  // rather than the other level. Sending a student reading a master's step to
  // a bachelor's page (or the reverse) is worse than showing no link at all.
  if (GRADUATE_HINT.test(hints)) {
    return candidates.find((p) => p.level === "graduate");
  }
  if (UNDERGRADUATE_HINT.test(hints)) {
    return candidates.find((p) => p.level === "undergraduate");
  }

  // No credential stated ("Accounting"): prefer the bachelor's, since pathways
  // reach FIU as a transfer destination, but take whatever exists.
  return (
    candidates.find((p) => p.level === "undergraduate") ?? candidates[0]
  );
}

export function getFIUProgramUrl(
  programName: string,
  levelHint?: string
): string | null {
  return findFIUProgram(programName, levelHint)?.url ?? null;
}

export function isFIUProgram(programName: string, levelHint?: string): boolean {
  return findFIUProgram(programName, levelHint) !== undefined;
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

  const undergrad = programs.filter((p) => p.level === "undergraduate").length;
  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}`);
  console.log(`  ${programs.length} programs (${undergrad} undergraduate, ${programs.length - undergrad} graduate)`);
  console.log(`  ${new Set(programs.map((p) => p.college)).size} colleges`);
  console.log(`  ${new Set(programs.map((p) => p.areaOfInterest)).size} areas of interest`);
}

main().catch((error) => {
  console.error(`\nScrape failed: ${error.message}`);
  process.exit(1);
});
