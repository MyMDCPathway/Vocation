import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/app/lib/password";

describe("hashPassword / verifyPassword", () => {
  it("verifies a password against its own hash", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("never stores the plaintext in the hash", async () => {
    const plain = "correct horse battery staple";
    const hash = await hashPassword(plain);
    expect(hash).not.toContain(plain);
  });

  it("produces a different hash for the same input each time (unique salt)", async () => {
    const a = await hashPassword("same password");
    const b = await hashPassword("same password");
    expect(a).not.toBe(b);
  });
});
