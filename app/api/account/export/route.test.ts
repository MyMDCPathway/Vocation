import { describe, it, expect, vi, beforeEach } from "vitest";

// Same "mock the boundary, not the logic" shape as app/api/pathways/route.test.ts:
// auth() returns whatever session the test sets and db is a set of vi.fn()
// stand-ins. The rate limiter is deliberately NOT mocked — it's in-process, and
// the whole point of the export limit is that it actually fires.

vi.mock("@/app/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/app/lib/db", () => ({
  db: { user: { findUnique: vi.fn() }, savedPathway: { findMany: vi.fn() } },
}));

import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { _resetRateLimits } from "@/app/lib/rateLimit";
import { GET } from "@/app/api/account/export/route";

const makeRequest = () => ({ headers: new Headers() }) as any;

const USER_ROW = {
  id: "user-1",
  name: "Ada",
  email: "ada@example.com",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  accountType: "student",
  interests: ["health"],
  goals: ["transfer"],
  postalCode: "33132",
  countryCode: "US",
  savedIntake: { career: "Nurse" },
};

beforeEach(() => {
  _resetRateLimits();
  vi.mocked(auth).mockReset();
  vi.mocked(db.user.findUnique).mockReset();
  vi.mocked(db.savedPathway.findMany).mockReset();
});

describe("GET /api/account/export", () => {
  it("requires a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("scopes both reads to the signed-in user", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(db.user.findUnique).mockResolvedValue(USER_ROW as any);
    vi.mocked(db.savedPathway.findMany).mockResolvedValue([]);

    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    expect(db.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user-1" } })
    );
    expect(db.savedPathway.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } })
    );
  });

  it("never selects passwordHash, and selects no field it hasn't named", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(db.user.findUnique).mockResolvedValue(USER_ROW as any);
    vi.mocked(db.savedPathway.findMany).mockResolvedValue([]);

    await GET(makeRequest());

    const select = vi.mocked(db.user.findUnique).mock.calls[0][0].select as Record<
      string,
      unknown
    >;
    expect(select).toBeDefined();
    expect(select.passwordHash).toBeUndefined();
    // The guard that matters: an `include` of accounts/sessions would drag
    // OAuth tokens and session tokens into the file.
    expect(
      (vi.mocked(db.user.findUnique).mock.calls[0][0] as any).include
    ).toBeUndefined();
  });

  it("downloads as a file rather than rendering in the tab", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(db.user.findUnique).mockResolvedValue(USER_ROW as any);
    vi.mocked(db.savedPathway.findMany).mockResolvedValue([]);

    const response = await GET(makeRequest());

    expect(response.headers.get("Content-Disposition")).toContain("attachment");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns the user row and the saved pathways together", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(db.user.findUnique).mockResolvedValue(USER_ROW as any);
    vi.mocked(db.savedPathway.findMany).mockResolvedValue([{ id: "p1" }] as any);

    const body = await (await GET(makeRequest())).json();

    expect(body.user.email).toBe("ada@example.com");
    expect(body.user.savedIntake).toEqual({ career: "Nurse" });
    expect(body.savedPathways).toHaveLength(1);
    expect(body.exportedAt).toBeTypeOf("string");
  });

  it("404s when the session points at a row that no longer exists", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(db.user.findUnique).mockResolvedValue(null as any);

    const response = await GET(makeRequest());

    expect(response.status).toBe(404);
    expect(db.savedPathway.findMany).not.toHaveBeenCalled();
  });

  it("rate-limits repeated exports from one address", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(db.user.findUnique).mockResolvedValue(USER_ROW as any);
    vi.mocked(db.savedPathway.findMany).mockResolvedValue([]);

    for (let i = 0; i < 5; i++) {
      expect((await GET(makeRequest())).status).toBe(200);
    }

    const limited = await GET(makeRequest());
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBeTruthy();
  });
});
