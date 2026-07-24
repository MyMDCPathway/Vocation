import { describe, it, expect, beforeEach, afterAll } from "vitest";
import {
  getCached,
  setCached,
  cacheKey,
  isSeeded,
  _clearCache,
  _setSeedForTests,
} from "@/app/lib/apiCache";

afterAll(() => _setSeedForTests(null));

describe("apiCache", () => {
  beforeEach(() => {
    _clearCache();
    _setSeedForTests({});
  });

  it("stores and retrieves a value by key", () => {
    setCached("k", { hello: "world" });
    expect(getCached("k")).toEqual({ hello: "world" });
  });

  it("returns undefined for an unknown key", () => {
    expect(getCached("missing")).toBeUndefined();
  });

  it("expires entries after their TTL", async () => {
    setCached("k", "v", 10); // 10ms TTL
    expect(getCached("k")).toBe("v");
    await new Promise((r) => setTimeout(r, 20));
    expect(getCached("k")).toBeUndefined();
  });

  it("builds a normalized, case-insensitive key", () => {
    expect(cacheKey("pathway", "  Software Engineer ")).toBe("pathway:software engineer");
    // Same career in different casing/spacing hits the same cache entry.
    expect(cacheKey("pathway", "software engineer")).toBe(cacheKey("pathway", "SOFTWARE ENGINEER"));
  });
});

describe("the seed layer", () => {
  beforeEach(() => _clearCache());

  it("serves committed entries without anything being generated first", () => {
    _setSeedForTests({ "pathway:welder": { title: "Welder", pathways: [] } });

    expect(getCached(cacheKey("pathway", "Welder"))).toEqual({
      title: "Welder",
      pathways: [],
    });
    expect(isSeeded("pathway:welder")).toBe(true);
  });

  it("never expires, unlike the in-memory layer", async () => {
    _setSeedForTests({ "pathway:welder": { title: "Welder" } });
    setCached("pathway:other", { title: "Other" }, 10);

    await new Promise((r) => setTimeout(r, 20));

    expect(getCached("pathway:other")).toBeUndefined();
    expect(getCached("pathway:welder")).toEqual({ title: "Welder" });
  });

  it("is not overwritten by a generated value", () => {
    _setSeedForTests({ "pathway:welder": { title: "Reviewed" } });
    setCached("pathway:welder", { title: "Generated" });

    expect(getCached("pathway:welder")).toEqual({ title: "Reviewed" });
  });
});

describe("generate-pathway route uses the cache", () => {
  it("does not call Gemini a second time for the same career", async () => {
    const { vi } = await import("vitest");
    vi.resetModules();
    process.env.GEMINI_API_KEY = "test-key";

    const cache = await import("@/app/lib/apiCache");
    cache._clearCache();
    cache._setSeedForTests({});

    const pathwayData = { title: "Nurse", pathways: [] };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(pathwayData) }] } }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("@/app/api/generate-pathway/route");
    const req = (body: unknown) => ({ json: async () => body }) as any;

    const first = await POST(req({ career: "Nurse" }));
    const second = await POST(req({ career: "  nurse  " })); // different spacing/case

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual(pathwayData);
    // The second request was served from cache — Gemini was hit only once.
    expect(fetchMock).toHaveBeenCalledOnce();

    vi.unstubAllGlobals();
  });
});
