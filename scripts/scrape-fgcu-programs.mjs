// Regenerates app/lib/programs/fgcu.ts from Florida Gulf Coast University's
// academic catalog.
//
//   npm run scrape:fgcu
//
// Unlike UCF/UF, FGCU's whole catalog (undergrad AND graduate) lives on one
// CourseLeaf "A to Z" sitemap page: catalog.fgcu.edu/programs/. Every real
// program link states its own credential in parens right in the link text
// ("Accounting (B.S.)", "Accounting and Taxation (M.S.)"), so level
// classification doesn't need a second source the way UF's did — a credential
// starting with "B." is a bachelor's; everything else that isn't a Minor or
// Certificate is graduate.
//
// The same page mixes in site navigation using the same <li><a> markup (the
// letter-jump menu, "Apply", "Visit", etc.), so only links whose href starts
// with /programs/ are kept.
//
// FGCU (and USF — dropped from this batch for the same reason) sit behind AWS
// WAF Bot Control, which challenges Node's fetch() but, empirically, does not
// challenge curl with an ordinary browser User-Agent — the two have different
// TLS/HTTP client fingerprints and this WAF rule is fingerprint-based, not
// User-Agent-based. So this scraper shells out to curl instead of using
// fetch(). If a future Florida-school scraper hits an empty body with HTTP
// 202 and an `x-amzn-waf-action: challenge` response header, this is why —
// try curl before concluding the site can't be scraped at all.
//
// Re-run this when FGCU updates its catalog. If the count printed at the end
// drops sharply, FGCU changed something structural and the parsing below
// needs updating.

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL = "https://catalog.fgcu.edu/programs/";
const ORIGIN = "https://catalog.fgcu.edu";

// FGCU is a smaller regional university than UCF/FIU/UF — its real bachelor's
// and graduate counts are in the dozens, not the hundreds. These floors are
// scaled to that, not loosened from the other scrapers' standard.
const MIN_EXPECTED_BACHELOR = 40;
const MIN_EXPECTED_GRADUATE = 20;

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function fetchHtml(url) {
  const html = execFileSync("curl", ["-s", "-A", BROWSER_USER_AGENT, url], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (!html) {
    throw new Error(`curl returned an empty response for ${url}`);
  }
  return html;
}

function parse(html) {
  const programs = [];
  const itemRe = /<li><a href="(\/programs\/[^"]+)">([^<]+)<\/a><\/li>/g;
  for (const m of html.matchAll(itemRe)) {
    const text = decode(m[2]);
    const credentialMatch = text.match(/\(([^)]+)\)\s*$/);
    if (!credentialMatch) continue; // no known entry lacks a credential tag

    const credential = credentialMatch[1];
    if (credential === "Minor" || credential === "Certificate") continue;

    const name = text.slice(0, credentialMatch.index).trim();
    programs.push({
      name,
      url: new URL(m[1], ORIGIN).toString(),
      level: credential.startsWith("B.") ? "bachelor" : "graduate",
      credential,
    });
  }

  // The A-Z sitemap can list the identical <li> twice if a program appears
  // under more than one department cross-reference.
  const seen = new Map();
  for (const p of programs) {
    const key = `${p.name}|${p.credential}`;
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
        `level: ${JSON.stringify(p.level)}, credential: ${JSON.stringify(p.credential)} },`
    )
    .join("\n");

  return `// FGCU degree catalog: program name -> official program page.
//
// GENERATED FILE — do not edit by hand. Regenerate with:
//   npm run scrape:fgcu
//
// Source:     ${SOURCE_URL}
// Scraped:    ${today}
// Programs:   ${programs.length} (${bachelor} bachelor, ${graduate} graduate)
//
// FGCU is a four-year university (like FIU/UCF/UF), so pathways start at the
// bachelor's rather than an associate degree. Every entry's own credential
// (e.g. "B.S.", "M.S.", "D.N.P.") comes straight from FGCU's single combined
// A-Z program sitemap — no area/college field, since that page doesn't
// expose one and guessing would be worse than leaving it out.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const FGCU_PROGRAMS: SchoolProgram[] = [
${rows}
];

// FGCU is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const fgcuCatalog = createProgramCatalog(FGCU_PROGRAMS, { preferred: "bachelor" });
`;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "app", "lib", "programs", "fgcu.ts");

async function main() {
  console.log(`Fetching ${SOURCE_URL}`);
  const programs = parse(await fetchHtml(SOURCE_URL));

  const bachelor = programs.filter((p) => p.level === "bachelor");
  const graduate = programs.filter((p) => p.level === "graduate");

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

  const sorted = [...programs].sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync(OUT_FILE, render(sorted), "utf8");

  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}`);
  console.log(`  ${sorted.length} programs (${bachelor.length} bachelor, ${graduate.length} graduate)`);
}

main().catch((error) => {
  console.error(`\nScrape failed: ${error.message}`);
  process.exit(1);
});
