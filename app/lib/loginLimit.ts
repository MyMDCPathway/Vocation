// Throttling for FAILED logins.
//
// /api/signup has been rate-limited since it shipped; /login never was, which
// left the one endpoint an attacker actually wants completely unmetered. The
// Credentials provider would answer password guesses as fast as bcrypt could
// hash them, forever, from anywhere. This module is the missing half.
//
// It counts failures only. A student who types their password correctly costs
// nothing no matter how often they sign in — spending allowance on successful
// logins would meter the one behaviour we want, and would mean a shared
// classroom address locks itself out by being used normally.
//
// TWO BUCKETS, ANSWERED DIFFERENTLY ON PURPOSE
//
//   per-IP        Hard refusal once the ceiling is spent, before any database
//                 read or password hash. An address that has produced 25 wrong
//                 passwords in fifteen minutes is not a person having a bad
//                 morning, and refusing costs the attacker the one resource
//                 that is expensive to replace. The ceiling is generous
//                 because a campus or library NAT puts many real students
//                 behind a single address.
//
//   per-account   A delay, never a refusal. This asymmetry is the whole point.
//                 An email address is public — anyone can type a stranger's
//                 into the login form. If failures against an address could
//                 lock it, then locking any user out of their own account
//                 would cost an attacker nothing but a handful of deliberate
//                 wrong guesses, and the rate limit would itself be the
//                 denial-of-service. So the account bucket slows attempts and
//                 lets a correct password through regardless of how much
//                 someone else has been guessing at that address.
//
// Keying on both is what makes either useful: an IP-only limit is defeated by
// spreading guesses across a botnet, and an account-only limit is defeated by
// spraying one common password across many accounts — besides inviting the
// lockout problem above.
//
// WHAT THIS DOES NOT DO, HONESTLY
//
//   - The state is in process memory, so on serverless it is per-instance.
//     Every warm lambda enforces its own copy of both ceilings, and the true
//     limit is the configured one times however many instances are live. That
//     is the same trade rateLimit.ts makes for its per-IP window, for the same
//     reason: a shared-store round trip on the login hot path buys precision
//     that a determined distributed attacker defeats anyway. It raises the
//     cost of casual guessing; it is not a guarantee. Real guarantees here are
//     a strong-password rule at signup (passwordStrength.ts, already enforced)
//     and eventually a second factor.
//
//   - The backoff delay is short — see LOGIN_BACKOFF_MS — because on a
//     serverless platform a sleeping request is a lambda we are paying for.
//     Long delays would let an attacker turn our own defence into a bill. The
//     per-IP ceiling, not the delay, is what actually stops volume.
//
//   - Ceilings are approximate by one attempt. checkIpLimit reports a bucket
//     as spent on the attempt AFTER the budget runs out, so the throttle bites
//     on failure N+2 rather than N+1. One extra guess out of 25 changes
//     nothing, and the alternative is a second counter shadowing the first.
//
// USER ENUMERATION
//
// authorize() deliberately answers identically for "no such email" and "wrong
// password" (see the comment there). Nothing in this module may undo that, so
// nothing in this module knows whether an account exists: both gate decisions
// are computed from the caller's own recent failures, before any lookup, and a
// failure is recorded the same way for a real address and an invented one. A
// rate-limited guess at a real account and a rate-limited guess at a
// nonexistent one are the same code path with the same result.

import { RATE_LIMIT_CONFIG } from "@/app/api/rate-limit-config";
import { checkIpLimit, _resetRateLimits } from "@/app/lib/rateLimit";

/**
 * Error code handed to the client when an IP is refused outright.
 *
 * Auth.js only lets authorize() return a user or null/throw, so there is no
 * way to answer a login with a real 429. Throwing a CredentialsSignin carrying
 * this code is the closest thing available: it rides back in the sign-in
 * response as `code`, which is enough for the login form to say "too many
 * attempts, wait a few minutes" instead of repeating "wrong password" at
 * someone whose password is fine. Safe to expose — it describes the caller's
 * own request history and nothing about any account.
 */
export const LOGIN_THROTTLED_CODE = "too_many_attempts";

/**
 * How long a throttled account's attempts are held before being answered.
 *
 * One second: enough to collapse a serial guessing loop from thousands of
 * attempts an hour to a few thousand, cheap enough that a real user who
 * mistyped their password a few times just notices a slow login, and short
 * enough that an attacker cannot pin our lambdas open for free.
 */
export const LOGIN_BACKOFF_MS = 1000;

