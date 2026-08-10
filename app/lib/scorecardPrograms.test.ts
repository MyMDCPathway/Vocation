import { describe, it, expect, afterEach } from "vitest";
import {
  scorecardProgramsAvailable,
  scorecardProgramsMeta,
  toCip4,
  earningsForProgram,
  _setProgramsSnapshotForTests,
} from "@/app/lib/scorecardPrograms";

const FIXTURE = {
  fetchedAt: "2026-08-10",
  source: "US Dept. of Education College Scorecard API (collegescorecard.ed.gov), field of study",
  scope: "FL",
  schoolCount: 1,
  count: 5,
  programs: [
    // Certificate-level row for unitId 1, cip4 "0106" — school-specific
    // earnings suppressed (null), national benchmark present. Mirrors the
    // real, live-observed shape (~65% of rows are suppressed this way).
    {
      unitId: 1,
      cip4: "0106",
      cipTitle: "Applied Horticulture and Horticultural Business Services.",
      credentialLevel: 1,
      credentialTitle: "Undergraduate Certificate or Diploma",
      schoolMedianEarnings: null,
      nationalMedianEarnings: 37705,
    },
    // Associate's-level row, same school and cip4 family — both figures
    // present, confirming earnings are keyed by credential, not cip4 alone.
    {
      unitId: 1,
      cip4: "0106",
      cipTitle: "Applied Horticulture and Horticultural Business Services.",
      credentialLevel: 2,
      credentialTitle: "Associate's Degree",
      schoolMedianEarnings: 41000,
      nationalMedianEarnings: 45283,
    },
    // Doctoral-level row for a "graduate" program — no master's row exists
    // at this school for this cip4, so the fallback order must skip past
    // master's (5) straight to doctoral (6).
    {
      unitId: 1,
      cip4: "1101",
      cipTitle: "Computer and Information Sciences, General.",
      credentialLevel: 6,
      credentialTitle: "Doctoral Degree",
      schoolMedianEarnings: 92000,
      nationalMedianEarnings: 88000,
    },
    // Second school, same cip4, to prove the lookup is scoped by unitId.
    {
      unitId: 2,
      cip4: "0106",
      cipTitle: "Applied Horticulture and Horticultural Business Services.",
      credentialLevel: 1,
      credentialTitle: "Undergraduate Certificate or Diploma",
      schoolMedianEarnings: 30000,
      nationalMedianEarnings: 37705,
    },
    // Non-credential row (Scorecard level 99) — must never be matched by any
    // of our ProgramLevel values, since none of them map to it.
    {
      unitId: 1,
      cip4: "1301",
      cipTitle: "Education, General.",
      credentialLevel: 99,
      credentialTitle: "Non-Credential Program",
      schoolMedianEarnings: 25000,
      nationalMedianEarnings: 28000,
    },
  ],
};

const EMPTY_SNAPSHOT = {
  fetchedAt: null,
  source: "US Dept. of Education College Scorecard API (collegescorecard.ed.gov), field of study",
  scope: "none",
  schoolCount: 0,
  count: 0,
  programs: [],
};

afterEach(() => {
  _setProgramsSnapshotForTests(null);
});

describe("scorecardProgramsAvailable", () => {
  it("is false against an empty snapshot (no key run yet)", () => {
    _setProgramsSnapshotForTests(EMPTY_SNAPSHOT);
    expect(scorecardProgramsAvailable()).toBe(false);
  });

  it("is true once a real snapshot is loaded", () => {
    _setProgramsSnapshotForTests(FIXTURE);
    expect(scorecardProgramsAvailable()).toBe(true);
  });

  it("is true against the real committed snapshot", () => {
    // data/scorecard-programs.json holds a real Florida field-of-study pull
    // as of this test (see scripts/fetch-scorecard-programs.mjs). If this
    // ever goes back to false, someone replaced real data with the empty
    // placeholder by mistake.
    expect(scorecardProgramsAvailable()).toBe(true);
  });
});

