import type { NextAuthConfig } from "next-auth";

// The Edge-safe half of the auth config — used ONLY by middleware.ts.
//
// Next.js middleware always runs in the Edge Runtime, which can't run
// bcryptjs (needs Node's setImmediate) or the standard Prisma Postgres driver
// (needs a raw TCP socket). Both of those live behind the Credentials
// provider and the Prisma adapter in the full config (auth.ts) — so this file
// deliberately omits them. Middleware only needs to answer one question ("is
// there a valid session cookie"), which reading and verifying a JWT can do on
// its own, with no database round trip and no password check involved.
//
// Splitting this out is the documented Auth.js v5 pattern for exactly this
// problem, not a project-specific workaround:
// https://authjs.dev/guides/edge-compatibility
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
};
