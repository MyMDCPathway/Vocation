// Pulls a real snapshot of US Dept. of Education College Scorecard data and
// writes it to data/scorecard.json — the earnings, completion, admission, and
// net-price figures /schools sorts by (see HANDOFF §"Phase 1"). Committed
// rather than fetched live on every request, for the same three reasons
// data/seed-cache.json is committed: serverless has no durable filesystem, a
// committed file is reviewable and diffable in a PR, and the underlying
// federal data changes at most once a year.
//
// Rule 1 (never invent school data) applies here exactly as it does to every
// scraped catalog: every row in the output file is a real API response.
// There is no synthetic fallback and no estimated fill-in for a school the
// API doesn't return.
//
// Usage:
//   SCORECARD_API_KEY=... npm run fetch:scorecard                 full national pull
//   SCORECARD_API_KEY=... npm run fetch:scorecard -- --state=FL   one state only
//   npm run fetch:scorecard -- --dry-run                          fetch, don't write
//
// Get a free, instant key at https://api.data.gov/signup/ — same "optional
// but strongly recommended" shape as BLS_API_KEY in .env.example. Without a
// key this falls back to api.data.gov's shared DEMO_KEY, which is throttled
// hard enough (a handful of requests, shared across every project using it)
// that it can only prove the script works against one small state, never
// produce a real national snapshot. This script refuses to write a truncated
// national result rather than commit a silently incomplete one.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "data", "scorecard.json");
const ENV_FILE = path.join(ROOT, ".env.local");

const BASE_URL = "https://api.data.gov/ed/collegescorecard/v1/schools.json";
const PER_PAGE = 100;

// Dotted paths the API's `fields` param accepts, flattened in the response
// under these exact keys. Kept narrow to exactly what /schools sorts and
// displays by — a wider fields list is a slower response for no benefit.
const FIELDS = [
  "id",
  "school.name",
  "school.city",
  "school.state",
  "school.zip",
  "school.ownership", // 1 public, 2 private nonprofit, 3 private for-profit
  "school.school_url",
  "location.lat",
  "location.lon",
  "latest.student.size",
  "latest.admissions.admission_rate.overall",
  "latest.completion.completion_rate_4yr_150nt",
  "latest.completion.completion_rate_less_than_4yr_150nt",
  "latest.earnings.10_yrs_after_entry.median",
  "latest.cost.avg_net_price.overall",
].join(",");

// Minimal .env.local reader — same as export-cache.mjs. Next.js loads that
// file for the app; a plain node script gets no such treatment, and pulling
// in dotenv for four lines isn't worth a dependency (HANDOFF rule 8).
async function loadEnvLocal() {
  if (!existsSync(ENV_FILE)) return;
  const text = await readFile(ENV_FILE, "utf8");
  for (const line of text.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, name, rawValue] = match;
    if (process.env[name] !== undefined) continue; // real env wins
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

  // A real backoff on 429, not an immediate retry — this is a shared public
  // rate limit, not a private one, and hammering it on failure is both bad
  // citizenship and unlikely to succeed any sooner.
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

function normalizeRow(raw) {
  return {
    unitId: raw.id,
    name: raw["school.name"] ?? null,
    city: raw["school.city"] ?? null,
    state: raw["school.state"] ?? null,
    zip: raw["school.zip"] ?? null,
    ownership: raw["school.ownership"] ?? null,
    website: raw["school.school_url"] ?? null,
    latitude: raw["location.lat"] ?? null,
    longitude: raw["location.lon"] ?? null,
    studentSize: raw["latest.student.size"] ?? null,
    admissionRate: raw["latest.admissions.admission_rate.overall"] ?? null,
    // 4-year completion when it exists; less-than-4-year (state colleges,
    // technical schools) otherwise. A school reports at most one of these.
    completionRate:
      raw["latest.completion.completion_rate_4yr_150nt"] ??
      raw["latest.completion.completion_rate_less_than_4yr_150nt"] ??
      null,
    medianEarnings10yr: raw["latest.earnings.10_yrs_after_entry.median"] ?? null,
    netPrice: raw["latest.cost.avg_net_price.overall"] ?? null,
  };
}

async function main() {
  await loadEnvLocal();

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const stateArg = args.find((a) => a.startsWith("--state="));
  const stateFilter = stateArg ? stateArg.split("=")[1].toUpperCase() : null;

  const apiKey = process.env.SCORECARD_API_KEY;
  const usingDemoKey = !apiKey;
  if (usingDemoKey) {
    console.warn(
      "No SCORECARD_API_KEY set — falling back to api.data.gov's shared DEMO_KEY.\n" +
        "That key's rate limit only supports a handful of requests total, so this\n" +
        "run will likely fail partway through anything but a single small state.\n" +
        "Get a free, instant key at https://api.data.gov/signup/ and set\n" +
        "SCORECARD_API_KEY for a real national pull.\n"
    );
  }
  const key = apiKey || "DEMO_KEY";

  console.log(
    `Fetching College Scorecard data${stateFilter ? ` for ${stateFilter}` : " (all states)"}...`
  );

  const rows = [];
  let page = 0;
  let total = Infinity;

  while (rows.length < total) {
    const body = await fetchPage(key, page, stateFilter);
    total = body.metadata?.total ?? rows.length;
    const results = body.results ?? [];
    if (results.length === 0) break;
    rows.push(...results.map(normalizeRow));
    console.log(`  page ${page}: ${rows.length}/${total}`);
    page += 1;
    // Polite pacing on a shared public API, real key or not — steeper on the
    // shared DEMO_KEY since every other project's smoke test shares its quota.
    await sleep(usingDemoKey ? 3000 : 300);
  }

  // Same "refuse to write a suspiciously small result" guard the program
  // scrapers use — a truncated run committed as if it were complete is worse
  // than no file at all, because nothing downstream would know to distrust it.
  if (!stateFilter && rows.length < 5000) {
    console.error(
      `Only got ${rows.length} institutions for a national pull (expected 6,000+).\n` +
        "Not writing data/scorecard.json — this looks like a truncated or\n" +
        "rate-limited run, not a real snapshot. Re-run with a real SCORECARD_API_KEY."
    );
    process.exit(1);
  }

  const snapshot = {
    // A plain node script, not the sandboxed Workflow tool — Date.now() here
    // is fine and is the honest "when was this actually pulled" stamp the
    // reader and UI cite next to every figure.
    fetchedAt: new Date().toISOString().slice(0, 10),
    source: "US Dept. of Education College Scorecard API (collegescorecard.ed.gov)",
    scope: stateFilter ?? "national",
    count: rows.length,
    schools: rows,
  };

  if (dryRun) {
    console.log(`\n--dry-run: fetched ${rows.length} institutions, not writing.`);
    return;
  }

  await writeFile(OUT_FILE, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  console.log(`\nWrote ${rows.length} institutions to data/scorecard.json.`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
