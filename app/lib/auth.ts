import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/app/lib/db";
import { verifyPassword } from "@/app/lib/password";
import { authConfig } from "@/app/lib/auth.config";
import { clientIp } from "@/app/lib/rateLimit";
import {
  LOGIN_THROTTLED_CODE,
  loginGate,
  recordFailedLogin,
  recordSuccessfulLogin,
} from "@/app/lib/loginLimit";

/**
 * The only way to report "you are being rate limited" from a Credentials
 * provider.
 *
 * authorize() may return a user, return null, or throw — there is no seam for
 * a 429, because Auth.js turns every credentials failure into one sign-in
 * error response. Returning null would work, but it would be indistinguishable
 * from a wrong password, and telling someone their password is wrong when it
 * is actually fine is exactly the silent mystery a rate limit shouldn't
 * create. Throwing a CredentialsSignin with our own `code` keeps the HTTP
 * shape Auth.js insists on while carrying one extra word back: the client's
 * signIn() result gets `code: "too_many_attempts"` alongside the usual
 * generic error, and the login form can say so.
 *
 * The tradeoff is that the code is only advisory — /login still shows its
 * generic message until it reads `result.code`, and the underlying HTTP status
 * is Auth.js's, not a 429 with Retry-After. Worth it: the alternative is a
 * throttle a user cannot tell apart from a lost password.
 *
 * Safe to expose, and not an enumeration leak: it is decided from the caller's
 * own IP failure history before any lookup, so a throttled guess at a real
 * account and a throttled guess at an invented one produce the same code.
 */
class TooManyLoginAttempts extends CredentialsSignin {
  code = LOGIN_THROTTLED_CODE;
}

// Auth.js configuration — the one place login actually happens.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  // JWT sessions, not database sessions: the adapter still needs the Session
  // model for the OAuth linking flow, but reading the session on every request
  // from a signed cookie avoids a database round trip on every page load.
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Auth.js v5 passes the originating request as the second argument, so
      // the real client IP is reachable here — it is a Request rebuilt from
      // the original headers, which is all clientIp() needs. Without it the
      // limiter below could only key on the email address, and an
      // email-only limit is one an attacker aims at other people.
      async authorize(credentials, request) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        // Malformed input above is not a password guess, so it is not charged;
        // everything from here on is.
        const ip = clientIp(request);
        const gate = loginGate(ip, email);

        // Refused before the database read and the bcrypt compare, which is
        // the point: past this ceiling an attacker should not be able to make
        // us do work at all.
        if (gate.refuse) throw new TooManyLoginAttempts();

        // Slowed, not refused. A correct password still gets through — see
        // loginLimit.ts for why an account-scoped lockout would be its own
        // vulnerability.
        if (gate.delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, gate.delayMs));
        }

        const user = await db.user.findUnique({ where: { email } });
        // No user, or a row somehow missing a hash: refuse rather than
        // compare against nothing. Same message either way — a different
        // error for "no such email" vs "wrong password" hands an attacker a
        // working email-enumeration oracle for free. The failure is recorded
        // identically here and below for the same reason: a throttle that
        // only engaged for real accounts would rebuild that oracle out of
        // timing.
        if (!user?.passwordHash) {
          recordFailedLogin(ip, email);
          return null;
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          recordFailedLogin(ip, email);
          return null;
        }

        recordSuccessfulLogin(ip, email);
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    // The account type and onboarding state ride on the JWT so pages can gate
    // on them (see middleware.ts) without a database read on every request.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
