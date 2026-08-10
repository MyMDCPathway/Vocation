import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { RATE_LIMIT_CONFIG } from "@/app/api/rate-limit-config";
import {
  LOGIN_BACKOFF_MS,
  LOGIN_THROTTLED_CODE,
  loginGate,
  recordFailedLogin,
  recordSuccessfulLogin,
  _resetLoginLimits,
} from "@/app/lib/loginLimit";

// auth.ts pulls in Auth.js, the Prisma adapter and bcrypt, none of which a
// unit test can or should stand up. Stubbing them lets us hold the REAL
// authorize() — the function an attacker actually talks to — and drive it
// directly, which is the only place the enumeration and success-isn't-charged
// properties can honestly be checked. loginLimit itself is deliberately not
// mocked: these tests exercise the real limiter through the real callsite.
const mocks = vi.hoisted(() => ({
  captured: { config: undefined as { providers: { authorize: Authorize }[] } | undefined },
  findUnique: vi.fn(),
  verifyPassword: vi.fn(),
}));

type Authorize = (
  credentials: Record<string, unknown>,
  request: unknown
) => Promise<{ id: string } | null>;

vi.mock("next-auth", () => ({
  default: (config: { providers: { authorize: Authorize }[] }) => {
    mocks.captured.config = config;
    return { handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() };
  },
  CredentialsSignin: class CredentialsSignin extends Error {
    code = "credentials";
  },
}));
vi.mock("next-auth/providers/credentials", () => ({
  default: (config: unknown) => config,
}));
vi.mock("@auth/prisma-adapter", () => ({ PrismaAdapter: () => ({}) }));
vi.mock("@/app/lib/db", () => ({ db: { user: { findUnique: mocks.findUnique } } }));
vi.mock("@/app/lib/password", () => ({ verifyPassword: mocks.verifyPassword }));

let authorize: Authorize;

beforeAll(async () => {
  await import("@/app/lib/auth");
  const provider = mocks.captured.config?.providers[0];
  if (!provider) throw new Error("Credentials provider was never configured");
  authorize = provider.authorize;
});

beforeEach(() => {
  _resetLoginLimits();
  mocks.findUnique.mockReset();
  mocks.verifyPassword.mockReset();
});

const ACCOUNT_CEILING = RATE_LIMIT_CONFIG.maxFailedLoginsPerAccount;
const IP_CEILING = RATE_LIMIT_CONFIG.maxFailedLoginsPerIP;

// clientIp() only ever reads headers, and prefers the one Vercel's edge
// rewrites on every request.
const requestFrom = (ip: string) => ({
  headers: { get: (name: string) => (name === "x-vercel-forwarded-for" ? ip : null) },
});

const REAL_USER = {
  id: "user_1",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  passwordHash: "$2a$10$hash",
};

/** Fails one account from a fresh IP each time, so only its bucket fills. */
function failAccount(email: string, times: number): void {
  for (let i = 0; i < times; i++) recordFailedLogin(`10.0.${i}.1`, email);
}

/** Fails from one IP against a fresh account each time, so only its bucket fills. */
function failFromIp(ip: string, times: number): void {
  for (let i = 0; i < times; i++) recordFailedLogin(ip, `nobody${i}@example.com`);
}

