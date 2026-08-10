import { describe, it, expect, vi, beforeEach } from "vitest";

// Prisma is mocked at the boundary — the point of these tests is WHAT gets
// handed to the update call, not that Prisma performs it.
vi.mock("@/app/lib/db", () => ({
  db: { user: { update: vi.fn() } },
}));

import { db } from "@/app/lib/db";
import { adoptIntake, adoptableIntake } from "@/app/lib/intakeAdoption";
import type { IntakeAnswers } from "@/app/lib/intake";

const FULL_INTAKE: IntakeAnswers = {
  career: { raw: "nurse", resolved: "Registered Nurse" },
  location: {
    countryCode: "US",
    subdivision: "FL",
    city: "Miami",
    postalCode: "33132",
    latitude: 25.77,
    longitude: -80.19,
  },
  educationLevel: "in-high-school",
  dependencyFlags: ["foster-or-ward"],
  dependencyAnswered: true,
  incomeBand: "under-30k",
  householdSize: 5,
  budgetPriority: "lowest-cost",
  desiredSchools: [{ id: "mdc", name: "Miami Dade College" } as never],
  discoveredSchools: [{ id: "fiu", name: "FIU" } as never],
};

beforeEach(() => {
  vi.mocked(db.user.update).mockReset();
  vi.mocked(db.user.update).mockResolvedValue({} as never);
});

describe("adoptableIntake", () => {
  it("keeps the answers an account has a reason to remember", () => {
    expect(adoptableIntake(FULL_INTAKE)).toEqual({
      career: { raw: "nurse", resolved: "Registered Nurse" },
      educationLevel: "in-high-school",
      budgetPriority: "lowest-cost",
    });
  });

  it("never carries income, household size, or dependency status", () => {
    const kept = adoptableIntake(FULL_INTAKE) as Record<string, unknown>;

    // Named one by one rather than checked in a loop: if any of these ever
    // starts passing through again, the failing test should say which.
    expect(kept).not.toHaveProperty("incomeBand");
    expect(kept).not.toHaveProperty("householdSize");
    expect(kept).not.toHaveProperty("dependencyFlags");
    expect(kept).not.toHaveProperty("dependencyAnswered");

    // And the values themselves are nowhere in the serialised result, in case
    // a future field smuggles them through under another name.
    const serialised = JSON.stringify(kept);
    expect(serialised).not.toContain("under-30k");
    expect(serialised).not.toContain("foster-or-ward");
  });

  it("is an allowlist, so a newly added field is not stored by default", () => {
    // Stands in for the next answer someone adds to IntakeAnswers. A denylist
    // would let this through; an allowlist has to be edited to admit it.
    const withNewField = {
      ...FULL_INTAKE,
      dateOfBirth: "2009-04-11",
    } as IntakeAnswers;

    expect(adoptableIntake(withNewField)).not.toHaveProperty("dateOfBirth");
  });

  it("drops location, which is stored in real columns instead", () => {
    expect(adoptableIntake(FULL_INTAKE)).not.toHaveProperty("location");
  });

  it("omits keys the student never answered rather than writing them empty", () => {
    expect(adoptableIntake({ educationLevel: "bachelor" })).toEqual({
      educationLevel: "bachelor",
    });
  });
});

describe("adoptIntake", () => {
  it("writes only the allowlisted answers to savedIntake", async () => {
    await adoptIntake("user-1", FULL_INTAKE);

    const { data } = vi.mocked(db.user.update).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };

    expect(data.savedIntake).toEqual({
      career: { raw: "nurse", resolved: "Registered Nurse" },
      educationLevel: "in-high-school",
      budgetPriority: "lowest-cost",
    });
    expect(JSON.stringify(data.savedIntake)).not.toContain("under-30k");
  });

  it("still lifts postal and country code into their own columns", async () => {
    await adoptIntake("user-1", FULL_INTAKE);

    const { data } = vi.mocked(db.user.update).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };

    expect(data.postalCode).toBe("33132");
    expect(data.countryCode).toBe("US");
  });

  it("does not touch the row for an empty or missing intake", async () => {
    await adoptIntake("user-1", undefined);
    await adoptIntake("user-1", null);
    await adoptIntake("user-1", {});

    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("writes an empty snapshot when the student only answered finances", async () => {
    // The financial answers are the only thing in this intake, so nothing
    // survives the allowlist — and crucially, nothing is what gets stored.
    await adoptIntake("user-1", { incomeBand: "over-150k", householdSize: 2 });

    const { data } = vi.mocked(db.user.update).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };

    expect(data.savedIntake).toEqual({});
  });
});
