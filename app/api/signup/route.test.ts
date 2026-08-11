import { describe, it, expect, vi, beforeEach } from "vitest";

// Same "mock the boundary, not the logic" shape pathways/route.test.ts uses:
// db.user is a set of vi.fn() stand-ins, adoptIntake (a real Prisma write of
// its own) is mocked to a no-op, and the rate limiter's shared in-memory
// state is reset between tests since it persists across the whole module.

vi.mock("@/app/lib/db", () => ({
  db: { user: { findUnique: vi.fn(), create: vi.fn() } },
}));
vi.mock("@/app/lib/intakeAdoption", () => ({ adoptIntake: vi.fn() }));

import { db } from "@/app/lib/db";
import { adoptIntake } from "@/app/lib/intakeAdoption";
import { _resetRateLimits } from "@/app/lib/rateLimit";
import { POST } from "@/app/api/signup/route";

const makeRequest = (body: unknown, ip = "203.0.113.1") =>
  ({
    json: async () => body,
    headers: { get: (name: string) => (name === "x-forwarded-for" ? ip : null) },
  }) as any;

const VALID_BODY = {
  name: "Jane Doe",
  email: "jane@example.com",
  password: "correct horse battery staple",
  // The age-and-terms attestation the form sends. Part of the valid body
  // rather than opted into per-test, so any future test that forgets it fails
  // loudly instead of quietly exercising a path real signups can't reach.
  agreedToTerms: true,
};

beforeEach(() => {
  vi.mocked(db.user.findUnique).mockReset();
  vi.mocked(db.user.create).mockReset();
  vi.mocked(adoptIntake).mockReset();
  _resetRateLimits();
});

describe("POST /api/signup", () => {
  it("creates an account with valid details", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    vi.mocked(db.user.create).mockResolvedValue({ id: "user-1", email: VALID_BODY.email } as any);

    const response = await POST(makeRequest(VALID_BODY));

    expect(response.status).toBe(200);
    expect(db.user.create).toHaveBeenCalledOnce();
    expect(adoptIntake).toHaveBeenCalledWith("user-1", undefined);
  });

  it("refuses to create an account without the 13+/terms attestation", async () => {
    const { agreedToTerms, ...withoutAttestation } = VALID_BODY;
    const response = await POST(makeRequest(withoutAttestation));

    expect(response.status).toBe(400);
    // Before any database work: an under-13 signup must not reach a write.
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("does not accept a truthy non-true value as the attestation", async () => {
    // The check is `!== true`, not falsiness — "false", 1, or "yes" arriving
    // from a hand-rolled client must not read as consent.
    for (const value of ["true", 1, "yes", {}]) {
      vi.mocked(db.user.create).mockReset();
      const response = await POST(
        makeRequest({ ...VALID_BODY, agreedToTerms: value })
      );
      expect(response.status).toBe(400);
      expect(db.user.create).not.toHaveBeenCalled();
    }
  });

  it("rejects a short password before touching the database", async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, password: "short" }));
    expect(response.status).toBe(400);
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a common password even when it's 8+ characters", async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, password: "qwertyuiop" }));
    expect(response.status).toBe(400);
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("refuses an existing email with a vague message, not a specific one", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "existing" } as any);

    const response = await POST(makeRequest(VALID_BODY));
    const body = await response.json();

    expect(response.status).toBe(409);
    // Deliberately vague — see the route's own comment on why this can't say
    // "that email is taken" without becoming an enumeration oracle.
    expect(body.error.toLowerCase()).not.toContain("taken");
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("rate-limits repeated signups from the same IP", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    vi.mocked(db.user.create).mockResolvedValue({ id: "user-1", email: "x@example.com" } as any);

    // RATE_LIMIT_CONFIG.maxRequestsPerIP is 10 — exhaust it from one IP.
    for (let i = 0; i < 10; i++) {
      const response = await POST(makeRequest({ ...VALID_BODY, email: `x${i}@example.com` }, "198.51.100.9"));
      expect(response.status).toBe(200);
    }

    const blocked = await POST(makeRequest({ ...VALID_BODY, email: "one-more@example.com" }, "198.51.100.9"));
    expect(blocked.status).toBe(429);
    expect(db.user.create).toHaveBeenCalledTimes(10);
    // hashPassword isn't mocked here, so this is 10 real bcrypt hashes, not a
    // mocked instant loop. Comfortably under a second per hash on most
    // machines, but the default 5000ms test timeout has been observed to trip
    // under background load (a running dev server, a busy CI runner) — this
    // widens the budget rather than weakening what the test actually proves.
  }, 15_000);

  it("accepts a plain-object intake and passes it to adoptIntake", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    vi.mocked(db.user.create).mockResolvedValue({ id: "user-1", email: VALID_BODY.email } as any);

    const intake = { educationLevel: "bachelor" };
    const response = await POST(makeRequest({ ...VALID_BODY, intake }));

    expect(response.status).toBe(200);
    expect(adoptIntake).toHaveBeenCalledWith("user-1", intake);
  });

  // The intake is the one field a visitor can shape freely, and this route
  // needs no session — so it gets checked like everything else on the body.
  it.each([
    ["a string", "not an intake"],
    ["an array", [1, 2, 3]],
    ["a number", 42],
    ["a boolean", true],
  ])("rejects an intake that is %s", async (_label, intake) => {
    const response = await POST(makeRequest({ ...VALID_BODY, intake }));

    expect(response.status).toBe(400);
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(adoptIntake).not.toHaveBeenCalled();
  });

  it("rejects an oversized intake before hashing or touching the database", async () => {
    // Well past MAX_INTAKE_CHARS (32k) — an unauthenticated write of arbitrary
    // size into a JSONB column is exactly what the ceiling exists to stop.
    const oversized = { career: { raw: "x".repeat(40_000), resolved: "x" } };

    const response = await POST(makeRequest({ ...VALID_BODY, intake: oversized }));

    expect(response.status).toBe(400);
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(adoptIntake).not.toHaveBeenCalled();
  });

  it("still accepts a signup with no intake at all", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    vi.mocked(db.user.create).mockResolvedValue({ id: "user-1", email: VALID_BODY.email } as any);

    const response = await POST(makeRequest({ ...VALID_BODY, intake: null }));

    expect(response.status).toBe(200);
  });

  it("does not rate-limit a different IP", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    vi.mocked(db.user.create).mockResolvedValue({ id: "user-2", email: "other@example.com" } as any);

    for (let i = 0; i < 10; i++) {
      await POST(makeRequest({ ...VALID_BODY, email: `y${i}@example.com` }, "198.51.100.10"));
    }

    const fromAnotherIp = await POST(makeRequest({ ...VALID_BODY, email: "other@example.com" }, "198.51.100.11"));
    expect(fromAnotherIp.status).toBe(200);
    // Same real-bcrypt-loop reasoning as the test above: 11 genuine hashes,
    // not mocked, so this gets the same widened budget.
  }, 15_000);
});
