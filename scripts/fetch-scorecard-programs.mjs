// Pulls College Scorecard's field-of-study earnings data and writes it to
// data/scorecard-programs.json — what THIS program's graduates earn, as
// opposed to data/scorecard.json's institution-wide figure (every major at
// the school averaged together). Committed for the same three reasons
// fetch-scorecard.mjs gives: no durable serverless filesystem, a reviewable
// diff, and federal data that changes at most once a year.
//
// Scoped to Florida by default, not national. Program-level earnings can
// only ever be DISPLAYED next to a real program list, and a real program
// list exists for exactly the schools in SCHOOLS_WITH_CATALOG — 53 schools,
// all Florida, as of this writing (app/lib/schoolCatalogs.ts). A national
// pull would fetch ~377x the institutions for data nothing can show. If a
// catalog for another state is ever added, widen --state or drop it for a
// national pull — same flag fetch-scorecard.mjs already uses.
//
// Rule 1 (never invent school data) applies here exactly as it does to
// fetch-scorecard.mjs: every row is a real API response, no synthetic fill.
//
// KEY DESIGN FACTS, confirmed against a live API call before writing this
// (see the plan's Phase 1 verification step):
//
//   1. Scorecard's field-of-study CIP code is coarser than our O*NET
//      crosswalk's. The crosswalk uses dotted 6-digit codes (e.g.
//      "01.0601"); Scorecard's `cip_4_digit.code` is the series + first two
//      detail digits with the dot stripped (e.g. "0106"). Confirmed live:
//      01.0601 (Horticulture Operations), 01.0605 (Landscaping), and
//      01.0607 (Turf Management) all collapse into Scorecard's single
//      "0106" bucket. Real precision loss, but still a program-family
//      figure rather than an institution-wide average — reader.ts documents
//      the exact truncation this file's keys assume.
//
//   2. Earnings are reported per (CIP, credential level), not per CIP alone
//      — a certificate, an associate's, and a bachelor's in the same field
//      pay very differently and Scorecard reports them separately.
//      Confirmed live at one school: Certificate $49k / Associate's $57k /
//      Bachelor's $62k, same CIP bucket. SchoolProgram.level
//      (app/lib/programCatalog.ts) is the join key on our side.
//
//   3. School-specific earnings are null roughly 65% of the time — real
//      federal small-cohort privacy suppression, not missing data. A
//      national benchmark for the same (CIP, credential) is populated
//      roughly 76% of the time and rides along in the same response. Both
//      are captured here; which one to prefer at render time is
//      app/lib/scorecardPrograms.ts's decision, not this script's.
//
// Usage:
//   SCORECARD_API_KEY=... npm run fetch:scorecard-programs                 FL (default)
//   SCORECARD_API_KEY=... npm run fetch:scorecard-programs -- --state=TX   one state
//   SCORECARD_API_KEY=... npm run fetch:scorecard-programs -- --national   every state
//   npm run fetch:scorecard-programs -- --dry-run                          fetch, don't write

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "data", "scorecard-programs.json");
const ENV_FILE = path.join(ROOT, ".env.local");

const BASE_URL = "https://api.data.gov/ed/collegescorecard/v1/schools.json";
const PER_PAGE = 20; // Field-of-study responses are large per row; a small
// page keeps any single request from timing out on a slow connection.

const DEFAULT_STATE = "FL";

// The nested field-of-study array. Unlike fetch-scorecard.mjs's flat FIELDS
// list, this can't be requested as individual dotted sub-paths — the API
// returns the whole array of objects per school for this one top-level key.
const FIELDS = ["id", "school.name", "latest.programs.cip_4_digit"].join(",");

