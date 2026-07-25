import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// The route captures process.env.GEMINI_API_KEY at module-load time, so each
// test sets the env and re-imports the module fresh via vi.resetModules().
async function loadRoute() {
  // These tests mock Gemini responses, so they need the request to actually
  // reach Gemini. Real careers live in the committed seed file and would be
  // served from there instead, so this run gets an empty seed. Both imports
  // resolve from the same post-reset module registry as the route's own.
  const { _setSeedForTests } = await import("@/app/lib/apiCache");
  _setSeedForTests({});
  return await import("@/app/api/generate-pathway/route");
}

// Minimal stand-in for a NextRequest - the handler only calls request.json().
const makeRequest = (body: unknown) => ({ json: async () => body }) as any;

describe("POST /api/generate-pathway", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.GEMINI_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the generated pathway data on success", async () => {
    const pathwayData = {
      title: "Electrical Engineer",
      pathways: [
        {
          title: "Pathway 1: A.A. in Engineering - Electrical",
          isPrimary: true,
          steps: [
            {
              type: "degree",
              level: "A.A. (MDC)",
              name: "Associate in Arts in Engineering - Electrical",
              description: "Start at MDC.",
            },
          ],
        },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ text: JSON.stringify(pathwayData) }] } },
          ],
        }),
      })
    );

    const { POST } = await loadRoute();
    const res = await POST(
      makeRequest({ career: "Electrical Engineer", school: "mdc" })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe("Electrical Engineer");
    expect(body.pathways).toHaveLength(1);
  });

  it("surfaces a Gemini rate limit as a 429 with a wait message (comparison bug regression)", async () => {
    // Adding careers to the comparison view fires extra generate calls, which
    // can trip the free tier's requests-per-minute quota. This used to come
    // back as a generic 500; it must be a 429 so the client stops retrying.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        text: async () => JSON.stringify({ error: { code: 429, message: "quota" } }),
      })
    );

    const { POST } = await loadRoute();
    const res = await POST(makeRequest({ career: "Nurse", school: "mdc" }));

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toMatch(/wait/i);
  });

  it("returns 502 for other upstream failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        text: async () => "upstream down",
      })
    );

    const { POST } = await loadRoute();
    const res = await POST(makeRequest({ career: "Nurse", school: "mdc" }));

    expect(res.status).toBe(502);
  });

  it("rejects a missing career with a 400 before calling Gemini", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await loadRoute();
    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a missing school rather than silently generating an MDC pathway", async () => {
    // The pre-selection identity is a neutral, non-school default (see
    // floridaSchools.ts), so a request that omits `school` must be rejected
    // the same way an uncatalogued school is - never fall back to MDC.
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await loadRoute();
    const res = await POST(makeRequest({ career: "Nurse" }));

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
