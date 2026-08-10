import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchLaborStats,
  fetchStateDemand,
  leadWageArea,
  seriesId,
  wageScale,
  type AreaStats,
} from "@/app/lib/blsStats";
import { US_TILE_MAP } from "@/app/lib/usTileMap";
import type { BlsArea } from "@/app/lib/blsAreas";
import type { OccupationMatch } from "@/app/lib/blsOccupations";

const NATIONAL: BlsArea = { state: "00", code: "0000000", type: "N", name: "United States" };
const FLORIDA: BlsArea = { state: "12", code: "1200000", type: "S", name: "Florida" };
const CALIFORNIA: BlsArea = { state: "06", code: "0600000", type: "S", name: "California" };
const MIAMI: BlsArea = {
  state: "12",
  code: "0033100",
  type: "M",
  name: "Miami-Fort Lauderdale-West Palm Beach, FL",
};

const NURSE: OccupationMatch = {
  code: "291141",
  title: "Registered Nurses",
  score: 1,
  via: "exact",
};

describe("seriesId", () => {
  // Verified against the live API — these exact strings return data.
  it("builds the OEWS series id BLS answers to", () => {
    expect(seriesId(NATIONAL, "291141", "median")).toBe("OEUN000000000000029114113");
    expect(seriesId(FLORIDA, "291141", "median")).toBe("OEUS120000000000029114113");
    expect(seriesId(MIAMI, "291141", "employment")).toBe("OEUM003310000000029114101");
  });

  it("is always 25 characters", () => {
    expect(seriesId(MIAMI, "472111", "locationQuotient")).toHaveLength(25);
  });
});

/** A fake BLS response returning `value` for every series asked for. */
function respondWith(values: Record<string, string>, year = "2025") {
  return vi.fn(async (_url: any, init: any) => {
    const body = JSON.parse(init.body);
    return {
      ok: true,
      json: async () => ({
        status: "REQUEST_SUCCEEDED",
        Results: {
          series: body.seriesid
            .filter((id: string) => id in values)
            .map((id: string) => ({
              seriesID: id,
              data: [{ year, period: "A01", value: values[id] }],
            })),
        },
      }),
    };
  }) as unknown as typeof fetch;
}

describe("wageScale", () => {
  const withWages = (
    name: string,
    p10: number | null,
    median: number | null,
    p90: number | null
  ): AreaStats => ({
    name,
    type: "S",
    wages: { p10, p25: null, median, p75: null, p90, mean: null },
    employment: null,
    perThousand: null,
    locationQuotient: null,
  });

  // The real Miami / Florida / national nurse figures.
  const NURSES = [
    withWages("Miami", 72640, 91380, 129150),
    withWages("Florida", 67970, 84190, 120330),
    withWages("United States", 68940, 97550, 137470),
  ];

  it("keeps every value on the track", () => {
    const position = wageScale(NURSES);
    for (const area of NURSES) {
      for (const value of [area.wages.p10!, area.wages.median!, area.wages.p90!]) {
        const percent = position(value);
        expect(Number.isFinite(percent)).toBe(true);
        expect(percent).toBeGreaterThanOrEqual(0);
        expect(percent).toBeLessThanOrEqual(100);
      }
    }
  });

  it("orders positions the way the numbers order", () => {
    const position = wageScale(NURSES);
    // Florida's median is the lowest, the national median the highest.
    expect(position(84190)).toBeLessThan(position(91380));
    expect(position(91380)).toBeLessThan(position(97550));
    // The overall floor sits left of the overall ceiling.
    expect(position(67970)).toBeLessThan(position(137470));
  });

  it("puts the same wage in the same place for every area", () => {
    // The property that makes the three rows comparable at a glance.
    const position = wageScale(NURSES);
    expect(position(90000)).toBe(position(90000));
  });

  // A single reporting area with one wage would divide by a zero spread.
  it("survives a single value without dividing by zero", () => {
    const position = wageScale([withWages("Somewhere", null, 50000, null)]);
    const percent = position(50000);
    expect(Number.isFinite(percent)).toBe(true);
    expect(percent).toBeGreaterThanOrEqual(0);
    expect(percent).toBeLessThanOrEqual(100);
  });

  it("survives an area with no wages at all", () => {
    const position = wageScale([withWages("Nowhere", null, null, null)]);
    expect(position(50000)).toBe(0);
    expect(wageScale([])(1)).toBe(0);
  });

  it("clamps a value outside the sampled set", () => {
    const position = wageScale(NURSES);
    expect(position(1_000_000)).toBe(100);
    expect(position(0)).toBe(0);
  });
});

