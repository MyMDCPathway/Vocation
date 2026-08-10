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

  it("does not serve a forged open-school entry to a legitimate request (cache poisoning regression)", async () => {
    // The attack this guards: /api/generate-pathway is unauthenticated and
    // openSchoolId() is a deterministic slug, so an attacker can compute the
    // exact key a real visitor will later hit. The cache key used to be
    // schoolId + archetype + career only, so a request carrying fabricated
    // details under a real school's name overwrote the durable entry every
    // later visitor got served. Keyed by content, the two can't collide.
    const poisoned = { title: "POISONED", pathways: [] };
    const legitimate = { title: "Registered Nurse", pathways: [] };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify(poisoned) }] } }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify(legitimate) }] } }],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await loadRoute();
    const school = "open:example-university";
    const name = "Example University";

    const attacker = await POST(
      makeRequest({
        career: "Registered Nurse",
        school,
        schoolRef: { name, city: "Nowhere", programsUrl: "https://attacker.example/x" },
      })
    );
    expect(attacker.status).toBe(200);
    expect((await attacker.json()).title).toBe("POISONED");

    // Same school, same career — but the real details a real lookup produces.
    const victim = await POST(
      makeRequest({
        career: "Registered Nurse",
        school,
        schoolRef: { name, city: "Springfield", programsUrl: "https://example.edu/programs" },
      })
    );
    expect(victim.status).toBe(200);
    expect((await victim.json()).title).toBe("Registered Nurse");
  });

  it("rejects an open-school ref whose name does not match its id", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await loadRoute();
    const res = await POST(
      makeRequest({
        career: "Nurse",
        school: "open:harvard-university",
        schoolRef: { name: "Some Other School" },
      })
    );

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not let an unvalidated routeArchetype mint unlimited cache keys", async () => {
    // routeArchetype went into the cache key unvalidated, so any random
    // string was a guaranteed miss and a guaranteed Gemini generation.
    // Unknown values must normalize to the default and share its entry.
    const data = { title: "Welder", pathways: [] };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(data) }] } }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await loadRoute();
    const schoolRef = { name: "Example University", city: "Springfield" };
    const base = { career: "Welder", school: "open:example-university", schoolRef };

    await POST(makeRequest({ ...base, routeArchetype: "degree" }));
    await POST(makeRequest({ ...base, routeArchetype: "not-an-archetype" }));
    await POST(makeRequest({ ...base, routeArchetype: "also-fake-" + "x".repeat(50) }));

    // Only the first should have reached Gemini; the rest normalize to
    // "degree" and hit its cache entry.
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
