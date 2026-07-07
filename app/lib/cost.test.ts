import { describe, it, expect } from "vitest";
import {
  calculateStepCostRange,
  calculatePathwayCostRange,
  findUniversityCost,
  formatCostRange,
} from "@/app/lib/cost";
import { FLORIDA_UNIVERSITIES } from "@/app/lib/universities";
import { PathwayStep } from "@/app/lib/types";

// Small helper so each test only specifies the fields that matter.
const step = (over: Partial<PathwayStep>): PathwayStep => ({
  type: "degree",
  level: "",
  name: "",
  description: "",
  ...over,
});

describe("calculateStepCostRange - MDC programs", () => {
  it("prices an MDC associate degree at $6,000-$8,000", () => {
    expect(
      calculateStepCostRange(
        step({ type: "degree", level: "MDC North Campus", name: "Associate in Arts in Psychology" })
      )
    ).toEqual({ low: 6000, high: 8000 });
  });

  it("prices an MDC certificate at $2,000-$4,000", () => {
    expect(
      calculateStepCostRange(
        step({ type: "degree", level: "MDC North Campus", name: "Certificate in Phlebotomy" })
      )
    ).toEqual({ low: 2000, high: 4000 });
  });

  it("prices an MDC bachelor's at $12,000-$15,000", () => {
    expect(
      calculateStepCostRange(
        step({ type: "degree", level: "MDC", name: "Bachelor of Science in Nursing" })
      )
    ).toEqual({ low: 12000, high: 15000 });
  });
});

describe("calculateStepCostRange - university bachelor's (per-university pricing)", () => {
  it("uses public in-state tuition for FIU (matched by abbreviation)", () => {
    // FIU annual: $6,500-$7,000 -> 2 years: $13,000-$14,000
    expect(
      calculateStepCostRange(
        step({ type: "degree", level: "FIU", name: "B.S. in Civil Engineering" })
      )
    ).toEqual({ low: 13000, high: 14000 });
  });

  it("uses private tuition for University of Miami (matched by full name)", () => {
    // UM annual: $57,000-$62,000 -> 2 years: $114,000-$124,000
    expect(
      calculateStepCostRange(
        step({ type: "degree", level: "University of Miami", name: "B.S. in Biology" })
      )
    ).toEqual({ low: 114000, high: 124000 });
  });

  it("prices public and private universities very differently (the 4-9x gap)", () => {
    const fiu = calculateStepCostRange(
      step({ type: "degree", level: "FIU", name: "Bachelor of Science" })
    );
    const um = calculateStepCostRange(
      step({ type: "degree", level: "University of Miami", name: "Bachelor of Science" })
    );
    expect(um.low / fiu.high).toBeGreaterThan(4);
  });

  it("falls back to a Florida-public estimate for an unrecognized university", () => {
    expect(
      calculateStepCostRange(
        step({ type: "degree", level: "Some Out-of-State University", name: "B.S. in Physics" })
      )
    ).toEqual({ low: 12000, high: 15000 });
  });
});

describe("calculateStepCostRange - non-degree steps", () => {
  it("prices a transfer step at $0", () => {
    expect(calculateStepCostRange(step({ type: "transfer", name: "Transfer to UF" }))).toEqual({
      low: 0,
      high: 0,
    });
  });

  it("prices internships at $0", () => {
    expect(
      calculateStepCostRange(step({ type: "internship", name: "Summer Internship" }))
    ).toEqual({ low: 0, high: 0 });
  });

  // Exam registration fees are published, so these stay flat (low === high).
  it.each([
    ["NCLEX-RN", 200],
    ["PE Exam", 375],
    ["FE Exam", 175],
    ["A.R.E. (Architect Registration Examination)", 1200], // dots must not break matching
    ["Bar Exam", 1000],
    ["CPA Exam", 800],
    ["Some Unlisted Exam", 300], // default fee
  ])("prices the %s exam at $%d", (name, expected) => {
    expect(calculateStepCostRange(step({ type: "exam", name }))).toEqual({
      low: expected,
      high: expected,
    });
  });

  it("does not mistake 'Care' for the A.R.E. exam (word-boundary fix)", () => {
    // The old substring match priced any exam containing "are" (e.g. "Health
    // Care Exam") at the $1,200 A.R.E. fee.
    expect(
      calculateStepCostRange(step({ type: "exam", name: "Health Care Certification Exam" }))
    ).toEqual({ low: 300, high: 300 });
  });
});

