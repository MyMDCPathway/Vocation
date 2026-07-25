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

  it("resolves the default identity, but keeps it out of the school list", () => {
    // First-time visitors (no cookie yet) get Vocation's own mark, not one
    // school's branding. It must resolve via getSchoolById so layout.tsx and
    // every consumer can render it like any other School, but it must NOT be
    // selectable from the dropdown, since it isn't a real school.
    const fallback = getSchoolById(DEFAULT_SCHOOL_ID);
    expect(fallback?.name).toBe("Vocation");
    expect(fallback?.logo).toBeTruthy();
    expect(FLORIDA_SCHOOLS.find((s) => s.id === DEFAULT_SCHOOL_ID)).toBeUndefined();
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
