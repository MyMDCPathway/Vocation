import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  checkIpLimit,
  checkDailyLimit,
  recordGeneration,
  clientIp,
  dailyUsage,
  enforceGenerationLimits,
  _resetRateLimits,
} from "@/app/lib/rateLimit";
import { durableCacheEnabled } from "@/app/lib/durableCache";
import { RATE_LIMIT_CONFIG } from "@/app/api/rate-limit-config";

describe("per-IP limiting", () => {
  beforeEach(() => _resetRateLimits());

  it("allows up to the configured number of requests, then blocks", () => {
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxRequestsPerIP; i++) {
      expect(checkIpLimit("1.2.3.4").allowed).toBe(true);
    }

    const blocked = checkIpLimit("1.2.3.4");
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe("ip");
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks each IP independently", () => {
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxRequestsPerIP; i++) {
      checkIpLimit("1.1.1.1");
    }
    expect(checkIpLimit("1.1.1.1").allowed).toBe(false);
    expect(checkIpLimit("2.2.2.2").allowed).toBe(true);
  });
});

describe("daily ceiling", () => {
  beforeEach(() => _resetRateLimits());

  it("blocks once the day's generations are spent", () => {
    expect(checkDailyLimit().allowed).toBe(true);

    for (let i = 0; i < RATE_LIMIT_CONFIG.maxGenerationsPerDay; i++) {
      recordGeneration();
    }

    const blocked = checkDailyLimit();
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe("daily");
    expect(dailyUsage().count).toBe(RATE_LIMIT_CONFIG.maxGenerationsPerDay);
  });

  it("does not count requests that were never generated", () => {
    checkDailyLimit();
    checkDailyLimit();
    expect(dailyUsage().count).toBe(0);
  });
});

describe("clientIp", () => {
  const withHeaders = (values: Record<string, string>) => ({
    headers: { get: (name: string) => values[name] ?? null },
  });

  it("reads the originating client from x-forwarded-for", () => {
    expect(clientIp(withHeaders({ "x-forwarded-for": "9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("takes the first entry when proxies have appended their own", () => {
    expect(
      clientIp(withHeaders({ "x-forwarded-for": "9.9.9.9, 10.0.0.1, 10.0.0.2" }))
    ).toBe("9.9.9.9");
  });

  it("falls back to x-real-ip", () => {
    expect(clientIp(withHeaders({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
  });

  it("does not throw when the caller has no headers at all", () => {
    // Unit tests and local tooling call the route handlers with bare objects.
    expect(clientIp({})).toBe("unknown");
    expect(clientIp(undefined)).toBe("unknown");
  });

  it("accepts IPv6, including a mapped IPv4 tail", () => {
    expect(clientIp(withHeaders({ "x-forwarded-for": "2001:db8::1" }))).toBe(
      "2001:db8::1"
    );
    expect(
      clientIp(withHeaders({ "x-forwarded-for": "::ffff:203.0.113.7" }))
    ).toBe("::ffff:203.0.113.7");
  });

  it("strips a port or brackets rather than rejecting a real address", () => {
    expect(clientIp(withHeaders({ "x-forwarded-for": "9.9.9.9:54321" }))).toBe(
      "9.9.9.9"
    );
    expect(
      clientIp(withHeaders({ "x-forwarded-for": "[2001:db8::1]:443" }))
    ).toBe("2001:db8::1");
  });

  describe("spoofing", () => {
    // The whole point of validating: a value that isn't an address must land
    // in the shared bucket, not mint a new one.
    const junk = [
      "not-an-ip",
      "",
      "   ",
      "999.999.999.999",
      "1.2.3",
      "1.2.3.4.5",
      "<script>alert(1)</script>",
      "2001:db8::1::2",
      "gggg::1",
      "a".repeat(200),
      "unknown",
    ];

    for (const value of junk) {
      it(`treats ${JSON.stringify(value)} as the shared bucket`, () => {
        expect(clientIp(withHeaders({ "x-forwarded-for": value }))).toBe("unknown");
      });
    }

    it("does not hand a fresh allowance to every spoofed header", () => {
      _resetRateLimits();

      // Old behaviour: every distinct string was its own bucket, so this loop
      // never hit the limit. Now they all collapse onto "unknown".
      let blocked = false;
      for (let i = 0; i < RATE_LIMIT_CONFIG.maxRequestsPerIP + 5; i++) {
        const ip = clientIp(withHeaders({ "x-forwarded-for": `spoof-${i}` }));
        expect(ip).toBe("unknown");
        if (!checkIpLimit(ip).allowed) blocked = true;
      }

      expect(blocked).toBe(true);
    });

    it("ignores a forgeable header when the platform set its own", () => {
      const ip = clientIp(
        withHeaders({
          "x-vercel-forwarded-for": "9.9.9.9",
          "x-forwarded-for": "1.1.1.1",
          "x-real-ip": "2.2.2.2",
        })
      );
      expect(ip).toBe("9.9.9.9");
    });

    it("falls through to x-forwarded-for when the platform header is junk", () => {
      // A malformed platform header shouldn't strand a real client, but it
      // must not be trusted either — the next header is validated the same way.
      expect(
        clientIp(
          withHeaders({
            "x-vercel-forwarded-for": "not-an-ip",
            "x-forwarded-for": "9.9.9.9",
          })
        )
      ).toBe("9.9.9.9");
    });
  });
});

describe("generation limits vs the default per-IP allowance", () => {
  beforeEach(() => _resetRateLimits());

  const request = (ip: string) => ({
    headers: { get: (name: string) => (name === "x-vercel-forwarded-for" ? ip : null) },
  });

  it("gives generations their own, higher ceiling", () => {
    // The default exists for signup, which is much cheaper to abuse than a
    // Gemini call is to serve — a student's intake alone blows past it.
    expect(RATE_LIMIT_CONFIG.maxGenerationsPerIP).toBeGreaterThan(
      RATE_LIMIT_CONFIG.maxRequestsPerIP
    );

    for (let i = 0; i < RATE_LIMIT_CONFIG.maxGenerationsPerIP; i++) {
      expect(enforceGenerationLimits(request("203.0.113.5"))).toBeNull();
    }
    expect(enforceGenerationLimits(request("203.0.113.5"))).not.toBeNull();
  });

  it("collapses spoofed headers onto one allowance", () => {
    const spoofed = (value: string) => ({
      headers: { get: (name: string) => (name === "x-forwarded-for" ? value : null) },
    });

    let blocked = false;
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxGenerationsPerIP + 5; i++) {
      if (enforceGenerationLimits(spoofed(`fake-client-${i}`)) !== null) blocked = true;
    }
    expect(blocked).toBe(true);
  });
});

describe("durable daily counter without a store", () => {
  const spyOnFetch = () => vi.spyOn(globalThis, "fetch");
  let fetchSpy: ReturnType<typeof spyOnFetch>;

  beforeEach(() => {
    _resetRateLimits();
    fetchSpy = spyOnFetch();
  });

  afterEach(() => fetchSpy.mockRestore());

  it("is disabled when no KV credentials are configured", () => {
    // CI and local dev have none; every test below depends on that.
    expect(durableCacheEnabled()).toBe(false);
  });

  it("counts in memory and never reaches for the network", () => {
    checkDailyLimit();
    recordGeneration();
    recordGeneration();
    checkDailyLimit();

    expect(dailyUsage().count).toBe(2);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("still enforces the ceiling with the in-memory fallback alone", () => {
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxGenerationsPerDay; i++) {
      recordGeneration();
    }
    expect(checkDailyLimit().allowed).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
