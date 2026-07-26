import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { MockInstance } from "vitest";

// The module reads env vars at import time, so each test that needs different
// credentials re-imports it with a fresh module registry.
async function loadWith(env: Record<string, string | undefined>) {
  vi.resetModules();
  const saved = { ...process.env };
  for (const [name, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  const mod = await import("@/app/lib/durableCache");
  process.env = saved;
  return mod;
}

const CONFIGURED = {
  KV_REST_API_URL: "https://example.upstash.io",
  KV_REST_API_TOKEN: "test-token",
};

const UNCONFIGURED = {
  KV_REST_API_URL: undefined,
  KV_REST_API_TOKEN: undefined,
};

let fetchSpy: MockInstance<typeof fetch>;

beforeEach(() => {
  fetchSpy = vi.spyOn(globalThis, "fetch");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("when no store is configured", () => {
  // This is how local dev and CI run. The whole layer has to vanish rather
  // than error, or every developer without credentials gets a broken app.
  it("reports itself disabled", async () => {
    const { durableCacheEnabled } = await loadWith(UNCONFIGURED);
    expect(durableCacheEnabled()).toBe(false);
  });

  it("never touches the network", async () => {
    const { getDurable, setDurable, listDurable } = await loadWith(UNCONFIGURED);

    expect(await getDurable("pathway:mdc:nurse")).toBeUndefined();
    await setDurable("pathway:mdc:nurse", { title: "Nurse" });
    expect(await listDurable()).toEqual({});

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("when a store is configured", () => {
  it("namespaces keys so the store can be shared", async () => {
    const { setDurable } = await loadWith(CONFIGURED);
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ result: "OK" }), { status: 200 })
    );

    await setDurable("pathway:mdc:nurse", { title: "Nurse" });

    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(init.body as string);
    expect(body[0]).toBe("SET");
    expect(body[1]).toBe("vocation:pathway:mdc:nurse");
    expect(JSON.parse(body[2])).toEqual({ title: "Nurse" });
    // Entries expire so a career nobody asks for again doesn't live forever.
    expect(body[3]).toBe("EX");
    expect(body[4]).toBeGreaterThan(0);
  });

  it("round-trips a stored value", async () => {
    const { getDurable } = await loadWith(CONFIGURED);
    const stored = { title: "Nurse", pathways: [{ steps: [] }] };
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ result: JSON.stringify(stored) }), { status: 200 })
    );

    expect(await getDurable("pathway:mdc:nurse")).toEqual(stored);
  });

  it("treats a missing key as a miss", async () => {
    const { getDurable } = await loadWith(CONFIGURED);
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ result: null }), { status: 200 })
    );

    expect(await getDurable("pathway:mdc:absent")).toBeUndefined();
  });

  it("strips the namespace back off when listing", async () => {
    const { listDurable } = await loadWith(CONFIGURED);
    fetchSpy
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ result: ["vocation:pathway:mdc:nurse", "vocation:exam:nclex"] }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: [JSON.stringify({ title: "Nurse" }), JSON.stringify({ name: "NCLEX" })],
          }),
          { status: 200 }
        )
      );

    // Keys must come back in seed-file form, or export-cache writes entries
    // the app will never look up.
    expect(await listDurable()).toEqual({
      "pathway:mdc:nurse": { title: "Nurse" },
      "exam:nclex": { name: "NCLEX" },
    });
  });

  it("returns nothing rather than throwing when the store is empty", async () => {
    const { listDurable } = await loadWith(CONFIGURED);
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ result: [] }), { status: 200 })
    );

    expect(await listDurable()).toEqual({});
  });
});

describe("failure handling", () => {
  // A cache is an optimization. An optimization that can take down a student's
  // request is a liability, so every failure mode has to degrade to a miss.
  it("degrades to a miss when the store errors", async () => {
    const { getDurable } = await loadWith(CONFIGURED);
    fetchSpy.mockResolvedValue(new Response("nope", { status: 500 }));

    expect(await getDurable("pathway:mdc:nurse")).toBeUndefined();
  });

  it("degrades to a miss when the network throws", async () => {
    const { getDurable } = await loadWith(CONFIGURED);
    fetchSpy.mockRejectedValue(new Error("ECONNREFUSED"));

    expect(await getDurable("pathway:mdc:nurse")).toBeUndefined();
  });

  it("does not throw when a write fails", async () => {
    const { setDurable } = await loadWith(CONFIGURED);
    fetchSpy.mockRejectedValue(new Error("ECONNREFUSED"));

    // The pathway has already been generated and is about to be returned to
    // the student; a failed write must not turn that into a 500.
    await expect(setDurable("k", { a: 1 })).resolves.toBeUndefined();
  });

  it("drops a corrupt entry instead of serving it", async () => {
    const { getDurable } = await loadWith(CONFIGURED);
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ result: "{ not json" }), { status: 200 })
    );

    expect(await getDurable("pathway:mdc:nurse")).toBeUndefined();
  });
});
