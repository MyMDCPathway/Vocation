import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/interests/[slug]/route";

function makeRequest(query: string) {
  return { nextUrl: new URL(`http://localhost/api/interests/healthcare${query}`) } as any;
}

describe("GET /api/interests/[slug]", () => {
  it("returns a curated interest's real job pool", async () => {
    const response = await GET(makeRequest(""), { params: { slug: "healthcare" } });
    const body = await response.json();

    expect(body.label).toBe("Healthcare");
    expect(body.jobs.some((j: any) => j.title === "Registered Nurses")).toBe(true);
    // Healthcare has more real jobs than the default page size, so total
    // (the full pool) must exceed jobs.length (one page of it) here.
    expect(body.total).toBeGreaterThan(body.jobs.length);
  });

  it("resolves a raw SOC major-group code from the browse-all page", async () => {
    const response = await GET(makeRequest(""), { params: { slug: "51" } });
    const body = await response.json();

    expect(body.label).toBe("Production");
    expect(body.jobs.every((j: any) => j.code.startsWith("51"))).toBe(true);
  });

  it("404s on an unknown slug", async () => {
    const response = await GET(makeRequest(""), { params: { slug: "not-real" } });
    expect(response.status).toBe(404);
  });

  it("filters by name search, case-insensitively", async () => {
    const response = await GET(makeRequest("?q=nurse"), { params: { slug: "healthcare" } });
    const body = await response.json();

    expect(body.jobs.length).toBeGreaterThan(0);
    expect(body.jobs.every((j: any) => j.title.toLowerCase().includes("nurse"))).toBe(true);
  });

  it("paginates with limit and offset", async () => {
    const first = await GET(makeRequest("?limit=3&offset=0"), { params: { slug: "healthcare" } });
    const firstBody = await first.json();
    const second = await GET(makeRequest("?limit=3&offset=3"), { params: { slug: "healthcare" } });
    const secondBody = await second.json();

    expect(firstBody.jobs.length).toBe(3);
    expect(firstBody.jobs[0].code).not.toBe(secondBody.jobs[0].code);
  });
});
