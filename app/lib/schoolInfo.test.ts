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

  it("falls back to MDC's info for an unknown school id", () => {
    // Every school in floridaSchools.ts is curated now, so the fallback only
    // fires for an id that isn't a school at all (a stale cookie, say).
    const unknown = getSchoolInfo("not-a-real-school");
    const mdc = getSchoolInfo("mdc");
    expect(unknown).toEqual(mdc);
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

describe("school info coverage", () => {
  // Every school got its links read off its own site (2026-07-25). These guard
  // the shape of that data, not its accuracy — a link rotting is something
  // only a human revisiting the site can catch.
  const ALL_IDS = FLORIDA_SCHOOLS.map((s) => s.id);

  it("curates every school in floridaSchools.ts", () => {
    expect(ALL_IDS).toHaveLength(61);
    for (const id of ALL_IDS) {
      expect(hasSchoolInfo(id), `${id} should have its own entry`).toBe(true);
    }
  });

  it("gives each school a site link and a programs page", () => {
    for (const id of ALL_IDS) {
      const info = getSchoolInfo(id);
      const labels = info.resources.map((r) => r.label);
      // The first entry is always the school's own site; a programs page is
      // always present. An advising page is not — a handful of schools
      // publish none, and a made-up link is worse than a missing one. Labels
      // beyond those two are allowed so a link can describe what it actually
      // is (Bethune-Cookman's is military & veteran services, not advising).
      expect(labels.length, id).toBeGreaterThanOrEqual(2);
      expect(labels).toContain("Degree Programs");
      for (const l of labels) expect(l.length, id).toBeGreaterThan(0);
      for (const r of info.resources) expect(r.url, `${id} ${r.label}`).toMatch(/^https:\/\//);
    }
  });

  it("uses https and a plausible address for every link and contact", () => {
    for (const id of ALL_IDS) {
      const info = getSchoolInfo(id);
      if (info.accessibilityUrl) {
        expect(info.accessibilityUrl, id).toMatch(/^https:\/\//);
      }
      if (info.transferAgreementsUrl) {
        expect(info.transferAgreementsUrl, id).toMatch(/^https:\/\//);
      }
      // contacts may legitimately be empty - inventing an address would be
      // worse than leaving it out.
      for (const c of info.contacts) {
        expect(c.email, `${id} ${c.label}`).toMatch(/^\S+@\S+\.\S+$/);
        expect(c.label.length, `${id}`).toBeGreaterThan(0);
      }
    }
  });

  it("never points an accessibility link at a web-accessibility policy page", () => {
    // FAMU and UNF both serve a /accessibility/ page that is a web content
    // policy, not the office that arranges student accommodations. Linking
    // those would send a student needing accommodations to the wrong place.
    expect(getSchoolInfo("famu").accessibilityUrl).toContain(
      "center-for-disability-access-and-resources"
    );
    expect(getSchoolInfo("unf").accessibilityUrl).toContain("/sac/");
    expect(getSchoolInfo("uf").accessibilityUrl).toBe("https://disability.ufl.edu/");
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
    expect(hasSchoolInfo("ucf")).toBe(true);
    expect(hasSchoolInfo("miami")).toBe(true);
    expect(hasSchoolInfo("not-a-real-school")).toBe(false);
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
