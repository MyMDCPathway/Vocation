import { describe, it, expect } from "vitest";
import { BROWARD_PROGRAMS, browardCatalog } from "@/app/lib/programs/broward";

describe("Broward catalog data", () => {
  it("has a substantial number of programs", () => {
    expect(BROWARD_PROGRAMS.length).toBeGreaterThan(150);
  });

  it("gives every program a name and a catalog.broward.edu URL", () => {
    for (const p of BROWARD_PROGRAMS) {
      expect(p.name.trim().length, p.name).toBeGreaterThan(0);
      expect(p.url, p.name).toMatch(/^https:\/\/catalog\.broward\.edu\//);
    }
  });

  it("covers all three levels", () => {
    for (const level of ["associate", "bachelor", "certificate"] as const) {
      expect(browardCatalog.byLevel(level).length, level).toBeGreaterThan(0);
    }
  });

  it("includes the plain Associate of Arts, not just the Honors variant", () => {
    // Broward's Degree Finder omits the general A.A., which is the degree most
    // transfer students actually take, so the scraper adds it explicitly.
    const aa = BROWARD_PROGRAMS.filter((p) => p.credential === "AA");
    expect(aa.map((p) => p.name)).toContain("Associate of Arts");
    expect(aa.length).toBeGreaterThanOrEqual(2);
  });

  it("captured the BSN as a bachelor's", () => {
    // "Nursing (BSN)" has a credential code the first parse didn't know about.
    const bsn = BROWARD_PROGRAMS.find((p) => p.credential === "BSN");
    expect(bsn?.level).toBe("bachelor");
  });

  it("strips the trailing program number from names", () => {
    // Titles arrive as "Accounting Technology (AS) - 2100".
    for (const p of BROWARD_PROGRAMS) {
      expect(p.name, p.name).not.toMatch(/\((AA|AS|AAS|BS|BAS|BSN|TC|VC|ATD|ATC)\)\s*$/);
      expect(p.name, p.name).not.toMatch(/\s-\s*\(?[A-Z]?\d{3,}/);
    }
  });

  it("has no duplicate name/credential pairs", () => {
    const keys = BROWARD_PROGRAMS.map((p) => `${p.name}|${p.credential}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("browardCatalog lookup", () => {
  it("finds a program by its exact name", () => {
    expect(browardCatalog.find("Accounting Technology")?.credential).toBe("AS");
  });

  it("is case and punctuation insensitive", () => {
    const a = browardCatalog.getUrl("accounting technology");
    expect(a).toBeTruthy();
    expect(browardCatalog.getUrl("  ACCOUNTING TECHNOLOGY  ")).toBe(a);
  });

  it("prefers the associate when a name exists at more than one level", () => {
    // A state college pathway starts at the associate, unlike FIU's bachelor's.
    const nursing = browardCatalog.find("Nursing");
    expect(nursing?.level).toBe(
      BROWARD_PROGRAMS.some((p) => p.name === "Nursing" && p.level === "associate")
        ? "associate"
        : nursing?.level
    );
  });

  it("respects an explicit bachelor's request", () => {
    expect(browardCatalog.find("Nursing", "B.S.N. (Broward)")?.level).toBe("bachelor");
  });

  it("returns undefined for a program Broward does not offer", () => {
    expect(browardCatalog.find("Underwater Basket Weaving")).toBeUndefined();
    expect(browardCatalog.find("")).toBeUndefined();
  });
});
