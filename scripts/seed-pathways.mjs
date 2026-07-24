// Pre-generates pathways for the common careers and writes data/seed-cache.json.
//
// Why this exists: without it, the first visitor to ask about each career pays
// a slow, billable Gemini generation, and on serverless that cost repeats after
// every cold start because the in-memory cache is gone. Running this once
// locally moves that cost off your visitors and into a file you commit, review,
// and correct.
//
// Usage:
//   1. Start the dev server with seeding enabled:
//        SEED_MODE=1 npm run dev          (PowerShell: $env:SEED_MODE=1; npm run dev)
//   2. In a second terminal:
//        npm run seed                     (all careers)
//        npm run seed -- --limit 20       (just the first 20)
//        npm run seed -- --no-exams       (skip exam lookups)
//
// The script merges into any existing seed file, so if you hit Gemini's
// per-minute limit partway through you can re-run it and keep what you had.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ALIASES_FILE = path.join(ROOT, "app", "lib", "careerAliases.ts");
const SEED_FILE = path.join(ROOT, "data", "seed-cache.json");

const BASE_URL = process.env.SEED_BASE_URL ?? "http://localhost:3000";

// Gemini's free tier caps requests per minute. Pathway generation plus its exam
// lookups is several calls, so pace the loop rather than getting throttled.
const DELAY_MS = Number(process.env.SEED_DELAY_MS ?? 5000);

function parseArgs(argv) {
  const args = { limit: Infinity, exams: true };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit") args.limit = Number(argv[++i]);
    else if (argv[i] === "--no-exams") args.exams = false;
  }
  return args;
}

// Single source of truth for canonical titles is the TypeScript alias table.
// This script is plain ESM and can't import it, so the values are extracted
// textually. The count check below turns a silently-empty parse into a loud
// failure if that file's shape ever changes.
async function readCanonicalCareers() {
  const source = await readFile(ALIASES_FILE, "utf8");
  const values = [...source.matchAll(/:\s*"([^"]+)"\s*,/g)].map((m) => m[1]);
  const unique = [...new Set(values)].sort();

  if (unique.length < 20) {
    throw new Error(
      `Only parsed ${unique.length} canonical careers from ${ALIASES_FILE}. ` +
        `Expected the CAREER_ALIASES object literal — has its format changed?`
    );
  }
  return unique;
}

// Must match cacheKey() in app/lib/apiCache.ts exactly, or the app will never
// find what this script writes.
function cacheKey(namespace, input) {
  return `${namespace}:${input.trim().toLowerCase()}`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function postJson(route, body) {
  const response = await fetch(`${BASE_URL}${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload.error ?? `HTTP ${response.status}`;
    return { ok: false, error: detail, status: response.status };
  }
  return { ok: true, data: payload };
}

function examNamesFrom(pathwayData) {
  const names = new Set();
  for (const option of pathwayData?.pathways ?? []) {
    for (const step of option?.steps ?? []) {
      if (step?.type === "exam" && step?.name) names.add(step.name);
    }
  }
  return [...names];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const careers = (await readCanonicalCareers()).slice(0, args.limit);

  const seed = existsSync(SEED_FILE)
    ? JSON.parse(await readFile(SEED_FILE, "utf8"))
    : {};

  console.log(`Seeding ${careers.length} careers against ${BASE_URL}`);
  console.log(`${Object.keys(seed).length} entries already present\n`);

  let generated = 0;
  let skipped = 0;
  const failures = [];

  for (const [index, career] of careers.entries()) {
    const key = cacheKey("pathway", career);
    const position = `[${index + 1}/${careers.length}]`;

    if (seed[key]) {
      skipped++;
      console.log(`${position} ${career} — already seeded, skipping`);
      continue;
    }

    const result = await postJson("/api/generate-pathway", { career });

    if (!result.ok) {
      failures.push({ career, error: result.error });
      console.error(`${position} ${career} — FAILED: ${result.error}`);
      // A 429 here means Gemini is throttling; backing off beats hammering it.
      await sleep(result.status === 429 ? DELAY_MS * 4 : DELAY_MS);
      continue;
    }

    seed[key] = result.data;
    generated++;
    console.log(`${position} ${career} — generated`);

    if (args.exams) {
      for (const examName of examNamesFrom(result.data)) {
        const examKey = cacheKey("exam", examName);
        if (seed[examKey]) continue;

        await sleep(DELAY_MS);
        const exam = await postJson("/api/get-exam-info", { examName });
        if (exam.ok) {
          seed[examKey] = exam.data;
          console.log(`        exam: ${examName}`);
        } else {
          failures.push({ career: examName, error: exam.error });
          console.error(`        exam: ${examName} — FAILED: ${exam.error}`);
        }
      }
    }

    // Write after each career so an interrupted run keeps its progress.
    await writeFile(SEED_FILE, JSON.stringify(seed, null, 2) + "\n", "utf8");
    await sleep(DELAY_MS);
  }

  await writeFile(SEED_FILE, JSON.stringify(seed, null, 2) + "\n", "utf8");

  console.log(`\nDone. ${generated} generated, ${skipped} already present.`);
  console.log(`Seed file now holds ${Object.keys(seed).length} entries.`);

  if (failures.length) {
    console.log(`\n${failures.length} failed — re-run to retry just these:`);
    for (const f of failures) console.log(`  ${f.career}: ${f.error}`);
  }
}

main().catch((error) => {
  console.error("\nSeeding failed.");
  console.error(error.message);
  if (error.cause?.code === "ECONNREFUSED") {
    console.error(
      `\nNothing is listening on ${BASE_URL}. Start the dev server first:\n` +
        `  SEED_MODE=1 npm run dev`
    );
  }
  process.exit(1);
});
