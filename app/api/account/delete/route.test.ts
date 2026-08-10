import { describe, it, expect, vi, beforeEach } from "vitest";

// auth(), the database and bcrypt are all mocked at the boundary, matching
// app/api/pathways/route.test.ts. The rate limiter is real, for the same reason
// it's real in the export test: it's in-process and it's part of the behaviour.

vi.mock("@/app/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/app/lib/db", () => ({
  db: { user: { findUnique: vi.fn(), delete: vi.fn() } },
}));
vi.mock("@/app/lib/password", () => ({ verifyPassword: vi.fn() }));

import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { verifyPassword } from "@/app/lib/password";
import { _resetRateLimits } from "@/app/lib/rateLimit";
import { POST } from "@/app/api/account/delete/route";

const makeRequest = (body: unknown) =>
  ({ headers: new Headers(), json: async () => body }) as any;

const USER_ROW = { id: "user-1", passwordHash: "$2a$12$hash" };

beforeEach(() => {
  _resetRateLimits();
  vi.mocked(auth).mockReset();
  vi.mocked(db.user.findUnique).mockReset();
  vi.mocked(db.user.delete).mockReset();
  vi.mocked(verifyPassword).mockReset();
});

describe("POST /api/account/delete", () => {
  it("requires a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const response = await POST(makeRequest({ password: "correct horse" }));
    expect(response.status).toBe(401);
    expect(db.user.delete).not.toHaveBeenCalled();
  });

  it("refuses a session with no password — a cookie alone can't delete", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
    expect(db.user.delete).not.toHaveBeenCalled();
  });

  it("refuses a wrong password", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(db.user.findUnique).mockResolvedValue(USER_ROW as any);
    vi.mocked(verifyPassword).mockResolvedValue(false);

    const response = await POST(makeRequest({ password: "wrong" }));

    expect(response.status).toBe(401);
    expect(db.user.delete).not.toHaveBeenCalled();
  });

  it("explains itself rather than crashing on an OAuth-only account", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "user-1", passwordHash: null } as any);

    const response = await POST(makeRequest({ password: "anything" }));

    expect(response.status).toBe(409);
    expect((await response.json()).error).toMatch(/Google/);
    expect(verifyPassword).not.toHaveBeenCalled();
    expect(db.user.delete).not.toHaveBeenCalled();
  });

  it("404s when the session points at a row that no longer exists", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(db.user.findUnique).mockResolvedValue(null as any);

    const response = await POST(makeRequest({ password: "correct horse" }));

    expect(response.status).toBe(404);
    expect(db.user.delete).not.toHaveBeenCalled();
  });

  it("deletes only the signed-in user's row and tells the client to sign out", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(db.user.findUnique).mockResolvedValue(USER_ROW as any);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(db.user.delete).mockResolvedValue(USER_ROW as any);

    const response = await POST(makeRequest({ password: "correct horse" }));

    expect(response.status).toBe(200);
    expect(db.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
    expect(await response.json()).toEqual({ deleted: true, signOut: true });
  });

  it("rate-limits repeated attempts from one address", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(db.user.findUnique).mockResolvedValue(USER_ROW as any);
    vi.mocked(verifyPassword).mockResolvedValue(false);

    for (let i = 0; i < 10; i++) {
      expect((await POST(makeRequest({ password: "guess" }))).status).toBe(401);
    }

    const limited = await POST(makeRequest({ password: "guess" }));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBeTruthy();
  });
});
