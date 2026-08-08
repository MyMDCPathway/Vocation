import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/interests/route";

describe("GET /api/interests", () => {
  it("returns curated tiles and the full industry taxonomy", async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.curated.length).toBe(6);
    expect(body.allIndustries.length).toBe(22);
    for (const interest of body.curated) {
      expect(interest.jobCount).toBeGreaterThan(0);
    }
  });
});
