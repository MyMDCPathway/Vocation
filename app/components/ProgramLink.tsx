"use client";

import { resolveProgramLink } from "@/app/lib/resolveProgramLink";
import type { PathwayStep } from "@/app/lib/types";

// Thin rendering wrapper — all resolution logic (which school a step's
// program page belongs to, and whether it's the school's own program or its
// transfer partner's) lives in resolveProgramLink.ts, where it can be unit
// tested without a component-rendering setup.

interface Props {
  step: PathwayStep;
  schoolId: string;
  /**
   * Whether a transfer step precedes this one in the SAME pathway. Several
   * state colleges grant a bachelor's under the same bare name their
   * transfer partner also uses (e.g. "Nursing", "Accounting") — this is the
   * structural signal that disambiguates "this school's own bachelor's" from
   * "the partner's bachelor's after transferring," since the component only
   * sees one step at a time. See resolveProgramLink.ts.
   */
  afterTransfer?: boolean;
}

export function ProgramLink({ step, schoolId, afterTransfer }: Props) {
  const resolved = resolveProgramLink(step, schoolId, { afterTransfer });
  if (!resolved) return null;

  const styles =
    resolved.variant === "primary"
      ? "border-transparent shadow-sm text-white bg-school-600 hover:bg-school-700"
      : "border-school-600 text-school-700 bg-white hover:bg-school-50";

  return (
    <a
      href={resolved.href}
      target="_blank"
      rel="noopener noreferrer"
      title={resolved.title}
      className={`mt-4 inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-school-500 transition duration-150 ${styles}`}
    >
      <i className="fas fa-external-link-alt mr-2" /> {resolved.label}
    </a>
  );
}
