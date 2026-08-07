import { describe, it, expect, afterEach } from "vitest";
import {
  scorecardAvailable,
  scorecardMeta,
  getScorecardByUnitId,
  listScorecardByState,
  findScorecardMatch,
  _setSnapshotForTests,
} from "@/app/lib/scorecard";

const FIXTURE = {
  fetchedAt: "2026-08-07",
  source: "US Dept. of Education College Scorecard API (collegescorecard.ed.gov)",
  scope: "FL",
  count: 3,
  schools: [
    {
      unitId: 1,
      name: "Test State College",
      city: "Testville",
      state: "FL",
      zip: "00000",
      ownership: 1,
      website: "test.edu",
      latitude: 25.0,
      longitude: -80.0,
      studentSize: 12000,
      admissionRate: 0.65,
      completionRate: 0.42,
      medianEarnings10yr: 45000,
      netPrice: 9000,
    },
    {
      unitId: 2,
      name: "Test State College",
      city: "Other City",
      state: "GA",
      zip: "11111",
      ownership: 1,
      website: "other.edu",
      latitude: 33.0,
      longitude: -84.0,
      studentSize: 8000,
      admissionRate: 0.7,
      completionRate: 0.38,
      medianEarnings10yr: 41000,
      netPrice: 8500,
    },
    {
      unitId: 3,
      name: "Ambiguous University",
      city: "Testville",
      state: "FL",
      zip: "00001",
      ownership: 2,
      website: "ambiguous.edu",
      latitude: 25.1,
      longitude: -80.1,
      studentSize: 3000,
      admissionRate: 0.5,
      completionRate: 0.6,
      medianEarnings10yr: 52000,
      netPrice: 20000,
    },
    {
      unitId: 4,
      name: "Ambiguous University",
      city: "Second Campus",
      state: "FL",
      zip: "00002",
      ownership: 2,
      website: "ambiguous.edu",
      latitude: 25.2,
      longitude: -80.2,
      studentSize: 1500,
      admissionRate: 0.55,
      completionRate: 0.58,
      medianEarnings10yr: 50000,
      netPrice: 19000,
    },
  ],
};

afterEach(() => {
  _setSnapshotForTests(null);
});

describe("scorecardAvailable", () => {
  it("is false against the committed placeholder (no key run yet)", () => {
    // The real data/scorecard.json is the honest empty file until someone
    // runs fetch-scorecard.mjs with a real key — see that file's own note.
    expect(scorecardAvailable()).toBe(false);
  });

  it("is true once a real snapshot is loaded", () => {
    _setSnapshotForTests(FIXTURE);
    expect(scorecardAvailable()).toBe(true);
  });
});

describe("scorecardMeta", () => {
  it("always carries provenance, even when empty", () => {
    const meta = scorecardMeta();
    expect(meta.source).toMatch(/College Scorecard/);
    expect(meta.count).toBe(0);
  });
});

describe("getScorecardByUnitId", () => {
  it("finds a school by its IPEDS id", () => {
    _setSnapshotForTests(FIXTURE);
    expect(getScorecardByUnitId(1)?.name).toBe("Test State College");
  });

  it("returns undefined for an id with no row", () => {
    _setSnapshotForTests(FIXTURE);
    expect(getScorecardByUnitId(999)).toBeUndefined();
  });
});

describe("listScorecardByState", () => {
  it("filters to the requested state only, case-insensitively", () => {
    _setSnapshotForTests(FIXTURE);
    const fl = listScorecardByState("fl");
    expect(fl.map((s) => s.unitId).sort()).toEqual([1, 3, 4]);
  });
});

describe("findScorecardMatch", () => {
  it("joins a name to its real Scorecard row within the given state", () => {
    _setSnapshotForTests(FIXTURE);
    const match = findScorecardMatch("Test State College", "FL");
    expect(match?.unitId).toBe(1);
  });

  it("never crosses state lines even when the name matches exactly", () => {
    // Same literal name exists in FL (id 1) and GA (id 2). Restricting to FL
    // must return only the FL row, not either-or.
    _setSnapshotForTests(FIXTURE);
    const match = findScorecardMatch("Test State College", "GA");
    expect(match?.unitId).toBe(2);
  });

  it("is tolerant of case and punctuation differences", () => {
    _setSnapshotForTests(FIXTURE);
    const match = findScorecardMatch("  test STATE, college  ", "FL");
    expect(match?.unitId).toBe(1);
  });

  it("refuses to guess when two real rows share a name in the same state", () => {
    // Two campuses of "Ambiguous University" both sit in FL. Rule 1 says a
    // wrong match is worse than no match — this must return undefined, not
    // arbitrarily pick the first one.
    _setSnapshotForTests(FIXTURE);
    expect(findScorecardMatch("Ambiguous University", "FL")).toBeUndefined();
  });

  it("returns undefined for a name with no match at all", () => {
    _setSnapshotForTests(FIXTURE);
    expect(findScorecardMatch("Nonexistent University", "FL")).toBeUndefined();
  });
});