// Same reader as fetch-scorecard.mjs — kept duplicated rather than shared
// across two tiny scripts (HANDOFF rule 8: not worth a shared module for
// four lines each script already has).
async function loadEnvLocal() {
  if (!existsSync(ENV_FILE)) return;
  const text = await readFile(ENV_FILE, "utf8");
  for (const line of text.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, name, rawValue] = match;
    if (process.env[name] !== undefined) continue;
    process.env[name] = rawValue.replace(/^["']|["']$/g, "");
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(apiKey, page, stateFilter) {
  const url = new URL(BASE_URL);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("per_page", String(PER_PAGE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("fields", FIELDS);
  if (stateFilter) url.searchParams.set("school.state", stateFilter);

  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url.toString());
    if (response.status === 429) {
      const wait = 5000 * (attempt + 1);
      console.warn(`  rate limited on page ${page}, waiting ${wait}ms...`);
      await sleep(wait);
      continue;
    }
    if (!response.ok) {
      throw new Error(
        `Scorecard API HTTP ${response.status} on page ${page}: ${await response.text()}`
      );
    }
    return response.json();
  }
  throw new Error(`Scorecard API still rate-limited after retries on page ${page}`);
}

// One row per (school, CIP bucket, credential level) — the exact key
// app/lib/scorecardPrograms.ts looks records up by.
function normalizeProgram(unitId, raw) {
  const earnings4yr = raw.earnings?.["4_yr"] ?? {};
  return {
    unitId,
    // Already the coarse "0106"-style 4-char code Scorecard reports at —
    // see this file's header for why it's coarser than our crosswalk.
    cip4: raw.code,
    cipTitle: raw.title ?? null,
    credentialLevel: raw.credential?.level ?? null,
    credentialTitle: raw.credential?.title ?? null,
    // School-specific: null far more often than not (privacy suppression
    // for small cohorts). Never backfilled — a null here means the file
    // has nothing to say for this exact school, not zero earnings.
    schoolMedianEarnings: earnings4yr.overall_median_earnings ?? null,
    // National benchmark for the same (CIP, credential) pair — the fallback
    // scorecardPrograms.ts reaches for when the school-specific figure is
    // suppressed. Confirmed live to be populated far more often.
    nationalMedianEarnings: earnings4yr.overall_median_earnings_national ?? null,
  };
}

async function main() {
  await loadEnvLocal();

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const national = args.includes("--national");
  const stateArg = args.find((a) => a.startsWith("--state="));
  const stateFilter = national ? null : (stateArg ? stateArg.split("=")[1].toUpperCase() : DEFAULT_STATE);

  const apiKey = process.env.SCORECARD_API_KEY;
  const usingDemoKey = !apiKey;
  if (usingDemoKey) {
    console.warn(
      "No SCORECARD_API_KEY set — falling back to api.data.gov's shared DEMO_KEY.\n" +
        "That key's rate limit only supports a handful of requests total, so this\n" +
        "run will likely fail partway through. Get a free, instant key at\n" +
        "https://api.data.gov/signup/ and set SCORECARD_API_KEY for a real pull.\n"
    );
  }
  const key = apiKey || "DEMO_KEY";

  console.log(
    `Fetching College Scorecard field-of-study data${stateFilter ? ` for ${stateFilter}` : " (national)"}...`
  );

  const rows = [];
  let schoolsSeen = 0;
  let page = 0;
  let total = Infinity;

  while (schoolsSeen < total) {
    const body = await fetchPage(key, page, stateFilter);
    total = body.metadata?.total ?? schoolsSeen;
    const results = body.results ?? [];
    if (results.length === 0) break;

    for (const school of results) {
      const programs = school["latest.programs.cip_4_digit"] ?? [];
      for (const program of programs) {
        rows.push(normalizeProgram(school.id, program));
      }
    }

    schoolsSeen += results.length;
    console.log(`  page ${page}: ${schoolsSeen}/${total} schools, ${rows.length} program rows so far`);
    page += 1;
    await sleep(usingDemoKey ? 3000 : 300);
  }

  // Same "refuse to write a suspiciously small result" guard as
  // fetch-scorecard.mjs, scaled to this fetch's expected size. A Florida
  // pull returns ~370 institutions; anything far short of that on an
  // unfiltered or state-filtered run is a truncated/rate-limited run, not a
  // real snapshot.
  const minExpectedSchools = national ? 5000 : 50;
  if (schoolsSeen < minExpectedSchools) {
    console.error(
      `Only saw ${schoolsSeen} institutions (expected ${minExpectedSchools}+).\n` +
        "Not writing data/scorecard-programs.json — this looks like a truncated or\n" +
        "rate-limited run, not a real snapshot. Re-run with a real SCORECARD_API_KEY."
    );
    process.exit(1);
  }

  const snapshot = {
    fetchedAt: new Date().toISOString().slice(0, 10),
    source: "US Dept. of Education College Scorecard API (collegescorecard.ed.gov), field of study",
    scope: stateFilter ?? "national",
    schoolCount: schoolsSeen,
    count: rows.length,
    programs: rows,
  };

  if (dryRun) {
    console.log(`\n--dry-run: fetched ${rows.length} program rows across ${schoolsSeen} schools, not writing.`);
    return;
  }

  await writeFile(OUT_FILE, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  console.log(`\nWrote ${rows.length} program rows (${schoolsSeen} schools) to data/scorecard-programs.json.`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
