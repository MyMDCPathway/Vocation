import { describe, it, expect } from "vitest";
import {
  FIU_PROGRAMS,
  findFIUProgram,
  getFIUProgramUrl,
  isFIUProgram,
  fiuColleges,
  fiuAreasOfInterest,
} from "@/app/lib/fiu-programs";

describe("FIU catalog data", () => {
  it("has a substantial number of programs", () => {
    // A sharp drop means the scraper silently half-parsed the page.
    expect(FIU_PROGRAMS.length).toBeGreaterThan(200);
  });

  it("gives every program a name, an fiu.edu URL, and a college", () => {
    for (const program of FIU_PROGRAMS) {
      expect(program.name.length, program.name).toBeGreaterThan(0);
      expect(program.url, program.name).toMatch(/^https?:\/\/[a-z0-9.-]*fiu\.edu/i);
      expect(program.college.length, program.name).toBeGreaterThan(0);
    }
  });

  it("carries no tracking parameters", () => {
    // FIU appends utm_* to every link; those would misattribute our traffic.
    for (const program of FIU_PROGRAMS) {
      expect(program.url, program.name).not.toMatch(/utm_/);
    }
  });

  it("has no leftover HTML entities in names", () => {
    for (const program of FIU_PROGRAMS) {
      expect(program.name, program.name).not.toMatch(/&[a-z]+;|&#\d+;/i);
    }
  });

  it("has no duplicate name/url pairs", () => {
    const keys = FIU_PROGRAMS.map((p) => `${p.name}|${p.url}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("classifies both undergraduate and graduate programs", () => {
    const levels = new Set(FIU_PROGRAMS.map((p) => p.level));
    expect(levels).toEqual(new Set(["undergraduate", "graduate"]));
  });
});

describe("findFIUProgram", () => {
  it("matches the exact catalog name", () => {
    expect(findFIUProgram("Accounting (BACC)")?.url).toBe(
      "https://business.fiu.edu/academics/undergraduate/bachelor-of-accounting/"
    );
  });

  it("matches without the degree code", () => {
    expect(findFIUProgram("Accounting")?.name).toContain("Accounting");
  });

  it("is case and punctuation insensitive", () => {
    const a = findFIUProgram("ACCOUNTING")?.url;
    const b = findFIUProgram("  accounting  ")?.url;
    expect(a).toBeDefined();
    expect(a).toBe(b);
  });

  it("strips degree prefixes the pathway generator adds", () => {
    // Gemini emits full titles; FIU lists bare names plus a code.
    expect(findFIUProgram("Bachelor of Science in Accounting")?.level).toBe(
      "undergraduate"
    );
  });

  it("prefers the undergraduate program when a name exists at both levels", () => {
    // "Accounting" is both a BACC and a MACC; transfers target the bachelor's.
    expect(findFIUProgram("Accounting")?.level).toBe("undergraduate");
  });

  it("returns the graduate program when the query asks for one", () => {
    expect(findFIUProgram("Master of Accounting")?.level).toBe("graduate");
    expect(findFIUProgram("Accounting (MACC)")?.name).toBe("Accounting (MACC)");
  });

  it("returns undefined for something FIU does not offer", () => {
    expect(findFIUProgram("Underwater Basket Weaving")).toBeUndefined();
    expect(findFIUProgram("")).toBeUndefined();
  });
});

describe("lookup helpers", () => {
  it("getFIUProgramUrl returns a URL or null", () => {
    expect(getFIUProgramUrl("Accounting")).toMatch(/^https:\/\//);
    expect(getFIUProgramUrl("Not A Real Program")).toBeNull();
  });

  it("isFIUProgram reports membership", () => {
    expect(isFIUProgram("Accounting")).toBe(true);
    expect(isFIUProgram("Not A Real Program")).toBe(false);
  });

  it("exposes colleges and areas of interest for grouping", () => {
    expect(fiuColleges().length).toBeGreaterThan(5);
    expect(fiuAreasOfInterest().length).toBeGreaterThan(5);
    expect(fiuColleges()).toContain("Business");
  });
});
