import { describe, it, expect, vi, beforeEach } from "vitest";

// This is the first database-backed route in the test suite — everything
// before it was JSON/cache-based (HANDOFF §5, §15). Neither auth() nor a real
// Postgres connection belongs in a unit test, so both are mocked: auth()
// returns whatever session the test sets, and db.savedPathway is a set of
// vi.fn() stand-ins asserted against directly, the same "mock the boundary,
// not the logic" shape route.test.ts files elsewhere in this repo already
// use for fetch and Gemini.

vi.mock("@/app/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/app/lib/db", () => ({
  db: { savedPathway: { findMany: vi.fn(), create: vi.fn() } },
}));

import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { GET, POST } from "@/app/api/pathways/route";

const makeGetRequest = (query = "") =>
  ({ nextUrl: new URL(`http://localhost/api/pathways${query}`) }) as any;
const makePostRequest = (body: unknown) => ({ json: async () => body }) as any;

const SAVE_BODY = {
  career: "Registered Nurse",
  schoolId: "mdc",
  schoolName: "Miami Dade College",
  data: { title: "Nursing (A.S.)", steps: [{ type: "degree", level: "Associate", name: "Nursing", description: "" }] },
};

beforeEach(() => {
  vi.mocked(auth).mockReset();
  vi.mocked(db.savedPathway.findMany).mockReset();
  vi.mocked(db.savedPathway.create).mockReset();
});

describe("GET /api/pathways", () => {
  it("requires a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(401);
    expect(db.savedPathway.findMany).not.toHaveBeenCalled();
  });

  it("scopes the query to the signed-in user and excludes archived by default", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(db.savedPathway.findMany).mockResolvedValue([]);

    await GET(makeGetRequest());

    expect(db.savedPathway.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1", archived: false } })
    );
  });

  it("includes archived rows only when explicitly asked", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(db.savedPathway.findMany).mockResolvedValue([]);

    await GET(makeGetRequest("?archived=1"));

    expect(db.savedPathway.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } })
    );
  });
});

describe("POST /api/pathways", () => {
  it("requires a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const response = await POST(makePostRequest(SAVE_BODY));
    expect(response.status).toBe(401);
    expect(db.savedPathway.create).not.toHaveBeenCalled();
  });

  it("rejects a body missing required fields", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    const response = await POST(makePostRequest({ career: "Nurse" }));
    expect(response.status).toBe(400);
    expect(db.savedPathway.create).not.toHaveBeenCalled();
  });

  it("creates the row scoped to the signed-in user", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(db.savedPathway.create).mockResolvedValue({ id: "p1", ...SAVE_BODY } as any);

    const response = await POST(makePostRequest(SAVE_BODY));
    expect(response.status).toBe(201);
    expect(db.savedPathway.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        career: SAVE_BODY.career,
        schoolId: SAVE_BODY.schoolId,
        schoolName: SAVE_BODY.schoolName,
        data: SAVE_BODY.data,
      },
    });
  });
});
