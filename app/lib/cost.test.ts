import { describe, it, expect } from "vitest";
import { calculateStepCost, calculatePathwayCost } from "@/app/lib/cost";
import { PathwayStep } from "@/app/lib/types";

// Small helper so each test only specifies the fields that matter.
const step = (over: Partial<PathwayStep>): PathwayStep => ({
  type: "degree",
  level: "",
  name: "",
  description: "",
  ...over,
});

describe("calculateStepCost", () => {
  it("prices an MDC associate degree at $7,200", () => {
    expect(
      calculateStepCost(
        step({ type: "degree", level: "MDC North Campus", name: "Associate in Arts in Psychology" })
      )
    ).toBe(7200);
  });

  it("prices an MDC certificate at $3,000", () => {
    expect(
      calculateStepCost(
        step({ type: "degree", level: "MDC North Campus", name: "Certificate in Phlebotomy" })
      )
    ).toBe(3000);
  });

  it("prices an MDC bachelor's at $13,500", () => {
    expect(
      calculateStepCost(
        step({ type: "degree", level: "MDC", name: "Bachelor of Science in Nursing" })
      )
    ).toBe(13500);
  });

  it("prices a transfer step at $0", () => {
    expect(calculateStepCost(step({ type: "transfer", name: "Transfer to UF" }))).toBe(0);
  });

  it("prices a bachelor's at a 4-year (non-MDC) university at $13,000", () => {
    expect(
      calculateStepCost(
        step({ type: "degree", level: "University of Florida", name: "B.S. in Mechanical Engineering" })
      )
    ).toBe(13000);
  });

  it("prices internships at $0", () => {
    expect(calculateStepCost(step({ type: "internship", name: "Summer Internship" }))).toBe(0);
  });

  // Per-exam fee table.
  it.each([
    ["NCLEX-RN", 200],
    ["PE Exam", 375],
    ["FE Exam", 175],
    ["ARE Exam", 1200],
    ["Bar Exam", 1000],
    ["CPA Exam", 800],
    ["Some Unlisted Exam", 300], // default fee
  ])("prices the %s exam at $%d", (name, expected) => {
    expect(calculateStepCost(step({ type: "exam", name }))).toBe(expected);
  });
});

describe("calculatePathwayCost (pathway total + comparison)", () => {
  it("sums every step in a pathway", () => {
    const nursingPath: PathwayStep[] = [
      step({ type: "degree", level: "MDC", name: "Associate in Science in Nursing" }), // 7200
      step({ type: "exam", name: "NCLEX-RN" }), // 200
    ];
    expect(calculatePathwayCost(nursingPath)).toBe(7400);
  });

  it("returns 0 for an empty pathway", () => {
    expect(calculatePathwayCost([])).toBe(0);
  });

  it("computes independent totals for two careers being compared side by side", () => {
    // This mirrors the comparison view, which totals each career's selected
    // pathway with the same function.
    const engineerPath: PathwayStep[] = [
      step({ type: "degree", level: "MDC", name: "Associate in Arts in Engineering" }), // 7200
      step({ type: "transfer", name: "Transfer to FIU" }), // 0
      step({ type: "degree", level: "FIU", name: "B.S. in Civil Engineering" }), // 13000
      step({ type: "exam", name: "FE Exam" }), // 175
      step({ type: "exam", name: "PE Exam" }), // 375
    ];
    const nursePath: PathwayStep[] = [
      step({ type: "degree", level: "MDC", name: "Associate in Science in Nursing" }), // 7200
      step({ type: "exam", name: "NCLEX-RN" }), // 200
    ];

    const engineerTotal = calculatePathwayCost(engineerPath);
    const nurseTotal = calculatePathwayCost(nursePath);

    expect(engineerTotal).toBe(20750);
    expect(nurseTotal).toBe(7400);
    // The two careers are costed independently.
    expect(engineerTotal).not.toBe(nurseTotal);
  });
});