describe("loginGate", () => {
  it("lets an attempt with no history straight through", () => {
    expect(loginGate("203.0.113.1", "ada@example.com")).toEqual({
      refuse: false,
      delayMs: 0,
    });
  });

  it("slows an account after repeated failures", () => {
    // +1, not exactly the ceiling: checkIpLimit reports a bucket as spent on
    // the attempt AFTER the budget runs out, so the verdict lands one failure
    // late. Documented in loginLimit.ts; pinned here so the extra guess stays
    // a deliberate choice rather than a drift.
    failAccount("ada@example.com", ACCOUNT_CEILING);
    expect(loginGate("198.51.100.7", "ada@example.com").delayMs).toBe(0);

    failAccount("ada@example.com", 1);

    const gate = loginGate("198.51.100.7", "ada@example.com");
    expect(gate.delayMs).toBe(LOGIN_BACKOFF_MS);
  });

  it("never refuses an account, however much a stranger guesses at it", () => {
    // The lockout-as-DoS case: an attacker who has never seen Ada's password
    // must not be able to shut Ada out of her own account.
    failAccount("ada@example.com", IP_CEILING * 4);

    const gate = loginGate("198.51.100.7", "ada@example.com");
    expect(gate.refuse).toBe(false);
    expect(gate.delayMs).toBe(LOGIN_BACKOFF_MS);
  });

  it("treats capitalisation of an address as the same account", () => {
    failAccount("ada@example.com", ACCOUNT_CEILING + 1);
    expect(loginGate("198.51.100.7", "  ADA@Example.COM ").delayMs).toBe(
      LOGIN_BACKOFF_MS
    );
  });

  it("leaves other accounts alone", () => {
    failAccount("ada@example.com", ACCOUNT_CEILING + 1);
    expect(loginGate("198.51.100.7", "grace@example.com")).toEqual({
      refuse: false,
      delayMs: 0,
    });
  });

  it("refuses an IP outright once its ceiling is spent", () => {
    failFromIp("203.0.113.9", IP_CEILING + 1);
    expect(loginGate("203.0.113.9", "anyone@example.com").refuse).toBe(true);
  });

  it("leaves other addresses alone", () => {
    failFromIp("203.0.113.9", IP_CEILING + 1);
    expect(loginGate("203.0.113.10", "anyone@example.com").refuse).toBe(false);
  });

  it("gives an IP a much longer leash than a single account", () => {
    // A campus NAT is many students on one address; a single account is one
    // person. The ceilings must not be the same number.
    expect(IP_CEILING).toBeGreaterThan(ACCOUNT_CEILING);

    failFromIp("203.0.113.11", ACCOUNT_CEILING + 1);
    expect(loginGate("203.0.113.11", "anyone@example.com").refuse).toBe(false);
  });

  it("clears an account's backoff once the password is right", () => {
    failAccount("ada@example.com", ACCOUNT_CEILING + 1);
    expect(loginGate("198.51.100.7", "ada@example.com").delayMs).toBe(LOGIN_BACKOFF_MS);

    recordSuccessfulLogin("198.51.100.7", "ada@example.com");
    expect(loginGate("198.51.100.7", "ada@example.com").delayMs).toBe(0);
  });

  it("does not let one success forgive an IP's failures", () => {
    failFromIp("203.0.113.9", IP_CEILING + 1);
    recordSuccessfulLogin("203.0.113.9", "ada@example.com");
    expect(loginGate("203.0.113.9", "ada@example.com").refuse).toBe(true);
  });
});

