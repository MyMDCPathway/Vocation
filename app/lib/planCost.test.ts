import { describe, it, expect } from "vitest";
import {
  annualCostFor,
  estimateAid,
  estimatePlanCost,
  formatCostRange,
  formatCostRangeShort,
  LISTED_UNIVERSITY_NAMES,
} from "@/app/lib/planCost";
import { FLORIDA_SCHOOLS, getSchoolById } from "@/app/lib/floridaSchools";
import { FLORIDA_UNIVERSITIES } from "@/app/lib/universities";
import { INCOME_BANDS } from "@/app/lib/intake";
import type { PathwayStep } from "@/app/lib/types";

const step = (over: Partial<PathwayStep>): PathwayStep => ({
  type: "degree",
  level: "",
  name: "",
  description: "",
  ...over,
});

describe("LISTED_UNIVERSITY_NAMES — the drift guard", () => {
  // The mapping is explicit strings rather than a runtime fuzzy match, which
  // makes it fast and predictable and also makes it silently wrong the moment
  // universities.ts renames an entry. These three tests are the whole reason
  // that trade is acceptable.

  it("names only universities that exist in universities.ts", () => {
    const known = new Set(FLORIDA_UNIVERSITIES.map((u) => u.name));
    const unknown = Object.entries(LISTED_UNIVERSITY_NAMES)
      .filter(([, name]) => !known.has(name))
      .map(([id, name]) => `${id} → "${name}"`);
    expect(unknown, `not found in universities.ts: ${unknown.join(", ")}`).toEqual([]);
  });

  it("keys only on real school ids", () => {
    const unknown = Object.keys(LISTED_UNIVERSITY_NAMES).filter(
      (id) => !getSchoolById(id)
    );
    expect(unknown, `not in floridaSchools.ts: ${unknown.join(", ")}`).toEqual([]);
  });

  it("serves each listed school its own published figure", () => {
    for (const [id, name] of Object.entries(LISTED_UNIVERSITY_NAMES)) {
      const listed = FLORIDA_UNIVERSITIES.find((u) => u.name === name)!;
      expect(annualCostFor(id, "bachelor").range, id).toEqual(listed.annualCost);
      expect(annualCostFor(id, "bachelor").basis, id).toBe("listed");
    }
  });

  it("covers all twelve public universities", () => {
    const publics = FLORIDA_SCHOOLS.filter((s) => s.kind === "public-university");
    expect(publics).toHaveLength(12);
    for (const school of publics) {
      expect(annualCostFor(school.id, "bachelor").basis, school.id).toBe("listed");
    }
  });
});

describe("annualCostFor", () => {
  it("returns a positive, ordered range for every school at every level", () => {
    for (const school of FLORIDA_SCHOOLS) {
      for (const level of ["certificate", "associate", "bachelor", "graduate"] as const) {
        const { range, note } = annualCostFor(school.id, level);
        expect(range.low, `${school.id} ${level}`).toBeGreaterThan(0);
        expect(range.high, `${school.id} ${level}`).toBeGreaterThanOrEqual(range.low);
        // Every figure carries its own caveat, so a sector band can never be
        // rendered as if it were the school's own published price.
        expect(note.length, `${school.id} ${level}`).toBeGreaterThan(0);
      }
    }
  });

  it("prices a state college below every public university", () => {
    const college = annualCostFor("mdc", "associate").range.high;
    const publics = FLORIDA_SCHOOLS.filter((s) => s.kind === "public-university");
    for (const school of publics) {
      expect(annualCostFor(school.id, "bachelor").range.low, school.id).toBeGreaterThan(
        college
      );
    }
  });

  it("charges a state college more for upper division than lower", () => {
    expect(annualCostFor("mdc", "bachelor").range.low).toBeGreaterThan(
      annualCostFor("mdc", "associate").range.low
    );
  });

  it("labels an unlisted private as a sector band, not a price", () => {
    // Flagler has a catalog but no curated tuition figure. It must not come
    // back looking like a school-published number.
    const { basis, note } = annualCostFor("flagler", "bachelor");
    expect(basis).toBe("sector");
    expect(note.toLowerCase()).toContain("typical");
  });
});

