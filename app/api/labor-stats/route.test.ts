import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// The plan page's wage panel. Unlike the career profile this route makes NO
// model call, so these tests only ever stub BLS.

async function loadRoute() {
  const { _setSeedForTests } = await import("@/app/lib/apiCache");
  _setSeedForTests({});
  return await import("@/app/api/labor-stats/route");
}

const makeRequest = (body: unknown) => ({ json: async () => body }) as any;

/** A BLS response answering every series it's asked for with `value`. */
function stubBls(values: Record<string, string>, onCall?: () => void) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: any, init: any) => {
      onCall?.();
      const ids: string[] = JSON.parse(init.body).seriesid;
      return {
        ok: true,
        json: async () => ({
          status: "REQUEST_SUCCEEDED",
          Results: {
            series: ids
              .filter((id) => id in values)
              .map((id) => ({
                seriesID: id,
                data: [{ year: "2025", period: "A01", value: values[id] }],
              })),
          },
        }),
      };
    })
  );
}

// Miami metro / Florida / national medians and employment for nurses.
const NURSE_VALUES = {
  OEUM003310000000029114113: "91380",
  OEUM003310000000029114111: "72640",
  OEUM003310000000029114115: "129150",
  OEUM003310000000029114101: "61670",
  OEUS120000000000029114113: "84190",
  OEUN000000000000029114113: "97550",
};

describe("POST /api/labor-stats", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the student's own metro figures", async () => {
    stubBls(NURSE_VALUES);
    const { POST } = await loadRoute();

    const response = await POST(
      makeRequest({
        career: "registered nurse",
        countryCode: "US",
        subdivision: "Florida",
        city: "Miami",
      })
    );
    const body = await response.json();

    expect(body.status).toBe("ok");
    expect(body.stats.metro.name).toMatch(/Miami/);
    expect(body.stats.metro.wages.median).toBe(91380);
    expect(body.stats.state.wages.median).toBe(84190);
    expect(body.stats.national.wages.median).toBe(97550);
  });

  it("requires a career", async () => {
    const { POST } = await loadRoute();
    const response = await POST(makeRequest({ countryCode: "US" }));
    expect(response.status).toBe(400);
  });

  // OEWS surveys US establishments only, so there is nothing to show — and
  // saying so is different from saying the occupation doesn't exist.
  it("reports outside-us without calling BLS", async () => {
    let called = false;
    stubBls({}, () => {
      called = true;
    });
    const { POST } = await loadRoute();

    const body = await (
      await POST(
        makeRequest({
          career: "marine biologist",
          countryCode: "GB",
          subdivision: "Scotland",
          city: "Edinburgh",
        })
      )
    ).json();

    expect(body.status).toBe("outside-us");
    expect(body.stats).toBeNull();
    expect(called).toBe(false);
  });

  it("reports unmatched when no BLS occupation is close enough", async () => {
    const { POST } = await loadRoute();
    const body = await (
      await POST(
        makeRequest({ career: "asdfghjkl", countryCode: "US", subdivision: "Florida", city: "Miami" })
      )
    ).json();

    expect(body.status).toBe("unmatched");
    expect(body.stats).toBeNull();
  });

  it("reports unavailable when BLS refuses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ status: "REQUEST_NOT_PROCESSED", message: ["daily threshold"] }),
      }))
    );
    const { POST } = await loadRoute();

    const body = await (
      await POST(
        makeRequest({
          career: "registered nurse",
          countryCode: "US",
          subdivision: "Florida",
          city: "Miami",
        })
      )
    ).json();

    expect(body.status).toBe("unavailable");
    expect(body.stats).toBeNull();
  });

  // Caching a refusal would freeze an exhausted rate limit into the answer for
  // as long as the cache lives — the same trap healStats exists to escape.
  it("does not cache a refusal", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls++;
        return {
          ok: true,
          json: async () => ({ status: "REQUEST_NOT_PROCESSED", message: ["daily threshold"] }),
        };
      })
    );
    const { POST } = await loadRoute();
    const body = {
      career: "registered nurse",
      countryCode: "US",
      subdivision: "Florida",
      city: "Miami",
    };

    await POST(makeRequest(body));
    const first = calls;
    await POST(makeRequest(body));

    expect(calls).toBeGreaterThan(first);
  });

  it("serves a repeat request for the same area from cache", async () => {
    let calls = 0;
    stubBls(NURSE_VALUES, () => {
      calls++;
    });
    const { POST } = await loadRoute();
    const body = {
      career: "registered nurse",
      countryCode: "US",
      subdivision: "Florida",
      city: "Miami",
    };

    await POST(makeRequest(body));
    const afterFirst = calls;
    await POST(makeRequest(body));

    expect(calls).toBe(afterFirst);
  });

  // The summary resolved the occupation with the model's SOC hint; the plan
  // has only the career text. Passing the code forward keeps both pages
  // describing the same job.
  it("honours a SOC code the summary already resolved", async () => {
    stubBls({ OEUN000000000000047211113: "63190" });
    const { POST } = await loadRoute();

    const body = await (
      await POST(
        makeRequest({
          career: "sparky",
          countryCode: "US",
          subdivision: "",
          city: "",
          socCode: "47-2111",
        })
      )
    ).json();

    expect(body.status).toBe("ok");
    expect(body.stats.occupation.title).toMatch(/Electricians/i);
    expect(body.stats.national.wages.median).toBe(63190);
  });
});
