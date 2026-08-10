import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RATE_LIMIT_CONFIG } from "@/app/api/rate-limit-config";
import { resolveCareer } from "@/app/lib/careerCanonical";
import { matchOccupation } from "@/app/lib/blsOccupations";
import { cacheKey } from "@/app/lib/apiCache";

// /api/labor-stats and /api/career-demand share one `bls:<ip>` bucket on
// purpose: they spend the same 500/day registration key, so one pool is the
// only ceiling that means anything. This exercises the demand route, but the
// limiter it reaches is the shared one.

// A career that resolves to a real BLS occupation. Asserted below rather than
// assumed, so this fails loudly if the occupation tables ever drift.
const CAREER = "Registered Nurse";
const OCCUPATION = matchOccupation(resolveCareer(CAREER).canonical, undefined);

async function loadRoute(seed: Record<string, unknown> = {}) {
  const { _setSeedForTests } = await import("@/app/lib/apiCache");
  _setSeedForTests(seed);
  return await import("@/app/api/career-demand/route");
}

// checkIpLimit reads x-forwarded-for via clientIp(), so each test gets its own
// address and can't inherit another test's spent budget.
const makeRequest = (body: unknown, ip: string) =>
  ({
    json: async () => body,
    headers: { get: (n: string) => (n === "x-forwarded-for" ? ip : null) },
  }) as any;

describe("POST /api/career-demand — BLS budget is bounded per IP", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.BLS_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("resolves the fixture career to a real occupation", () => {
    expect(OCCUPATION).toBeTruthy();
  });

  it("refuses further uncached lookups from one address past the limit", async () => {
    // BLS answering with no usable series is the uncacheable case: the route
    // deliberately does not cache "unavailable", so every one of these is a
    // fresh miss — which is exactly the exhaustion shape this guards against.
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "REQUEST_SUCCEEDED", Results: { series: [] } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await loadRoute();
    const ip = "203.0.113.10";

    let sawLimit = false;
    for (let i = 0; i <= RATE_LIMIT_CONFIG.maxBlsLookupsPerIP; i++) {
      const res = await POST(makeRequest({ career: CAREER }, ip));
      if (res.status === 429) {
        sawLimit = true;
        expect(res.headers.get("Retry-After")).toBeTruthy();
        break;
      }
    }

    expect(sawLimit).toBe(true);
  });

  it("does not charge an already-cached occupation against the limit", async () => {
    // Seeded rather than fetched, so this tests the ordering (cache before
    // limiter) without depending on BLS's wire format.
    const key = cacheKey("demand", OCCUPATION!.code);
    const seeded = { demand: { FL: { employment: 1, locationQuotient: 1 } }, status: "ok" };

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await loadRoute({ [key]: seeded });
    const ip = "203.0.113.20";

    for (let i = 0; i < RATE_LIMIT_CONFIG.maxBlsLookupsPerIP + 5; i++) {
      const res = await POST(makeRequest({ career: CAREER }, ip));
      expect(res.status).toBe(200);
    }
    // Never reached BLS, and never reached the limiter either.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not charge an unmatched career against the limit", async () => {
    // An occupation we can't match costs no BLS request, so it returns before
    // the limiter and must never consume someone's allowance.
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await loadRoute();
    const ip = "203.0.113.30";

    for (let i = 0; i < RATE_LIMIT_CONFIG.maxBlsLookupsPerIP + 5; i++) {
      const res = await POST(
        makeRequest({ career: `Nonexistent Occupation ${i}` }, ip)
      );
      expect(res.status).toBe(200);
      expect((await res.json()).status).toBe("unmatched");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
