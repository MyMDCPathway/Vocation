// Pulls the real O*NET CIP-to-SOC crosswalk and writes it to
// data/cip-soc.json — which program of study leads to which real BLS
// occupation, the data /schools/[id]'s "jobs this degree leads to" screen
// needs and that nothing in this repo had before.
//
// NOT the O*NET Web Services API (that needs a registered developer key,
// currently pending approval) — this is O*NET's own static crosswalk file,
// published for direct download with no authentication at all:
//   https://www.onetcenter.org/crosswalks/cip/Education_CIP_to_ONET_SOC.xlsx
// Confirmed live with a plain curl: HTTP 200, no key, no login.
//
// PARSED WITHOUT AN XLSX LIBRARY. An .xlsx is a ZIP archive of XML parts.
// Adding a dependency for a script that runs a few times a year isn't worth
// it when Node's built-in zlib already does the one thing an unzip library
// would (raw DEFLATE inflation) — the rest is walking a ZIP central
// directory, which is a fixed, documented binary format. See readZipEntries
// below. Verified against the file's actual bytes before being trusted here.
//
// CROSS-REFERENCED, NOT TAKEN VERBATIM. O*NET's crosswalk uses O*NET-SOC
// codes ("19-1011.00" — a specialization finer than the base SOC), which are
// normalized to the 6-digit base code (e.g. "191011") and then filtered
// against the occupations actually in data/bls-occupations.json. A CIP
// program that only maps to O*NET specializations outside our own
// occupation table would otherwise resolve to a "job" this app can show no
// wage data for and can't actually back up — Rule 1 applies to what's kept,
// not just what's fetched.
//
// Usage:
//   npm run fetch:cip-soc                fetch, parse, write data/cip-soc.json
//   npm run fetch:cip-soc -- --dry-run    fetch and parse, don't write

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "data", "cip-soc.json");
const OCCUPATIONS_FILE = path.join(ROOT, "data", "bls-occupations.json");

const SOURCE_URL = "https://www.onetcenter.org/crosswalks/cip/Education_CIP_to_ONET_SOC.xlsx";

/** Minimal ZIP central-directory reader — just enough to pull two named
 *  XML parts out of an .xlsx. See file header for why this exists instead
 *  of a library. */
function readZipEntries(buf, names) {
  const EOCD_SIG = 0x06054b50;
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error("Not a valid ZIP/XLSX file (no end-of-central-directory record).");

  const entryCount = buf.readUInt16LE(eocdOffset + 10);
  const centralDirOffset = buf.readUInt32LE(eocdOffset + 16);

  const found = {};
  let offset = centralDirOffset;
  for (let i = 0; i < entryCount; i++) {
    const compMethod = buf.readUInt16LE(offset + 10);
    const compSize = buf.readUInt32LE(offset + 20);
    const nameLen = buf.readUInt16LE(offset + 28);
    const extraLen = buf.readUInt16LE(offset + 30);
    const commentLen = buf.readUInt16LE(offset + 32);
    const localHeaderOffset = buf.readUInt32LE(offset + 42);
    const name = buf.toString("utf8", offset + 46, offset + 46 + nameLen);

    if (names.includes(name)) {
      const lhNameLen = buf.readUInt16LE(localHeaderOffset + 26);
      const lhExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + lhNameLen + lhExtraLen;
      const compData = buf.subarray(dataStart, dataStart + compSize);
      // Method 0 = stored (no compression), 8 = deflate. XLSX always uses one
      // of these two for its XML parts.
      found[name] = (compMethod === 0 ? compData : zlib.inflateRawSync(compData)).toString("utf8");
    }

    offset += 46 + nameLen + extraLen + commentLen;
  }
  return found;
}

function decodeXmlEntities(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** <si><t>text</t></si> entries, in order — referenced by index from cells. */
function parseSharedStrings(xml) {
  const items = [];
  for (const m of xml.matchAll(/<si>(.*?)<\/si>/gs)) {
    const texts = [...m[1].matchAll(/<t[^>]*>(.*?)<\/t>/gs)].map((x) => x[1]);
    items.push(decodeXmlEntities(texts.join("")));
  }
  return items;
}

/** Each row as { A: value, B: value, ... } by column letter. */
function parseRows(xml, sharedStrings) {
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row[^>]*r="\d+"[^>]*>(.*?)<\/row>/gs)) {
    const cells = {};
    for (const cellMatch of rowMatch[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*)>(.*?)<\/c>/gs)) {
      const [, col, attrs, inner] = cellMatch;
      const valueMatch = inner.match(/<v>(.*?)<\/v>/s);
      if (!valueMatch) continue;
      cells[col] = /t="s"/.test(attrs) ? sharedStrings[parseInt(valueMatch[1], 10)] : valueMatch[1];
    }
    rows.push(cells);
  }
  return rows;
}

