import { describe, it, expect } from "vitest";
import {
  getCertificationInfo,
  parseRequirementsFromDescription,
} from "@/app/lib/certifications";

describe("getCertificationInfo", () => {
  it("finds the NCLEX nursing exam", () => {
    const info = getCertificationInfo("NCLEX");
    expect(info).not.toBeNull();
    expect(info!.url).toBe("https://www.ncsbn.org/nclex.htm");
    expect(info!.requirements.length).toBeGreaterThan(0);
  });

  it("finds the FE engineering exam", () => {
    const info = getCertificationInfo("FE Exam");
    expect(info?.url).toBe("https://ncees.org/engineering/fe/");
  });

  it("finds the CPA exam", () => {
    const info = getCertificationInfo("CPA");
    expect(info?.url).toBe("https://www.aicpa-cima.com/cpa-exam");
  });

  it("returns null for an unknown certification", () => {
    expect(getCertificationInfo("xyznonexistentcredential")).toBeNull();
  });
});

describe("parseRequirementsFromDescription", () => {
  it("falls back to exam-specific requirements when no description is given", () => {
    const reqs = parseRequirementsFromDescription(undefined, "NCLEX");
    expect(reqs.length).toBeGreaterThan(0);
    expect(reqs.some((r) => /nursing/i.test(r))).toBe(true);
  });

  it("returns generic requirements for an unrecognized exam", () => {
    const reqs = parseRequirementsFromDescription(undefined, "Widget Certification");
    expect(reqs.length).toBeGreaterThanOrEqual(5);
    expect(reqs.some((r) => /official certification website/i.test(r))).toBe(true);
  });
});
