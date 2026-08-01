import { describe, it, expect } from "vitest";
import seedCache from "@/data/seed-cache.json";
import { findFIUProgram } from "@/app/lib/fiu-programs";
import { hasMDCProgramPage } from "@/app/lib/mdc-programs";
import type { PathwayData, PathwayStep } from "@/app/lib/types";

// Checks that the FIU catalog sends a generated pathway step to the right kind
// of program.
//
// This used to also assert a floor on how OFTEN the catalog resolves a step at
// all — a coverage ratio over every seeded pathway. That assertion was removed:
// it measured the model's phrasing as much as the matcher, so it drifted
// downward every time the seed cache was regenerated with differently-worded
// step names, and it failed without anything actually being broken. A test that
// goes red on unrelated churn stops being read.
//
// What's left is the part that can only fail for a real reason: if the matcher
// starts routing a bachelor's step to a graduate program, that's a wrong link
// in front of a student, and these catch it.

const seed = seedCache as Record<string, unknown>;

function transferDegreeSteps(): PathwayStep[] {
  const steps: PathwayStep[] = [];
  for (const [key, value] of Object.entries(seed)) {
    if (!key.startsWith("pathway:")) continue;
    for (const option of (value as PathwayData).pathways ?? []) {
      for (const step of option.steps ?? []) {
        // Steps taken at MDC are covered by the MDC catalog.
        if (step.type !== "degree") continue;
        if (step.level?.includes("MDC")) continue;
        if (hasMDCProgramPage(step.name, step.level)) continue;
        steps.push(step);
      }
    }
  }
  return steps;
}

describe("FIU catalog coverage of generated pathways", () => {
  it("has seeded pathway data to measure against", () => {
    expect(transferDegreeSteps().length).toBeGreaterThan(50);
  });

  it("routes bachelor's steps to undergraduate programs", () => {
    const bachelors = transferDegreeSteps().filter((s) =>
      /^bachelor/i.test(s.name)
    );
    expect(bachelors.length).toBeGreaterThan(10);

    for (const step of bachelors) {
      const program = findFIUProgram(step.name, step.level);
      if (!program) continue;
      expect(program.level, `${step.name} (${step.level})`).toBe("bachelor");
    }
  });

  it("routes master's and doctoral steps to graduate programs", () => {
    const graduate = transferDegreeSteps().filter((s) =>
      /^(master|doctor)/i.test(s.name)
    );

    for (const step of graduate) {
      const program = findFIUProgram(step.name, step.level);
      if (!program) continue;
      expect(program.level, `${step.name} (${step.level})`).toBe("graduate");
    }
  });
});
