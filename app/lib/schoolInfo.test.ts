import { describe, it, expect } from "vitest";
import { getSchoolInfo, hasSchoolInfo } from "@/app/lib/schoolInfo";

describe("getSchoolInfo", () => {
  it("returns Broward's four campus contacts", () => {
    const info = getSchoolInfo("broward");
    expect(info.contacts.map((c) => c.email)).toEqual([
      "nadvise@broward.edu",
      "cadvise1@broward.edu",
      "sadvise@broward.edu",
      "bconline@broward.edu",
    ]);
    expect(info.transferAgreementsUrl).toBe(
      "https://www.broward.edu/students/transfer-services/transfer-agreements.html"
    );
  });

  it("returns FIU's single advising contact", () => {
    const info = getSchoolInfo("fiu");
    expect(info.contacts).toEqual([{ label: "Advising", email: "fiuadvising@fiu.edu" }]);
  });

  it("falls back to MDC's info for a school with no curated entry", () => {
    // 58 of 61 schools in floridaSchools.ts have no dedicated footer data yet.
    const ucf = getSchoolInfo("ucf");
    const mdc = getSchoolInfo("mdc");
    expect(ucf).toEqual(mdc);
  });

  it("gives every school at least one resource link and one contact", () => {
    for (const id of ["mdc", "fiu", "broward"]) {
      const info = getSchoolInfo(id);
      expect(info.resources.length, id).toBeGreaterThan(0);
      expect(info.contacts.length, id).toBeGreaterThan(0);
      for (const r of info.resources) expect(r.url, id).toMatch(/^https:\/\//);
      for (const c of info.contacts) expect(c.email, id).toMatch(/^\S+@\S+\.\S+$/);
    }
  });
});

describe("hasSchoolInfo", () => {
  it("distinguishes a curated school from a fallback one", () => {
    expect(hasSchoolInfo("broward")).toBe(true);
    expect(hasSchoolInfo("fiu")).toBe(true);
    expect(hasSchoolInfo("ucf")).toBe(false);
  });
});

describe("accessibilityUrl", () => {
  it("gives every curated school its own accessibility page", () => {
    expect(getSchoolInfo("mdc").accessibilityUrl).toBe("https://www.mdc.edu/access/");
    expect(getSchoolInfo("fiu").accessibilityUrl).toBe("https://accessibility.fiu.edu/");
    expect(getSchoolInfo("broward").accessibilityUrl).toBe(
      "https://www.broward.edu/accessibility/resources.html"
    );
  });
});
