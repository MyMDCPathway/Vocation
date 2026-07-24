import { describe, it, expect, beforeEach } from "vitest";
import {
  checkIpLimit,
  checkDailyLimit,
  recordGeneration,
  clientIp,
  dailyUsage,
  _resetRateLimits,
} from "@/app/lib/rateLimit";
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
});