describe("leadWageArea", () => {
  const area = (
    name: string,
    type: "N" | "S" | "M",
    median: number | null,
    employment: number | null = null
  ) => ({
    name,
    type,
    wages: { p10: null, p25: null, median, p75: null, p90: null, mean: null },
    employment,
    perThousand: null,
    locationQuotient: null,
  });

  const stats = (
    metro: ReturnType<typeof area> | null,
    state: ReturnType<typeof area> | null,
    national: ReturnType<typeof area>
  ) => ({
    occupation: { code: "272021", title: "Athletes and Sports Competitors", via: "hint" as const },
    year: "2025",
    metro,
    state,
    national,
    hasLocal: metro !== null || state !== null,
  });

  it("prefers the most local area that reported a wage", () => {
    const result = leadWageArea(
      stats(area("Miami", "M", 91380), area("Florida", "S", 84190), area("US", "N", 97550))
    );
    expect(result?.name).toBe("Miami");
  });

  // The bug this exists to stop: BLS published 160 athletes in the Austin
  // metro with every wage cell suppressed. Falling through to the state's
  // median while keeping the metro's NAME printed Texas money under an Austin
  // label — a real figure attached to the wrong place.
  it("skips an area that reported employment but no wage", () => {
    const result = leadWageArea(
      stats(
        area("Austin-Round Rock-San Marcos, TX", "M", null, 160),
        area("Texas", "S", 80510),
        area("US", "N", 66710)
      )
    );
    expect(result?.name).toBe("Texas");
    expect(result?.wages.median).toBe(80510);
  });

  it("falls all the way back to national", () => {
    const result = leadWageArea(
      stats(area("Austin", "M", null), area("Texas", "S", null), area("US", "N", 66710))
    );
    expect(result?.name).toBe("US");
  });

  it("returns null when nothing anywhere reported a wage", () => {
    expect(leadWageArea(stats(null, null, area("US", "N", null)))).toBeNull();
  });
});

