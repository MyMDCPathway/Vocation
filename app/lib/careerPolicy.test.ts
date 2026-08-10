import { describe, it, expect } from "vitest";
import { blockedCareer, MAX_CAREER_INPUT } from "@/app/lib/careerPolicy";
import { normalizeCareer, resolveCareer } from "@/app/lib/careerCanonical";

/** What a route does: normalize first, then ask. */
const check = (input: string) => blockedCareer(normalizeCareer(input));

describe("blockedCareer", () => {
  it("refuses violence and serious physical crime", () => {
    for (const input of [
      "hitman",
      "hit man",
      "assassin",
      "contract killer",
      "hired gun",
      "arms dealer",
      "human trafficker",
      "terrorist",
      "bank robber",
    ]) {
      expect(check(input), input).toBe("violence");
    }
  });

  it("refuses the illegal drug trade", () => {
    for (const input of [
      "drug dealer",
      "drug trafficker",
      "meth cook",
      "drug lord",
      "cocaine dealer",
    ]) {
      expect(check(input), input).toBe("drugs");
    }
  });

  it("refuses commercial sexual services", () => {
    for (const input of [
      "porn star",
      "porn actor",
      "prostitute",
      "escort service",
      "stripper",
      "cam girl",
    ]) {
      expect(check(input), input).toBe("sexual");
    }
  });

  it("refuses fraud and theft as the occupation", () => {
    for (const input of [
      "scammer",
      "con artist",
      "identity thief",
      "money launderer",
      "ponzi scheme",
      "counterfeiter",
    ]) {
      expect(check(input), input).toBe("fraud");
    }
  });

  it("still refuses when the phrase is buried in a sentence", () => {
    expect(check("I want to be a drug dealer in Miami")).toBe("drugs");
    expect(check("how do i become a hitman")).toBe("violence");
  });
});

describe("the allowlist runs before the block list", () => {
  // These are the cases that make ordering load-bearing rather than cosmetic:
  // each one contains a phrase the block list refuses, and each is a real job.
  it("keeps careers that name the crime they exist to fight", () => {
    expect(check("anti money laundering analyst")).toBeNull();
    expect(check("money laundering investigator")).toBeNull();
    expect(check("anti human trafficking advocate")).toBeNull();
    expect(check("human trafficking investigator")).toBeNull();
  });

  it("keeps the legitimate security careers a hacker rule would kill", () => {
    expect(check("ethical hacker")).toBeNull();
    expect(check("white hat hacker")).toBeNull();
    expect(check("penetration tester")).toBeNull();
    expect(check("certified ethical hacker")).toBeNull();
  });
});

describe("word boundaries, not substrings", () => {
  // Every one of these is refused by an obvious-looking substring rule:
  // "drug", "harm"/"arm", "gun", "con", "meth", "adult".
  it("keeps the counselling careers a bare 'drug' rule would refuse", () => {
    expect(check("drug counselor")).toBeNull();
    expect(check("drug and alcohol counselor")).toBeNull();
    expect(check("substance abuse counselor")).toBeNull();
    expect(check("addiction counselor")).toBeNull();
  });

  it("keeps ordinary careers whose spelling contains a blocked fragment", () => {
    for (const input of [
      "pharmacist",
      "security guard",
      "police officer",
      "gunsmith",
      "method actor",
      "construction manager",
      "consultant",
      "adult education teacher",
      "criminal defense lawyer",
      "forensic scientist",
      "corrections officer",
    ]) {
      expect(check(input), input).toBeNull();
    }
  });
});

describe("normal careers pass through untouched", () => {
  it("clears the careers the app is actually built for", () => {
    for (const input of [
      "registered nurse",
      "electrician",
      "software engineer",
      "welder",
      "teacher",
      "doctor",
      "graphic designer",
      "cloud engineer",
      "I want to be a mechanical engineer",
    ]) {
      expect(check(input), input).toBeNull();
    }
  });

  it("returns null for empty and whitespace-only input", () => {
    expect(blockedCareer("")).toBeNull();
    expect(blockedCareer("   ")).toBeNull();
  });
});

describe("resolveCareer carries the verdict", () => {
  it("flags a blocked career without throwing", () => {
    const resolved = resolveCareer("I want to be a hitman");
    expect(resolved.blocked).toBe("violence");
    // Still a normal resolution: the caller decides what refusal means.
    expect(resolved.canonical).toBe("Hitman");
  });

  it("leaves every ordinary career unflagged", () => {
    expect(resolveCareer("RN").blocked).toBeNull();
    expect(resolveCareer("Registered Nurse").blocked).toBeNull();
    expect(resolveCareer("underwater basket weaver").blocked).toBeNull();
  });

  it("judges what was typed, so no alias can launder a refused phrase", () => {
    // Punctuation and casing are normalized away before the check, so these
    // are the same input as far as the policy is concerned.
    expect(resolveCareer("Hit-Man!").blocked).toBe("violence");
    expect(resolveCareer("DRUG DEALER").blocked).toBe("drugs");
  });
});

describe("MAX_CAREER_INPUT", () => {
  it("is long enough for any real job title", () => {
    expect(MAX_CAREER_INPUT).toBeGreaterThan(
      "certified registered nurse anesthetist".length
    );
  });
});
