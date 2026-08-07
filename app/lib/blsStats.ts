// Real wage and employment numbers, from the agency that collects them.
//
// Everything else on the career page is the model's best judgement. This file
// is the one part that isn't: these are the published results of the
// Occupational Employment and Wage Statistics survey, which asks about
// 1.1 million establishments what they actually pay. When a figure comes from
// here the page says so by name, and when it doesn't, the page says that too.
//
// WHY THIS MATTERS MORE THAN IT LOOKS. A model asked for a median salary
// returns a plausible number, and a plausible number is exactly what a student
// cannot check. Being off by fifteen thousand dollars changes whether a degree
// pays for itself, and nothing on the page would have looked wrong.
//
// API KEY. The public BLS API works with no registration at all, which is why
// this ships working out of the box. Unregistered callers get 25 queries per
// day per IP — fine in development against a warm cache, not enough for real
// traffic. Setting BLS_API_KEY switches to v2 and raises that to 500 queries
// of 50 series each. Same code path either way; see the const below.

import { findState, type BlsArea, type ResolvedAreas } from "@/app/lib/blsAreas";
import type { OccupationMatch } from "@/app/lib/blsOccupations";
import { US_TILE_MAP } from "@/app/lib/usTileMap";

const apiKey = process.env.BLS_API_KEY;

const ENDPOINT = apiKey
  ? "https://api.bls.gov/publicAPI/v2/timeseries/data/"
  : "https://api.bls.gov/publicAPI/v1/timeseries/data/";

/** v2 takes 50 series a request, v1 takes 25. */
const SERIES_PER_REQUEST = apiKey ? 50 : 25;

const REQUEST_TIMEOUT_MS = 12_000;

/**
 * OEWS data type codes, from oe.datatype.
 *
 * Annual figures rather than hourly throughout: a student comparing a career
 * against four years of tuition is thinking in years, and the hourly framing
 * quietly hides how much part-time work there is in some of these occupations.
 */
const DATA_TYPES = {
  employment: "01",
  mean: "04",
  p10: "11",
  p25: "12",
  median: "13",
  p75: "14",
  p90: "15",
  perThousand: "16",
  locationQuotient: "17",
} as const;

type Measure = keyof typeof DATA_TYPES;

export interface WageSpread {
  p10: number | null;
  p25: number | null;
  median: number | null;
  p75: number | null;
  p90: number | null;
  mean: number | null;
}

export interface AreaStats {
  /** "United States", "Florida", "Miami-Fort Lauderdale-West Palm Beach, FL". */
  name: string;
  type: "N" | "S" | "M";
  wages: WageSpread;
  /** How many people hold this job here. */
  employment: number | null;
  /** Jobs of this kind per 1,000 jobs of any kind — how common it is here. */
  perThousand: number | null;
  /**
   * Concentration against the national average. 1.0 is exactly typical; 1.4
   * means this area employs 40% more of them per capita than the country does.
   *
   * The closest thing BLS publishes to "is this market saturated or hungry",
   * and it cuts both ways — a high quotient means the work is here, and also
   * that so is the competition.
   */
  locationQuotient: number | null;
}

export interface LaborStats {
  occupation: { code: string; title: string; via: OccupationMatch["via"] };
  /** The survey year these figures are from, e.g. "2025". */
  year: string;
  national: AreaStats;
  state: AreaStats | null;
  metro: AreaStats | null;
  /** True when the student's own metro reported, so the page can lead with it. */
  hasLocal: boolean;
}

/**
 * The most local area that actually reported a median wage.
 *
 * NOT simply "the metro if there is one". BLS suppresses wage cells for small
 * samples while still publishing an employment count, so a metro can exist,
 * report 160 people doing the job, and report no wage at all. Falling back to
 * the state's median while still naming the metro would print Texas's salary
 * under an Austin label — a real figure attached to the wrong place, which is
 * the exact failure this whole file exists to avoid.
 */
export function leadWageArea(stats: LaborStats): AreaStats | null {
  return (
    [stats.metro, stats.state, stats.national].find(
      (area): area is AreaStats => area != null && area.wages.median != null
    ) ?? null
  );
}

/**
 * One shared horizontal scale for every area's wage bar.
 *
 * SHARED IS THE WHOLE POINT. Give each row its own scale and Miami, Florida
 * and the country all render as identical bars, which says the opposite of
 * what the numbers say. Placing them on one axis is what makes the comparison
 * mean anything.
 *
 * Lives here rather than in the component so it can be tested as arithmetic —
 * a bar positioned at NaN% silently collapses to the left edge and looks like
 * a design choice rather than a bug.
 */
