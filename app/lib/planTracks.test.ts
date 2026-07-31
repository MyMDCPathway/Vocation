import { describe, it, expect } from "vitest";
import { relevanceScore, resolveTracks } from "@/app/lib/planTracks";
import { SCHOOLS_WITH_CATALOG } from "@/app/lib/schoolCatalogs";
import { getSchoolById } from "@/app/lib/floridaSchools";
import { ELSEWHERE_REGION_ID } from "@/app/lib/geography";
import { NO_MOBILITY, type IntakeAnswers } from "@/app/lib/intake";

// A complete intake, so each test only states the answer it's actually about.
const intake = (over: Partial<IntakeAnswers> = {}): IntakeAnswers => ({
  career: { raw: "nurse", resolved: "Registered Nurse" },
  regionId: "miami-dade",
  educationLevel: "hs-diploma",
  support: "dependent",
  incomeBand: "30-60k",
  desiredSchoolIds: [],
  schoolsAnswered: true,
  budgetPriority: "balanced",
  mobility: NO_MOBILITY,
  ...over,
});

const catalogIds = new Set<string>(SCHOOLS_WITH_CATALOG);

describe("resolveTracks — the invariant that matters most", () => {
  it("never returns a school we can't actually generate against", () => {
    // A track pointing at a school with no catalog is a guaranteed error on
    // the results page, and the student would have no idea why.
    const cases: IntakeAnswers[] = [
      intake(),
      intake({ educationLevel: "bachelor" }),
      intake({ regionId: ELSEWHERE_REGION_ID }),
      intake({ desiredSchoolIds: ["eckerd"] }),
      intake({ career: { raw: "bcba", resolved: "Board Certified Behavior Analyst" } }),
      intake({ career: { raw: "welder", resolved: "Welder" }, regionId: "panhandle" }),
      intake({ budgetPriority: "lowest-cost", regionId: "keys" }),
      intake({ budgetPriority: "best-program", educationLevel: "graduate" }),
    ];

    for (const answers of cases) {
      for (const track of resolveTracks(answers).tracks) {
        expect(catalogIds.has(track.schoolId), `${track.schoolId} has no catalog`).toBe(
          true
        );
      }
    }
  });

  it("returns at least one track for every region and education level", () => {
    const regions = ["miami-dade", "panhandle", "keys", "tallahassee", "orlando"];
    const levels = ["in-high-school", "some-college", "associate", "bachelor"] as const;

    for (const regionId of regions) {
      for (const educationLevel of levels) {
        const result = resolveTracks(intake({ regionId, educationLevel }));
        expect(
          result.tracks.length,
          `${regionId} / ${educationLevel} produced no tracks`
        ).toBeGreaterThan(0);
      }
    }
  });

  it("never shows the same school twice", () => {
    const result = resolveTracks(
      intake({ desiredSchoolIds: ["mdc"], budgetPriority: "lowest-cost" })
    );
    const ids = result.tracks.map((t) => t.schoolId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("records the collapsed kinds on the surviving card", () => {
    // A Miami student who names MDC: local, cheapest, and their pick are all
    // the same school. One card, three badges — not three identical cards.
    const result = resolveTracks(intake({ desiredSchoolIds: ["mdc"] }));
    const mdc = result.tracks.find((t) => t.schoolId === "mdc");
    expect(mdc).toBeDefined();
    expect(mdc!.alsoCovers.length).toBeGreaterThan(0);

    const kinds = [mdc!.kind, ...mdc!.alsoCovers];
    expect(new Set(kinds).size).toBe(kinds.length);
  });
});

describe("resolveTracks — the local track", () => {
  it("picks a school in the student's own metro", () => {
    const miami = resolveTracks(intake({ regionId: "miami-dade" }));
    const local = miami.tracks.find((t) => t.kind === "local");
    expect(local?.distanceMiles).not.toBeNull();
    expect(local!.distanceMiles!).toBeLessThan(30);
  });

  it("moves with the student", () => {
    const miami = resolveTracks(intake({ regionId: "miami-dade" })).tracks.find(
      (t) => t.kind === "local"
    );
    const panhandle = resolveTracks(intake({ regionId: "panhandle" })).tracks.find(
      (t) => t.kind === "local"
    );
    expect(miami?.schoolId).not.toBe(panhandle?.schoolId);
  });

  it("picks a public school, not a private one", () => {
    for (const regionId of ["miami-dade", "orlando", "tampa-bay", "jacksonville"]) {
      const local = resolveTracks(intake({ regionId })).tracks.find(
        (t) => t.kind === "local"
      );
      expect(getSchoolById(local!.schoolId)?.kind, regionId).not.toBe("private");
    }
  });

  it("stays local no matter how idiosyncratic the career title is", () => {
    // Regression: "Pediatrician" matched two schools statewide — EFSC's
    // Pediatric Cardiac Sonography and SPC's Pediatric Respiratory Care —
    // and that fluke evicted every other school from the pool, so a Miami
    // student's "closest to home" came back as Cocoa, 184 miles away.
    // Proximity must never lose to a weak text match.
    const careers = [
      "Pediatrician",
      "Air Traffic Controller",
      "Registered Nurse",
      "Sommelier",
      "Zorblax Wrangler",
    ];

    for (const resolved of careers) {
      const local = resolveTracks(
        intake({ regionId: "miami-dade", career: { raw: resolved, resolved } })
      ).tracks.find((t) => t.kind === "local");

      expect(local, `no local track for ${resolved}`).toBeDefined();
      expect(local!.distanceMiles!, `${resolved} sent them ${local!.distanceMiles} mi away`).toBeLessThan(30);
    }
  });

  it("picks the same nearby school regardless of career", () => {
    // The local track answers "what's near me", which does not depend on what
    // you want to be. Two very different careers must not move it.
    const forNurse = resolveTracks(
      intake({ career: { raw: "nurse", resolved: "Registered Nurse" } })
    ).tracks.find((t) => t.kind === "local");
    const forWelder = resolveTracks(
      intake({ career: { raw: "welder", resolved: "Welder" } })
    ).tracks.find((t) => t.kind === "local");

    expect(forNurse!.schoolId).toBe(forWelder!.schoolId);
  });

  it("drops the local track outside Florida and says why", () => {
    const result = resolveTracks(intake({ regionId: ELSEWHERE_REGION_ID }));
    expect(result.tracks.some((t) => t.kind === "local")).toBe(false);
    expect(result.notes.join(" ")).toContain("outside Florida");
  });
});

describe("resolveTracks — the affordable track", () => {
  it("picks a state college for a student who hasn't started college", () => {
    const cheap = resolveTracks(intake({ educationLevel: "hs-diploma" })).tracks.find(
      (t) => t.kind === "affordable" || t.alsoCovers.includes("affordable")
    );
    expect(getSchoolById(cheap!.schoolId)?.kind).toBe("state-college");
  });

  it("skips two-year colleges for someone who already holds a degree", () => {
    const result = resolveTracks(intake({ educationLevel: "bachelor" }));
    for (const track of result.tracks) {
      expect(getSchoolById(track.schoolId)?.kind, track.schoolId).not.toBe(
        "state-college"
      );
    }
    expect(result.notes.join(" ")).toContain("already hold a degree");
  });

  it("breaks a statutory-rate tie by distance rather than alphabetically", () => {
    // Every state college charges the same, so without the distance tiebreak
    // this returns whichever happens to sort first for everyone in Florida.
    const miami = resolveTracks(
      intake({ regionId: "miami-dade", budgetPriority: "lowest-cost" })
    ).tracks[0];
    const jax = resolveTracks(
      intake({ regionId: "jacksonville", budgetPriority: "lowest-cost" })
    ).tracks[0];
    expect(miami.schoolId).not.toBe(jax.schoolId);
  });
});

describe("resolveTracks — the desired track", () => {
  it("honors a school the student named", () => {
    const result = resolveTracks(intake({ desiredSchoolIds: ["uf"] }));
    expect(result.tracks.some((t) => t.schoolId === "uf")).toBe(true);
  });

  it("explains a named school we hold no catalog for instead of dropping it silently", () => {
    const result = resolveTracks(intake({ desiredSchoolIds: ["eckerd"] }));
    expect(result.tracks.some((t) => t.schoolId === "eckerd")).toBe(false);
    expect(result.notes.join(" ")).toContain("Eckerd College");
  });

  it("falls through to a named school that does have a catalog", () => {
    const result = resolveTracks(intake({ desiredSchoolIds: ["eckerd", "usf"] }));
    expect(result.tracks.some((t) => t.schoolId === "usf")).toBe(true);
  });

  it("adds no desired track when the student had no preference", () => {
    const result = resolveTracks(intake({ desiredSchoolIds: [] }));
    expect(result.tracks.some((t) => t.kind === "desired")).toBe(false);
  });
});

describe("resolveTracks — ordering", () => {
  it("leads with cost when that's what the student said matters", () => {
    const result = resolveTracks(
      intake({ budgetPriority: "lowest-cost", desiredSchoolIds: ["miami"] })
    );
    expect(result.tracks[0].kind).toBe("affordable");
  });

  it("leads with the named school when the program matters more than price", () => {
    const result = resolveTracks(
      intake({ budgetPriority: "best-program", desiredSchoolIds: ["miami"] })
    );
    expect(result.tracks[0].kind).toBe("desired");
  });

  it("leads with the local school when the student wants balance", () => {
    const result = resolveTracks(
      intake({ budgetPriority: "balanced", desiredSchoolIds: ["miami"] })
    );
    expect(result.tracks[0].kind).toBe("local");
  });
});

describe("resolveTracks — degenerate input", () => {
  it("returns a note rather than throwing when no career was given", () => {
    const result = resolveTracks({});
    expect(result.tracks).toEqual([]);
    expect(result.notes.length).toBeGreaterThan(0);
  });

  it("still plans when the career matches no program name anywhere", () => {
    // The relevance filter must degrade to "rank by distance and price", not
    // to an empty page. Job titles routinely share no word with any degree.
    const result = resolveTracks(
      intake({ career: { raw: "zorblax", resolved: "Zorblax Wrangler" } })
    );
    expect(result.tracks.length).toBeGreaterThan(0);
  });
});

describe("relevanceScore", () => {
  it("connects a job title to the degree that shares its stem", () => {
    // "nurse" → "Nursing" is the whole reason this uses prefixes and not
    // exact matching.
    expect(relevanceScore("mdc", "Registered Nurse")).toBeGreaterThan(0);
  });

  it("scores a school that teaches the subject above one that doesn't", () => {
    // Florida Poly is STEM-only, so it must not outrank a school with a real
    // nursing program when the career is nursing.
    expect(relevanceScore("usf", "Registered Nurse")).toBeGreaterThan(
      relevanceScore("flpoly", "Registered Nurse")
    );
  });

  it("ignores filler words in a job title", () => {
    // Scoring "registered" or "certified" would match half of every catalog.
    expect(relevanceScore("flpoly", "Certified Registered Professional")).toBe(0);
  });

  it("returns zero rather than throwing for a school with no catalog", () => {
    expect(relevanceScore("eckerd", "Registered Nurse")).toBe(0);
  });

  it("fires broadly for a real field and barely at all for a fluke", () => {
    // This gap is what MIN_RELEVANT_SCHOOLS keys off. If "Pediatrician" ever
    // starts matching widely, or "Registered Nurse" stops, the threshold is
    // filtering on something other than what it thinks it is.
    const scoring = (career: string) =>
      SCHOOLS_WITH_CATALOG.filter((id) => relevanceScore(id, career) > 0).length;

    expect(scoring("Registered Nurse")).toBeGreaterThan(20);
    expect(scoring("Pediatrician")).toBeLessThan(5);
  });
});
