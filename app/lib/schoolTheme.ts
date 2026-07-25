// Turns a school's single brand color into a full Tailwind-shaped color scale,
// so selecting a school retints the whole app instead of just its logo.
//
// The app's markup uses blue-50 through blue-900. Rather than rewrite those
// relationships, this generates the same ten steps from one brand color and
// publishes them as CSS variables (--school-50 ... --school-900). Tailwind maps
// them to a `school` palette, so `bg-school-600` is a drop-in for `bg-blue-600`
// and every existing hover/ring/tint keeps working.
//
// Two rules shape the math:
//
//   1. Step 600 IS the brand color. Most of these are deep navies and garnets
//      (FIU #081E3F, FSU #782F40); forcing them onto a generic lightness curve
//      would wash them out and they'd stop reading as the school's color.
//   2. Except when it fails contrast. Step 600 is a button background with
//      white text on it, so it must clear WCAG AA (4.5:1). UCF's gold (#BA9B37)
//      is only ~2.4:1 and would ship unreadable buttons, so colors that light
//      get darkened until they pass. The lighter steps stay keyed to the
//      original brand color, so the tints still look like UCF gold.

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export type ScaleStep = keyof ColorScale;

export const SCALE_STEPS: ScaleStep[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

interface Hsl {
  h: number;
  s: number;
  l: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

export function hexToHsl(hex: string): Hsl {
  const [r255, g255, b255] = hexToRgb(hex);
  const r = r255 / 255;
  const g = g255 / 255;
  const b = b255 / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === r) h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / delta + 2) / 6;
    else h = ((r - g) / delta + 4) / 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToHex({ h, s, l }: Hsl): string {
  const sat = clamp(s, 0, 100) / 100;
  const lum = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * lum - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lum - c / 2;

  const sector = Math.floor(((h % 360) + 360) % 360 / 60);
  const [r1, g1, b1] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][sector];

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two colors, 1:1 to 21:1. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE = "#ffffff";
const AA_NORMAL_TEXT = 4.5;

/**
 * Darkens a color just enough that white text on it clears WCAG AA. Returns
 * the color unchanged when it already passes.
 */
export function ensureContrastWithWhite(hex: string): string {
  let hsl = hexToHsl(hex);
  let candidate = hex;

  // Lightness only drops, so this always terminates: black clears 4.5:1.
  while (contrastRatio(candidate, WHITE) < AA_NORMAL_TEXT && hsl.l > 0) {
    hsl = { ...hsl, l: hsl.l - 2 };
    candidate = hslToHex(hsl);
  }
  return candidate;
}

// How far each step travels from the brand color toward white (lighter steps)
// or toward near-black (darker steps).
const LIGHTER_MIX: Record<number, number> = {
  50: 0.95,
  100: 0.88,
  200: 0.72,
  300: 0.54,
  400: 0.34,
  500: 0.16,
};
const DARKER_MIX: Record<number, number> = {
  700: 0.2,
  800: 0.4,
  900: 0.56,
};

const LIGHTEST_L = 97;
const DARKEST_L = 11;

export function buildScale(brandHex: string): ColorScale {
  const anchor = ensureContrastWithWhite(brandHex);
  const anchorHsl = hexToHsl(anchor);
  // Tints are keyed to the school's real color, not the darkened anchor, so a
  // light brand like UCF gold still reads as gold in backgrounds and borders.
  const tintHsl = hexToHsl(brandHex);

  const scale = {} as ColorScale;

  for (const step of SCALE_STEPS) {
    if (step === 600) {
      scale[600] = anchor;
      continue;
    }

    if (step in LIGHTER_MIX) {
      const t = LIGHTER_MIX[step];
      scale[step] = hslToHex({
        h: tintHsl.h,
        // Pale tints of a saturated color look neon; ease saturation down.
        s: tintHsl.s * (1 - t * 0.45),
        l: tintHsl.l + (LIGHTEST_L - tintHsl.l) * t,
      });
    } else {
      const t = DARKER_MIX[step];
      scale[step] = hslToHex({
        h: anchorHsl.h,
        s: anchorHsl.s,
        l: anchorHsl.l - (anchorHsl.l - DARKEST_L) * t,
      });
    }
  }

  return scale;
}

/** CSS custom properties for a brand color, keyed as --school-<step>. */
export function scaleToCssVars(brandHex: string): Record<string, string> {
  const scale = buildScale(brandHex);
  const vars = Object.fromEntries(
    SCALE_STEPS.map((step) => [`--school-${step}`, scale[step]])
  );
  // globals.css builds translucent flowchart fills with
  // rgba(var(--school-primary-rgb), ...), which needs the channels separately.
  vars["--school-primary-rgb"] = hexToRgb(scale[600]).join(", ");
  return vars;
}

/** Applies a school's palette to the document. No-op outside the browser. */
export function applySchoolTheme(brandHex: string): void {
  if (typeof document === "undefined") return;
  const vars = scaleToCssVars(brandHex);
  for (const [name, value] of Object.entries(vars)) {
    document.documentElement.style.setProperty(name, value);
  }
}
