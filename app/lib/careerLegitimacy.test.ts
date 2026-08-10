import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateJson } from "@/app/lib/geminiJson";

// The model call is the only thing worth faking here: everything else about
// this module is the caching behaviour that decides whether it costs anything.
vi.mock("@/app/lib/geminiJson", () => ({ generateJson: vi.fn() }));

const mockGenerateJson = vi.mocked(generateJson);

async function load() {
  const { _setSeedForTests } = await import("@/app/lib/apiCache");
  _setSeedForTests({});
  return await import("@/app/lib/careerLegitimacy");
}

function answers(legitimate: boolean) {
  mockGenerateJson.mockResolvedValue({ ok: true, data: { legitimate } } as never);
}

describe("careerIsLegitimate", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGenerateJson.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows a career the model accepts", async () => {
    answers(true);
    const { careerIsLegitimate } = await load();

    expect(await careerIsLegitimate("registered nurse", "k")).toBe(true);
  });

  it("refuses a career the model rejects", async () => {
    answers(false);
    const { careerIsLegitimate } = await load();

    expect(await careerIsLegitimate("contract killer", "k")).toBe(false);
  });

  it("asks the model once per career, then serves the verdict from cache", async () => {
    // The whole reason this is affordable on four extra routes.
    answers(true);
    const { careerIsLegitimate } = await load();

    for (let i = 0; i < 5; i++) {
      expect(await careerIsLegitimate("welder", "k")).toBe(true);
    }
    expect(mockGenerateJson).toHaveBeenCalledTimes(1);
  });

  it("caches a refusal too, so a repeat attempt costs nothing", async () => {
    answers(false);
    const { careerIsLegitimate } = await load();

    await careerIsLegitimate("hitman", "k");
    await careerIsLegitimate("hitman", "k");

    expect(mockGenerateJson).toHaveBeenCalledTimes(1);
  });

  it("reads a verdict another route already published, without calling the model", async () => {
    // This is the path the wizard takes: refine-career gets `legitimate` free
    // as one field of a call it makes anyway, records it, and the other four
    // routes never ask again.
    const { careerIsLegitimate, recordLegitimacy } = await load();
    await recordLegitimacy("paralegal", true);

    expect(await careerIsLegitimate("paralegal", "k")).toBe(true);
    expect(mockGenerateJson).not.toHaveBeenCalled();
  });

  it("propagates a published refusal to the other routes", async () => {
    const { careerIsLegitimate, recordLegitimacy } = await load();
    await recordLegitimacy("drug courier", false);

    expect(await careerIsLegitimate("drug courier", "k")).toBe(false);
    expect(mockGenerateJson).not.toHaveBeenCalled();
  });

  it("fails open when the model call errors", async () => {
    // Deliberate, and the same direction rateLimit.ts and durableCache.ts
    // fail. The static blocklist has already run and is unaffected, so this
    // drops the second layer rather than both — and the prompt's own rule is
    // that wrongly refusing a student's real career is the worse outcome.
    mockGenerateJson.mockResolvedValue({
      ok: false,
      status: 502,
      error: "upstream exploded",
    } as never);
    const { careerIsLegitimate } = await load();

    expect(await careerIsLegitimate("electrician", "k")).toBe(true);
  });

  it("does not cache a failed check, so the next attempt retries", async () => {
    mockGenerateJson.mockResolvedValue({
      ok: false,
      status: 502,
      error: "upstream exploded",
    } as never);
    const { careerIsLegitimate } = await load();

    await careerIsLegitimate("machinist", "k");
    await careerIsLegitimate("machinist", "k");

    // Caching a fail-open verdict would turn one bad minute into a 30-day
    // hole in the policy.
    expect(mockGenerateJson).toHaveBeenCalledTimes(2);
  });
});