export function wageScale(areas: AreaStats[]): (value: number) => number {
  const values = areas.flatMap((area) =>
    [area.wages.p10, area.wages.p25, area.wages.median, area.wages.p75, area.wages.p90].filter(
      (v): v is number => v !== null
    )
  );

  if (!values.length) return () => 0;

  const floor = Math.min(...values);
  const ceiling = Math.max(...values);
  // Guard the single-value case: without the max(), spread is 0 and every
  // position divides by zero.
  const spread = Math.max(ceiling - floor, 1);
  const base = floor - spread * 0.04;
  const span = spread * 1.08;

  return (value: number) => {
    const percent = ((value - base) / span) * 100;
    // Clamp rather than trust: a value outside the sampled set (a mean above
    // the 90th percentile, say) would otherwise position off the track.
    return Math.min(100, Math.max(0, percent));
  };
}

/** OEU + areaType + area(7) + industry(6) + occupation(6) + dataType(2). */
export function seriesId(
  area: BlsArea,
  occupationCode: string,
  measure: Measure
): string {
  return `OEU${area.type}${area.code}000000${occupationCode}${DATA_TYPES[measure]}`;
}

/**
 * Read a BLS value.
 *
 * Suppressed and top-coded cells come back as "#", "*", or empty rather than as
 * an error — BLS withholds figures that would identify an employer, and
 * top-codes wages above $239,200. All of those become null so the UI omits the
 * row instead of rendering a zero, which would read as "this job pays nothing".
 */
