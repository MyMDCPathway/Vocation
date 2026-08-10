import { createHash, randomBytes, timingSafeEqual } from "crypto";

// The rules a password reset token lives by, kept as pure functions so they
// can be tested without a database, a mailbox, or a running server.
//
// Nothing here reads or writes Prisma on purpose. The two routes
// (/api/auth/forgot-password, /api/auth/reset-password) own the persistence;
// this file owns the parts that are easy to get subtly, silently wrong —
// where the randomness comes from, what gets stored, and when a token stops
// working.

/**
 * Bytes of randomness per token. 32 bytes is 256 bits, which is the same
 * order as the session secret protecting an already-logged-in account — a
 * reset link is a temporary credential for the whole account, so it has no
 * business being weaker than the thing it replaces.
 *
 * Hex-encoded, so the value that lands in the URL is 64 characters: long, but
 * it is copied by a click, never typed.
 */
const TOKEN_BYTES = 32;

/**
 * One hour. Short deliberately: a reset link sits in an inbox, and an inbox is
 * exactly where a stale one is most likely to be found by someone who
 * shouldn't have it — a shared machine, a synced phone, a mailbox breached
 * months later. Someone who genuinely asked for a reset acts within minutes;
 * the cost of expiring too eagerly is one more click on "email me a link",
 * which is cheap. The cost of expiring too late is an account.
 */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/**
 * A fresh raw reset token. This value is emailed and then forgotten — only
 * its hash is ever persisted (see hashResetToken).
 *
 * crypto.randomBytes, not Math.random. Math.random is a fast non-cryptographic
 * PRNG whose internal state can be recovered from a handful of outputs; using
 * it here would mean an attacker who requested one reset of their own could
 * predict the next person's link. This is the one distinction that matters
 * most in this file and the easiest to typo past code review.
 */
export function generateResetToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

/**
 * What actually goes in the database.
 *
 * SHA-256, not the bcrypt in app/lib/password.ts, and the reason is the input
 * rather than convenience. bcrypt's cost factor exists to make guessing a
 * low-entropy, human-chosen secret expensive; a 256-bit CSPRNG token is not
 * guessable at any cost factor, so the stretching protects against nothing
 * that is actually a threat here. What bcrypt would cost is concrete: it salts
 * per row, so a presented token could not be hashed and looked up by index —
 * verification would have to scan every outstanding row and run a deliberately
 * slow comparison against each one, turning a lookup into a self-inflicted
 * denial of service. A SHA-256 digest is deterministic, so the lookup is a
 * single indexed equality match, and the stored value is still useless to
 * anyone who steals it: reversing it means reversing 256 bits of randomness.
 */
export function hashResetToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

/** When a token minted at `now` stops being accepted. */
export function resetTokenExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + RESET_TOKEN_TTL_MS);
}

/**
 * The stored shape this module reasons about — structurally the columns of
 * PasswordResetToken that decide whether a link still works, not the Prisma
 * row type. Declared locally so these rules can be tested without generating
 * a Prisma client first.
 */
export interface ResetTokenRecord {
  expiresAt: Date;
  consumedAt: Date | null;
}

/**
 * Whether a stored token may still be spent.
 *
 * Two independent reasons to refuse, and both have to be checked every time:
 * expiry bounds how long a leaked link is useful, and consumedAt makes a link
 * single-use. Skipping the second one leaves a working second key to the
 * account lying in an inbox after the password has already been changed —
 * including in the inbox of whoever triggered an unwanted reset.
 *
 * Exclusive comparison (`<`), so a token is dead exactly at its expiry
 * instant rather than one tick after it.
 */
export function isResetTokenUsable(
  record: ResetTokenRecord,
  now: Date = new Date()
): boolean {
  if (record.consumedAt !== null) return false;
  return now.getTime() < record.expiresAt.getTime();
}

/**
 * Constant-time comparison of two token hashes.
 *
 * The routes look tokens up by indexed equality, so this isn't on their hot
 * path — it exists for anywhere a hash is compared in application code, where
 * a plain `===` leaks how many leading characters matched through timing.
 * Length is compared first because timingSafeEqual throws on a mismatch, and
 * hash lengths are fixed and public anyway.
 */
export function resetTokenHashesMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}
