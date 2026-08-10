import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Same loader shape durableCache.test.ts uses: the module reads its env vars at
// import time, so each test that needs different configuration re-imports it
// with a fresh module registry.
async function loadWith(env: Record<string, string | undefined>) {
  vi.resetModules();
  const saved = { ...process.env };
  for (const [name, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  const mod = await import("@/app/lib/email");
  process.env = saved;
  return mod;
}

const UNCONFIGURED = { RESEND_API_KEY: undefined, EMAIL_FROM: undefined };
const CONFIGURED = {
  RESEND_API_KEY: "re_test_key",
  EMAIL_FROM: "Vocation <no-reply@example.com>",
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("when no mail provider is configured", () => {
  // This is how local dev and CI run. A missing key must degrade to a no-op,
  // never to a thrown request — the same rule durableCache.ts follows.
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  it("reports itself disabled", async () => {
    const { emailEnabled } = await loadWith(UNCONFIGURED);
    expect(emailEnabled()).toBe(false);
  });

  it("falls back to the console transport", async () => {
    const { emailTransport } = await loadWith(UNCONFIGURED);
    expect(emailTransport().name).toBe("console");
  });

  it("prints the reset link instead of failing", async () => {
    const { sendPasswordResetEmail } = await loadWith(UNCONFIGURED);
    const url = "http://localhost:3000/reset-password?token=abc123";

    await expect(sendPasswordResetEmail("jane@example.com", url, 60)).resolves
      .toBeUndefined();

    // The link has to actually be readable in the output, or the local flow is
    // a dead end rather than a degraded one.
    const printed = vi.mocked(console.info).mock.calls.map(String).join("\n");
    expect(printed).toContain(url);
    expect(printed).toContain("jane@example.com");
  });

  it("treats a key with no sender as unconfigured", async () => {
    // A key without a verified From is a request Resend rejects — a silent
    // delivery failure, which is worse than the console fallback.
    const { emailEnabled } = await loadWith({
      RESEND_API_KEY: "re_test_key",
      EMAIL_FROM: undefined,
    });
    expect(emailEnabled()).toBe(false);
  });
});

describe("when a mail provider is configured", () => {
  it("reports itself enabled and picks the real transport", async () => {
    const { emailEnabled, emailTransport } = await loadWith(CONFIGURED);
    expect(emailEnabled()).toBe(true);
    expect(emailTransport().name).toBe("resend");
  });

  it("swallows a delivery failure rather than throwing at the caller", async () => {
    // The forgot-password route must answer identically whether or not the
    // address exists, so it cannot be handed an error to branch on.
    const { sendEmail } = await loadWith(CONFIGURED);
    vi.spyOn(console, "error").mockImplementation(() => {});
    // Mocked rather than left to hit the network: the point is the failure
    // path, and a test that depends on api.resend.com being unreachable is a
    // test that behaves differently on a machine that can reach it.
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(
      sendEmail({ to: "jane@example.com", subject: "s", text: "t" })
    ).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});
