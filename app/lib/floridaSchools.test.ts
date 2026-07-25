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
});
