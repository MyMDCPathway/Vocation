import { describe, it, expect } from "vitest";
import {
  clearedFraction,
  enrichOutline,
  outlineDurationHint,
  type OutlineStep,
} from "@/app/lib/pathOutline";
import { NO_MOBILITY, type IntakeAnswers } from "@/app/lib/intake";

const step = (over: Partial<OutlineStep>): OutlineStep => ({
  label: "Step",
  detail: "Something happens.",
  kind: "education",
  duration: "",
  ...over,
});

/** A degree-shaped outline, the case with the most steps to clear. */
const DEGREE_OUTLINE: OutlineStep[] = [
  step({ label: "High school", kind: "education", clearedBy: "hs-diploma", duration: "4 years" }),
  step({ label: "Bachelor's degree", kind: "education", clearedBy: "bachelor", duration: "4 years" }),
  step({ label: "Medical school", kind: "education", clearedBy: "graduate", duration: "4 years" }),
  step({ label: "Residency", kind: "experience", duration: "3 years" }),
  step({ label: "Board certification", kind: "credential", duration: "" }),
];

const answers = (over: Partial<IntakeAnswers> = {}): IntakeAnswers => ({
  career: { raw: "doctor", resolved: "Pediatrician" },
  mobility: NO_MOBILITY,
  ...over,
});

describe("enrichOutline — where the student actually starts", () => {
  it("marks nothing cleared when we don't know their education yet", () => {
    // The rail shows up at question two, before the education question. It
    // must not claim they've finished anything.
    const steps = enrichOutline(DEGREE_OUTLINE, answers());
    expect(steps.every((s) => s.status !== "cleared")).toBe(true);
    expect(steps[0].status).toBe("next");
  });

  it("clears the steps a student's existing attainment covers", () => {
    const steps = enrichOutline(DEGREE_OUTLINE, answers({ educationLevel: "bachelor" }));
    expect(steps.map((s) => s.status)).toEqual([
      "cleared", // high school
      "cleared", // bachelor's
      "next", // medical school
      "later",
      "later",
    ]);
  });

  it("puts exactly one step in the 'next' state", () => {
    for (const level of ["in-high-school", "hs-diploma", "bachelor", "graduate"] as const) {
      const steps = enrichOutline(DEGREE_OUTLINE, answers({ educationLevel: level }));
      expect(steps.filter((s) => s.status === "next"), level).toHaveLength(1);
    }
  });

  it("compares by rank, not equality", () => {
    // A graduate degree clears the bachelor's step even though the labels
    // don't match. Equality checking would show someone with a master's a
    // bachelor's step still to do.
    const steps = enrichOutline(DEGREE_OUTLINE, answers({ educationLevel: "graduate" }));
    expect(steps[1].status).toBe("cleared");
  });

  it("never clears a step that prior education can't cover", () => {
    // An apprenticeship isn't cleared by a degree — this is the whole reason
    // clearedBy is optional rather than inferred from position.
    const trade: OutlineStep[] = [
      step({ label: "High school", clearedBy: "hs-diploma" }),
      step({ label: "Apprenticeship", kind: "training", duration: "4 years" }),
      step({ label: "Journeyman licence", kind: "credential" }),
    ];
    const steps = enrichOutline(trade, answers({ educationLevel: "graduate" }));
    expect(steps[1].status).toBe("next");
    expect(steps[2].status).toBe("later");
  });

  it("handles an outline where everything is cleared", () => {
    const steps = enrichOutline(
      [step({ label: "Bachelor's", clearedBy: "bachelor" })],
      answers({ educationLevel: "graduate" })
    );
    expect(steps[0].status).toBe("cleared");
    expect(steps.some((s) => s.status === "next")).toBe(false);
  });

  it("survives an empty outline", () => {
    expect(enrichOutline([], answers({ educationLevel: "bachelor" }))).toEqual([]);
  });
});

