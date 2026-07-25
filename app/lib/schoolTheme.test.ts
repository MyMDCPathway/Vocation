import { describe, it, expect } from "vitest";
import {
  buildScale,
  contrastRatio,
  ensureContrastWithWhite,
  hexToHsl,
  hslToHex,
  luminance,
  SCALE_STEPS,
  scaleToCssVars,
} from "@/app/lib/schoolTheme";
import { FLORIDA_SCHOOLS } from "@/app/lib/floridaSchools";

describe("color conversion", () => {
  it("round-trips hex through HSL", () => {
    for (const hex of ["#0053a0", "#782f40", "#ba9b37", "#081e3f", "#ffffff", "#000000"]) {
      expect(hslToHex(hexToHsl(hex))).toBe(hex);
    }
  });

  it("computes known luminance endpoints", () => {
    expect(luminance("#000000")).toBeCloseTo(0, 5);
    expect(luminance("#ffffff")).toBeCloseTo(1, 5);
  });

  it("computes the known black-on-white contrast ratio", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });
});

describe("ensureContrastWithWhite", () => {
  it("leaves an already-dark brand color alone", () => {
    // FIU navy is far past the threshold; darkening it would be wrong.
    expect(ensureContrastWithWhite("#081e3f")).toBe("#081e3f");
  });

  it("darkens a light brand color until white text is readable", () => {
    // UCF gold starts around 2.4:1 — unreadable as a button background.
    expect(contrastRatio("#ba9b37", "#ffffff")).toBeLessThan(4.5);

    const fixed = ensureContrastWithWhite("#ba9b37");
    expect(contrastRatio(fixed, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    // Still recognizably gold, not turned into mud.
    expect(hexToHsl(fixed).h).toBeCloseTo(hexToHsl("#ba9b37").h, 0);
  });
});

describe("buildScale", () => {
  it("produces every step as a valid hex color", () => {
    const scale = buildScale("#0053a0");
    for (const step of SCALE_STEPS) {
      expect(scale[step], `step ${step}`).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("gets lighter as the step number decreases", () => {
    const scale = buildScale("#0053a0");
    const lums = SCALE_STEPS.map((s) => luminance(scale[s]));
    for (let i = 1; i < lums.length; i++) {
      expect(lums[i], `step ${SCALE_STEPS[i]} vs ${SCALE_STEPS[i - 1]}`).toBeLessThan(lums[i - 1]);
    }
  });

  it("uses the brand color itself as step 600 when contrast allows", () => {
    expect(buildScale("#0053a0")[600]).toBe("#0053a0");
  });

  it("keeps white text readable on 600 for every school in the list", () => {
    // This is the guarantee that matters: 600 is a button background.
    for (const school of FLORIDA_SCHOOLS) {
      const scale = buildScale(school.color);
      expect(
        contrastRatio(scale[600], "#ffffff"),
        `${school.name} (${school.color})`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps the 50 tint pale enough to read dark text on", () => {
    for (const school of FLORIDA_SCHOOLS) {
      const scale = buildScale(school.color);
      expect(
        contrastRatio(scale[50], "#1f2937"),
        `${school.name} (${school.color})`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("scaleToCssVars", () => {
  it("names variables so Tailwind can consume them", () => {
    const vars = scaleToCssVars("#0053a0");
    for (const step of SCALE_STEPS) {
      expect(vars[`--school-${step}`], `step ${step}`).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(vars["--school-600"]).toBe("#0053a0");
  });

  it("also emits step 600 as rgb channels for translucent flowchart fills", () => {
    // globals.css uses rgba(var(--school-primary-rgb), 0.1) and can't do that
    // with a hex value.
    expect(scaleToCssVars("#0053a0")["--school-primary-rgb"]).toBe("0, 83, 160");
  });
});
