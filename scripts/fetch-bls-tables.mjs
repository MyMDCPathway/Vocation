// Pull the two BLS lookup tables the labour-market stats are keyed on.
//
//   oe.occupation  every SOC occupation code and its official title
//   oe.area        every area code BLS reports by — national, 54 states, 528 metros
//
// These are the join keys for the OEWS series IDs in app/lib/blsStats.ts. They
// change roughly once a year when BLS republishes, they're small, and having
// them committed means a career profile doesn't depend on download.bls.gov
// being up. Re-run with `node scripts/fetch-bls-tables.mjs` after a BLS
// release.
//
// The titles are BLS's, verbatim. Nothing here is hand-written or inferred:
// a career name is matched against the real occupation list, and if it doesn't
// match anything, the profile shows no statistics rather than approximate ones.

import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// BLS blocks requests without a contact-bearing User-Agent.
const UA = "Vocation/2.0 (career planning app; chrisorozco305@gmail.com)";
const BASE = "https://download.bls.gov/pub/time.series/oe";

/** Parse one of BLS's tab-separated tables into objects. Files are CRLF. */
async function table(name) {
  const response = await fetch(`${BASE}/${name}`, { headers: { "User-Agent": UA } });
  if (!response.ok) {
    throw new Error(`${name}: HTTP ${response.status}`);
  }
  const text = await response.text();
  const lines = text.trim().split("\n");
  const headers = lines[0].split("\t").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const cells = line.split("\t");
    const row = {};
    headers.forEach((header, i) => {
      row[header] = (cells[i] ?? "").trim();
    });
    return row;
  });
}

async function main() {
  console.log("Fetching BLS occupation table…");
  const occupations = await table("oe.occupation");

  // display_level 3 is the detailed SOC occupation — an actual job like
  // "Registered nurses". Levels 0-2 are the rolled-up families ("Healthcare
  // Practitioners"), which have wage data but are far too broad to show a
  // student who asked about one specific job.
  const detailed = occupations
    .filter((row) => row.display_level === "3" && row.occupation_code)
    .map((row) => ({ code: row.occupation_code, title: row.occupation_name }));

  console.log(`  ${occupations.length} rows, ${detailed.length} detailed occupations`);

  console.log("Fetching BLS area table…");
  const areas = await table("oe.area");
  const usable = areas
    .filter((row) => row.area_code && row.areatype_code !== "N")
    .map((row) => ({
      state: row.state_code,
      code: row.area_code,
      type: row.areatype_code,
      name: row.area_name,
    }));

  const metros = usable.filter((a) => a.type === "M").length;
  const states = usable.filter((a) => a.type === "S").length;
  console.log(`  ${states} states, ${metros} metro areas`);

  await writeFile(
    join(ROOT, "data", "bls-occupations.json"),
    JSON.stringify(detailed, null, 0) + "\n"
  );
  await writeFile(
    join(ROOT, "data", "bls-areas.json"),
    JSON.stringify(usable, null, 0) + "\n"
  );

  console.log("Wrote data/bls-occupations.json and data/bls-areas.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
