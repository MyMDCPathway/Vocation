import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/program-careers/route";

function makeRequest(program: string) {
  return { nextUrl: new URL(`http://localhost/api/program-careers?program=${encodeURIComponent(program)}`) } as any;
}

describe("GET /api/program-careers", () => {
  it("resolves a real program name to real careers", async () => {
    const response = await GET(makeRequest("Nursing — R.N."));
    const body = await response.json();

    expect(body.match).not.toBeNull();
    expect(body.careers.some((c: any) => c.title === "Registered Nurses")).toBe(true);
    expect(body.meta.source).toContain("O*NET");
  });

  it("returns an empty result, not an error, for a program with no confident match", async () => {
    const response = await GET(makeRequest("xyzzy quux flibbertigibbet"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.match).toBeNull();
    expect(body.careers).toEqual([]);
  });

  it("400s on a missing program name", async () => {
    const response = await GET(makeRequest(""));
    expect(response.status).toBe(400);
  });
});
