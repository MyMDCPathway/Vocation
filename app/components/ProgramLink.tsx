"use client";

import { findFIUProgram } from "@/app/lib/fiu-programs";
import { getMDCProgramUrl, hasMDCProgramPage } from "@/app/lib/mdc-programs";
import type { PathwayStep } from "@/app/lib/types";

// Resolves a pathway's degree step to the right school's program page.
//
// What "right" means depends on which school the pathway was generated for:
//
//   FIU pathway — every degree step IS an FIU program (the prompt only permits
//   names from FIU's catalog), so the link is primary and reads "View Program
//   Page", exactly like MDC's does on an MDC pathway.
//
//   MDC pathway — steps taken at MDC link to MDC. Steps AFTER MDC (the
//   bachelor's a student transfers into) have no school attached, because the
//   generator says "Transfer to a 4-Year University" without naming one. FIU is
//   offered there as a labelled EXAMPLE, styled secondary, because claiming it
//   as the destination would assert something the pathway never said.

interface Props {
  step: PathwayStep;
  schoolId: string;
}

function LinkButton({
  href,
  label,
  title,
  variant,
}: {
  href: string;
  label: string;
  title?: string;
  variant: "primary" | "secondary";
}) {
  const styles =
    variant === "primary"
      ? "border-transparent shadow-sm text-white bg-school-600 hover:bg-school-700"
      : "border-school-600 text-school-700 bg-white hover:bg-school-50";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className={`mt-4 inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-school-500 transition duration-150 ${styles}`}
    >
      <i className="fas fa-external-link-alt mr-2" /> {label}
    </a>
  );
}

export function ProgramLink({ step, schoolId }: Props) {
  if (step.type !== "degree") return null;

  if (schoolId === "fiu") {
    const program = findFIUProgram(step.name, step.level);
    if (!program) return null;
    return (
      <LinkButton
        href={program.url}
        label="View Program Page"
        title={`${program.name} — ${program.college}, Florida International University`}
        variant="primary"
      />
    );
  }

  // MDC pathway.
  if (hasMDCProgramPage(step.name, step.level)) {
    return (
      <LinkButton
        href={getMDCProgramUrl(step.name)}
        label="View Program Page"
        variant="primary"
      />
    );
  }

  // Steps taken at MDC without a catalog page get nothing rather than being
  // sent to another school's site.
  if (step.level?.includes("MDC")) return null;

  const program = findFIUProgram(step.name, step.level);
  if (!program) return null;

  return (
    <LinkButton
      href={program.url}
      label={`Offered at FIU: ${program.name}`}
      title={`${program.name} — ${program.college}, Florida International University`}
      variant="secondary"
    />
  );
}
