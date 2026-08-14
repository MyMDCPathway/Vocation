import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// The module reads its config at import time, so each case re-imports with a
// fresh module registry rather than trying to mutate constants after the fact.
async function loadWith(env: Record<string, string | undefined>) {
  vi.resetModules();
  const previous = { ...process.env };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  const mod = await import("@/app/lib/feedback");
  process.env = previous;
  return mod;
}

const FORM = "https://docs.google.com/forms/d/e/1FAKE/viewform";

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.resetModules();
});

describe("feedbackUrl", () => {
  it("returns null when no form is configured", async () => {
    // The whole point of the null: callers render nothing rather than shipping
    // a 'Provide feedback' button that opens a 404. Local dev and CI have no
    // form configured and must behave exactly as they did before this existed.
    const { feedbackUrl } = await loadWith({
      NEXT_PUBLIC_FEEDBACK_FORM_URL: undefined,
      NEXT_PUBLIC_FEEDBACK_FLOW_ENTRY_ID: undefined,
    });

    expect(feedbackUrl("classic")).toBeNull();
    expect(feedbackUrl("guided")).toBeNull();
    expect(feedbackUrl("home")).toBeNull();
  });

  it("returns the bare form URL when the entry id is missing", async () => {
    // Degrades rather than disables: attribution is lost, the survey still runs.
    const { feedbackUrl } = await loadWith({
      NEXT_PUBLIC_FEEDBACK_FORM_URL: FORM,
      NEXT_PUBLIC_FEEDBACK_FLOW_ENTRY_ID: undefined,
    });

    expect(feedbackUrl("classic")).toBe(FORM);
  });

  it("prefills the flow so attribution doesn't depend on self-report", async () => {
    const { feedbackUrl } = await loadWith({
      NEXT_PUBLIC_FEEDBACK_FORM_URL: FORM,
      NEXT_PUBLIC_FEEDBACK_FLOW_ENTRY_ID: "123456",
    });

    const classic = new URL(feedbackUrl("classic")!);
    const guided = new URL(feedbackUrl("guided")!);

    expect(classic.searchParams.get("entry.123456")).toBe("classic");
    expect(guided.searchParams.get("entry.123456")).toBe("guided");
    // Google ignores entry params without this.
    expect(classic.searchParams.get("usp")).toBe("pp_url");
  });

  it("keeps the three flows distinct", async () => {
    // `home` must not collapse into either side — a landing-page respondent
    // who generated nothing would otherwise pollute the comparison.
    const { feedbackUrl } = await loadWith({
      NEXT_PUBLIC_FEEDBACK_FORM_URL: FORM,
      NEXT_PUBLIC_FEEDBACK_FLOW_ENTRY_ID: "123456",
    });

    const values = (["classic", "guided", "home"] as const).map(
      (flow) => new URL(feedbackUrl(flow)!).searchParams.get("entry.123456")
    );

    expect(new Set(values).size).toBe(3);
  });
});
