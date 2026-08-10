import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/app/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/app/lib/db", () => ({
  db: { savedPathway: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() } },
}));

import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { GET, PATCH, DELETE } from "@/app/api/pathways/[id]/route";

const ctx = { params: { id: "p1" } };
const makeGetRequest = () => ({}) as any;
const makePatchRequest = (body: unknown) => ({ json: async () => body }) as any;

beforeEach(() => {
  vi.mocked(auth).mockReset();
  vi.mocked(db.savedPathway.findFirst).mockReset();
  vi.mocked(db.savedPathway.update).mockReset();
  vi.mocked(db.savedPathway.delete).mockReset();
});

describe("GET /api/pathways/[id]", () => {
  it("requires a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const response = await GET(makeGetRequest(), ctx);
    expect(response.status).toBe(401);
  });

  it("404s rather than 403s when the row belongs to someone else (findFirst scoped by userId returns null)", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(db.savedPathway.findFirst).mockResolvedValue(null);

    const response = await GET(makeGetRequest(), ctx);
    expect(response.status).toBe(404);
    expect(db.savedPathway.findFirst).toHaveBeenCalledWith({
      where: { id: "p1", userId: "user-1" },
    });
  });

  it("returns the row when it's owned by the signed-in user", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    const row = { id: "p1", userId: "user-1", career: "Nurse" };
    vi.mocked(db.savedPathway.findFirst).mockResolvedValue(row as any);

    const response = await GET(makeGetRequest(), ctx);
    const body = await response.json();
    expect(body.pathway).toEqual(row);
  });
});

describe("PATCH /api/pathways/[id]", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(db.savedPathway.findFirst).mockResolvedValue({ id: "p1", userId: "user-1" } as any);
  });

  it("404s for a row not owned by the caller", async () => {
    vi.mocked(db.savedPathway.findFirst).mockResolvedValue(null);
    const response = await PATCH(makePatchRequest({ notes: "hi" }), ctx);
    expect(response.status).toBe(404);
    expect(db.savedPathway.update).not.toHaveBeenCalled();
  });

  it("rejects a body with none of the mutable fields", async () => {
    const response = await PATCH(makePatchRequest({}), ctx);
    expect(response.status).toBe(400);
  });

  it("never accepts `data` as a mutable field — edits live in their own column", async () => {
    vi.mocked(db.savedPathway.update).mockResolvedValue({} as any);
    await PATCH(makePatchRequest({ notes: "keep this", data: { title: "hacked" } }), ctx);
    const call = vi.mocked(db.savedPathway.update).mock.calls[0][0];
    expect(call.data).not.toHaveProperty("data");
    expect(call.data.notes).toBe("keep this");
  });

  it("updates edits with a real steps array", async () => {
    vi.mocked(db.savedPathway.update).mockResolvedValue({} as any);
    const edits = { steps: [{ type: "degree", level: "Associate", name: "X", description: "" }] };
    await PATCH(makePatchRequest({ edits }), ctx);
    expect(db.savedPathway.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { edits },
    });
  });

  it("rejects edits without a steps array", async () => {
    const response = await PATCH(makePatchRequest({ edits: { foo: "bar" } }), ctx);
    expect(response.status).toBe(400);
  });

  it("clears edits with Prisma's JsonNull sentinel, not a plain null (reset to original)", async () => {
    // A plain JS null is a no-op to Prisma's query engine for a JSON column
    // — it must be Prisma.JsonNull or "reset to original" silently does
    // nothing while reporting success.
    vi.mocked(db.savedPathway.update).mockResolvedValue({} as any);
    await PATCH(makePatchRequest({ edits: null }), ctx);
    expect(db.savedPathway.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { edits: Prisma.JsonNull },
    });
  });

  it("toggles archived", async () => {
    vi.mocked(db.savedPathway.update).mockResolvedValue({} as any);
    await PATCH(makePatchRequest({ archived: true }), ctx);
    expect(db.savedPathway.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { archived: true },
    });
  });
});

describe("DELETE /api/pathways/[id]", () => {
  it("requires a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const response = await DELETE(makeGetRequest(), ctx);
    expect(response.status).toBe(401);
  });

  it("404s for a row not owned by the caller", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(db.savedPathway.findFirst).mockResolvedValue(null);
    const response = await DELETE(makeGetRequest(), ctx);
    expect(response.status).toBe(404);
    expect(db.savedPathway.delete).not.toHaveBeenCalled();
  });

  it("deletes an owned row", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(db.savedPathway.findFirst).mockResolvedValue({ id: "p1", userId: "user-1" } as any);
    vi.mocked(db.savedPathway.delete).mockResolvedValue({} as any);

    const response = await DELETE(makeGetRequest(), ctx);
    expect(response.status).toBe(200);
    expect(db.savedPathway.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
  });
});