describe("fetchLaborStats", () => {
  it("reads wages, employment and location quotient for each area", async () => {
    const fetchImpl = respondWith({
      [seriesId(NATIONAL, "291141", "median")]: "97550",
      [seriesId(NATIONAL, "291141", "p10")]: "68940",
      [seriesId(NATIONAL, "291141", "p90")]: "137470",
      [seriesId(NATIONAL, "291141", "employment")]: "3379720",
      [seriesId(FLORIDA, "291141", "median")]: "84190",
      [seriesId(FLORIDA, "291141", "locationQuotient")]: "1.07",
      [seriesId(MIAMI, "291141", "median")]: "91380",
      [seriesId(MIAMI, "291141", "employment")]: "61670",
    });

    const stats = await fetchLaborStats(
      NURSE,
      { national: NATIONAL, state: FLORIDA, metro: MIAMI },
      fetchImpl
    );

    expect(stats).not.toBeNull();
    expect(stats!.year).toBe("2025");
    expect(stats!.national.wages.median).toBe(97550);
    expect(stats!.national.wages.p10).toBe(68940);
    expect(stats!.national.employment).toBe(3379720);
    expect(stats!.state!.wages.median).toBe(84190);
    expect(stats!.state!.locationQuotient).toBe(1.07);
    expect(stats!.metro!.wages.median).toBe(91380);
    expect(stats!.hasLocal).toBe(true);
  });

  // BLS withholds cells that would identify an employer and top-codes wages
  // above $239,200. Both arrive as text, and rendering them as 0 would say the
  // job pays nothing.
  it("turns suppressed and top-coded cells into null, not zero", async () => {
    const fetchImpl = respondWith({
      [seriesId(NATIONAL, "291141", "median")]: "97550",
      [seriesId(NATIONAL, "291141", "p90")]: "#",
      [seriesId(NATIONAL, "291141", "mean")]: "*",
      [seriesId(NATIONAL, "291141", "p10")]: "",
    });

    const stats = await fetchLaborStats(
      NURSE,
      { national: NATIONAL, state: null, metro: null },
      fetchImpl
    );

    expect(stats!.national.wages.median).toBe(97550);
    expect(stats!.national.wages.p90).toBeNull();
    expect(stats!.national.wages.mean).toBeNull();
    expect(stats!.national.wages.p10).toBeNull();
  });

  it("drops an area that reported nothing rather than showing empty rows", async () => {
    const fetchImpl = respondWith({
      [seriesId(NATIONAL, "291141", "median")]: "97550",
      // Small metros suppress whole occupations.
      [seriesId(MIAMI, "291141", "locationQuotient")]: "1.01",
    });

    const stats = await fetchLaborStats(
      NURSE,
      { national: NATIONAL, state: null, metro: MIAMI },
      fetchImpl
    );

    expect(stats!.metro).toBeNull();
    expect(stats!.hasLocal).toBe(false);
  });

  it("returns null when even the national figure is missing", async () => {
    const stats = await fetchLaborStats(
      NURSE,
      { national: NATIONAL, state: null, metro: null },
      respondWith({ [seriesId(NATIONAL, "291141", "locationQuotient")]: "1.0" })
    );
    expect(stats).toBeNull();
  });

  // The career page has to render without statistics — a BLS outage or an
  // exhausted rate limit cannot take the whole screen down.
  it("survives a network failure", async () => {
    const failing = vi.fn(async () => {
      throw new Error("ECONNRESET");
    }) as unknown as typeof fetch;

    await expect(
      fetchLaborStats(NURSE, { national: NATIONAL, state: null, metro: null }, failing)
    ).resolves.toBeNull();
  });

  it("survives a non-200 and a rate-limit body", async () => {
    const rateLimited = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: "REQUEST_NOT_PROCESSED", message: ["daily threshold"] }),
    })) as unknown as typeof fetch;

    await expect(
      fetchLaborStats(NURSE, { national: NATIONAL, state: null, metro: null }, rateLimited)
    ).resolves.toBeNull();
  });

  it("batches within the unregistered 25-series request limit", async () => {
    const calls: string[][] = [];
    const counting = vi.fn(async (_url: any, init: any) => {
      calls.push(JSON.parse(init.body).seriesid);
      return {
        ok: true,
        json: async () => ({
          status: "REQUEST_SUCCEEDED",
          Results: {
            series: [
              {
                seriesID: seriesId(NATIONAL, "291141", "median"),
                data: [{ year: "2025", value: "97550" }],
              },
            ],
          },
        }),
      };
    }) as unknown as typeof fetch;

    // 3 areas x 9 measures = 27 series, over the v1 limit of 25.
    await fetchLaborStats(
      NURSE,
      { national: NATIONAL, state: FLORIDA, metro: MIAMI },
      counting
    );

    expect(calls.length).toBeGreaterThan(1);
    for (const batch of calls) expect(batch.length).toBeLessThanOrEqual(25);
  });

  // Observed in the browser: 27 series sliced flat put the metro's location
  // quotient and per-1,000 alone in a second request. That request hit the
  // unregistered daily limit, and the metro rendered with its wages intact and
  // its concentration silently absent — indistinguishable from BLS not
  // publishing one. An area has to survive or fail whole.
  it("never splits one area's measures across two requests", async () => {
    const calls: string[][] = [];
    const counting = vi.fn(async (_url: any, init: any) => {
      calls.push(JSON.parse(init.body).seriesid);
      return { ok: true, json: async () => ({ status: "REQUEST_SUCCEEDED", Results: { series: [] } }) };
    }) as unknown as typeof fetch;

    await fetchLaborStats(
      NURSE,
      { national: NATIONAL, state: FLORIDA, metro: MIAMI },
      counting
    );

    // Every series id carries its area code; no area may appear in two batches.
    const batchesPerArea = new Map<string, Set<number>>();
    calls.forEach((batch, index) => {
      for (const id of batch) {
        const area = id.slice(3, 11); // areaType + 7-digit area code
        if (!batchesPerArea.has(area)) batchesPerArea.set(area, new Set());
        batchesPerArea.get(area)!.add(index);
      }
    });

    expect(batchesPerArea.size).toBe(3);
    for (const [area, indices] of batchesPerArea) {
      expect(indices.size, `area ${area} was split across requests`).toBe(1);
    }
  });

  // The failure the packing protects against, end to end: one request dies and
  // the area it carried is dropped whole rather than half-populated.
  it("drops a whole area when its request fails", async () => {
    let call = 0;
    const flaky = vi.fn(async (_url: any, init: any) => {
      const ids: string[] = JSON.parse(init.body).seriesid;
      call++;
      // Fail whichever request carries the metro.
      if (ids.some((id) => id.includes(MIAMI.code))) {
        throw new Error("daily threshold reached");
      }
      return {
        ok: true,
        json: async () => ({
          status: "REQUEST_SUCCEEDED",
          Results: {
            series: ids.map((id) => ({
              seriesID: id,
              data: [{ year: "2025", value: id.endsWith("13") ? "97550" : "1.0" }],
            })),
          },
        }),
      };
    }) as unknown as typeof fetch;

    const stats = await fetchLaborStats(
      NURSE,
      { national: NATIONAL, state: FLORIDA, metro: MIAMI },
      flaky
    );

    expect(call).toBeGreaterThan(0);
    expect(stats).not.toBeNull();
    expect(stats!.metro).toBeNull();
    expect(stats!.national.wages.median).toBe(97550);
  });
});

