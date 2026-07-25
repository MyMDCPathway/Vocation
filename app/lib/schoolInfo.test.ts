import { describe, it, expect } from "vitest";
import { getSchoolInfo, hasSchoolInfo } from "@/app/lib/schoolInfo";
import { FLORIDA_SCHOOLS } from "@/app/lib/floridaSchools";

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
    // Schools in floridaSchools.ts with no dedicated footer data yet — the
    // state universities and privates, now that all 28 FCS schools are curated.
    const ucf = getSchoolInfo("ucf");
    const mdc = getSchoolInfo("mdc");
    expect(ucf).toEqual(mdc);
  });

  it("gives every school at least one resource link", () => {
    for (const id of ["mdc", "fiu", "broward"]) {
      const info = getSchoolInfo(id);
      expect(info.resources.length, id).toBeGreaterThan(0);
      expect(info.contacts.length, id).toBeGreaterThan(0);
      for (const r of info.resources) expect(r.url, id).toMatch(/^https:\/\//);
      for (const c of info.contacts) expect(c.email, id).toMatch(/^\S+@\S+\.\S+$/);
    }
  });
});

describe("Florida College System coverage", () => {
  // Every FCS school got its links read off its own site (2026-07-25). These
  // guard the shape of that data, not its accuracy — a link rotting is
  // something only a human revisiting the site can catch.
  const FCS_IDS = FLORIDA_SCHOOLS.filter((s) => s.kind === "state-college").map(
    (s) => s.id
  );

  it("curates all 28 FCS schools, none falling back to MDC", () => {
    expect(FCS_IDS).toHaveLength(28);
    for (const id of FCS_IDS) {
      expect(hasSchoolInfo(id), `${id} should have its own entry`).toBe(true);
    }
  });

  it("gives each FCS school a site, an advising page and a programs page", () => {
    for (const id of FCS_IDS) {
      const info = getSchoolInfo(id);
      expect(info.resources.map((r) => r.label), id).toEqual([
        expect.any(String),
        "Academic Advising",
        "Degree Programs",
      ]);
      for (const r of info.resources) expect(r.url, `${id} ${r.label}`).toMatch(/^https:\/\//);
    }
  });

  it("uses https and a plausible address for every link and contact", () => {
    for (const id of FCS_IDS) {
      const info = getSchoolInfo(id);
      if (info.accessibilityUrl) {
        expect(info.accessibilityUrl, id).toMatch(/^https:\/\//);
      }
      if (info.transferAgreementsUrl) {
        expect(info.transferAgreementsUrl, id).toMatch(/^https:\/\//);
      }
      // contacts may legitimately be empty - several schools publish no
      // central advising address, and inventing one would be worse.
      for (const c of info.contacts) {
        expect(c.email, `${id} ${c.label}`).toMatch(/^\S+@\S+\.\S+$/);
        expect(c.label.length, `${id}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("the default (no school selected) identity", () => {
  it("points at Vocation's own contact and the state DOE, not MDC's", () => {
    // The pre-selection identity must not silently inherit MDC's info the way
    // an uncatalogued school does - that would misleadingly look like MDC had
    // already been chosen.
    const info = getSchoolInfo("default");
    expect(info.contacts).toEqual([
      { label: "Vocation", email: "chrisorozco305@gmail.com" },
    ]);
    expect(info.resources).toEqual([
      { label: "Florida Department of Education", url: "https://www.fldoe.org/" },
    ]);
    expect(info.accessibilityUrl).toBeNull();
  });

  it("is a curated entry, not a fallback", () => {
    expect(hasSchoolInfo("default")).toBe(true);
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
