import { describe, it, expect } from "vitest";
import {
  fastestGrowingOccupations,
  mostNewJobsOccupations,
  projectionsMeta,
} from "@/app/lib/projections";

// Against the real committed data/projections.json — there's no swappable
// snapshot here the way scorecard.ts has one, because this file has no
// matching/joining logic to isolate from the data; it's a straight read of
// two committed tables. These assertions are about shape and BLS's own
// published ordering, not about specific figures that would go stale the
// next time someone refreshes the snapshot per its own "note" field.

describe("projectionsMeta", () => {
  it("reports real BLS provenance, not a placeholder", () => {
    const meta = projectionsMeta();
    expect(meta.source).toContain("Bureau of Labor Statistics");
    expect(meta.sourceUrls.length).toBeGreaterThan(0);
    expect(meta.projectionPeriod).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe("fastestGrowingOccupations", () => {
  it("returns every row when called with no limit", () => {
    const rows = fastestGrowingOccupations();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.occupation.length).toBeGreaterThan(0);
      expect(row.growthRatePercent).toBeGreaterThan(0);
      expect(row.medianPay2024).toBeGreaterThan(0);
    }
  });

  it("respects limit", () => {
    expect(fastestGrowingOccupations(5)).toHaveLength(5);
  });

  it("is sorted by growth rate descending, as BLS published it", () => {
    const rows = fastestGrowingOccupations();
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].growthRatePercent).toBeGreaterThanOrEqual(rows[i].growthRatePercent);
    }
  });
});

describe("mostNewJobsOccupations", () => {
  it("returns every row when called with no limit", () => {
    const rows = mostNewJobsOccupations();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.occupation.length).toBeGreaterThan(0);
      expect(row.newJobs).toBeGreaterThan(0);
      expect(row.medianPay2024).toBeGreaterThan(0);
    }
  });

  it("respects limit", () => {
    expect(mostNewJobsOccupations(5)).toHaveLength(5);
  });

  it("is sorted by new jobs descending, as BLS published it", () => {
    const rows = mostNewJobsOccupations();
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].newJobs).toBeGreaterThanOrEqual(rows[i].newJobs);
    }
  });
});