describe("scorecardProgramsMeta", () => {
  it("always carries provenance, even when empty", () => {
    _setProgramsSnapshotForTests(EMPTY_SNAPSHOT);
    const meta = scorecardProgramsMeta();
    expect(meta.source).toMatch(/College Scorecard/);
    expect(meta.count).toBe(0);
  });
});

describe("toCip4", () => {
  it("strips the dot and takes the first four characters", () => {
    // Live-confirmed: three distinct 6-digit crosswalk codes collapse into
    // this one Scorecard bucket.
    expect(toCip4("01.0601")).toBe("0106");
    expect(toCip4("01.0605")).toBe("0106");
    expect(toCip4("01.0607")).toBe("0106");
  });

  it("leaves an already-4-digit-equivalent code unchanged in shape", () => {
    expect(toCip4("11.0101")).toBe("1101");
  });
});

describe("earningsForProgram", () => {
  it("returns the exact row for a matching (unitId, cip4, level)", () => {
    _setProgramsSnapshotForTests(FIXTURE);
    const row = earningsForProgram(1, "01.0605", "associate");
    // 01.0605 truncates to the same "0106" bucket as the fixture's rows.
    expect(row?.schoolMedianEarnings).toBe(41000);
    expect(row?.nationalMedianEarnings).toBe(45283);
  });

  it("returns the row even when school-specific earnings are suppressed", () => {
    // Rule 1: the row itself is real (it's what Scorecard reported), even
    // though its school figure is null. Callers decide what to do with a
    // null school figure — this function must not hide the row.
    _setProgramsSnapshotForTests(FIXTURE);
    const row = earningsForProgram(1, "01.0601", "certificate");
    expect(row).toBeDefined();
    expect(row?.schoolMedianEarnings).toBeNull();
    expect(row?.nationalMedianEarnings).toBe(37705);
  });

  it("is scoped by unitId — never returns another school's figures", () => {
    _setProgramsSnapshotForTests(FIXTURE);
    const school1 = earningsForProgram(1, "01.0601", "certificate");
    const school2 = earningsForProgram(2, "01.0601", "certificate");
    expect(school1?.schoolMedianEarnings).toBeNull();
    expect(school2?.schoolMedianEarnings).toBe(30000);
  });

  it("falls back through the graduate credential order when master's is absent", () => {
    // Fixture has only a doctoral (6) row for unitId 1 / cip4 1101 — no
    // master's (5). The lookup must not stop at the first level and give up;
    // it must keep trying the documented fallback order.
    _setProgramsSnapshotForTests(FIXTURE);
    const row = earningsForProgram(1, "11.0101", "graduate");
    expect(row?.credentialTitle).toBe("Doctoral Degree");
    expect(row?.schoolMedianEarnings).toBe(92000);
  });

  it("never matches Scorecard's non-credential level 99", () => {
    // A "certificate" program must not accidentally pick up the 99 row —
    // none of LEVEL_MAP's arrays contain 99.
    _setProgramsSnapshotForTests(FIXTURE);
    expect(earningsForProgram(1, "13.0101", "certificate")).toBeUndefined();
    expect(earningsForProgram(1, "13.0101", "graduate")).toBeUndefined();
  });

  it("returns undefined when the school has no row for this program family at all", () => {
    _setProgramsSnapshotForTests(FIXTURE);
    expect(earningsForProgram(1, "51.9999", "bachelor")).toBeUndefined();
  });

  it("returns undefined when the school offers the program family but not at this credential level", () => {
    // unitId 1 / cip4 "0106" has certificate and associate's rows, but no
    // bachelor's row — must not fall back to a different level than the one
    // requested for certificate/associate/bachelor (only "graduate" has a
    // documented fallback chain).
    _setProgramsSnapshotForTests(FIXTURE);
    expect(earningsForProgram(1, "01.0601", "bachelor")).toBeUndefined();
  });
});