describe("enrichOutline — annotations from later answers", () => {
  it("adds nothing before the student has said where they live", () => {
    const steps = enrichOutline(DEGREE_OUTLINE, answers());
    expect(steps.flatMap((s) => s.notes)).toEqual([]);
  });

  it("localises the study steps once a city is known", () => {
    const steps = enrichOutline(
      DEGREE_OUTLINE,
      answers({ location: { countryCode: "US", subdivision: "Florida", city: "Miami" } })
    );
    expect(steps[0].notes).toContain("Near Miami");
    // A residency or an exam isn't a place you enrol, so it gets no locality.
    expect(steps[3].notes).toEqual([]);
    expect(steps[4].notes).toEqual([]);
  });

  it("names the chosen provider on the step they'd actually start at", () => {
    const steps = enrichOutline(
      DEGREE_OUTLINE,
      answers({
        educationLevel: "bachelor",
        location: { countryCode: "US", subdivision: "Florida", city: "Miami" },
        desiredSchools: [
          {
            id: "open:x",
            name: "University of Miami",
            city: "Coral Gables",
            subdivision: "Florida",
            countryCode: "US",
            kind: "private",
            source: "ai",
          },
        ],
      })
    );
    // Medical school is 'next' for someone holding a bachelor's.
    expect(steps[2].notes).toContain("At University of Miami");
    // Steps they've already cleared don't get a provider they never attended.
    expect(steps[1].notes.join()).not.toContain("University of Miami");
  });

  it("counts the others when several providers are picked", () => {
    const school = (id: string, name: string) => ({
      id,
      name,
      city: "Miami",
      subdivision: "Florida",
      countryCode: "US",
      kind: "private" as const,
      source: "ai" as const,
    });
    const steps = enrichOutline(
      [step({ label: "Training", kind: "training" })],
      answers({
        location: { countryCode: "US", subdivision: "Florida", city: "Miami" },
        desiredSchools: [school("a", "First"), school("b", "Second"), school("c", "Third")],
      })
    );
    expect(steps[0].notes[0]).toBe("At First or 2 others you picked");
  });
});

describe("clearedFraction", () => {
  it("is zero at the start, which is the common case", () => {
    expect(clearedFraction(enrichOutline(DEGREE_OUTLINE, answers()))).toBe(0);
  });

  it("reflects how much is behind them", () => {
    const steps = enrichOutline(DEGREE_OUTLINE, answers({ educationLevel: "bachelor" }));
    expect(clearedFraction(steps)).toBeCloseTo(2 / 5);
  });

  it("doesn't divide by zero on an empty outline", () => {
    expect(clearedFraction([])).toBe(0);
  });
});

describe("outlineDurationHint", () => {
  it("counts only what's left", () => {
    // Fresh out of high school: bachelor's + med school + residency = 11.
    const fresh = enrichOutline(DEGREE_OUTLINE, answers({ educationLevel: "hs-diploma" }));
    expect(outlineDurationHint(fresh)).toBe("about 11 years");

    // Already holds a bachelor's: med school + residency = 7.
    const later = enrichOutline(DEGREE_OUTLINE, answers({ educationLevel: "bachelor" }));
    expect(outlineDurationHint(later)).toBe("about 7 years");
  });

  it("takes the upper bound of a range, not the lower", () => {
    const steps = enrichOutline([step({ duration: "4-5 years" })], answers());
    expect(outlineDurationHint(steps)).toBe("about 5 years");
  });

  it("reads naturally at one year", () => {
    expect(outlineDurationHint(enrichOutline([step({ duration: "1 year" })], answers()))).toBe(
      "about a year"
    );
  });

  it("says nothing rather than zero when no step is measured in years", () => {
    // Months and untimed steps shouldn't render as "about 0 years".
    const steps = enrichOutline(
      [step({ duration: "6 months" }), step({ duration: "" })],
      answers()
    );
    expect(outlineDurationHint(steps)).toBe("");
  });

  it("says nothing when everything is already done", () => {
    const steps = enrichOutline(
      [step({ duration: "4 years", clearedBy: "bachelor" })],
      answers({ educationLevel: "bachelor" })
    );
    expect(outlineDurationHint(steps)).toBe("");
  });
});