describe("estimatePlanCost", () => {
  it("totals exactly the sum of its steps", () => {
    const steps = [
      step({ level: "A.S. (MDC)", name: "Associate in Science in Nursing" }),
      step({ type: "transfer", level: "Transfer", name: "Transfer to a university" }),
      step({ level: "B.S.", name: "Bachelor of Science in Nursing at UCF" }),
      step({ type: "exam", level: "Licensure Exam", name: "NCLEX-RN" }),
    ];
    const plan = estimatePlanCost(steps, "mdc");
    const summed = plan.steps.reduce(
      (sum, s) => ({ low: sum.low + s.range.low, high: sum.high + s.range.high }),
      { low: 0, high: 0 }
    );
    expect(plan.total).toEqual(summed);
  });

  it("charges two years for a bachelor's entered with an associate, not four", () => {
    const withAssociate = estimatePlanCost(
      [
        step({ level: "A.A. (MDC)", name: "Associate in Arts in Psychology" }),
        step({ type: "transfer", level: "Transfer", name: "Transfer" }),
        step({ level: "B.S.", name: "Bachelor of Science in Psychology at UCF" }),
      ],
      "mdc"
    );
    const direct = estimatePlanCost(
      [step({ level: "B.S. (UCF)", name: "Psychology" })],
      "ucf"
    );

    const transferBachelor = withAssociate.steps[2];
    expect(transferBachelor.years).toBe(2);
    expect(direct.steps[0].years).toBe(4);
    // The 2+2 route has to come out cheaper than four years at the university,
    // which is the entire premise the state college system is sold on.
    expect(withAssociate.total.high).toBeLessThan(direct.total.high);
  });

  it("gives transfers and internships no cost and no years", () => {
    const plan = estimatePlanCost(
      [
        step({ type: "transfer", level: "Transfer", name: "Transfer to a university" }),
        step({ type: "internship", level: "Internship", name: "Clinical rotations" }),
      ],
      "mdc"
    );
    expect(plan.total).toEqual({ low: 0, high: 0 });
    expect(plan.years).toBe(0);
  });

  it("prices exams as a flat published fee", () => {
    const plan = estimatePlanCost(
      [step({ type: "exam", level: "Licensure Exam", name: "NCLEX-RN" })],
      "mdc"
    );
    expect(plan.total).toEqual({ low: 200, high: 200 });
    expect(plan.steps[0].basis).toBe("published-fee");
  });

  it("matches dotted exam abbreviations", () => {
    // "A.R.E." and "F.E." only match their word-boundary patterns once the
    // periods are stripped — the same normalization cost.ts needed.
    const are = estimatePlanCost(
      [step({ type: "exam", level: "Exam", name: "A.R.E. (all divisions)" })],
      "mdc"
    );
    expect(are.total.high).toBe(1200);
  });

  it("runs a doctorate longer than a master's", () => {
    const phd = estimatePlanCost([step({ level: "Ph.D. (UF)", name: "Chemistry" })], "uf");
    const masters = estimatePlanCost([step({ level: "M.S. (UF)", name: "Chemistry" })], "uf");
    expect(phd.steps[0].years).toBeGreaterThan(masters.steps[0].years);
  });

  it("prices a step at the school it names, not the one the plan started at", () => {
    // A private university named mid-pathway must not be billed at the state
    // college's statutory rate.
    const plan = estimatePlanCost(
      [
        step({ level: "A.A. (MDC)", name: "Associate in Arts in Business Administration" }),
        step({ type: "transfer", level: "Transfer", name: "Transfer" }),
        step({ level: "B.B.A.", name: "Business Administration at University of Miami" }),
      ],
      "mdc"
    );
    expect(plan.steps[2].range.low).toBeGreaterThan(50000);
  });

  it("flags when any figure came from a sector band", () => {
    expect(estimatePlanCost([step({ level: "B.S. (UF)", name: "Biology" })], "uf").hasSectorEstimate).toBe(
      false
    );
    expect(
      estimatePlanCost([step({ level: "A.S. (MDC)", name: "Nursing" })], "mdc")
        .hasSectorEstimate
    ).toBe(true);
  });

  it("survives an empty pathway", () => {
    const plan = estimatePlanCost([], "mdc");
    expect(plan.total).toEqual({ low: 0, high: 0 });
    expect(plan.steps).toEqual([]);
  });
});

describe("estimateAid", () => {
  it("handles every income band without throwing", () => {
    for (const band of INCOME_BANDS) {
      const aid = estimateAid(band.id);
      expect(aid.headline.length, band.id).toBeGreaterThan(0);
      expect(aid.detail.length, band.id).toBeGreaterThan(0);
      expect(aid.annual.high, band.id).toBeGreaterThanOrEqual(aid.annual.low);
    }
  });

  it("never claims an estimate when the student declined to say", () => {
    const aid = estimateAid("prefer-not-to-say");
    expect(aid.estimated).toBe(false);
    expect(aid.annual).toEqual({ low: 0, high: 0 });
  });

  it("estimates nothing when no band was given at all", () => {
    expect(estimateAid(undefined).estimated).toBe(false);
  });

  it("never awards more aid to a higher income", () => {
    const bands = INCOME_BANDS.filter((b) => b.midpoint !== null);
    for (let i = 1; i < bands.length; i++) {
      const richer = estimateAid(bands[i].id).annual.high;
      const poorer = estimateAid(bands[i - 1].id).annual.high;
      expect(richer, `${bands[i].id} vs ${bands[i - 1].id}`).toBeLessThanOrEqual(poorer);
    }
  });
});

describe("formatting", () => {
  it("collapses a range with equal ends to one figure", () => {
    expect(formatCostRange({ low: 200, high: 200 })).toBe("$200");
  });

  it("renders a real range with both ends", () => {
    expect(formatCostRange({ low: 6000, high: 8000 })).toBe("$6,000 – $8,000");
  });

  it("abbreviates thousands in the short form", () => {
    expect(formatCostRangeShort({ low: 18000, high: 24000 })).toBe("$18k – $24k");
  });

  it("collapses the short form when both ends round the same", () => {
    expect(formatCostRangeShort({ low: 6100, high: 6400 })).toBe("$6k");
  });
});
