import { describe, it, expect } from "vitest";
import {
  listCuratedInterests,
  listAllIndustries,
  getInterestDetail,
  CURATED_INTERESTS,
  SOC_MAJOR_GROUPS,
} from "@/app/lib/interests";

describe("listCuratedInterests", () => {
  it("returns all six curated tiles with a positive job count", () => {
    const interests = listCuratedInterests();
    expect(interests).toHaveLength(CURATED_INTERESTS.length);
    for (const interest of interests) {
      expect(interest.jobCount).toBeGreaterThan(0);
    }
  });

  it("never double-counts a job across two curated interests", () => {
    // Each curated interest's SOC groups must be disjoint from every other's —
    // otherwise a job would appear under two different "interests", which
    // would make the counts on the homepage lie about the total pool size.
    const seen = new Set<string>();
    for (const interest of CURATED_INTERESTS) {
      for (const group of interest.groups) {
        expect(seen.has(group)).toBe(false);
        seen.add(group);
      }
    }
  });
});

describe("listAllIndustries", () => {
  it("covers every SOC major group BLS defines", () => {
    const industries = listAllIndustries();
    expect(industries).toHaveLength(Object.keys(SOC_MAJOR_GROUPS).length);
    for (const industry of industries) {
      expect(industry.jobCount).toBeGreaterThan(0);
    }
  });
});

describe("getInterestDetail", () => {
  it("resolves a curated slug to real, uniquely-coded BLS jobs", () => {
    const detail = getInterestDetail("healthcare");
    expect(detail).not.toBeNull();
    expect(detail!.jobs.length).toBeGreaterThan(0);
    expect(detail!.jobs.some((j) => j.title === "Registered Nurses")).toBe(true);
    // Every job's own SOC code must actually belong to one of the interest's
    // declared groups — proof the filter matches on the job's real code, not
    // some other signal.
    const interest = CURATED_INTERESTS.find((i) => i.slug === "healthcare")!;
    for (const job of detail!.jobs) {
      expect(interest.groups).toContain(job.code.slice(0, 2));
    }
  });

  it("resolves a raw SOC major-group code from the browse-all page", () => {
    const detail = getInterestDetail("51");
    expect(detail).not.toBeNull();
    expect(detail!.label).toBe(SOC_MAJOR_GROUPS["51"]);
    expect(detail!.jobs.every((j) => j.code.startsWith("51"))).toBe(true);
  });

  it("returns null for an unknown slug rather than an empty pool", () => {
    // An empty array here would render as "no jobs in this field" — a real
    // claim about the labor market. null lets the caller render 404 instead.
    expect(getInterestDetail("not-a-real-interest")).toBeNull();
  });
});
