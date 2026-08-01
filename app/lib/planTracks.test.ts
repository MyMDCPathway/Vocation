import { describe, it, expect } from "vitest";
import { annualUsdMidpoint, resolveTracks } from "@/app/lib/planTracks";
import { NO_MOBILITY, type IntakeAnswers } from "@/app/lib/intake";
import type { SchoolRef } from "@/app/lib/schoolRef";

// A complete intake, so each test only states the answer it's actually about.
const intake = (over: Partial<IntakeAnswers> = {}): IntakeAnswers => ({
  career: { raw: "nurse", resolved: "Registered Nurse" },
  location: { countryCode: "US", subdivision: "Florida", city: "Miami" },
  educationLevel: "hs-diploma",
  support: "dependent",
  incomeBand: "30-60k",
  desiredSchools: [],
  schoolsAnswered: true,
  budgetPriority: "balanced",
  mobility: NO_MOBILITY,
  ...over,
});

const catalogSchool = (over: Partial<SchoolRef> = {}): SchoolRef => ({
  id: "mdc",
  name: "Miami Dade College",
  city: "Miami",
  subdivision: "Florida",
  countryCode: "US",
  kind: "state-college",
  source: "catalog",
  distanceMiles: 0,
  ...over,
});

const openSchool = (over: Partial<SchoolRef> = {}): SchoolRef => ({
  id: "open:harvard-university",
  name: "Harvard University",
  city: "Cambridge",
  subdivision: "Massachusetts",
  countryCode: "US",
  kind: "private",
  source: "ai",
  website: "https://www.harvard.edu",
  programsUrl: "https://college.harvard.edu/academics/fields-study",
  tuition: {
    low: 56000,
    high: 60000,
    currency: "USD",
    usdLow: 56000,
    usdHigh: 60000,
  },
  distanceMiles: null,
  ...over,
});

describe("resolveTracks — degenerate input", () => {
  it("returns a note rather than throwing when no career was given", () => {
    const result = resolveTracks({}, [catalogSchool()]);
    expect(result.tracks).toEqual([]);
    expect(result.notes.length).toBeGreaterThan(0);
  });

  it("returns a note rather than throwing when no schools were found", () => {
    const result = resolveTracks(intake(), []);
    expect(result.tracks).toEqual([]);
    expect(result.notes.join(" ")).toContain("couldn't find schools");
  });
});

describe("resolveTracks — picking", () => {
  const nearby = catalogSchool({ id: "mdc", distanceMiles: 0 });
  const far = catalogSchool({
    id: "uwf",
    name: "University of West Florida",
    city: "Pensacola",
    kind: "public-university",
    distanceMiles: 540,
  });

  it("picks the nearest school for the local track", () => {
    const result = resolveTracks(intake(), [far, nearby]);
    const local = result.tracks.find((t) => t.kind === "local");
    expect(local?.school.id).toBe("mdc");
  });

  it("picks the cheapest school for the affordable track", () => {
    // A state college beats a $56k/yr private, and must be chosen on price
    // rather than on whichever happened to come back first.
    const result = resolveTracks(intake(), [openSchool(), nearby]);
    const affordable = result.tracks.find(
      (t) => t.kind === "affordable" || t.alsoCovers.includes("affordable")
    );
    expect(affordable?.school.id).toBe("mdc");
  });

  it("honors a school the student named", () => {
    const harvard = openSchool();
    const result = resolveTracks(intake({ desiredSchools: [harvard] }), [
      nearby,
      harvard,
    ]);
    expect(result.tracks.some((t) => t.school.id === harvard.id)).toBe(true);
  });

  it("keeps a named school that dropped out of the fresh discovery list", () => {
    // Discovery is non-deterministic. A school the student explicitly picked
    // must survive not coming back the second time, or their choice silently
    // vanishes between one screen and the next.
    const harvard = openSchool();
    const result = resolveTracks(intake({ desiredSchools: [harvard] }), [nearby]);
    const desired = result.tracks.find((t) => t.kind === "desired");
    expect(desired?.school.name).toBe("Harvard University");
  });

  it("adds no desired track when the student had no preference", () => {
    const result = resolveTracks(intake({ desiredSchools: [] }), [nearby]);
    expect(result.tracks.some((t) => t.kind === "desired")).toBe(false);
  });
});

