// Rate limiting configuration.
// You can adjust these values based on your needs.

export const RATE_LIMIT_CONFIG = {
  // Default requests per IP per window, used by anything that calls
  // checkIpLimit without saying otherwise — today that's /api/signup. Ten
  // account-creation attempts in a quarter hour is already generous for a real
  // person, and each one costs a bcrypt hash, so this stays tight.
  maxRequestsPerIP: 10,

  // The same window, but for routes that are about to spend a Gemini request.
  //
  // Split out from maxRequestsPerIP because 10 doesn't survive contact with a
  // real student. One pass through the intake costs roughly a dozen uncached
  // generations — career suggestions, refine-career, career-profile,
  // find-schools, then one generate-pathway per school track, plus exam info
  // and school lookups. A student who backs up and explores a second career
  // doubles that, and a campus or library NAT puts several of them behind one
  // address. At 10 the first student would hit a 429 partway through, which
  // reads as the app being broken rather than as abuse being stopped.
  //
  // 40 clears a full intake with room for a second exploration and for
  // classmates sharing an IP, while still capping how fast any one address can
  // burn the budget. It is not the spend guard — maxGenerationsPerDay is.
  // Only uncached generations count, so browsing seeded careers never counts
  // against this at all.
  maxGenerationsPerIP: 40,

  // Uncached BLS lookups from one IP per window.
  //
  // BLS's registration key is capped at 500 requests/day for the whole app,
  // not per visitor, and /api/labor-stats and /api/career-demand were the two
  // routes with no limiter at all. Their cache keys — (occupation, area) and
  // (occupation) — are a large enough space to walk, so an unauthenticated
  // caller could force a miss every time and exhaust the day's allowance. When
  // it's gone, blsStats.ts swallows the failure and every wage figure on the
  // site silently degrades to a model estimate until midnight.
  //
  // 30 rather than the Gemini routes' 40: a student's plan page makes a
  // handful of these, not a dozen, and only uncached ones count. This bounds
  // one address rather than defeating a distributed caller — the honest
  // ceiling is still BLS's own daily quota.
  maxBlsLookupsPerIP: 30,

  // Failed logins from one IP per window, after which /login stops answering
  // that address at all. Counted in loginLimit.ts, which explains the design;
  // the numbers live here so both login ceilings can be read side by side.
  //
  // Deliberately much higher than maxRequestsPerIP. A signup attempt is a
  // one-off; a login is something the same person repeats, mistypes, and
  // retries, and a campus or library NAT stacks several of those people behind
  // one address — the same reason maxGenerationsPerIP is 40 rather than 10.
  // 25 wrong passwords in a quarter hour is still nothing like a real person
  // fumbling a login, and a script reaches it in under a second.
  maxFailedLoginsPerIP: 25,

  // Failed logins against one email address per window, after which attempts
  // on that address are deliberately slowed. NOT a lockout — nothing an
  // attacker can do to someone else's email address may deny that person their
  // own account. See loginLimit.ts for why the two buckets answer differently.
  //
  // Lower than the IP ceiling because it is scoped to one account: eight wrong
  // passwords covers a genuinely forgetful user's session, and past that the
  // most likely explanation is that someone is guessing.
  maxFailedLoginsPerAccount: 8,

  // Time window in milliseconds (15 minutes)
  windowMs: 15 * 60 * 1000,

  // Message shown when limit exceeded
  message: "Too many requests from this IP, please try again later.",

  // Hard ceiling on Gemini-backed generations per day across all visitors.
  // This is the budget kill switch: cache hits and seeded careers don't count
  // toward it, so only genuinely new careers consume the allowance. When it's
  // exhausted the app degrades to a message instead of spending more.
  //
  // Left at 300 deliberately, but know what it now buys. It used to be 300 per
  // warm instance; it is now 300 total, counted in the shared store. At the
  // ~12 uncached generations a first-time student costs, 300 is roughly 20
  // fresh intakes a day — and it climbs well past that as the seed file fills
  // in, since repeat careers are served free. If a launch expects more than
  // that on day one, raise this number on purpose, with the Gemini bill in
  // view, rather than discovering it as students hitting the limit message.
  maxGenerationsPerDay: 300,

  // Message shown when the daily ceiling is reached
  dailyLimitMessage:
    "This demo has hit its daily generation limit. Try one of the common careers, or run it yourself with your own API key — the repo is linked below.",
};
