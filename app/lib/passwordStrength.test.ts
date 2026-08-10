import { describe, it, expect } from "vitest";
import { isCommonPassword, passwordStrength } from "@/app/lib/passwordStrength";

describe("isCommonPassword", () => {
  it("catches well-known common passwords", () => {
    expect(isCommonPassword("password")).toBe(true);
    expect(isCommonPassword("123456")).toBe(true);
    expect(isCommonPassword("qwerty")).toBe(true);
  });

  it("is case- and punctuation-insensitive", () => {
    expect(isCommonPassword("Password")).toBe(true);
    expect(isCommonPassword("PASSWORD1")).toBe(true);
    expect(isCommonPassword("p@ssword")).toBe(true);
  });

  it("does not flag a genuinely uncommon passphrase", () => {
    expect(isCommonPassword("correct horse battery staple")).toBe(false);
    expect(isCommonPassword("xk7#mQz2!vLpN9")).toBe(false);
  });
});

describe("passwordStrength", () => {
  it("blocks common passwords outright, regardless of length", () => {
    const result = passwordStrength("qwertyuiop");
    expect(result.blocked).toBe(true);
    expect(result.score).toBe(0);
  });

  it("blocks anything under 8 characters", () => {
    const result = passwordStrength("Ab1!");
    expect(result.blocked).toBe(true);
  });

  it("never requires a symbol or uppercase letter to pass", () => {
    // A long, uncommon, all-lowercase passphrase must be accepted — the
    // whole point of following NIST 800-63B instead of composition rules.
    const result = passwordStrength("correct horse battery staple");
    expect(result.blocked).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(2);
  });

  it("scores a long uncommon password higher than a short one", () => {
    const short = passwordStrength("Abcdefg1");
    const long = passwordStrength("this is a genuinely long passphrase indeed");
    expect(long.score).toBeGreaterThan(short.score);
  });

  it("rewards character diversity without requiring it", () => {
    const plain = passwordStrength("aaaaaaaaaaaa");
    const diverse = passwordStrength("aB3!aaaaaaaa");
    expect(diverse.score).toBeGreaterThanOrEqual(plain.score);
  });
});
