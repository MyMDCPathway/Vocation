// One JSON shape for "the database didn't answer".
//
// Every route that touches Prisma used to let a driver error escape. Nothing
// leaked — Next's default 500 carries no stack — but the response body is
// HTML, and every client in this app calls `await response.json()` on a failed
// request. So a Neon connection-limit blip surfaced to the student as a JSON
// parse error, which says nothing about what happened, and to the operator as
// nothing at all.
//
// Wrapping is deliberately at the handler boundary rather than around each
// query: the routes read clearly as straight-line code, and there is no
// per-query recovery to do here anyway. The only useful answer to "Postgres is
// unreachable" is to say so honestly and let the caller retry.

import { NextResponse } from "next/server";

/**
 * Prisma's error classes are all named PrismaClient*, and its known request
 * errors additionally carry a `code` like "P2021" (table does not exist) or
 * "P1001" (can't reach database).
 *
 * Checked by name rather than `instanceof` so this module doesn't have to
 * import the Prisma namespace — that would pull the generated client into the
 * module graph of anything that imports this, including tests that have no
 * database.
 */
function isDatabaseError(error: unknown): boolean {
  const name = (error as { name?: unknown } | null)?.name;
  return typeof name === "string" && name.startsWith("PrismaClient");
}

/**
 * Wraps a route handler so a thrown database error becomes JSON instead of
 * Next's HTML error page.
 *
 * 503 for a database failure, because it is transient and retrying is the
 * right thing for a caller to do. 500 for anything else, which is a bug in
 * this app and won't be fixed by trying again. Both bodies use the `error`
 * key every other route in this app returns, so existing client-side error
 * handling reads them without a special case.
 *
 * The message is deliberately generic. The detail goes to the log, where the
 * operator can see it, and not to the response, where it would tell a stranger
 * about our schema.
 */
export function withDbErrors<A extends unknown[], R extends Response>(
  handler: (...args: A) => Promise<R>
): (...args: A) => Promise<R | NextResponse> {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (isDatabaseError(error)) {
        console.error(
          "[db] request failed:",
          (error as { code?: string }).code ?? "",
          error instanceof Error ? error.message : error
        );
        return NextResponse.json(
          { error: "We couldn't reach the database just now. Please try again." },
          { status: 503 }
        );
      }

      console.error("[route] unhandled error:", error);
      return NextResponse.json(
        { error: "Something went wrong on our end." },
        { status: 500 }
      );
    }
  };
}
