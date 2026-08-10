import { describe, it, expect } from "vitest";
import { resolveProgramLink } from "@/app/lib/resolveProgramLink";
import type { PathwayStep } from "@/app/lib/types";

function degreeStep(name: string, level: string): PathwayStep {
  return { type: "degree", name, level, description: "" };
}

describe("resolveProgramLink", () => {
  it("resolves a step at the school itself to the school's own program page", () => {
    const link = resolveProgramLink(degreeStep("Accounting", "B.S. (SF)"), "sf")!;
    expect(link).not.toBeNull();
    expect(link.variant).toBe("primary");
    expect(link.href).toContain("sfcollege.edu");
  });

  it("resolves the post-transfer bachelor's to the partner via afterTransfer, even without the level tag", () => {
    // The level-string tag ("B.S. (UF)") is a convention the prompt teaches
    // the model, not a guarantee — Gemini is free text generation. afterTransfer
    // is the structural, always-available signal: the caller knows whether a
    // transfer step precedes this one in the same pathway regardless of how
    // the model phrased the level. A bare "B.S." with no partner tag must
    // still resolve to UF when the caller says afterTransfer.
    const link = resolveProgramLink(degreeStep("Accounting", "B.S."), "sf", {
      afterTransfer: true,
    })!;
    expect(link).not.toBeNull();
    expect(link.href).toContain("ufl.edu");
    expect(link.href).not.toContain("sfcollege.edu");
  });

  it("resolves the post-transfer bachelor's to the partner, not a same-named local program", () => {
    // Regression: Santa Fe College grants its own "Accounting (B.S.)", the
    // same bare name UF's "Accounting" bachelor's resolves to. Before the fix,
    // catalogFor("sf").find() matched SF's own program first (its own
    // catalog's name-only lookup doesn't know the step was meant for UF), so
    // a step explicitly labelled "B.S. (UF)" silently linked to SF's own
    // program page instead of UF's — confirmed live via a real Gemini
    // generation before this test was written.
    const link = resolveProgramLink(degreeStep("Accounting", "B.S. (UF)"), "sf")!;
    expect(link).not.toBeNull();
    expect(link.href).toContain("ufl.edu");
    expect(link.href).not.toContain("sfcollege.edu");
    expect(link.label).toContain("Offered at UF");
  });

  it("defaults to the school's own bachelor's with no partner signal at all", () => {
    // With neither afterTransfer nor a level tag, a bare "Accounting"/"B.S."
    // step is genuinely ambiguous between SF's own bachelor's and UF's — this
    // documents the deliberate default (favor the school actually selected)
    // rather than treating it as a bug.
    const link = resolveProgramLink(degreeStep("Accounting", "B.S."), "sf")!;
    expect(link.href).toContain("sfcollege.edu");
  });

  it("still resolves the school's own bachelor's when the level does not name the partner", () => {
    // The fix must not break the ordinary "SF grants its own bachelor's"
    // pathway this collision sits right next to.
    const link = resolveProgramLink(degreeStep("Accounting", "B.S. (SF)"), "sf")!;
    expect(link.href).toContain("sfcollege.edu");
    expect(link.variant).toBe("primary");
  });

  it("resolves MDC's post-transfer bachelor's to FIU, table-driven not hardcoded", () => {
    const link = resolveProgramLink(degreeStep("Accounting (BACC)", "B.S. (FIU)"), "mdc")!;
    expect(link).not.toBeNull();
    expect(link.href).toContain("fiu.edu");
    expect(link.label).toContain("Offered at FIU");
  });

  it("returns null for a non-degree step", () => {
    expect(
      resolveProgramLink(
        { type: "transfer", name: "Transfer", level: "Transfer", description: "" },
        "broward"
      )
    ).toBeNull();
  });

  it("returns null rather than guessing when a school has no transfer partner catalog", () => {
    // GCSC's partner is FSU Panama City, which has no universityId (see
    // transferAgreements.ts) — a step that isn't one of GCSC's own programs
    // must get nothing, not a wrong-campus FSU link.
    const link = resolveProgramLink(degreeStep("Nursing", "B.S.N."), "gcsc");
    expect(link).toBeNull();
  });
});