export interface LoginGate {
  /** Refuse before touching the database. Only ever set by the IP bucket. */
  refuse: boolean;
  /** Hold the attempt this long, then process it normally. */
  delayMs: number;
}

const OPEN: LoginGate = { refuse: false, delayMs: 0 };

/**
 * Bucket key -> when its throttle lifts.
 *
 * Not a second limiter: the counting is entirely checkIpLimit's. This only
 * remembers the verdict that call already produced, because checkIpLimit
 * records a hit whenever it allows one — so asking it "am I throttled?" on
 * the way in would count every attempt, including the successful ones we
 * promised not to charge for. Recording on the failure path and reading the
 * remembered verdict on the way in keeps that promise.
 */
const throttledUntil = new Map<string, number>();

// Prefixed so login buckets can never collide with the signup ("signup:") or
// generation (bare IP) buckets sharing checkIpLimit's map — and so an email
// address can sit in the same map as an IP without ambiguity.
function ipKey(ip: string): string {
  return `login-ip:${ip}`;
}

/**
 * Case-folded, because "Ada@example.com" and "ada@example.com" are the same
 * account to guess at even where the database treats them as distinct rows.
 * The lookup in authorize() still uses the address exactly as typed; this
 * normalisation exists only so an attacker cannot mint a fresh allowance by
 * changing capitalisation.
 */
function accountKey(email: string): string {
  return `login-user:${email.trim().toLowerCase()}`;
}

function isThrottled(key: string, now: number): boolean {
  const until = throttledUntil.get(key);
  if (until === undefined) return false;
  if (until > now) return true;
  throttledUntil.delete(key);
  return false;
}

/**
 * What to do with an incoming login attempt, decided before any database read.
 *
 * Pure and synchronous: it inspects remembered verdicts only, and never
 * consumes allowance, so calling it on an attempt that turns out to be
 * correct costs the user nothing.
 */
export function loginGate(ip: string, email: string): LoginGate {
  const now = Date.now();

  if (isThrottled(ipKey(ip), now)) return { refuse: true, delayMs: 0 };

  // Note the ordering: an exhausted account bucket never reaches the refusal
  // branch, so no amount of guessing at someone else's address can shut them
  // out of their own account.
  if (isThrottled(accountKey(email), now)) {
    return { refuse: false, delayMs: LOGIN_BACKOFF_MS };
  }

  return OPEN;
}

/**
 * Charge one failed attempt to both buckets.
 *
 * Call this for every refusal authorize() makes after the credentials parse —
 * including "no such user". Skipping the record for unknown addresses would
 * make the throttle itself an enumeration oracle: guesses at real accounts
 * would slow down while guesses at invented ones stayed fast.
 */
export function recordFailedLogin(ip: string, email: string): void {
  charge(ipKey(ip), RATE_LIMIT_CONFIG.maxFailedLoginsPerIP);
  charge(accountKey(email), RATE_LIMIT_CONFIG.maxFailedLoginsPerAccount);
  pruneExpired();
}

function charge(key: string, max: number): void {
  const result = checkIpLimit(key, max);
  if (result.allowed) return;
  throttledUntil.set(key, Date.now() + (result.retryAfterSeconds ?? 60) * 1000);
}

/**
 * Forgive an account's backoff after a correct password.
 *
 * Only the account bucket, and only its remembered verdict — checkIpLimit's
 * window still holds the failure timestamps, so the very next wrong password
 * re-throttles immediately. That is the intended shape: a user who fumbles
 * their password and then gets it right isn't left slow for the rest of the
 * window, but a guesser who happens to land one correct login doesn't get a
 * clean slate either.
 *
 * The IP bucket is untouched on purpose. Behind a shared address one person
 * signing in successfully says nothing about the twenty-five failures that
 * came from the same place.
 */
export function recordSuccessfulLogin(_ip: string, email: string): void {
  throttledUntil.delete(accountKey(email));
}

// Opportunistic cleanup, mirroring checkIpLimit's own. Entries are tiny and
// self-expiring, so this only exists to stop a spray of invented addresses
// from pinning memory between deploys.
function pruneExpired(): void {
  if (throttledUntil.size <= 5000) return;
  const now = Date.now();
  for (const [key, until] of throttledUntil) {
    if (until <= now) throttledUntil.delete(key);
  }
}

// Test-only. Clears the shared limiter too, since the counts this module reads
// live there — a reset that left them behind would leak state between tests.
export function _resetLoginLimits(): void {
  throttledUntil.clear();
  _resetRateLimits();
}
