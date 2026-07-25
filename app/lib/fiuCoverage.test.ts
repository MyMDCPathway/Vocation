import { describe, it, expect } from "vitest";
import seedCache from "@/data/seed-cache.json";
import { findFIUProgram } from "@/app/lib/fiu-programs";
import { hasMDCProgramPage } from "@/app/lib/mdc-programs";
import type { PathwayData, PathwayStep } from "@/app/lib/types";

// Measures how often the FIU catalog can resolve a real generated pathway step.
//
// The value here is regression detection, not the exact number: if a future
// change to normalization or the scraper quietly breaks matching, coverage
// collapses and this fails. Without it, TransferProgramLink would simply stop
// rendering and nothing would complain.

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

  it("resolves a meaningful share of post-MDC degree steps", () => {
    const steps = transferDegreeSteps();
    const matched = steps.filter((s) => findFIUProgram(s.name, s.level));
    const ratio = matched.length / steps.length;

    // Generated names are free text, so full coverage is not the goal — but a
    // sharp drop means the matcher or the scraped catalog broke.
    expect(ratio, `${matched.length}/${steps.length} matched`).toBeGreaterThan(0.3);
  });

  it("routes bachelor's steps to undergraduate programs", () => {
    const bachelors = transferDegreeSteps().filter((s) =>
      /^bachelor/i.test(s.name)
    );
    expect(bachelors.length).toBeGreaterThan(10);

    for (const step of bachelors) {
      const program = findFIUProgram(step.name, step.level);
      if (!program) continue;
      expect(program.level, `${step.name} (${step.level})`).toBe("undergraduate");
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
