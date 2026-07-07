import { describe, it, expect } from "vitest";
import {
  getMDCProgramUrl,
  getMDCAssociateArtsProgramUrl,
  isMDCBachelorsProgram,
  isMDCAssociateInArtsProgram,
  isMDCAssociateInScienceProgram,
  extractFirstProgramOption,
} from "@/app/lib/mdc-programs";

describe("getMDCProgramUrl - curated links (the MDC Major page links)", () => {
  it("resolves a known bachelor's program to its exact mdc.edu URL", () => {
    expect(getMDCProgramUrl("Bachelor of Science in Nursing")).toBe("https://www.mdc.edu/bsn/");
  });

  it("resolves a known Associate in Arts program to its exact mdc.edu URL", () => {
    expect(getMDCProgramUrl("Associate in Arts in Psychology")).toBe("https://www.mdc.edu/psychology/");
  });

  it("resolves a known Associate in Science program to its exact mdc.edu URL", () => {
    expect(getMDCProgramUrl("Associate in Science in Nursing")).toBe("https://www.mdc.edu/nursingrn/");
  });

  it("resolves an engineering A.A. specialization to its exact URL", () => {
    expect(getMDCAssociateArtsProgramUrl("Associate in Arts in Engineering - Mechanical")).toBe(
      "https://www.mdc.edu/mechanicalengineering"
    );
  });

  it("every curated program link points at the mdc.edu domain", () => {
    const samples = [
      "Bachelor of Science in Cybersecurity",
      "Associate in Arts in Biology",
      "Associate in Science in Dental Hygiene",
    ];
    for (const name of samples) {
      expect(getMDCProgramUrl(name)).toMatch(/^https:\/\/www\.mdc\.edu\//);
    }
  });
});

describe("getMDCProgramUrl - generated fallback (links that may not resolve)", () => {
  // Programs with no curated mapping fall back to a slug generated from the
  // name. These always return an mdc.edu URL, but the page is NOT guaranteed to
  // exist - this test documents that behavior so a regression is visible.
  it("still returns an mdc.edu URL for an unmapped program", () => {
    const url = getMDCProgramUrl("Certificate in Underwater Basket Weaving");
    expect(url).toMatch(/^https:\/\/www\.mdc\.edu\/[a-z0-9]+\/$/);
  });

  it("strips the program-type prefix when building the fallback slug", () => {
    // "Certificate in " prefix removed, spaces/case collapsed.
    expect(getMDCProgramUrl("Certificate in Widgetry")).toBe("https://www.mdc.edu/widgetry/");
  });
});

describe("program classifiers", () => {
  it("identifies a bachelor's program", () => {
    expect(isMDCBachelorsProgram("Bachelor of Science in Nursing")).toBe(true);
    expect(isMDCBachelorsProgram("Associate in Arts in Psychology")).toBe(false);
  });

  it("distinguishes A.S. from A.A. programs", () => {
    expect(isMDCAssociateInScienceProgram("Associate in Science in Nursing")).toBe(true);
    expect(isMDCAssociateInArtsProgram("Associate in Science in Nursing")).toBe(false);

    expect(isMDCAssociateInArtsProgram("Associate in Arts in Psychology")).toBe(true);
    expect(isMDCAssociateInScienceProgram("Associate in Arts in Psychology")).toBe(false);
  });

  it("rejects a nonsense program name", () => {
    expect(isMDCBachelorsProgram("Bachelor of Nonsense in Nothing")).toBe(false);
    expect(isMDCAssociateInArtsProgram("Associate in Arts in Nonsensicalstudies")).toBe(false);
  });
});

describe("extractFirstProgramOption", () => {
  it("takes the first option when several are listed with 'or'", () => {
    expect(extractFirstProgramOption("Mechanical or Civil")).toBe("Mechanical");
  });

  it("takes the first option when separated by 'and'", () => {
    expect(extractFirstProgramOption("Biology and Chemistry")).toBe("Biology");
  });

  it("returns the name unchanged when there is a single option", () => {
    expect(extractFirstProgramOption("Psychology")).toBe("Psychology");
  });
});
