import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

// Guards the two ways an entrance animation silently turns into a blank page.
//
// Both have already happened in this file once. The prefers-reduced-motion
// opt-out sat near the top, above every rule it was meant to override, and
// since a media query contributes no specificity the later declarations won —
// the opt-out did nothing at all, and nothing caught it, because CSS has no
// type checker and none of the 1200 other tests read a stylesheet.
//
// These assertions are about source order and the absence of a declaration,
// which is exactly what review misses and what a test can hold.

const CSS = readFileSync(
  path.join(process.cwd(), "app", "globals.css"),
  "utf8"
);
const LAYOUT = readFileSync(
  path.join(process.cwd(), "app", "layout.tsx"),
  "utf8"
);

/** The classes the reduced-motion opt-out claims to cover. */
const REDUCED_MOTION_CLASSES = [
  "site-enter",
  "fade-in",
  "fade-in-delay-1",
  "fade-in-delay-2",
  "fade-in-flowchart",
  "letter-fade-in",
  "flowchart-step",
  "reveal",
  "reveal-visible",
];

/** Start index of the top-level `.name { ... }` rule, or -1. */
function ruleIndex(css: string, className: string): number {
  const match = new RegExp(`^\\.${className}\\s*\\{`, "m").exec(css);
  return match ? match.index : -1;
}

/** Body of the first `@media (<query>)` block, brace-matched. */
function mediaBlock(css: string, query: string): { start: number; body: string } {
  const header = `@media (${query})`;
  const start = css.indexOf(header);
  expect(start, `missing ${header} block`).toBeGreaterThan(-1);

  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) {
        return { start, body: css.slice(css.indexOf("{", start) + 1, i) };
      }
    }
  }
  throw new Error(`unterminated ${header} block`);
}

describe("site entry animation", () => {
  it("is applied by the root layout, so it plays once per page load", () => {
    // Not on a page: the root layout is the only element the App Router keeps
    // mounted across client-side navigation, which is what makes this a
    // site-entry animation rather than a per-navigation one.
    expect(LAYOUT).toContain('className="site-enter"');
  });

  it("defines .site-enter", () => {
    expect(ruleIndex(CSS, "site-enter")).toBeGreaterThan(-1);
  });

  it("never hides its content with a static opacity or a forwards fill", () => {
    // The safety property. The animation's last frame equals the element's
    // default computed style, so nothing but a running animation can hide it.
    // Add `opacity: 0` or `forwards` here and every way the animation can fail
    // to run — CSS blocked, reduced motion, a crawler, an unsupported
    // keyframe — becomes a permanently blank page.
    const start = ruleIndex(CSS, "site-enter");
    const rule = CSS.slice(start, CSS.indexOf("}", start));

    expect(rule).not.toMatch(/opacity\s*:\s*0/);
    expect(rule).not.toMatch(/\bforwards\b/);
    expect(rule).not.toMatch(/\bboth\b/);
  });

  it("reuses an existing keyframe instead of adding another one", () => {
    const start = ruleIndex(CSS, "site-enter");
    const rule = CSS.slice(start, CSS.indexOf("}", start));

    expect(rule).toMatch(/animation:\s*reveal\b/);
    expect(CSS).toContain("@keyframes reveal");
  });

  it("runs inside the 300-600ms window the design calls for", () => {
    const start = ruleIndex(CSS, "site-enter");
    const rule = CSS.slice(start, CSS.indexOf("}", start));
    const duration = /animation:[^;]*?(\d*\.?\d+)s/.exec(rule);

    expect(duration).not.toBeNull();
    const ms = Number(duration![1]) * 1000;
    expect(ms).toBeGreaterThanOrEqual(300);
    expect(ms).toBeLessThanOrEqual(600);
  });
});

describe("prefers-reduced-motion opt-out", () => {
  const { start, body } = mediaBlock(CSS, "prefers-reduced-motion: reduce");

  it("covers the site entry animation", () => {
    expect(body).toContain(".site-enter");
  });

  it.each(REDUCED_MOTION_CLASSES)("covers .%s", (className) => {
    expect(body).toMatch(new RegExp(`\\.${className}\\s*[,{\\n]`));
  });

  it("restores opacity rather than only switching motion off", () => {
    // Every class it covers pairs its motion with opacity: 0. `animation:
    // none` alone would freeze them there — invisible, permanently.
    expect(body).toMatch(/animation:\s*none/);
    expect(body).toMatch(/opacity:\s*1/);
    expect(body).toMatch(/transform:\s*none/);
  });

  it.each(REDUCED_MOTION_CLASSES)(
    "is declared after .%s, so it actually wins the cascade",
    (className) => {
      // A media query adds no specificity. At equal specificity the last
      // declaration wins, so this block is only effective from below.
      const declared = ruleIndex(CSS, className);
      expect(declared, `.${className} rule not found`).toBeGreaterThan(-1);
      expect(declared).toBeLessThan(start);
    }
  );
});

describe("no-JavaScript fallback", () => {
  it("shows .reveal sections when scripting is unavailable", () => {
    // .reveal is the only entrance state applied by JS (useReveal adds
    // .reveal-visible from an IntersectionObserver). Without scripting it
    // would sit at opacity: 0 forever, which is most of the landing page.
    const { body } = mediaBlock(CSS, "scripting: none");
    expect(body).toMatch(/\.reveal\s*\{/);
    expect(body).toMatch(/opacity:\s*1/);
  });
});
