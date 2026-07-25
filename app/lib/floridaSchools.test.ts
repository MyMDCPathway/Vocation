import { describe, it, expect } from "vitest";
import {
  FLORIDA_SCHOOLS,
  DEFAULT_SCHOOL_ID,
  getSchoolById,
} from "@/app/lib/floridaSchools";

describe("floridaSchools", () => {
  it("has unique ids", () => {
    const ids = FLORIDA_SCHOOLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes MDC as the default school, with its logo", () => {
    const mdc = getSchoolById(DEFAULT_SCHOOL_ID);
    expect(mdc?.name).toBe("Miami Dade College");
    expect(mdc?.logo).toBeTruthy();
  });

  it("lists the complete public systems", () => {
    // Florida College System has 28 institutions, the SUS has 12. If either
    // count drifts, a school was dropped or invented — both are wrong.
    expect(FLORIDA_SCHOOLS.filter((s) => s.kind === "state-college")).toHaveLength(28);
    expect(FLORIDA_SCHOOLS.filter((s) => s.kind === "public-university")).toHaveLength(12);
  });

  it("keeps every entry renderable as a chip", () => {
    for (const school of FLORIDA_SCHOOLS) {
      expect(school.name.length, school.id).toBeGreaterThan(0);
      expect(school.shortName.length, school.id).toBeLessThanOrEqual(4);
      expect(school.color, school.id).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("points every logo at a local file, not a hotlinked URL", () => {
    // mdc.png used to hotlink mdcwap.mdc.edu; every logo now ships from our
    // own public/logos so it can't break when a school reorganizes its site.
    for (const school of FLORIDA_SCHOOLS.filter((s) => s.logo)) {
      expect(school.logo, school.id).toMatch(/^\/logos\/[a-z]+\.png$/);
    }
  });

  it("has a real logo for every school", () => {
    // All 61 are covered, so the monogram chip is now a safety net for logos
    // that fail to load rather than the normal state for most rows.
    for (const school of FLORIDA_SCHOOLS) {
      expect(school.logo, school.id).toBeTruthy();
    }
  });

  it("keeps a usable monogram for every school anyway", () => {
    // SchoolMark falls back to this if an image 404s or fails to decode.
    for (const school of FLORIDA_SCHOOLS) {
      expect(school.shortName.trim().length, school.id).toBeGreaterThan(0);
    }
  });
});
