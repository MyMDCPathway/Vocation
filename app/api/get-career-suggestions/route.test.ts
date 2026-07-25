import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// The route captures process.env.GEMINI_API_KEY at module-load time, so each
// test re-imports it fresh. The seed layer is emptied so these tests exercise
// the generation path rather than being answered from committed data.
async function loadRoute() {
  const { _clearCache, _setSeedForTests } = await import("@/app/lib/apiCache");
  const { _resetRateLimits } = await import("@/app/lib/rateLimit");
  _clearCache();
  _setSeedForTests({});
  _resetRateLimits();
  return await import("@/app/api/get-career-suggestions/route");
}

const makeRequest = (body: unknown) => ({ json: async () => body }) as any;

const SUGGESTIONS = [
  {
    title: "Registered Nurse",
    description: "Provides patient care.",
    salary: "$75,000 - $85,000",
    jobOutlook: "High demand",
    competitiveness: "Less competitive",
  },
];

function mockGemini() {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [
        { content: { parts: [{ text: JSON.stringify(SUGGESTIONS) }] } },
      ],
    }),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("POST /api/get-career-suggestions", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.GEMINI_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns suggestions for a career", async () => {
    mockGemini();
    const { POST } = await loadRoute();

    const res = await POST(makeRequest({ input: "Nurse" }));
    expect(res.status).toBe(200);
    expect((await res.json()).suggestions[0].title).toBe("Registered Nurse");
  });

  it("spends only one Gemini call across spellings of the same career", async () => {
    const fetchMock = mockGemini();
    const { POST } = await loadRoute();

    // These all resolve to the same canonical career, so the suggestion list
    // should be generated once and reused.
    await POST(makeRequest({ input: "RN" }));
    await POST(makeRequest({ input: "nurse" }));
    await POST(makeRequest({ input: "  NURSE  " }));
    await POST(makeRequest({ input: "I want to be a nurse" }));

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("still generates separately for genuinely different careers", async () => {
    const fetchMock = mockGemini();
    const { POST } = await loadRoute();

    await POST(makeRequest({ input: "nurse" }));
    await POST(makeRequest({ input: "architect" }));

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("prompts with the canonical career, not the raw input", async () => {
    const fetchMock = mockGemini();
    const { POST } = await loadRoute();

    await POST(makeRequest({ input: "RN" }));

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const prompt = body.contents[0].parts[0].text;
    expect(prompt).toContain("Registered Nurse");
  });

  it("rejects an empty input without calling Gemini", async () => {
    const fetchMock = mockGemini();
    const { POST } = await loadRoute();

    const res = await POST(makeRequest({ input: "   " }));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("seeded suggestions", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.GEMINI_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("serves a committed suggestion list without calling Gemini", async () => {
    const { _clearCache, _setSeedForTests } = await import("@/app/lib/apiCache");
    const { _resetRateLimits } = await import("@/app/lib/rateLimit");
    _clearCache();
    _resetRateLimits();
    // Key format must match what scripts/seed-pathways.mjs writes.
    _setSeedForTests({ "suggestions:registered nurse": SUGGESTIONS });

    const fetchMock = mockGemini();
    const { POST } = await import("@/app/api/get-career-suggestions/route");

    const res = await POST(makeRequest({ input: "RN" }));

    expect(res.status).toBe(200);
    expect((await res.json()).suggestions[0].title).toBe("Registered Nurse");
    expect(fetchMock).not.toHaveBeenCalled();

    _setSeedForTests(null);
  });
});
