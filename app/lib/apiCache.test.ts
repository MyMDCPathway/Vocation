import { describe, it, expect, beforeEach } from "vitest";
import { getCached, setCached, cacheKey, _clearCache } from "@/app/lib/apiCache";

describe("apiCache", () => {
  beforeEach(() => _clearCache());

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

describe("generate-pathway route uses the cache", () => {
  it("does not call Gemini a second time for the same career", async () => {
    const { vi } = await import("vitest");
    _clearCache();
    vi.resetModules();
    process.env.GEMINI_API_KEY = "test-key";

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
