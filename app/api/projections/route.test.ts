import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/projections/route";

function makeRequest(query: string) {
  return { nextUrl: new URL(`http://localhost/api/projections${query}`) } as any;
}

describe("GET /api/projections", () => {
  it("returns both tables and provenance", async () => {
    const response = await GET(makeRequest(""));
    const body = await response.json();

    expect(body.fastestGrowing.length).toBeGreaterThan(0);
    expect(body.mostNewJobs.length).toBeGreaterThan(0);
    expect(body.meta.source).toContain("Bureau of Labor Statistics");
  });

  it("tags matchedInterest: null on every row with no interests param", async () => {
    const response = await GET(makeRequest(""));
    const body = await response.json();

    expect(body.fastestGrowing.every((row: any) => row.matchedInterest === null)).toBe(true);
    expect(body.mostNewJobs.every((row: any) => row.matchedInterest === null)).toBe(true);
  });

  it("flags rows that fall inside a requested interest", async () => {
    const response = await GET(makeRequest("?interests=healthcare"));
    const body = await response.json();

    // "Nurse practitioners" is the first fastest-growing row and a real
    // Healthcare occupation — see data/projections.json.
    const nursePractitioners = body.fastestGrowing.find(
      (row: any) => row.occupation === "Nurse practitioners"
    );
    expect(nursePractitioners.matchedInterest).toBe("Healthcare");

    // "Wind turbine service technicians" is Skilled Trades, not Healthcare.
    const windTech = body.fastestGrowing.find(
      (row: any) => row.occupation === "Wind turbine service technicians"
    );
    expect(windTech.matchedInterest).toBeNull();
  });
});
