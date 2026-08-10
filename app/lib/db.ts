import { PrismaClient } from "@prisma/client";

// The Prisma client singleton.
//
// Next.js hot-reloads route modules in dev, which would otherwise construct a
// fresh PrismaClient — and a fresh connection pool — on every save, until the
// database refuses new connections. Stashing the instance on `globalThis`
// survives the reload; production has one long-lived process per lambda, so
// this is a no-op there and the client is created exactly once either way.
//
// This is the standard Prisma-with-Next.js pattern, not a project invention:
// https://www.prisma.io/docs/guides/nextjs

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
