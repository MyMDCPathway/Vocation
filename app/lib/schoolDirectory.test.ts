import { describe, it, expect, afterEach } from "vitest";
import { listDirectorySchools, sortDirectorySchools } from "@/app/lib/schoolDirectory";
import { _setSnapshotForTests } from "@/app/lib/scorecard";
import { FLORIDA_SCHOOLS } from "@/app/lib/floridaSchools";
import { SCHOOLS_WITH_CATALOG } from "@/app/lib/schoolCatalogs";

afterEach(() => {
  _setSnapshotForTests(null);
});

describe("listDirectorySchools", () => {
  it("returns every school in floridaSchools.ts, no more, no fewer", () => {
    const schools = listDirectorySchools();
    expect(schools.length).toBe(FLORIDA_SCHOOLS.length);
    expect(schools.map((s) => s.id).sort()).toEqual(FLORIDA_SCHOOLS.map((s) => s.id).sort());
  });

  it("marks catalog schools correctly", () => {
    const schools = listDirectorySchools();
    const mdc = schools.find((s) => s.id === "mdc")!;
    expect(mdc.hasCatalog).toBe(true);
    expect(SCHOOLS_WITH_CATALOG).toContain("mdc");
  });

  it("leaves scorecard undefined when no snapshot is loaded (the honest placeholder state)", () => {
    // data/scorecard.json now holds a real committed Florida pull, so the
    // "nothing loaded" case is set explicitly here rather than assumed from
    // the file's current content — see the "joins a real Scorecard row"
    // test below for the now-real, non-empty case.
    _setSnapshotForTests({
      fetchedAt: null,
      source: "test",
      scope: "none",
      count: 0,
      schools: [],
    });
    const schools = listDirectorySchools();
    expect(schools.every((s) => s.scorecard === undefined)).toBe(true);
  });

  it("joins real committed Scorecard data onto MDC", () => {
    // Against the actual data/scorecard.json — no _setSnapshotForTests here.
    // If this ever fails, either the committed file went back to empty or
    // Miami Dade College's name stopped matching its Scorecard row exactly.
    const schools = listDirectorySchools();
    const mdc = schools.find((s) => s.id === "mdc")!;
    expect(mdc.scorecard).toBeDefined();
    expect(mdc.scorecard!.medianEarnings10yr).toBeGreaterThan(0);
  });

  it("leaves distanceMiles null without an origin", () => {
    const schools = listDirectorySchools();
    expect(schools.every((s) => s.distanceMiles === null)).toBe(true);
  });

  it("computes a plausible distance from a real origin (MDC is in Miami)", () => {
    // Miami's own coordinates — MDC's distance from itself should be ~0.
    const schools = listDirectorySchools({ lat: 25.774, lng: -80.194 });
    const mdc = schools.find((s) => s.id === "mdc")!;
    expect(mdc.distanceMiles).not.toBeNull();
    expect(mdc.distanceMiles!).toBeLessThan(1);

    // UF is in Gainesville, roughly 330 miles from Miami by air.
    const uf = schools.find((s) => s.id === "uf")!;
    expect(uf.distanceMiles!).toBeGreaterThan(250);
    expect(uf.distanceMiles!).toBeLessThan(400);
  });

  it("joins a real Scorecard row onto its matching school", () => {
    _setSnapshotForTests({
      fetchedAt: "2026-08-07",
      source: "test",
      scope: "FL",
      count: 1,
      schools: [
        {
          unitId: 1,
          name: "Miami Dade College",
          city: "Miami",
          state: "FL",
          zip: "33132",
          ownership: 1,
          website: "mdc.edu",
          latitude: 25.77,
          longitude: -80.19,
          studentSize: 50000,
          admissionRate: null,
          completionRate: 0.31,
          medianEarnings10yr: 38000,
          netPrice: 7000,
        },
      ],
    });
    const schools = listDirectorySchools();
    const mdc = schools.find((s) => s.id === "mdc")!;
    expect(mdc.scorecard?.medianEarnings10yr).toBe(38000);
  });
});

describe("sortDirectorySchools", () => {
  it("sorts by distance ascending, missing values last", () => {
    const schools = listDirectorySchools({ lat: 25.774, lng: -80.194 });
    const sorted = sortDirectorySchools(schools, "distance");
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].distanceMiles).not.toBeNull();
      expect(sorted[i - 1].distanceMiles!).toBeLessThanOrEqual(sorted[i].distanceMiles!);
    }
  });

  it("sorts by earnings descending and never fabricates a value for a school with none", () => {
    _setSnapshotForTests({
      fetchedAt: "2026-08-07",
      source: "test",
      scope: "FL",
      count: 1,
      schools: [
        {
          unitId: 1,
          name: "Miami Dade College",
          city: "Miami",
          state: "FL",
          zip: "33132",
          ownership: 1,
          website: "mdc.edu",
          latitude: 25.77,
          longitude: -80.19,
          studentSize: 50000,
          admissionRate: null,
          completionRate: 0.31,
          medianEarnings10yr: 38000,
          netPrice: 7000,
        },
      ],
    });
    const sorted = sortDirectorySchools(listDirectorySchools(), "earnings");
    // Only MDC has a real figure — it must lead, and every school after it
    // must have scorecard === undefined (never a synthesized number).
    expect(sorted[0].id).toBe("mdc");
    expect(sorted.slice(1).every((s) => s.scorecard === undefined)).toBe(true);
  });

  it("sorts by name alphabetically", () => {
    const sorted = sortDirectorySchools(listDirectorySchools(), "name");
    const names = sorted.map((s) => s.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});
