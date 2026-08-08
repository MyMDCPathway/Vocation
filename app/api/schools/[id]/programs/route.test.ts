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
});
