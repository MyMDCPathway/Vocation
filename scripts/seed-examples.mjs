// Generates data/example-pathways.json — the fixed set of read-only example
// routes /roadmaps/[career] shows, and what the landing page's three "View
// Full Roadmap" cards actually link to now.
//
// Deliberately separate from data/seed-cache.json (seed-pathways.mjs). That
// file is the real answer for whatever a student actually asks about,
// growing from real demand; this one is a small, fixed, hand-reviewed set
// for exactly the three careers app/page.tsx's EXAMPLE_ROUTES names. Mixing
// them would mean editing this curated set every time the main cache grows.
//
// "Optimal route" means the same MDC generation every student gets for that
// career — not personalized, no location or income involved. This script
// doesn't add a new generation path; it just calls the real
// /api/generate-pathway route (same as seed-pathways.mjs) and keeps the one
// PRIMARY option, since a read-only example page shows one route, not a
// student's full set of alternatives.
//
// Usage:
//   SEED_MODE=1 npm run dev          (in one terminal)
//   npm run seed-examples            (in another)

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "data", "example-pathways.json");
const BASE_URL = process.env.SEED_BASE_URL ?? "http://localhost:3000";
const DELAY_MS = Number(process.env.SEED_DELAY_MS ?? 3000);

// Matches app/page.tsx's EXAMPLE_ROUTES exactly — same three careers, same
// order, so the landing page's cards and this file never drift apart.
const EXAMPLE_CAREERS = [
  "Registered Nurse",
  "Machine Learning Technician",
  "Aircraft Maintenance Technician",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generate(career) {
  const response = await fetch(`${BASE_URL}/api/generate-pathway`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ career, school: "mdc" }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
  return body;
}

async function main() {
  const existing = existsSync(OUT_FILE)
    ? JSON.parse(await readFile(OUT_FILE, "utf8"))
    : {};

  console.log(`Generating ${EXAMPLE_CAREERS.length} example pathways against ${BASE_URL}...\n`);

  const result = {};
  const failures = [];

  for (const career of EXAMPLE_CAREERS) {
    try {
      const data = await generate(career);
      const primary = data.pathways?.find((p) => p.isPrimary) ?? data.pathways?.[0];
      if (!primary) throw new Error("No pathway option in the response.");

      result[career] = {
        title: primary.title,
        steps: primary.steps,
        confidence: data.confidence ?? "catalog",
      };
      console.log(`  ${career} — ${primary.steps.length} steps`);
    } catch (error) {
      failures.push({ career, error: error.message });
      console.error(`  ${career} — FAILED: ${error.message}`);
      // Keep whatever was already there for this career rather than dropping
      // it because today's regeneration attempt failed.
      if (existing[career]) result[career] = existing[career];
    }
    await sleep(DELAY_MS);
  }

  if (Object.keys(result).length === 0) {
    console.error("\nNothing generated — not writing an empty file.");
    process.exit(1);
  }

  await writeFile(OUT_FILE, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.log(`\nWrote ${Object.keys(result).length} example pathways to data/example-pathways.json.`);

  if (failures.length) {
    console.log(`\n${failures.length} failed — re-run to retry:`);
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
