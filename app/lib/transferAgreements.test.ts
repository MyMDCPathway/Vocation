import { describe, it, expect } from "vitest";
import {
  transferAgreementFor,
  schoolsWithTransferAgreement,
} from "@/app/lib/transferAgreements";
import { FLORIDA_SCHOOLS } from "@/app/lib/floridaSchools";
import { hasCatalog } from "@/app/lib/schoolCatalogs";

describe("transfer agreements", () => {
  const ids = schoolsWithTransferAgreement();

  it("covers the state colleges wired up so far", () => {
    expect(ids).toEqual([
      "cf",
      "cfk",
      "daytona",
      "efsc",
      "fgc",
      "fscj",
      "fsw",
      "gcsc",
      "hcc",
      "irsc",
      "lssc",
      "nfc",
      "nwfsc",
      "pbsc",
      "phsc",
      "polk",
      "psc",
      "scf",
      "seminole",
      "sf",
      "sfsc",
      "sjr",
      "spc",
      "tsc",
      "valencia",
    ]);
  });

  it("has no forced flagship for a school with no real one, rather than guessing", () => {
    // Chipola offers parallel AA pathway sheets to five universities (FSU,
    // UF, FAMU, UWF, UCF) with no branded guaranteed-admission program tying
    // it to one of them the way Aspire ties TSC to FSU. Inventing a "flagship"
    // here would misrepresent an agreement Chipola doesn't actually have.
    expect(transferAgreementFor("chipola")).toBeNull();
  });

  it("records a real school for every agreement", () => {
    for (const id of ids) {
      expect(FLORIDA_SCHOOLS.some((s) => s.id === id), id).toBe(true);
    }
  });

  it("only names a partner for schools we can actually plan a pathway for", () => {
    // An agreement on a school with no catalog would never be reachable, and
    // would quietly rot rather than fail.
    for (const id of ids) {
      expect(hasCatalog(id), id).toBe(true);
    }
  });

  it("fills in every field the prompt interpolates", () => {
    for (const id of ids) {
      const a = transferAgreementFor(id)!;
      expect(a, id).not.toBeNull();
      expect(a.university.length, id).toBeGreaterThan(3);
      expect(a.universityShortName.length, id).toBeGreaterThan(1);
      expect(a.programName.length, id).toBeGreaterThan(3);
      expect(a.url, id).toMatch(/^https:\/\//);
      // The summary is the sentence the model repeats to the student, so an
      // empty or stub value would silently produce vague advice.
      expect(a.summary.length, id).toBeGreaterThan(60);
      expect(a.summary, id).toMatch(/\.$/);
    }
  });

  it("points each agreement's link at the school or its partner", () => {
    // A link to some third-party write-up would age badly.
    for (const id of ids) {
      const a = transferAgreementFor(id)!;
      expect(a.url, id).toMatch(/\.edu\//);
    }
  });

  it("returns null for schools with no recorded agreement", () => {
    expect(transferAgreementFor("mdc")).toBeNull();
    expect(transferAgreementFor("fiu")).toBeNull();
    expect(transferAgreementFor("ucf")).toBeNull();
    expect(transferAgreementFor("uf")).toBeNull();
    expect(transferAgreementFor("fgcu")).toBeNull();
    expect(transferAgreementFor("uwf")).toBeNull();
    expect(transferAgreementFor("ncf")).toBeNull();
    expect(transferAgreementFor("unf")).toBeNull();
    expect(transferAgreementFor("flpoly")).toBeNull();
    expect(transferAgreementFor("usf")).toBeNull();
    expect(transferAgreementFor("fau")).toBeNull();
    expect(transferAgreementFor("famu")).toBeNull();
    expect(transferAgreementFor("fsu")).toBeNull();
    expect(transferAgreementFor("nope")).toBeNull();
    expect(transferAgreementFor("")).toBeNull();
  });

  it("does not list the flagship partner again under also-partners", () => {
    for (const id of ids) {
      const a = transferAgreementFor(id)!;
      expect(a.alsoPartnersWith ?? [], id).not.toContain(a.university);
    }
  });
});
