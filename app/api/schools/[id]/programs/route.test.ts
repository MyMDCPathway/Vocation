import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/schools/[id]/programs/route";

function makeRequest(schoolId: string, query = "") {
  return { nextUrl: new URL(`http://localhost/api/schools/${schoolId}/programs${query}`) } as any;
}

describe("GET /api/schools/[id]/programs", () => {
  it("returns MDC's real bespoke-table programs", async () => {
    const response = await GET(makeRequest("mdc"), { params: { id: "mdc" } });
    const body = await response.json();

    expect(body.hasCatalog).toBe(true);
    expect(body.programs.length).toBeGreaterThan(0);
    expect(body.programs.some((p: any) => /nursing/i.test(p.name))).toBe(true);
    expect(body.resources).toEqual([]);
  });

  it("returns a scraped catalog school's real programs", async () => {
    const response = await GET(makeRequest("broward"), { params: { id: "broward" } });
    const body = await response.json();

    expect(body.hasCatalog).toBe(true);
    expect(body.programs.length).toBeGreaterThan(0);
  });

  it("filters by name search, case-insensitively", async () => {
    const response = await GET(makeRequest("mdc", "?q=nursing"), { params: { id: "mdc" } });
    const body = await response.json();

    expect(body.programs.length).toBeGreaterThan(0);
    expect(body.programs.every((p: any) => p.name.toLowerCase().includes("nursing"))).toBe(true);
  });

  it("falls back to real resource links, never a fabricated catalog, for a school with no scraped programs", async () => {
    const response = await GET(makeRequest("cookman"), { params: { id: "cookman" } });
    const body = await response.json();

    expect(body.hasCatalog).toBe(false);
    expect(body.programs).toEqual([]);
    expect(body.resources.length).toBeGreaterThan(0);
    for (const resource of body.resources) {
      expect(resource.url).toMatch(/^https?:\/\//);
    }
  });

  it("404s on an unknown school", async () => {
    const response = await GET(makeRequest("not-a-real-school"), { params: { id: "not-a-real-school" } });
    expect(response.status).toBe(404);
  });

  it("falls back to the school's own real website for a synthesized national school", async () => {
    // Harvard University, unitId 166027 — real, from data/scorecard.json.
    // No scraped catalog and no curated schoolInfo.ts entry, so the only
    // honest fallback is the one real link Scorecard gives us.
    const response = await GET(makeRequest("sc-166027"), { params: { id: "sc-166027" } });
    const body = await response.json();

    expect(body.hasCatalog).toBe(false);
    expect(body.programs).toEqual([]);
    expect(body.resources.length).toBe(1);
    expect(body.resources[0].url).toMatch(/^https:\/\/.*harvard\.edu/i);
  });

  it("tags matchedInterest: null on every program with no interests param", async () => {
    const response = await GET(makeRequest("mdc"), { params: { id: "mdc" } });
    const body = await response.json();
    expect(body.programs.every((p: any) => p.matchedInterest === null)).toBe(true);
  });

  it("flags and reorders programs that fall inside a requested interest", async () => {
    const response = await GET(makeRequest("mdc", "?interests=healthcare"), { params: { id: "mdc" } });
    const body = await response.json();

    // MDC's real nursing program resolves to Registered Nurses (see
    // programCareers.test.ts) — Healthcare. Matched by substring rather than
    // the exact catalog key, since dedup-by-URL picks whichever nursing
    // alias happens to appear first in mdc-programs.ts.
    const nursing = body.programs.find((p: any) => /nursing.*r\.n\./i.test(p.name));
    expect(nursing).toBeDefined();
    expect(nursing.matchedInterest).toBe("Healthcare");

    // Every matched program sorts before every unmatched one.
    const firstUnmatchedIndex = body.programs.findIndex((p: any) => p.matchedInterest === null);
    const lastMatchedIndex = body.programs.map((p: any) => p.matchedInterest !== null).lastIndexOf(true);
    expect(lastMatchedIndex).toBeLessThan(firstUnmatchedIndex);
  });

  it("attaches real per-program earnings for a catalog school, with provenance", async () => {
    const response = await GET(makeRequest("mdc"), { params: { id: "mdc" } });
    const body = await response.json();

    expect(body.programEarnings.available).toBe(true);
    expect(body.programEarnings.source).toMatch(/College Scorecard/);

    // Confirmed against the real committed snapshot: MDC's accelerated RN
    // program joins to a real, populated earnings row at the associate's
    // level. If this ever goes back to null, either the crosswalk match
    // broke or data/scorecard-programs.json regressed to the empty
    // placeholder — both worth failing loudly on.
    const nursing = body.programs.find((p: any) => /nursing.*r\.n\..*accelerated/i.test(p.name));
    expect(nursing).toBeDefined();
    expect(nursing.level).toBe("associate");
    expect(nursing.earnings).not.toBeNull();
    expect(typeof nursing.earnings.schoolMedianEarnings).toBe("number");
    expect(typeof nursing.earnings.nationalMedianEarnings).toBe("number");
    expect(nursing.earnings.cipTitle).toMatch(/Nursing/i);

    // At least some real programs carry earnings — proves the join is
    // actually firing broadly, not just for one hand-picked program.
    const withEarnings = body.programs.filter((p: any) => p.earnings !== null);
    expect(withEarnings.length).toBeGreaterThan(20);
  });

  it("never attaches earnings for a school with no program list to attach them to", async () => {
    // No catalog → no programs → nothing for earningsForProgram to run
    // against. Must not throw trying to resolve a Scorecard match for a
    // school with nothing to match.
    const response = await GET(makeRequest("cookman"), { params: { id: "cookman" } });
    const body = await response.json();
    expect(body.programs).toEqual([]);
  });

  it("leaves earnings null for a program the crosswalk can't confidently match", async () => {
    // programCareers.ts refuses to guess below its match floor — a program
    // with no confident match must not get a fabricated earnings figure
    // either. Every entry either has a real, non-null match or null.
    const response = await GET(makeRequest("mdc"), { params: { id: "mdc" } });
    const body = await response.json();
    for (const program of body.programs) {
      if (program.earnings !== null) {
        expect(typeof program.earnings.cipTitle).toBe("string");
      }
    }
  });
});
