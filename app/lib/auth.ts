import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/app/lib/db";
import { verifyPassword } from "@/app/lib/password";
import { authConfig } from "@/app/lib/auth.config";

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
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await db.user.findUnique({ where: { email } });
        // No user, or a row somehow missing a hash: refuse rather than
        // compare against nothing. Same message either way — a different
        // error for "no such email" vs "wrong password" hands an attacker a
        // working email-enumeration oracle for free.
        if (!user?.passwordHash) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

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
