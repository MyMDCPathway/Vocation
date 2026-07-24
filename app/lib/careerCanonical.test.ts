import { describe, it, expect } from "vitest";
import {
  normalizeCareer,
  resolveCareer,
  canonicalCareers,
} from "@/app/lib/careerCanonical";

describe("normalizeCareer", () => {
  it("lowercases, trims, and collapses whitespace", () => {
    expect(normalizeCareer("  Registered   NURSE ")).toBe("registered nurse");
  });

  it("turns punctuation into word boundaries", () => {
    expect(normalizeCareer("Nurse-Midwife")).toBe("nurse midwife");
    expect(normalizeCareer("X-Ray Technician!")).toBe("x ray technician");
  });

  it("keeps symbols that carry meaning in job titles", () => {
    expect(normalizeCareer("C++ Developer")).toBe("c++ developer");
    expect(normalizeCareer("C# Developer")).toBe("c# developer");
  });

  it("strips leading intent phrases and articles", () => {
    expect(normalizeCareer("I want to be a nurse")).toBe("nurse");
    expect(normalizeCareer("how to become an architect")).toBe("architect");
    expect(normalizeCareer("the architect")).toBe("architect");
  });
});

describe("resolveCareer", () => {
  it("maps casing and spacing variants to one canonical title", () => {
    const variants = ["nurse", "Nurse", "  NURSE  "];
    const resolved = variants.map((v) => resolveCareer(v).canonical);
    expect(new Set(resolved).size).toBe(1);
    expect(resolved[0]).toBe("Registered Nurse");
  });

  it("maps abbreviations and synonyms to the same canonical title", () => {
    for (const input of ["RN", "nursing", "registered nurse", "I want to be a nurse"]) {
      expect(resolveCareer(input).canonical).toBe("Registered Nurse");
    }
  });

  it("matches plurals by falling back to the singular form", () => {
    expect(resolveCareer("nurses").canonical).toBe("Registered Nurse");
    expect(resolveCareer("Software Engineers").canonical).toBe("Software Engineer");
  });

  it("does not strip a trailing s when doing so would mangle the word", () => {
    // "business" must not become "busines"; with no alias hit it stays as typed.
    expect(resolveCareer("business").canonical).toBe("Business");
    expect(resolveCareer("physics").canonical).toBe("Physics");
  });

  it("keeps genuinely different careers separate", () => {
    // Same field, different degrees and different licensing exams — collapsing
    // these would show a student the wrong plan.
    const rn = resolveCareer("RN").canonical;
    const np = resolveCareer("nurse practitioner").canonical;
    const crna = resolveCareer("CRNA").canonical;
    expect(new Set([rn, np, crna]).size).toBe(3);
  });

  it("reports whether an alias actually matched", () => {
    expect(resolveCareer("RN").matched).toBe(true);
    expect(resolveCareer("underwater basket weaver").matched).toBe(false);
  });

  it("still collapses casing for careers with no alias entry", () => {
    const a = resolveCareer("UNDERWATER BASKET WEAVER").canonical;
    const b = resolveCareer("  underwater basket weaver ").canonical;
    expect(a).toBe(b);
    expect(a).toBe("Underwater Basket Weaver");
  });
});

describe("generate-pathway shares one generation across spellings", () => {
  it("does not call Gemini again for a synonym of an already-generated career", async () => {
    const { vi } = await import("vitest");
    vi.resetModules();
    process.env.GEMINI_API_KEY = "test-key";

    const { _clearCache, _setSeedForTests } = await import("@/app/lib/apiCache");
    const { _resetRateLimits } = await import("@/app/lib/rateLimit");
    _clearCache();
    _resetRateLimits();
    // Nursing is in the committed seed file; empty it so the first request has
    // to generate and the "only one Gemini call" assertion means something.
    _setSeedForTests({});

    const pathwayData = { title: "Registered Nurse", pathways: [] };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(pathwayData) }] } }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("@/app/api/generate-pathway/route");
    const req = (body: unknown) => ({ json: async () => body }) as any;

    const first = await POST(req({ career: "RN" }));
    const second = await POST(req({ career: "nurse" }));
    const third = await POST(req({ career: "Registered Nurse" }));

    expect(first.status).toBe(200);
    expect(await third.json()).toEqual(pathwayData);
    // All three spellings resolved to one canonical title, so only the first
    // one spent a Gemini request.
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(second.status).toBe(200);

    vi.unstubAllGlobals();
  });
});

describe("canonicalCareers", () => {
  it("returns a deduplicated, sorted list for the seed script", () => {
    const list = canonicalCareers();
    expect(list.length).toBeGreaterThan(20);
    expect(new Set(list).size).toBe(list.length);
    expect([...list].sort()).toEqual(list);
  });
});