/** "19-1011.00" -> "191011" — the 6-digit base SOC bls-occupations.json uses. */
function normalizeSoc(onetSocCode) {
  return onetSocCode.split(".")[0].replace(/[^0-9]/g, "");
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  console.log(`Fetching ${SOURCE_URL} ...`);
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`O*NET crosswalk fetch failed: HTTP ${response.status}`);
  }
  const buf = Buffer.from(await response.arrayBuffer());
  console.log(`  ${buf.length} bytes`);

  const entries = readZipEntries(buf, ["xl/sharedStrings.xml", "xl/worksheets/sheet1.xml"]);
  if (!entries["xl/sharedStrings.xml"] || !entries["xl/worksheets/sheet1.xml"]) {
    throw new Error("Expected worksheet parts not found — O*NET may have changed the file's internal layout.");
  }

  const sharedStrings = parseSharedStrings(entries["xl/sharedStrings.xml"]);
  const rows = parseRows(entries["xl/worksheets/sheet1.xml"], sharedStrings);

  // The first few rows are titles/headers; real data rows have a CIP code
  // ("01.0000" style) in column A.
  const dataRows = rows.filter((r) => r.A && /^\d{2}\.\d{4}$/.test(r.A));
  console.log(`  ${dataRows.length} data rows`);

  // A truncated or malformed parse committed as if complete would be worse
  // than no file at all — nothing downstream would know to distrust it. The
  // real file has run to ~8,500 rows historically.
  if (dataRows.length < 5000) {
    console.error(
      `Only parsed ${dataRows.length} rows (expected 5,000+). Not writing ` +
        "data/cip-soc.json — this looks like a truncated fetch or a changed " +
        "file layout, not a real crosswalk."
    );
    process.exit(1);
  }

  const occupations = JSON.parse(await readFile(OCCUPATIONS_FILE, "utf8"));
  const validSocCodes = new Set(occupations.map((o) => o.code));

  const byCip = new Map();
  for (const row of dataRows) {
    if (!byCip.has(row.A)) {
      byCip.set(row.A, { cipCode: row.A, cipTitle: row.B, socCodes: new Set() });
    }
    byCip.get(row.A).socCodes.add(normalizeSoc(row.C));
  }

  const entriesOut = [];
  for (const entry of byCip.values()) {
    // Only SOC codes we actually hold in bls-occupations.json — a match to a
    // finer O*NET specialization outside that table would resolve to a job
    // this app has no wage data for and can't show alongside anything else.
    const socCodes = [...entry.socCodes].filter((code) => validSocCodes.has(code)).sort();
    if (socCodes.length === 0) continue;
    entriesOut.push({ cipCode: entry.cipCode, cipTitle: entry.cipTitle, socCodes });
  }
  entriesOut.sort((a, b) => a.cipCode.localeCompare(b.cipCode));

  console.log(`  ${entriesOut.length} CIP programs with at least one matching BLS occupation`);

  const snapshot = {
    fetchedAt: new Date().toISOString().slice(0, 10),
    source: "O*NET Resource Center, 2020 CIP to O*NET-SOC 2019 Crosswalk",
    sourceUrl: SOURCE_URL,
    note:
      "O*NET's own published crosswalk (Dept. of Labor-sponsored), fetched with no " +
      "authentication — see this script's header for how it's parsed without a " +
      "library. SOC codes are normalized to bls-occupations.json's 6-digit base " +
      "form and filtered to codes that table actually contains. Refresh by " +
      "re-running `npm run fetch:cip-soc` — O*NET updates this crosswalk " +
      "periodically as CIP and SOC revisions are published.",
    count: entriesOut.length,
    entries: entriesOut,
  };

  if (dryRun) {
    console.log(`\n--dry-run: parsed ${entriesOut.length} CIP programs, not writing.`);
    return;
  }

  await writeFile(OUT_FILE, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  console.log(`\nWrote ${entriesOut.length} CIP-to-SOC entries to data/cip-soc.json.`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