describe("authorize", () => {
  it("refuses malformed credentials without charging anything", async () => {
    await expect(
      authorize({ email: 123, password: null }, requestFrom("203.0.113.20"))
    ).resolves.toBeNull();

    // Nothing was guessed, so nothing was spent.
    expect(loginGate("203.0.113.20", "ada@example.com")).toEqual({
      refuse: false,
      delayMs: 0,
    });
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("does not charge a successful login", async () => {
    mocks.findUnique.mockResolvedValue(REAL_USER);
    mocks.verifyPassword.mockResolvedValue(true);

    // Far past both ceilings. If successes were counted, this would throttle.
    for (let i = 0; i < IP_CEILING * 3; i++) {
      await expect(
        authorize(
          { email: "ada@example.com", password: "correct horse" },
          requestFrom("203.0.113.21")
        )
      ).resolves.toMatchObject({ id: "user_1" });
    }

    expect(loginGate("203.0.113.21", "ada@example.com")).toEqual({
      refuse: false,
      delayMs: 0,
    });
  });

  it("throttles a wrong password repeated from one address", async () => {
    mocks.findUnique.mockResolvedValue(REAL_USER);
    mocks.verifyPassword.mockResolvedValue(false);

    const request = requestFrom("203.0.113.22");
    for (let i = 0; i < IP_CEILING + 1; i++) {
      await expect(
        authorize({ email: `guess${i}@example.com`, password: "hunter2" }, request)
      ).resolves.toBeNull();
    }

    await expect(
      authorize({ email: "ada@example.com", password: "hunter2" }, request)
    ).rejects.toMatchObject({ code: LOGIN_THROTTLED_CODE });
  });

  it("stops doing work at all once an address is refused", async () => {
    mocks.findUnique.mockResolvedValue(REAL_USER);
    mocks.verifyPassword.mockResolvedValue(false);

    failFromIp("203.0.113.23", IP_CEILING + 1);
    mocks.findUnique.mockClear();
    mocks.verifyPassword.mockClear();

    await expect(
      authorize({ email: "ada@example.com", password: "hunter2" }, requestFrom("203.0.113.23"))
    ).rejects.toMatchObject({ code: LOGIN_THROTTLED_CODE });

    // The point of refusing before the lookup: no database read, no bcrypt.
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
  });

  it("lets a correct password through while the account is only slowed", async () => {
    failAccount("ada@example.com", ACCOUNT_CEILING + 1);
    expect(loginGate("198.51.100.50", "ada@example.com").delayMs).toBe(LOGIN_BACKOFF_MS);

    mocks.findUnique.mockResolvedValue(REAL_USER);
    mocks.verifyPassword.mockResolvedValue(true);

    vi.useFakeTimers();
    try {
      const pending = authorize(
        { email: "ada@example.com", password: "correct horse" },
        requestFrom("198.51.100.50")
      );
      await vi.advanceTimersByTimeAsync(LOGIN_BACKOFF_MS);
      await expect(pending).resolves.toMatchObject({ id: "user_1" });
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("user enumeration safety", () => {
  // The property under test: nothing the limiter does may let a caller tell
  // "no such account" apart from "wrong password". Both must produce the same
  // answer AND leave the same throttle state behind.

  it("answers an unknown address exactly as it answers a wrong password", async () => {
    mocks.findUnique.mockResolvedValue(null);
    const unknown = await authorize(
      { email: "ghost@example.com", password: "hunter2" },
      requestFrom("203.0.113.30")
    );

    mocks.findUnique.mockResolvedValue(REAL_USER);
    mocks.verifyPassword.mockResolvedValue(false);
    const wrongPassword = await authorize(
      { email: "ada@example.com", password: "hunter2" },
      requestFrom("203.0.113.31")
    );

    expect(unknown).toBeNull();
    expect(wrongPassword).toBeNull();
  });

  it("throttles a nonexistent account on exactly the same schedule as a real one", async () => {
    const attempts = ACCOUNT_CEILING + 1;

    // A run of guesses at an address that does not exist.
    mocks.findUnique.mockResolvedValue(null);
    for (let i = 0; i < attempts; i++) {
      await authorize(
        { email: "ghost@example.com", password: "hunter2" },
        requestFrom(`192.0.2.${i}`)
      );
    }
    const ghostGate = loginGate("192.0.2.200", "ghost@example.com");

    _resetLoginLimits();

    // The identical run against a real account.
    mocks.findUnique.mockResolvedValue(REAL_USER);
    mocks.verifyPassword.mockResolvedValue(false);
    for (let i = 0; i < attempts; i++) {
      await authorize(
        { email: "ada@example.com", password: "hunter2" },
        requestFrom(`192.0.2.${i}`)
      );
    }
    const realGate = loginGate("192.0.2.200", "ada@example.com");

    // Same delay, same refusal — the throttle is not an oracle.
    expect(ghostGate).toEqual(realGate);
    expect(ghostGate.delayMs).toBe(LOGIN_BACKOFF_MS);
  });

  it("refuses an address for guessing at accounts that never existed", async () => {
    // The IP ceiling has to bite on invented addresses too, or an attacker
    // could probe for free simply by aiming at names nobody has registered.
    mocks.findUnique.mockResolvedValue(null);

    const request = requestFrom("203.0.113.40");
    for (let i = 0; i < IP_CEILING + 1; i++) {
      await authorize({ email: `ghost${i}@example.com`, password: "x" }, request);
    }

    await expect(
      authorize({ email: "ghost@example.com", password: "x" }, request)
    ).rejects.toMatchObject({ code: LOGIN_THROTTLED_CODE });
  });
});
