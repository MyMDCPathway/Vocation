"use client";

import { useEffect, useId, useState } from "react";

/**
 * The wait screen shown while Gemini generates a pathway or career list.
 *
 * Replaces three near-identical blocks that used to live inline in
 * app/pathway/page.tsx (career-suggestion loading, first-pathway loading,
 * and the compare-another-career overlay) — same Gemini star, same
 * animate-spin-slow, same gradient defined three times with the same SVG
 * id, differing only in a label string and whether they were `fixed`.
 *
 * The ring is deliberately indeterminate — no percentage. generate-pathway
 * is one HTTP round trip; there is no point in it where the server reports
 * "40% done," so a percentage here would have to be invented. See the
 * .generation-ring comment in globals.css for the longer version of why
 * that's not a line this app crosses.
 *
 * `stages` describes real, ordered pipeline steps, not literal server
 * progress — nothing here polls the server for which step is current. It
 * advances on a timer and HOLDS on the last stage rather than looping, so
 * the text never contradicts itself by re-describing something already
 * passed while the request is still in flight.
 */
export function GenerationProgress({
  stages,
  fixed = false,
}: {
  /** Real pipeline steps, in true order. At least one required. */
  stages: [string, ...string[]];
  /** Full-screen overlay atop existing content vs. an inline block. */
  fixed?: boolean;
}) {
  const [stageIndex, setStageIndex] = useState(0);
  // Rather than a hardcoded SVG id, which would collide if this component
  // ever renders twice on the same page at once (a future compare-two-plans
  // view, say) — the exact class of bug this component was extracted to fix,
  // duplicated across the three overlays it replaced.
  const gradientId = useId();

  useEffect(() => {
    setStageIndex(0);
    if (stages.length <= 1) return;

    const id = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, stages.length - 1));
    }, 1800);
    return () => clearInterval(id);
    // Only the stage COUNT should restart the timer. Re-keying on the array
    // itself would restart it every render, since callers generally pass a
    // fresh array literal — this only cares that the shape didn't change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stages.length]);

  const ring = (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <div className="generation-pulse absolute inset-0 rounded-full border-4 border-secondary" />
      <svg
        className="generation-ring absolute inset-0 h-full w-full"
        viewBox="0 0 96 96"
        fill="none"
      >
        <circle
          cx="48"
          cy="48"
          r="42"
          stroke="var(--surface-container-high)"
          strokeWidth="6"
        />
        <circle
          cx="48"
          cy="48"
          r="42"
          stroke="var(--secondary)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="66 264"
        />
      </svg>
      <svg
        className="h-9 w-9"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          fill={`url(#${gradientId})`}
        />
      </svg>
    </div>
  );

  const body = (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 text-center"
    >
      {ring}
      <span className="text-xl font-medium text-secondary">
        {stages[stageIndex]}
      </span>
    </div>
  );

  if (!fixed) {
    return <div className="flex min-h-[400px] items-center justify-center">{body}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/85 backdrop-blur-sm">
      {body}
    </div>
  );
}
