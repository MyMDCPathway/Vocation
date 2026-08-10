import { describe, it, expect } from "vitest";
import {
  ARCHETYPE_PROFILES,
  DEFAULT_ARCHETYPE,
  ROUTE_ARCHETYPES,
  archetypeProfile,
  usesCollegeCatalog,
} from "@/app/lib/routeArchetype";

// This file exists because the app confidently handed a welder a list of
// universities. That's not a missing feature — it's a wrong answer, and the
// tests below are mostly about the routes where "go to college" is wrong.

describe("archetypeProfile", () => {
  it("returns the matching profile for every known archetype", () => {
    for (const id of ROUTE_ARCHETYPES) {
      expect(archetypeProfile(id).id, id).toBe(id);
    }
  });

  it("falls back rather than throwing on anything unrecognised", () => {
    // The model is enum-constrained, but the fallback is what makes that a
    // guarantee instead of a hope — and old cached entries have no value at
    // all.
    expect(archetypeProfile(undefined).id).toBe(DEFAULT_ARCHETYPE);
    expect(archetypeProfile("").id).toBe(DEFAULT_ARCHETYPE);
    expect(archetypeProfile("vocational-ish").id).toBe(DEFAULT_ARCHETYPE);
    expect(archetypeProfile("DEGREE").id).toBe(DEFAULT_ARCHETYPE);
  });

  it("defaults to degree, the recoverable wrong answer", () => {
    // Showing a degree path for a job that doesn't need one gives the student
    // an expensive option they can decline. Telling a future surgeon they can
    // start tomorrow does not fail safe.
    expect(DEFAULT_ARCHETYPE).toBe("degree");
  });
});

describe("usesCollegeCatalog", () => {
  // The catalog is 53 Florida COLLEGES. Merging it into a route that doesn't
  // run through one is the original bug.

  it("is off for the routes that don't go through a college", () => {
    expect(usesCollegeCatalog("apprenticeship")).toBe(false);
    expect(usesCollegeCatalog("certification")).toBe(false);
    expect(usesCollegeCatalog("enlistment")).toBe(false);
    expect(usesCollegeCatalog("talent")).toBe(false);
    expect(usesCollegeCatalog("direct-entry")).toBe(false);
  });

  it("is on for degree and credential, which genuinely do", () => {
    // A nurse or dental hygienist earns their credential at a college, so the
    // scraped catalogs are the right source there.
    expect(usesCollegeCatalog("degree")).toBe(true);
    expect(usesCollegeCatalog("credential")).toBe(true);
  });

  it("is on for an unknown route, matching the degree fallback", () => {
    expect(usesCollegeCatalog(undefined)).toBe(true);
  });
});

describe("every profile is complete enough to render", () => {
  // Each of these strings goes straight onto a screen or into a prompt. An
  // empty one is a blank question or an instruction that says nothing.
  it.each(ROUTE_ARCHETYPES)("%s has usable copy", (id) => {
    const profile = ARCHETYPE_PROFILES[id];
    for (const [field, value] of Object.entries(profile)) {
      if (typeof value !== "string") continue;
      expect(value.trim().length, `${id}.${field}`).toBeGreaterThan(0);
    }
  });

  it("keys each profile under its own id", () => {
    for (const id of ROUTE_ARCHETYPES) {
      expect(ARCHETYPE_PROFILES[id].id).toBe(id);
    }
  });

  it("tells the model something route-specific to look for", () => {
    // discoveryTarget is interpolated into the discovery prompt. Two routes
    // sharing one would return the same providers for both.
    const targets = ROUTE_ARCHETYPES.map(
      (id) => ARCHETYPE_PROFILES[id].discoveryTarget
    );
    expect(new Set(targets).size).toBe(targets.length);
  });

  it("never tells an apprenticeship route to look for universities", () => {
    const target = ARCHETYPE_PROFILES.apprenticeship.discoveryTarget.toLowerCase();
    expect(target).toContain("apprentice");
    expect(target).not.toContain("universit");
  });
});
