import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/app/lib/auth.config";

// Route protection, scoped to exactly one path: /onboarding.
//
// Everything else — the intake, /start, /plan, /pathway — stays reachable
// with zero interaction with accounts. Signup must never become a wall in
// front of the free core plan (PRODUCT.md, DESIGN.md's Do's and Don'ts). The
// only thing an account genuinely gates is its own setup step.
//
// Built from authConfig, NOT the full app/lib/auth.ts — middleware runs in
// the Edge Runtime, which can't load bcryptjs or the standard Prisma driver
// that the full config pulls in via the Credentials provider and the Prisma
// adapter. This lighter instance only reads and verifies the session JWT,
// which is all a route guard needs.
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const isOnboarding = request.nextUrl.pathname.startsWith("/onboarding");
  if (isOnboarding && !request.auth) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }
});

export const config = {
  matcher: ["/onboarding"],
};
