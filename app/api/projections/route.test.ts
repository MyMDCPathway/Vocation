import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/projections/route";

describe("GET /api/projections", () => {
  it("returns both tables and provenance", async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.fastestGrowing.length).toBeGreaterThan(0);
    expect(body.mostNewJobs.length).toBeGreaterThan(0);
    expect(body.meta.source).toContain("Bureau of Labor Statistics");
  });
});
