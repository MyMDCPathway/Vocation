import { describe, it, expect, afterEach } from "vitest";
import { GET } from "@/app/api/schools/route";
import { _setSnapshotForTests } from "@/app/lib/scorecard";
import { FLORIDA_SCHOOLS } from "@/app/lib/floridaSchools";

// The handler only reads request.nextUrl.searchParams — a bare URL's own
// .searchParams matches that surface closely enough without needing the real
// (heavier) NextRequest, the same "minimal stand-in" call route.test.ts files
// already make elsewhere in this repo.
function makeRequest(query: string) {
  return { nextUrl: new URL(`http://localhost/api/schools${query}`) } as any;
}

afterEach(() => {
  _setSnapshotForTests(null);
});

describe("GET /api/schools", () => {
  it("returns every Florida school by default, paginated to the default limit", async () => {
    const response = await GET(makeRequest(""));
    const body = await response.json();
    expect(body.total).toBe(FLORIDA_SCHOOLS.length);
    expect(body.schools.length).toBeLessThanOrEqual(60);
  });

  it("filters to catalog schools only", async () => {
    const response = await GET(makeRequest("?catalogOnly=1"));
    const body = await response.json();
    expect(body.schools.every((s: any) => s.hasCatalog)).toBe(true);
    // A school known to have no catalog must be excluded.
    expect(body.schools.some((s: any) => s.id === "nova")).toBe(false);
  });

  it("filters by kind", async () => {
    const response = await GET(makeRequest("?kind=public-university"));
    const body = await response.json();
    expect(body.schools.every((s: any) => s.kind === "public-university")).toBe(true);
  });

  it("filters by name search, case-insensitively", async () => {
    const response = await GET(makeRequest("?q=miami"));
    const body = await response.json();
    expect(body.schools.length).toBeGreaterThan(0);
    expect(body.schools.every((s: any) => s.name.toLowerCase().includes("miami"))).toBe(true);
  });

  it("rejects a distance sort with no origin rather than returning a fake order", async () => {
    const response = await GET(makeRequest("?sort=distance"));
    expect(response.status).toBe(400);
  });

  it("sorts by distance when an origin is given", async () => {
    // Miami's own coordinates.
    const response = await GET(makeRequest("?sort=distance&lat=25.774&lng=-80.194"));
    const body = await response.json();
    const distances = body.schools
      .map((s: any) => s.distanceMiles)
      .filter((d: number | null) => d !== null);
    for (let i = 1; i < distances.length; i++) {
      expect(distances[i - 1]).toBeLessThanOrEqual(distances[i]);
    }
  });

  it("paginates with limit and offset", async () => {
    const first = await GET(makeRequest("?limit=5&offset=0"));
    const firstBody = await first.json();
    const second = await GET(makeRequest("?limit=5&offset=5"));
    const secondBody = await second.json();
    expect(firstBody.schools.length).toBe(5);
    expect(secondBody.schools[0].id).not.toBe(firstBody.schools[0].id);
  });

  it("reports scorecard availability honestly", async () => {
    const response = await GET(makeRequest(""));
    const body = await response.json();
    // data/scorecard.json now holds a real committed national pull, so a
    // real request against it reports real availability — see
    // scorecard.test.ts for the explicit true/false cases via
    // _setSnapshotForTests, which don't depend on the committed file.
    expect(body.scorecard.available).toBe(true);
    expect(body.scorecard.count).toBeGreaterThan(0);
  });

  it("includes the full list of real states regardless of the current filter", async () => {
    const response = await GET(makeRequest(""));
    const body = await response.json();
    expect(body.states).toContain("FL");
    expect(body.states).toContain("MA");
    expect(body.states.length).toBeGreaterThan(45);
  });

  it("scope 'ALL' returns real schools outside Florida", async () => {
    const totalsResponse = await GET(makeRequest("?state=ALL"));
    const totalsBody = await totalsResponse.json();
    expect(totalsBody.total).toBeGreaterThan(FLORIDA_SCHOOLS.length);

    // Name search narrows past pagination to confirm a specific real
    // non-Florida school is actually reachable, not just counted.
    const response = await GET(makeRequest("?state=ALL&q=Harvard%20University"));
    const body = await response.json();
    expect(body.schools.some((s: any) => s.name === "Harvard University")).toBe(true);
  });

  it("a specific non-Florida state returns only that state's real schools", async () => {
    const response = await GET(makeRequest("?state=GA&limit=200"));
    const body = await response.json();
    expect(body.total).toBeGreaterThan(0);
    expect(body.schools.every((s: any) => s.state === "GA")).toBe(true);
  });
});
