"use client";

import Link from "next/link";
import { SchoolMark } from "@/app/components/SchoolMark";
import { useSelectedSchool } from "@/app/lib/useSelectedSchool";

/**
 * The header bar for pages other than the home page.
 *
 * Shows the school the visitor picked rather than a hardcoded MDC logo, so the
 * choice made on the home page carries through the rest of the app. Changing
 * schools still happens in the home page selector; this is display only, which
 * is why the whole mark is a link back there.
 */
export function SchoolHeader() {
  const school = useSelectedSchool();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        {/* /classic, not /. The title has always said "change school on the
            home page", but the home page stopped having a school picker when
            2.0 inverted the flow to career-first — so this sent students
            somewhere that couldn't do the thing it promised. /classic is where
            the picker actually lives now. */}
        <Link
          href="/classic"
          aria-label={`${school.name} — change school`}
          title={`${school.name} — change school`}
          className="rounded-lg px-2 py-1 hover:bg-gray-100 transition"
        >
          <SchoolMark school={school} size="lg" />
        </Link>
      </div>
    </header>
  );
}
