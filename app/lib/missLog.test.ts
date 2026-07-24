import { describe, it, expect, vi, afterEach } from "vitest";
import { logCacheMiss } from "@/app/lib/missLog";

function captureLog(fn: () => void): string {
  const spy = vi.spyOn(console, "log").mockImplementation(() => {});
  fn();
  const line = spy.mock.calls.at(0)?.[0] as string;
  spy.mockRestore();
  return line ?? "";
}

afterEach(() => vi.restoreAllMocks());

describe("logCacheMiss", () => {
  it("records the search term and what it resolved to", () => {
    const line = captureLog(() => logCacheMiss("pathway", "RN", "Registered Nurse"));
    expect(line).toContain("[cache-miss] pathway");
    expect(line).toContain('raw="RN"');
    expect(line).toContain('canonical="Registered Nurse"');
  });

  it("omits the canonical form when it adds nothing", () => {
    const line = captureLog(() => logCacheMiss("exam", "NCLEX-RN", "NCLEX-RN"));
    expect(line).not.toContain("canonical=");
  });

  it("strips newlines so input cannot forge a second log entry", () => {
    const line = captureLog(() =>
      logCacheMiss("pathway", 'nurse"\n[cache-miss] pathway raw="injected')
    );
    expect(line.split("\n")).toHaveLength(1);
    expect(line).not.toMatch(/\r|\n/);
  });

  it("caps very long input", () => {
    const line = captureLog(() => logCacheMiss("suggestions", "x".repeat(500)));
    expect(line.length).toBeLessThan(150);
  });
});
