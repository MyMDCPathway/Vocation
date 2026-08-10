import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { withDbErrors } from "@/app/lib/withDbErrors";

// Mocked at the module level rather than with vi.spyOn: the SDK's exports are
// a frozen ES module namespace, so spyOn fails with "Cannot redefine property".
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

/** Shaped like a real Prisma failure: the class name is what's checked. */
function prismaError(name: string, code?: string) {
  const e = new Error("connection refused");
  e.name = name;
  if (code) (e as unknown as { code: string }).code = code;
  return e;
}

describe("withDbErrors", () => {
  beforeEach(() => {
    // The wrapper logs deliberately; keep the test output readable.
    vi.spyOn(console, "error").mockImplementation(() => {});
    // Module mocks persist across tests; clear call history so each assertion
    // sees only its own invocation.
    vi.mocked(Sentry.captureException).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes a successful response through untouched", async () => {
    const handler = vi.fn(async () => NextResponse.json({ ok: true }, { status: 201 }));
    const res = await withDbErrors(handler)();

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("forwards every argument to the wrapped handler", async () => {
    // Route handlers take (request, context) — the [id] routes rely on the
    // second argument, so dropping it would break them silently.
    const handler = vi.fn(async (_a: unknown, _b: unknown) => NextResponse.json({}));
    const ctx = { params: { id: "abc" } };
    await withDbErrors(handler)("request", ctx);

    expect(handler).toHaveBeenCalledWith("request", ctx);
  });

  it.each([
    ["PrismaClientKnownRequestError", "P2021"],
    ["PrismaClientInitializationError", "P1001"],
    ["PrismaClientRustPanicError", undefined],
    ["PrismaClientUnknownRequestError", undefined],
  ])("turns a %s into a JSON 503", async (name, code) => {
    const res = await withDbErrors(async () => {
      throw prismaError(name, code);
    })();

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/database/i);
  });

  it.each([
    ["DYNAMIC_SERVER_USAGE", "a build-time dynamic-route probe"],
    ["NEXT_REDIRECT;replace;/login;307;", "redirect()"],
    ["NEXT_NOT_FOUND", "notFound()"],
  ])("re-throws %s rather than answering it", async (digest) => {
    // Next signals by throwing. Catching these breaks the framework: the
    // first version of this wrapper turned /api/account/export's
    // DynamicServerError into a 500 during `next build`, logging a fake
    // failure and swallowing the signal Next needed to mark the route
    // dynamic.
    const signal = Object.assign(new Error("next internal"), { digest });

    await expect(
      withDbErrors(async () => {
        throw signal;
      })()
    ).rejects.toBe(signal);
  });

  it("turns any other thrown error into a JSON 500", async () => {
    const res = await withDbErrors(async () => {
      throw new TypeError("undefined is not a function");
    })();

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBeTruthy();
  });

  it("never puts the underlying error text in the response body", async () => {
    // The detail belongs in the log, not in something a stranger can read.
    const res = await withDbErrors(async () => {
      throw prismaError("PrismaClientKnownRequestError", "P2021");
    })();

    const body = JSON.stringify(await res.json());
    expect(body).not.toContain("connection refused");
    expect(body).not.toContain("P2021");
  });

  it("reports the error to Sentry, since catching it hides it otherwise", async () => {
    // Sentry's automatic instrumentation only sees what escapes the handler.
    // Without an explicit capture here, wrapping these routes would have made
    // database failures LESS visible than before it existed.
    const boom = prismaError("PrismaClientKnownRequestError", "P1001");

    await withDbErrors(async () => {
      throw boom;
    })();

    expect(Sentry.captureException).toHaveBeenCalledWith(boom);
  });

  it("does not report Next's own control-flow throws to Sentry", async () => {
    // redirect() and notFound() are normal app behaviour. Reporting them would
    // fill the dashboard with noise on every redirect.
    await expect(
      withDbErrors(async () => {
        throw Object.assign(new Error("next internal"), { digest: "NEXT_NOT_FOUND" });
      })()
    ).rejects.toThrow();

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("uses the same `error` key the rest of the app returns", async () => {
    // Client code across the app reads `errorData.error`; a different shape
    // here would mean every caller needs a special case.
    const res = await withDbErrors(async () => {
      throw prismaError("PrismaClientInitializationError");
    })();

    expect(Object.keys(await res.json())).toContain("error");
  });
});