describe("findUniversityCost", () => {
  it("matches by abbreviation with word boundaries", () => {
    expect(findUniversityCost("Transfer to UCF for engineering")).toEqual({
      low: 6400,
      high: 6900,
    });
  });

  it("returns null when no university is named", () => {
    expect(findUniversityCost("a bachelor's degree somewhere")).toBeNull();
  });
});

describe("calculatePathwayCostRange (pathway total + comparison)", () => {
  it("sums every step in a pathway", () => {
    const nursingPath: PathwayStep[] = [
      step({ type: "degree", level: "MDC", name: "Associate in Science in Nursing" }), // 6000-8000
      step({ type: "exam", name: "NCLEX-RN" }), // 200
    ];
    expect(calculatePathwayCostRange(nursingPath)).toEqual({ low: 6200, high: 8200 });
  });

  it("returns $0-$0 for an empty pathway", () => {
    expect(calculatePathwayCostRange([])).toEqual({ low: 0, high: 0 });
  });

  it("computes independent totals for two careers being compared side by side", () => {
    // This mirrors the comparison view, which totals each career's selected
    // pathway with the same function.
    const engineerPath: PathwayStep[] = [
      step({ type: "degree", level: "MDC", name: "Associate in Arts in Engineering" }), // 6000-8000
      step({ type: "transfer", name: "Transfer to FIU" }), // 0
      step({ type: "degree", level: "FIU", name: "B.S. in Civil Engineering" }), // 13000-14000
      step({ type: "exam", name: "FE Exam" }), // 175
      step({ type: "exam", name: "PE Exam" }), // 375
    ];
    const nursePath: PathwayStep[] = [
      step({ type: "degree", level: "MDC", name: "Associate in Science in Nursing" }), // 6000-8000
      step({ type: "exam", name: "NCLEX-RN" }), // 200
    ];

    expect(calculatePathwayCostRange(engineerPath)).toEqual({ low: 19550, high: 22550 });
    expect(calculatePathwayCostRange(nursePath)).toEqual({ low: 6200, high: 8200 });
  });
});

describe("formatCostRange", () => {
  it("shows a range with thousands separators", () => {
    expect(formatCostRange({ low: 6000, high: 8000 })).toBe("$6,000 – $8,000");
  });

  it("collapses to a single figure when low equals high", () => {
    expect(formatCostRange({ low: 200, high: 200 })).toBe("$200");
  });
});

describe("university cost data sanity", () => {
  it("every university has a positive, ordered annualCost range", () => {
    for (const uni of FLORIDA_UNIVERSITIES) {
      expect(uni.annualCost.low).toBeGreaterThan(0);
      expect(uni.annualCost.high).toBeGreaterThanOrEqual(uni.annualCost.low);
    }
  });

  it("every public university is cheaper than every private one", () => {
    const publics = FLORIDA_UNIVERSITIES.filter((u) => u.type === "Public");
    const privates = FLORIDA_UNIVERSITIES.filter((u) => u.type === "Private");
    expect(publics.length).toBeGreaterThan(0);
    expect(privates.length).toBeGreaterThan(0);
    const maxPublic = Math.max(...publics.map((u) => u.annualCost.high));
    const minPrivate = Math.min(...privates.map((u) => u.annualCost.low));
    expect(maxPublic).toBeLessThan(minPrivate);
  });
});
