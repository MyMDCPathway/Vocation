import { describe, it, expect } from "vitest";
import { matchProgramToCip, careersForProgram, crosswalkMeta, MATCH_FLOOR } from "@/app/lib/programCareers";

// Against the real committed data/cip-soc.json — same discipline
// projections.test.ts and interests.test.ts follow: assertions about shape
// and known-good real matches, not brittle exact-score numbers.

describe("crosswalkMeta", () => {
  it("reports real O*NET provenance, not a placeholder", () => {
    const meta = crosswalkMeta();
    expect(meta.source).toContain("O*NET");
    expect(meta.sourceUrl).toMatch(/^https:\/\//);
  });
});

describe("matchProgramToCip", () => {
  it("matches a school's own program name to a real CIP program", () => {
    // These are real, verbatim program names pulled from this app's own
    // catalogs (mdc-programs.ts / programs/*.ts) — not invented test data.
    const nursing = matchProgramToCip("Nursing — R.N.");
    expect(nursing).not.toBeNull();
    expect(nursing!.cipTitle.toLowerCase()).toContain("nursing");

    const cs = matchProgramToCip("Computer Science");
    expect(cs).not.toBeNull();
    expect(cs!.cipTitle.toLowerCase()).toContain("computer science");
  });

  it("returns null rather than a low-confidence guess for gibberish", () => {
    expect(matchProgramToCip("xyzzy quux flibbertigibbet")).toBeNull();
  });

  it("never returns a match below its own floor", () => {
    const samples = [
      "Nursing — R.N.",
      "Applied Artificial Intelligence",
      "Aviation Maintenance Management",
      "Culinary Arts",
      "Criminal Justice",
      "Business Administration",
    ];
    for (const name of samples) {
      const match = matchProgramToCip(name);
      if (match) expect(match.score).toBeGreaterThanOrEqual(MATCH_FLOOR);
    }
  });
});

describe("careersForProgram", () => {
  it("resolves a nursing program to real BLS occupations, Registered Nurses included", () => {
    const result = careersForProgram("Nursing — R.N.");
    expect(result).not.toBeNull();
    expect(result!.careers.length).toBeGreaterThan(0);
    expect(result!.careers.some((c) => c.title === "Registered Nurses")).toBe(true);
  });

  it("resolves every career through the real occupation table, never a fabricated one", () => {
    const result = careersForProgram("Computer Science");
    expect(result).not.toBeNull();
    for (const career of result!.careers) {
      expect(career.code).toMatch(/^\d{6}$/);
      expect(career.title.length).toBeGreaterThan(0);
    }
  });

  it("returns null for a program with no confident match", () => {
    expect(careersForProgram("xyzzy quux flibbertigibbet")).toBeNull();
  });
});