function parseValue(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "#" || trimmed === "*" || trimmed === "-") return null;
  const value = Number(trimmed.replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

/**
 * Pack whole groups into requests without ever splitting one.
 *
 * WHY NOT A FLAT CHUNK. Nine measures per area against a 25-series request
 * limit means a naive slice puts national + state + seven of the metro's
 * measures in the first request and the metro's last two in the second. When
 * that second request fails — and unregistered callers get 25 requests a day,
 * so it does — the metro row renders with its wages intact and its location
 * quotient silently missing, which reads as "BLS doesn't publish one" rather
 * than "we didn't get it".
 *
 * Keeping an area whole means a lost request costs a whole area, which
 * hasAnyData drops cleanly and visibly, instead of quietly corrupting one.
 */
function packGroups<T>(groups: T[][], limit: number): T[][] {
  const batches: T[][] = [];
  let current: T[] = [];

  for (const group of groups) {
    // A group bigger than the limit can't be kept whole; send it alone and
    // let the API truncate rather than dropping it entirely.
    if (current.length && current.length + group.length > limit) {
      batches.push(current);
      current = [];
    }
    current.push(...group);
  }

  if (current.length) batches.push(current);
  return batches;
}

type SeriesValues = Map<string, { value: number | null; year: string }>;

async function fetchSeries(
  groups: string[][],
  fetchImpl: typeof fetch = fetch
): Promise<SeriesValues> {
  const found: SeriesValues = new Map();

  for (const batch of packGroups(groups, SERIES_PER_REQUEST)) {
    const body: Record<string, unknown> = { seriesid: batch };
    if (apiKey) body.registrationkey = apiKey;

    let payload: any;
    try {
      const response = await fetchImpl(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) continue;
      payload = await response.json();
    } catch {
      // A BLS outage or a hit rate limit must not take the career page down
      // with it — the page is built to render without statistics.
      continue;
    }

    if (payload?.status !== "REQUEST_SUCCEEDED") continue;

    for (const series of payload?.Results?.series ?? []) {
      const latest = series?.data?.[0];
      if (!latest) continue;
      found.set(series.seriesID, {
        value: parseValue(latest.value),
        year: String(latest.year ?? ""),
      });
    }
  }

  return found;
}

function readArea(
  area: BlsArea,
  occupationCode: string,
  values: SeriesValues
): { stats: AreaStats; year: string } {
  const read = (measure: Measure) =>
    values.get(seriesId(area, occupationCode, measure))?.value ?? null;

  const year =
    values.get(seriesId(area, occupationCode, "median"))?.year ??
    values.get(seriesId(area, occupationCode, "employment"))?.year ??
    "";

  return {
    stats: {
      name: area.name,
      type: area.type as AreaStats["type"],
      wages: {
        p10: read("p10"),
        p25: read("p25"),
        median: read("median"),
        p75: read("p75"),
        p90: read("p90"),
        mean: read("mean"),
      },
      employment: read("employment"),
      perThousand: read("perThousand"),
      locationQuotient: read("locationQuotient"),
    },
    year,
  };
}

/** Did this area report anything at all? Small metros suppress whole occupations. */
function hasAnyData(stats: AreaStats): boolean {
  return (
    stats.wages.median !== null ||
    stats.wages.mean !== null ||
    stats.employment !== null
  );
}

/**
 * Fetch every figure the career page can show, for every area that applies.
 *
 * One network round trip per 25 (or 50) series, all measures for all areas
 * requested together — a career page needs the national baseline to make the
 * local number mean anything, so there is no version of this that only wants
 * one area.
 *
 * Returns null when the occupation didn't match or nothing reported, which the
 * caller renders as "no official figures for this one" rather than as an error.
 */
export interface StateDemand {
  /** BLS area name, e.g. "California". */
  name: string;
  /**
   * How concentrated the job is here versus the country as a whole. 1.0 means
   * exactly the national rate; 2.0 means twice as many of these jobs per job
   * as the average. This is the honest measure of "where is this work", because
   * raw headcount only ever redraws a population map — California and Texas
   * lead almost every occupation on employment alone.
   */
  locationQuotient: number | null;
  /** Raw headcount, shown alongside so concentration has a size next to it. */
  employment: number | null;
}

export interface StateDemandMap {
  year: string;
  /** Only states BLS actually published for. See the suppression note below. */
  states: StateDemand[];
}

/**
 * Concentration of one occupation across every US state.
 *
 * Two measures for fifty-one areas is 102 series, which packs into three
 * requests with a registration key and eight without — so this is a feature
 * that genuinely wants BLS_API_KEY set. It's also identical for every visitor
 * looking at the same job, which makes it worth caching hard by SOC code
 * rather than per-student.
 *
 * SUPPRESSION IS NOT ZERO. BLS withholds estimates for cells too small to
 * publish safely, so a niche occupation comes back with real figures for a
 * handful of states and nothing for the rest. A missing state must render as
 * "not published", never as an empty or cold square — drawing "no data" the
 * same way as "no jobs" would be inventing a fact about somewhere a student
 * might be about to move.
 */
export async function fetchStateDemand(
  occupationCode: string,
  fetchImpl: typeof fetch = fetch
): Promise<StateDemandMap | null> {
  // Registered callers only, and not for want of politeness — this is the one
  // call in the app expensive enough to crowd out the others. Unregistered,
  // BLS allows 25 queries a day per IP for everything; a single uncached map
  // spends five of them, so three careers would exhaust the budget the WAGE
  // figures depend on. Those are load-bearing and this panel is a bonus, so
  // without a key the bonus simply doesn't run and the page is unchanged.
  // Read live rather than from the module-level `apiKey` above: this is a
  // runtime policy about whether to spend quota, not startup configuration,
  // and reading it here is what lets the gate be tested from both sides.
  if (!process.env.BLS_API_KEY) return null;

  const areas = US_TILE_MAP.map((tile) => findState(tile.name)).filter(
    (area): area is BlsArea => area !== null
  );
  if (!areas.length) return null;

  // One group per state so a request boundary never splits a state's two
  // measures apart — see packGroups.
  const groups = areas.map((area) => [
    seriesId(area, occupationCode, "locationQuotient"),
    seriesId(area, occupationCode, "employment"),
  ]);

  const values = await fetchSeries(groups, fetchImpl);
  if (!values.size) return null;

  let year = "";
  const states: StateDemand[] = [];

  for (const area of areas) {
    const lq = values.get(seriesId(area, occupationCode, "locationQuotient"));
    const employment = values.get(seriesId(area, occupationCode, "employment"));
    if (!year) year = lq?.year || employment?.year || "";

    // A state with neither figure is omitted rather than carried as a row of
    // nulls; the map treats absence as "not published" and says so.
    if (lq?.value == null && employment?.value == null) continue;

    states.push({
      name: area.name,
      locationQuotient: lq?.value ?? null,
      employment: employment?.value ?? null,
    });
  }

  if (!states.length) return null;
  return { year, states };
}

export async function fetchLaborStats(
  occupation: OccupationMatch,
  areas: ResolvedAreas,
  fetchImpl: typeof fetch = fetch
): Promise<LaborStats | null> {
  const targets = [areas.national, areas.state, areas.metro].filter(
    (a): a is BlsArea => a !== null
  );

  const measures = Object.keys(DATA_TYPES) as Measure[];
  // One group per area, kept whole across the request boundary — see packGroups.
  const groups = targets.map((area) =>
    measures.map((measure) => seriesId(area, occupation.code, measure))
  );

  const values = await fetchSeries(groups, fetchImpl);
  if (!values.size) return null;

  const national = readArea(areas.national, occupation.code, values);
  if (!hasAnyData(national.stats)) return null;

  const state = areas.state ? readArea(areas.state, occupation.code, values) : null;
  const metro = areas.metro ? readArea(areas.metro, occupation.code, values) : null;

  const usableState = state && hasAnyData(state.stats) ? state.stats : null;
  const usableMetro = metro && hasAnyData(metro.stats) ? metro.stats : null;

  return {
    occupation: {
      code: occupation.code,
      title: occupation.title,
      via: occupation.via,
    },
    year: national.year || state?.year || metro?.year || "",
    national: national.stats,
    state: usableState,
    metro: usableMetro,
    hasLocal: usableMetro !== null || usableState !== null,
  };
}
