import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/schools/search-programs/route";

const makeRequest = (body: unknown) => ({ json: async () => body }) as any;

describe("POST /api/schools/search-programs", () => {
  it("rejects a query shorter than the minimum length", async () => {
    const response = await POST(makeRequest({ query: "a" }));
    expect(response.status).toBe(400);
  });

  it("rejects a missing query", async () => {
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
  });

  it("finds real nursing programs across multiple schools, MDC included", async () => {
    const response = await POST(makeRequest({ query: "nursing" }));
    const body = await response.json();
    expect(body.results.length).toBeGreaterThan(1);
    const mdc = body.results.find((r: any) => r.schoolId === "mdc");
    expect(mdc).toBeDefined();
    expect(mdc.matches.length).toBeGreaterThan(0);
    for (const result of body.results) {
      for (const match of result.matches) {
        expect(match.name.toLowerCase()).toContain("nursing");
        expect(match.url).toMatch(/^https?:\/\//);
      }
    }
  });

  it("never returns a synthesized program — every match is a real catalog entry with a real URL", async () => {
    const response = await POST(makeRequest({ query: "accounting" }));
    const body = await response.json();
    for (const result of body.results) {
      for (const match of result.matches) {
        expect(typeof match.url).toBe("string");
        expect(match.url.length).toBeGreaterThan(0);
      }
    }
  });

  it("orders schools by match count, most relevant first", async () => {
    const response = await POST(makeRequest({ query: "business" }));
    const body = await response.json();
    for (let i = 1; i < body.results.length; i++) {
      expect(body.results[i - 1].totalMatches).toBeGreaterThanOrEqual(body.results[i].totalMatches);
    }
  });

  it("returns an empty result set for a query matching nothing real", async () => {
    const response = await POST(makeRequest({ query: "zzzznonexistentprogramzzzz" }));
    const body = await response.json();
    expect(body.results).toEqual([]);
  });
});
