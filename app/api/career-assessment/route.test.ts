import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// The route captures process.env.GEMINI_API_KEY at module-load time, so each
// test sets the env and re-imports the module fresh via vi.resetModules().
async function loadRoute() {
  return await import("@/app/api/career-assessment/route");
}

// Minimal stand-in for a NextRequest - the handler only calls request.json().
const makeRequest = (body: unknown) => ({ json: async () => body }) as any;

// Shape a fake Gemini generateContent response whose text is a JSON array.
const geminiWith = (text: string) => ({
  ok: true,
  json: async () => ({
    candidates: [{ content: { parts: [{ text }] } }],
  }),
});

describe("POST /api/career-assessment (what career fits you)", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.GEMINI_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns recommended careers from a set of quiz answers", async () => {
    const modelJson = JSON.stringify([
      {
        title: "Registered Nurse",
        description: "Provides patient care.",
        salary: "$75,000 - $85,000",
        jobOutlook: "High demand",
        competitiveness: "Less competitive",
        matchReason: "You enjoy helping people.",
      },
      {
        title: "Physical Therapist",
        description: "Helps patients recover mobility.",
        salary: "$90,000",
        jobOutlook: "Growing field",
        competitiveness: "Moderately competitive",
        match_reason: "You like science and helping others.", // snake_case variant
      },
    ]);
    // Gemini often wraps JSON in a markdown code fence - the route must strip it.
    const fetchMock = vi.fn().mockResolvedValue(geminiWith("```json\n" + modelJson + "\n```"));
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await loadRoute();
    const res = await POST(
      makeRequest({
        answers: [
          { question: "What do you enjoy?", answer: "Helping people" },
          { question: "Preferred subjects?", answer: ["Biology", "Health"] },
        ],
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.careers).toHaveLength(2);
    expect(body.careers[0].title).toBe("Registered Nurse");
    expect(body.careers[0].matchReason).toBe("You enjoy helping people.");
    // The snake_case match_reason field is normalized to matchReason.
    expect(body.careers[1].matchReason).toBe("You like science and helping others.");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("drops malformed entries that have no title", async () => {
    const modelJson = JSON.stringify([
      { title: "Software Engineer", description: "Builds software." },
      { description: "No title here - should be filtered out." },
    ]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(geminiWith(modelJson)));

    const { POST } = await loadRoute();
    const res = await POST(makeRequest({ answers: [{ question: "Q", answer: "A" }] }));

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.careers).toHaveLength(1);
    expect(body.careers[0].title).toBe("Software Engineer");
  });

  it("rejects an empty answers array with a 400", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await loadRoute();
    const res = await POST(makeRequest({ answers: [] }));

    expect(res.status).toBe(400);
    // Validation happens before any Gemini call.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces an upstream Gemini error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        text: async () => "quota exceeded",
      })
    );

    const { POST } = await loadRoute();
    const res = await POST(makeRequest({ answers: [{ question: "Q", answer: "A" }] }));

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toMatch(/Gemini API error/);
  });
});
