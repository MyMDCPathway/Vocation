"use client";

import { useState } from "react";
import { ensureContrastWithWhite } from "@/app/lib/schoolTheme";

/**
 * A school's logo, or a monogram in its brand color when no logo exists.
 *
 * Every logo file is pre-rendered onto the same 240x80 transparent canvas, so
 * the fixed 3:1 box makes a wide wordmark and a tall shield occupy identical
 * space. The monogram centers inside that same box, so rows stay aligned
 * whether or not a school has a logo yet.
 *
 * Takes only the four fields it actually draws — not the full School or
 * DirectorySchool shape — so it works for either without one needing to be
 * assignable to the other. DirectorySchool's `kind` is a wider type than
 * School's (see schoolDirectory.ts), which would otherwise make a
 * synthesized (non-curated) school's card fail to type-check here even
 * though this component never reads `kind` at all.
 */
export function SchoolMark({
  school,
  size,
}: {
  school: { name: string; shortName: string; color: string; logo?: string };
  size: "sm" | "lg";
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const box = size === "lg" ? "h-12 w-36" : "h-8 w-24";

  return (
    <span className={`${box} inline-flex items-center justify-center shrink-0`}>
      {school.logo && !logoFailed ? (
        <img
          src={school.logo}
          alt={`${school.name} logo`}
          className="max-h-full max-w-full object-contain"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <span
          aria-hidden="true"
          className={`${
            size === "lg" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs"
          } inline-flex items-center justify-center rounded-full font-bold text-white`}
          // Darkened where needed so the white monogram stays legible — several
          // brand colors (UCF gold, for one) are too light to carry white text.
          style={{ backgroundColor: ensureContrastWithWhite(school.color) }}
        >
          {school.shortName}
        </span>
      )}
    </span>
  );
}
