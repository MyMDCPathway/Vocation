import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/occupations/route";

function makeRequest(query: string) {
  return { nextUrl: new URL(`http://localhost/api/occupations${query}`) } as any;
}

describe("GET /api/occupations", () => {
  it("returns real BLS occupations with no query", async () => {
    const response = await GET(makeRequest(""));
    const body = await response.json();

    expect(body.jobs.length).toBeGreaterThan(0);
    expect(body.total).toBeGreaterThan(body.jobs.length);
  });

  it("filters by title search, case-insensitively, across the full table", async () => {
    const response = await GET(makeRequest("?q=nurse"));
    const body = await response.json();

    expect(body.jobs.length).toBeGreaterThan(0);
    expect(body.jobs.every((j: any) => j.title.toLowerCase().includes("nurse"))).toBe(true);
    // Not scoped to one interest group — Registered Nurses (Healthcare) should
    // be reachable the same way as any other title.
    expect(body.jobs.some((j: any) => j.title === "Registered Nurses")).toBe(true);
  });

  it("paginates with limit and offset", async () => {
    const first = await GET(makeRequest("?limit=3&offset=0"));
    const firstBody = await first.json();
    const second = await GET(makeRequest("?limit=3&offset=3"));
    const secondBody = await second.json();

    expect(firstBody.jobs.length).toBe(3);
    expect(firstBody.jobs[0].code).not.toBe(secondBody.jobs[0].code);
  });
});
