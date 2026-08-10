import { describe, it, expect } from "vitest";
import {
  matchOccupation,
  occupationByCode,
  occupationCount,
  MATCH_FLOOR,
} from "@/app/lib/blsOccupations";

describe("BLS occupation table", () => {
  it("ships the full detailed SOC list", () => {
    // 830 detailed occupations in the 2025 release. A number far below this
    // means the fetch script filtered on the wrong display_level.
    expect(occupationCount()).toBeGreaterThan(700);
  });
});

describe("occupationByCode", () => {
  it("resolves a real code with or without the printed hyphen", () => {
    expect(occupationByCode("29-1141")?.title).toMatch(/Registered Nurses/i);
    expect(occupationByCode("291141")?.title).toMatch(/Registered Nurses/i);
  });

  // The safety property the model hint depends on: a well-formed code that
  // BLS doesn't publish has to fail, or a hallucination becomes a wage table.
  it("rejects a well-formed code that BLS does not publish", () => {
    expect(occupationByCode("999999")).toBeNull();
  });

  it("rejects malformed input", () => {
    expect(occupationByCode("29")).toBeNull();
    expect(occupationByCode("")).toBeNull();
    expect(occupationByCode(undefined)).toBeNull();
  });
});

describe("matchOccupation", () => {
  it("matches the careers students actually type", () => {
    const cases: [string, RegExp][] = [
      ["registered nurse", /Registered Nurses/i],
      ["electrician", /Electricians/i],
      ["pediatrician", /Pediatricians/i],
      ["welder", /Welders/i],
      ["software developer", /Software Developers/i],
      ["dental hygienist", /Dental Hygienists/i],
      ["firefighter", /Firefighters/i],
      ["paralegal", /Paralegals/i],
      ["air traffic controller", /Air Traffic Controllers/i],
      ["respiratory therapist", /Respiratory Therapists/i],
    ];

    for (const [query, expected] of cases) {
      const match = matchOccupation(query);
      expect(match, `no match for "${query}"`).not.toBeNull();
      expect(match!.title, `"${query}" matched "${match!.title}"`).toMatch(expected);
    }
  });

  it("prefers the more specific title when both would cover the query", () => {
    // "Registered Nurses" also contains "nurse"; the specific one must win.
    expect(matchOccupation("nurse anesthetist")!.title).toMatch(/Anesthetist/i);
    expect(matchOccupation("nurse practitioner")!.title).toMatch(/Practitioner/i);
  });

  it("declines when BLS has no comparable occupation", () => {
    // BLS surveys no esports category. The nearest survivor is "Coaches and
    // Scouts", whose pay describes a different job — showing it would be worse
    // than showing nothing.
    for (const query of ["esports player", "asdfghjkl", ""]) {
      const match = matchOccupation(query);
      if (match) expect(match.score).toBeGreaterThanOrEqual(MATCH_FLOOR);
      else expect(match).toBeNull();
    }
    expect(matchOccupation("asdfghjkl")).toBeNull();
    expect(matchOccupation("")).toBeNull();
  });

  it("uses a valid model hint when local matching is unsure", () => {
    // A phrase local scoring can't place, plus the correct code.
    const match = matchOccupation("sparky", "47-2111");
    expect(match?.title).toMatch(/Electricians/i);
    expect(match?.via).toBe("hint");
  });

  it("ignores a hint that BLS does not publish", () => {
    const match = matchOccupation("registered nurse", "99-9999");
    expect(match?.title).toMatch(/Registered Nurses/i);
    expect(match?.via).not.toBe("hint");
  });

  it("lets a confident local match overrule a plausible wrong hint", () => {
    // 47-2111 is a real code (electricians) but the student said "welder".
    const match = matchOccupation("welders cutters solderers brazers", "47-2111");
    expect(match?.title).toMatch(/Welders/i);
  });

  it("is not thrown by punctuation or casing", () => {
    expect(matchOccupation("Registered Nurse!")?.title).toMatch(/Registered Nurses/i);
    expect(matchOccupation("  ELECTRICIAN  ")?.title).toMatch(/Electricians/i);
  });
});