describe("resolveTracks — collapsing", () => {
  it("never shows the same school twice", () => {
    const mdc = catalogSchool();
    const result = resolveTracks(intake({ desiredSchools: [mdc] }), [mdc]);
    const ids = result.tracks.map((t) => t.school.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("records the collapsed kinds on the surviving card", () => {
    const mdc = catalogSchool();
    const result = resolveTracks(intake({ desiredSchools: [mdc] }), [mdc]);
    const card = result.tracks[0];
    expect(card.alsoCovers.length).toBeGreaterThan(0);

    const kinds = [card.kind, ...card.alsoCovers];
    expect(new Set(kinds).size).toBe(kinds.length);
  });
});

describe("resolveTracks — education level", () => {
  it("skips two-year colleges for someone who already holds a degree", () => {
    const result = resolveTracks(intake({ educationLevel: "bachelor" }), [
      catalogSchool(),
      openSchool(),
    ]);
    for (const track of result.tracks) {
      expect(track.school.kind, track.school.id).not.toBe("state-college");
    }
    expect(result.notes.join(" ")).toContain("already hold a degree");
  });

  it("treats a community college the same as a state college", () => {
    // The two names mean the same thing in different countries, and only one
    // of them appears in Florida's data.
    const result = resolveTracks(intake({ educationLevel: "bachelor" }), [
      openSchool({
        id: "open:city-college",
        name: "City College",
        kind: "community-college",
      }),
      openSchool(),
    ]);
    for (const track of result.tracks) {
      expect(track.school.kind).not.toBe("community-college");
    }
  });
});

describe("resolveTracks — ordering", () => {
  const schools = [catalogSchool(), openSchool()];

  it("leads with cost when that's what the student said matters", () => {
    const result = resolveTracks(
      intake({ budgetPriority: "lowest-cost", desiredSchools: [openSchool()] }),
      schools
    );
    expect(result.tracks[0].kind).toBe("affordable");
  });

  it("leads with the named school when the program matters more than price", () => {
    const result = resolveTracks(
      intake({ budgetPriority: "best-program", desiredSchools: [openSchool()] }),
      schools
    );
    expect(result.tracks[0].kind).toBe("desired");
  });

  it("leads with the local school when the student wants balance", () => {
    const result = resolveTracks(
      intake({ budgetPriority: "balanced", desiredSchools: [openSchool()] }),
      schools
    );
    expect(result.tracks[0].kind).toBe("local");
  });
});

describe("annualUsdMidpoint", () => {
  it("prices a catalog school from our own tables", () => {
    expect(annualUsdMidpoint(catalogSchool(), "entry")).toBeGreaterThan(0);
  });

  it("prices an AI-discovered school from its own estimate", () => {
    expect(annualUsdMidpoint(openSchool(), "entry")).toBe(58000);
  });

  it("returns null rather than zero when a school has no price", () => {
    // Zero would win the cheapest track outright. "We don't know" must not
    // read as "free".
    expect(annualUsdMidpoint(openSchool({ tuition: undefined }), "entry")).toBeNull();
  });

  it("keeps an unpriced school out of the affordable track entirely", () => {
    const unpriced = openSchool({ id: "open:mystery", tuition: undefined });
    const priced = catalogSchool();
    const result = resolveTracks(intake(), [unpriced, priced]);
    const affordable = result.tracks.find(
      (t) => t.kind === "affordable" || t.alsoCovers.includes("affordable")
    );
    expect(affordable?.school.id).toBe(priced.id);
  });

  it("says so when nothing could be priced", () => {
    const result = resolveTracks(intake(), [
      openSchool({ id: "open:a", tuition: undefined }),
    ]);
    expect(result.tracks.some((t) => t.kind === "affordable")).toBe(false);
    expect(result.notes.join(" ")).toContain("tuition figure");
  });
});
