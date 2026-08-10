import { describe, it, expect } from "vitest";
import { createHash } from "crypto";
import {
  RESET_TOKEN_TTL_MS,
  generateResetToken,
  hashResetToken,
  isResetTokenUsable,
  resetTokenExpiry,
  resetTokenHashesMatch,
} from "@/app/lib/passwordReset";

describe("generateResetToken", () => {
  it("produces a 256-bit token", () => {
    // 32 bytes, hex-encoded. Weaker than this and the token becomes something
    // worth grinding rather than something that cannot be guessed.
    expect(generateResetToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("never repeats itself", () => {
    // A cheap smoke test for "is this actually random". A Math.random-seeded
    // or counter-based implementation would still pass the shape check above.
    const tokens = new Set(Array.from({ length: 500 }, generateResetToken));
    expect(tokens.size).toBe(500);
  });
});

describe("hashResetToken", () => {
  it("stores a hash, never the token itself", () => {
    const raw = generateResetToken();
    const hash = hashResetToken(raw);

    // The whole point of the column: a leaked database row must not be a
    // working reset link.
    expect(hash).not.toBe(raw);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic, so a presented token is an indexed lookup", () => {
    const raw = generateResetToken();
    expect(hashResetToken(raw)).toBe(hashResetToken(raw));
  });

  it("matches a plain SHA-256 of the token", () => {
    // Pinned against the standard construction rather than against itself, so
    // a change of algorithm shows up here as a decision rather than as a
    // silently updated snapshot — every already-issued link would stop working.
    const raw = "0123456789abcdef";
    expect(hashResetToken(raw)).toBe(
      createHash("sha256").update(raw, "utf8").digest("hex")
    );
  });

  it("gives different tokens different hashes", () => {
    expect(hashResetToken("token-a")).not.toBe(hashResetToken("token-b"));
  });
});

describe("resetTokenExpiry", () => {
  it("expires an hour out", () => {
    const now = new Date("2026-08-09T12:00:00.000Z");
    expect(resetTokenExpiry(now).toISOString()).toBe("2026-08-09T13:00:00.000Z");
  });

  it("keeps the window short", () => {
    // A reset link lives in an inbox. Guard the intent, not just the constant:
    // anything measured in days is a different security posture.
    expect(RESET_TOKEN_TTL_MS).toBeLessThanOrEqual(60 * 60 * 1000);
    expect(RESET_TOKEN_TTL_MS).toBeGreaterThan(0);
  });
});

describe("isResetTokenUsable", () => {
  const issued = new Date("2026-08-09T12:00:00.000Z");
  const expiresAt = resetTokenExpiry(issued);

  it("accepts a fresh, unspent token", () => {
    const fiveMinutesLater = new Date(issued.getTime() + 5 * 60_000);
    expect(isResetTokenUsable({ expiresAt, consumedAt: null }, fiveMinutesLater)).toBe(true);
  });

  it("refuses a token past its expiry", () => {
    const anHourAndABitLater = new Date(issued.getTime() + RESET_TOKEN_TTL_MS + 1000);
    expect(isResetTokenUsable({ expiresAt, consumedAt: null }, anHourAndABitLater)).toBe(false);
  });

  it("refuses a token exactly at its expiry", () => {
    // Dead at the instant, not one tick after it.
    expect(isResetTokenUsable({ expiresAt, consumedAt: null }, expiresAt)).toBe(false);
  });

  it("refuses an already-spent token even while it is unexpired", () => {
    // Single use. A link that still works after the password has changed is a
    // second, unattended key to the account — including for whoever triggered
    // a reset the owner didn't ask for.
    const spentAt = new Date(issued.getTime() + 60_000);
    const stillWithinTheHour = new Date(issued.getTime() + 2 * 60_000);
    expect(
      isResetTokenUsable({ expiresAt, consumedAt: spentAt }, stillWithinTheHour)
    ).toBe(false);
  });

  it("refuses a token that is both spent and expired", () => {
    const spentAt = new Date(issued.getTime() + 60_000);
    const muchLater = new Date(issued.getTime() + 48 * 60 * 60_000);
    expect(isResetTokenUsable({ expiresAt, consumedAt: spentAt }, muchLater)).toBe(false);
  });

  it("accepts a token issued right now with no explicit clock", () => {
    // The default-argument path the routes actually take.
    expect(isResetTokenUsable({ expiresAt: resetTokenExpiry(), consumedAt: null })).toBe(true);
  });
});

describe("resetTokenHashesMatch", () => {
  it("matches identical hashes", () => {
    const hash = hashResetToken(generateResetToken());
    expect(resetTokenHashesMatch(hash, hash)).toBe(true);
  });

  it("rejects different hashes", () => {
    expect(
      resetTokenHashesMatch(hashResetToken("a"), hashResetToken("b"))
    ).toBe(false);
  });

  it("returns false rather than throwing on a length mismatch", () => {
    // timingSafeEqual throws on unequal lengths; a comparison helper that can
    // crash a route is worse than one that answers no.
    expect(resetTokenHashesMatch("short", hashResetToken("a"))).toBe(false);
    expect(resetTokenHashesMatch("", "")).toBe(true);
  });
});

describe("the full issue-then-spend sequence", () => {
  it("only accepts the hash of the token that was actually issued", () => {
    const raw = generateResetToken();
    const stored = hashResetToken(raw);

    // What a route does with the value from the URL.
    expect(hashResetToken(raw)).toBe(stored);
    expect(hashResetToken(generateResetToken())).not.toBe(stored);
  });

  it("cannot be spent twice", () => {
    const issued = new Date("2026-08-09T12:00:00.000Z");
    const record = { expiresAt: resetTokenExpiry(issued), consumedAt: null as Date | null };

    const firstAttempt = new Date(issued.getTime() + 60_000);
    expect(isResetTokenUsable(record, firstAttempt)).toBe(true);

    // Spending it is what the reset route writes.
    record.consumedAt = firstAttempt;

    const secondAttempt = new Date(issued.getTime() + 120_000);
    expect(isResetTokenUsable(record, secondAttempt)).toBe(false);
  });
});
