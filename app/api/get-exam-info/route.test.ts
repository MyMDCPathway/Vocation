import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mirrors generate-pathway's route test: the route reads GEMINI_API_KEY at
// module load, so each test re-imports fresh, and the seed cache is emptied so
// requests actually reach the (mocked) model instead of being served from it.
async function loadRoute() {
  const { _setSeedForTests } = await import("@/app/lib/apiCache");
  _setSeedForTests({});
  return await import("@/app/api/get-exam-info/route");
}

const makeRequest = (body: unknown) => ({ json: async () => body }) as any;

/** A Gemini response whose JSON payload is `examInfo`. */
function mockGemini(examInfo: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(examInfo) }] } }],
    }),
  });
}

const REQUIREMENTS = ["Meet the education prerequisite", "Pass the exam"];

describe("POST /api/get-exam-info — model-supplied url is not trusted", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.GEMINI_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("passes through a normal https url", async () => {
    vi.stubGlobal(
      "fetch",
      mockGemini({ url: "https://www.example.org/cert", requirements: REQUIREMENTS })
    );

    const { POST } = await loadRoute();
    const res = await POST(makeRequest({ examName: "Test Certification Exam" }));
    const body = await res.json();

    expect(body.url).toBe("https://www.example.org/cert");
  });

  // The sink: this value is cached under the exam name, served to every later
  // visitor asking about that certification, and rendered into an href the
  // student is invited to click. A javascript: URL there executes in our origin.
  it.each([
    ["javascript:", "javascript:alert(document.cookie)"],
    ["data:", "data:text/html,<script>alert(1)</script>"],
    ["file:", "file:///etc/passwd"],
    ["an internal host", "http://localhost:3000/admin"],
    ["a private IP", "http://169.254.169.254/latest/meta-data/"],
  ])("replaces a %s url with the search fallback", async (_label, url) => {
    vi.stubGlobal("fetch", mockGemini({ url, requirements: REQUIREMENTS }));

    const { POST } = await loadRoute();
    const res = await POST(makeRequest({ examName: "Test Certification Exam" }));
    const body = await res.json();

    expect(body.url).not.toBe(url);
    expect(body.url).toContain("google.com/search");
  });

  it("does not cache a rejected url, so a later request can still get the real one", async () => {
    // The fallback is deliberately not cached (see the route's cache write), so
    // a poisoned answer can never become the persisted one.
    vi.stubGlobal(
      "fetch",
      mockGemini({ url: "javascript:alert(1)", requirements: REQUIREMENTS })
    );

    const { POST } = await loadRoute();
    const first = await POST(makeRequest({ examName: "Test Certification Exam" }));
    expect((await first.json()).url).toContain("google.com/search");

    const { getCached, cacheKey } = await import("@/app/lib/apiCache");
    expect(getCached(cacheKey("exam", "test certification exam"))).toBeUndefined();
  });
});
