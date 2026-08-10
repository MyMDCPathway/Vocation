import { describe, it, expect } from "vitest";
import {
  distanceMiles,
  distanceToSchool,
  ELSEWHERE_REGION_ID,
  FLORIDA_REGIONS,
  SCHOOL_COORDINATES,
  schoolsNearestTo,
} from "@/app/lib/geography";
import { FLORIDA_SCHOOLS } from "@/app/lib/floridaSchools";
import { SCHOOLS_WITH_CATALOG } from "@/app/lib/schoolCatalogs";

// Invariants, not examples. A test asserting "MDC is at 25.774, -80.194" would
// pass forever and catch nothing; "every school we can plan against has usable
// coordinates" is what actually breaks when someone adds a school.

// Generous enough to hold every corner of the state (Pensacola to Key West)
// without admitting a sign error or a transposed lat/lng, which is the failure
// mode that matters — a flipped pair puts a school in the Indian Ocean and
// silently makes it "nearest" to nothing.
const FLORIDA_BOUNDS = { minLat: 24.4, maxLat: 31.1, minLng: -87.7, maxLng: -79.9 };

describe("school coordinates", () => {
  it("covers every school that can generate a pathway", () => {
    const missing = SCHOOLS_WITH_CATALOG.filter((id) => !SCHOOL_COORDINATES[id]);
    expect(missing, `no coordinates for: ${missing.join(", ")}`).toEqual([]);
  });

  it("covers every school in the selector", () => {
    const missing = FLORIDA_SCHOOLS.filter((s) => !SCHOOL_COORDINATES[s.id]).map(
      (s) => s.id
    );
    expect(missing, `no coordinates for: ${missing.join(", ")}`).toEqual([]);
  });

  it("places every school inside Florida", () => {
    for (const [id, coords] of Object.entries(SCHOOL_COORDINATES)) {
      expect(coords.lat, `${id} latitude`).toBeGreaterThan(FLORIDA_BOUNDS.minLat);
      expect(coords.lat, `${id} latitude`).toBeLessThan(FLORIDA_BOUNDS.maxLat);
      expect(coords.lng, `${id} longitude`).toBeGreaterThan(FLORIDA_BOUNDS.minLng);
      expect(coords.lng, `${id} longitude`).toBeLessThan(FLORIDA_BOUNDS.maxLng);
    }
  });

  it("has no entry for a school the selector doesn't list", () => {
    const known = new Set(FLORIDA_SCHOOLS.map((s) => s.id));
    const orphans = Object.keys(SCHOOL_COORDINATES).filter((id) => !known.has(id));
    expect(orphans, `not in FLORIDA_SCHOOLS: ${orphans.join(", ")}`).toEqual([]);
  });
});

describe("regions", () => {
  it("places every region inside Florida", () => {
    for (const region of FLORIDA_REGIONS) {
      expect(region.center.lat, region.id).toBeGreaterThan(FLORIDA_BOUNDS.minLat);
      expect(region.center.lat, region.id).toBeLessThan(FLORIDA_BOUNDS.maxLat);
      expect(region.center.lng, region.id).toBeGreaterThan(FLORIDA_BOUNDS.minLng);
      expect(region.center.lng, region.id).toBeLessThan(FLORIDA_BOUNDS.maxLng);
    }
  });

  it("uses unique ids that never collide with the outside-Florida answer", () => {
    const ids = FLORIDA_REGIONS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain(ELSEWHERE_REGION_ID);
  });

  it("puts at least one plannable school within 60 miles of every region", () => {
    // A region no school serves would render a "closest to home" card for a
    // school two hours away without saying so.
    for (const region of FLORIDA_REGIONS) {
      const nearest = schoolsNearestTo(region.id, SCHOOLS_WITH_CATALOG)[0];
      const miles = distanceToSchool(region.id, nearest);
      expect(miles, `${region.label} → ${nearest}`).toBeLessThan(60);
    }
  });
});

describe("distanceMiles", () => {
  it("is zero for a point and itself", () => {
    const miami = SCHOOL_COORDINATES.mdc;
    expect(distanceMiles(miami, miami)).toBe(0);
  });

  it("is symmetric", () => {
    const a = distanceMiles(SCHOOL_COORDINATES.mdc, SCHOOL_COORDINATES.uwf);
    const b = distanceMiles(SCHOOL_COORDINATES.uwf, SCHOOL_COORDINATES.mdc);
    expect(a).toBeCloseTo(b, 6);
  });

  it("matches a known long distance across the state", () => {
    // Miami to Pensacola is ~540 statute miles great-circle. Note that's well
    // short of the ~660-mile drive — the whole panhandle bends west, so road
    // distance and straight-line distance diverge hard here. This asserts the
    // straight-line figure, which is what ranks schools.
    const miles = distanceMiles(SCHOOL_COORDINATES.mdc, SCHOOL_COORDINATES.uwf);
    expect(miles).toBeGreaterThan(510);
    expect(miles).toBeLessThan(570);
  });
});

describe("schoolsNearestTo", () => {
  it("returns a school in the same metro first", () => {
    expect(schoolsNearestTo("miami-dade", SCHOOLS_WITH_CATALOG)[0]).toBe("mdc");
    expect(schoolsNearestTo("orlando", SCHOOLS_WITH_CATALOG)[0]).toBe("valencia");
  });

  it("sorts strictly by increasing distance", () => {
    const sorted = schoolsNearestTo("tampa-bay", SCHOOLS_WITH_CATALOG);
    const distances = sorted.map((id) => distanceToSchool("tampa-bay", id)!);
    for (let i = 1; i < distances.length; i++) {
      expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
    }
  });

  it("returns the candidates unchanged for a region it can't place", () => {
    // Not a silent reordering that looks distance-ranked and isn't.
    const candidates = ["uf", "mdc", "usf"];
    expect(schoolsNearestTo(ELSEWHERE_REGION_ID, candidates)).toEqual(candidates);
  });

  it("does not mutate the array it was given", () => {
    const candidates = ["uwf", "mdc", "ucf"];
    schoolsNearestTo("miami-dade", candidates);
    expect(candidates).toEqual(["uwf", "mdc", "ucf"]);
  });

  it("sorts a school with no coordinates last rather than to distance zero", () => {
    const sorted = schoolsNearestTo("miami-dade", ["not-a-school", "mdc"]);
    expect(sorted[sorted.length - 1]).toBe("not-a-school");
  });
});

describe("distanceToSchool", () => {
  it("returns null rather than a number when either end is unknown", () => {
    expect(distanceToSchool(ELSEWHERE_REGION_ID, "mdc")).toBeNull();
    expect(distanceToSchool("miami-dade", "not-a-school")).toBeNull();
  });
});