describe("fetchStateDemand", () => {
  // The state map only runs for registered callers — see the gate in
  // fetchStateDemand. Every test below except the gate's own needs a key.
  const noKey = Symbol("no key");
  let previous: string | undefined | typeof noKey = noKey;

  beforeEach(() => {
    previous = process.env.BLS_API_KEY;
    process.env.BLS_API_KEY = "test-key";
  });

  afterEach(() => {
    if (previous === undefined) delete process.env.BLS_API_KEY;
    else if (previous !== noKey) process.env.BLS_API_KEY = previous as string;
  });

  it("spends no quota at all when no registration key is set", () => {
    // Unregistered, BLS allows 25 queries a day for everything the app does.
    // This one call would take five of them, so it must not fire — and it must
    // not fire WITHOUT calling fetch, or the saving is imaginary.
    delete process.env.BLS_API_KEY;
    const fake = vi.fn();
    return fetchStateDemand("15-1252", fake as any).then((result) => {
      expect(result).toBeNull();
      expect(fake).not.toHaveBeenCalled();
    });
  });

  // Enough of the BLS envelope for the parser: it reads status, then
  // Results.series[].data[0].
  const reply = (series: { seriesID: string; value: string }[]) => ({
    ok: true,
    json: async () => ({
      status: "REQUEST_SUCCEEDED",
      Results: {
        series: series.map((s) => ({
          seriesID: s.seriesID,
          data: [{ value: s.value, year: "2024" }],
        })),
      },
    }),
  });

  const lq = (area: BlsArea) => seriesId(area, "15-1252", "locationQuotient");
  const emp = (area: BlsArea) => seriesId(area, "15-1252", "employment");

  it("reads a location quotient and headcount back for a state", async () => {
    const fake = vi.fn().mockResolvedValue(
      reply([
        { seriesID: lq(CALIFORNIA), value: "1.9" },
        { seriesID: emp(CALIFORNIA), value: "210000" },
      ])
    );

    const demand = await fetchStateDemand("15-1252", fake as any);

    expect(demand?.year).toBe("2024");
    const california = demand?.states.find((s) => s.name === "California");
    expect(california?.locationQuotient).toBe(1.9);
    expect(california?.employment).toBe(210000);
  });

  it("omits states BLS suppressed rather than reporting them as zero", async () => {
    // The distinction the map depends on: a withheld estimate is "not
    // published", which is a different fact from "no jobs here" and must not
    // be drawn the same way.
    const fake = vi.fn().mockResolvedValue(
      reply([{ seriesID: lq(CALIFORNIA), value: "1.9" }])
    );

    const demand = await fetchStateDemand("15-1252", fake as any);

    expect(demand?.states.map((s) => s.name)).toEqual(["California"]);
    expect(demand?.states.some((s) => s.locationQuotient === 0)).toBe(false);
  });

  it("returns null when BLS gives nothing back at all", async () => {
    const fake = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
    expect(await fetchStateDemand("15-1252", fake as any)).toBeNull();
  });

  it("asks for every state on the tile map", async () => {
    const fake = vi.fn().mockResolvedValue(reply([]));
    await fetchStateDemand("15-1252", fake as any);

    const requested = fake.mock.calls.flatMap(
      (call: any) => JSON.parse(call[1].body).seriesid
    );
    // Two measures per state, and no state silently dropped by batching.
    expect(requested).toHaveLength(US_TILE_MAP.length * 2);
    expect(requested).toContain(lq(CALIFORNIA));
  });
});
