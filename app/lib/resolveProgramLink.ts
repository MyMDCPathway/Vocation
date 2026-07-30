import { catalogFor } from "@/app/lib/programCatalogs";
import { getMDCProgramUrl, hasMDCProgramPage } from "@/app/lib/mdc-programs";
import { transferAgreementFor } from "@/app/lib/transferAgreements";
import type { PathwayStep } from "@/app/lib/types";

// Resolves a pathway's degree step to the right school's program page.
//
// Plain (no React) so it can be unit-tested directly — ProgramLink.tsx is a
// thin wrapper that renders this result. Kept separate because this project
// has no component-rendering test setup (vitest here runs Node, not jsdom),
// and the school/partner name-collision this function guards against (see
// LEVEL_NAMES_PARTNER below) needs a real regression test, not just a manual
// spot-check.
//
// What "right" means depends on which school the pathway was generated for:
//
//   FIU pathway — every degree step IS an FIU program (the prompt only permits
//   names from FIU's catalog), so the link is primary and reads "View Program
//   Page", exactly like MDC's does on an MDC pathway.
//
//   State college pathway — steps taken at the college link to the college.
//   The step AFTER it, the bachelor's the student transfers into, is a program
//   at that college's flagship transfer partner: the prompt embeds the
//   partner's real bachelor's list (see transferPartnerSection in
//   pathwayPrompts.ts), so the name resolves against the partner's own catalog
//   here. It's styled SECONDARY and labelled with the partner's name, because
//   transferring is a real step the student still has to take — this is where
//   the degree is offered, not somewhere they already are.
//
//   MDC pathway — same idea for the post-transfer step (MDC's own
//   `transferAgreements` entry names FIU), but MDC's OWN programs live in
//   mdc-programs.ts's bespoke URL-mapping tables rather than a scraped
//   SchoolProgram[] catalog (see mdcSystemPrompt in pathwayPrompts.ts), so
//   they're resolved separately before falling through to the same partner
//   lookup every college uses.

export interface ResolvedProgramLink {
  href: string;
  label: string;
  title?: string;
  variant: "primary" | "secondary";
}

// Resolves a step against the school's flagship transfer partner — the
// bachelor's a student transfers INTO. Used by every school whose own catalog
// (or, for MDC, own program tables) doesn't contain the step, so this is
// reached only once the caller has ruled out the step being one of the
// school's own programs.
function transferPartnerLink(
  schoolId: string,
  step: PathwayStep
): ResolvedProgramLink | null {
  const agreement = transferAgreementFor(schoolId);
  const partnerCatalog = agreement?.universityId
    ? catalogFor(agreement.universityId)
    : null;
  if (!agreement || !partnerCatalog) return null;

  const partnerProgram = partnerCatalog.find(step.name, step.level);
  if (!partnerProgram) return null;

  return {
    href: partnerProgram.url,
    label: `Offered at ${agreement.universityShortName}: ${partnerProgram.name}`,
    title: `${partnerProgram.name} — ${agreement.university}`,
    variant: "secondary",
  };
}

// True when the step's own 'level' explicitly names the transfer partner —
// e.g. "B.S. (UF)" — using the exact "(Shortname)" convention the prompt
// teaches the model (see the 'level' field instructions in
// collegeSystemPrompt/mdcSystemPrompt in pathwayPrompts.ts).
function levelNamesPartner(step: PathwayStep, partnerShortName: string): boolean {
  return step.level?.includes(`(${partnerShortName})`) ?? false;
}

export function resolveProgramLink(
  step: PathwayStep,
  schoolId: string,
  options: { afterTransfer?: boolean } = {}
): ResolvedProgramLink | null {
  if (step.type !== "degree") return null;

  // Schools with a scraped catalog resolve their own steps directly. Every
  // degree step in such a pathway is one of that school's programs, because the
  // prompt only permits names from its catalog.
  const catalog = catalogFor(schoolId);
  if (catalog) {
    // Some state colleges grant bachelor's degrees themselves, and several
    // share a bare subject name with their own flagship partner's bachelor's
    // — "Nursing," "Accounting," "Business Administration," and "Elementary
    // Education" all appear on both sides of at least one college/partner
    // pair (Santa Fe/UF, TSC/FSU, IRSC/FAU, and others — confirmed by
    // diffing every college's own bachelor names against its partner's).
    // Two independent signals say a step was taken AT the partner rather
    // than being this school's own same-named program: `afterTransfer`,
    // whether a transfer step precedes this one in the SAME pathway (the
    // caller has the full steps array; this function only sees one step, so
    // it can't compute this itself) — the reliable, structural signal — and,
    // as a fallback when the caller can't provide that, whether the model
    // explicitly labelled this step's level with the partner's name
    // ("B.S. (UF)"), the convention collegeSystemPrompt/mdcSystemPrompt teach
    // it in pathwayPrompts.ts. Either one tried first, because the college's
    // own same-named program would otherwise silently shadow the partner's
    // and the link would point at the wrong school's page.
    const agreement = transferAgreementFor(schoolId);
    const shouldTryPartnerFirst =
      agreement != null &&
      (options.afterTransfer || levelNamesPartner(step, agreement.universityShortName));
    if (shouldTryPartnerFirst) {
      const partnerLink = transferPartnerLink(schoolId, step);
      if (partnerLink) return partnerLink;
    }

    const program = catalog.find(step.name, step.level);
    if (program) {
      return {
        href: program.url,
        label: "View Program Page",
        title: program.area ? `${program.name} — ${program.area}` : program.name,
        variant: "primary",
      };
    }

    // Not one of this school's own programs — on a state-college pathway
    // that means the post-transfer bachelor's, so try the flagship partner
    // before giving up, otherwise the one step the whole pathway aims at is
    // the only one with no link.
    return transferPartnerLink(schoolId, step);
  }

  // MDC pathway: MDC's own programs first (its bespoke URL-mapping tables,
  // not a scraped catalog — see the comment above).
  if (hasMDCProgramPage(step.name, step.level)) {
    return {
      href: getMDCProgramUrl(step.name),
      label: "View Program Page",
      variant: "primary",
    };
  }

  // A step explicitly marked as taken at MDC that isn't one of MDC's own
  // program pages gets nothing rather than being sent to another school's
  // site under a false claim of being "at MDC".
  if (step.level?.includes("MDC")) return null;

  // Otherwise this is the post-transfer bachelor's — same partner lookup
  // every college uses, now that MDC's own transferAgreements entry names FIU
  // instead of that being hardcoded here.
  return transferPartnerLink(schoolId, step);
}
