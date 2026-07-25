// Per-school footer resources, advising contacts, and transfer-agreement link.
//
// Separate from app/lib/programCatalog.ts: that file is about resolving a
// generated pathway's degree steps to program pages. This is about the site
// chrome — the footer and the "View Transfer Agreements" button — which only
// needs a school's own links, not its program list.
//
// Only schools we've actually curated this for have an entry; every other
// school (58 of 61 in floridaSchools.ts) falls back to MDC's, matching how the
// footer behaved before per-school data existed. That's a placeholder, not a
// claim that MDC's contacts are correct for that school — extend this as real
// info comes in, the same way SCHOOLS_WITH_CATALOG grows.

export interface SchoolContact {
  label: string;
  email: string;
}

export interface SchoolResource {
  label: string;
  url: string;
}

export interface SchoolInfo {
  shortName: string;
  transferAgreementsUrl: string;
  /** null when there's no school to point an accessibility link at (the default identity). */
  accessibilityUrl: string | null;
  resources: SchoolResource[];
  contacts: SchoolContact[];
}

const SCHOOL_INFO: Record<string, SchoolInfo> = {
  // The pre-selection identity (see floridaSchools.ts DEFAULT_SCHOOL) isn't a
  // school, so it gets Vocation's own contact and the state's higher-ed site
  // instead of MDC's — that fallback would misleadingly imply the visitor had
  // already picked MDC. No accessibilityUrl for the same reason: there's no
  // school-specific accessibility page to point at yet.
  default: {
    shortName: "Vocation",
    transferAgreementsUrl: "https://www.fldoe.org/",
    accessibilityUrl: null,
    resources: [{ label: "Florida Department of Education", url: "https://www.fldoe.org/" }],
    contacts: [{ label: "Vocation", email: "chrisorozco305@gmail.com" }],
  },
  mdc: {
    shortName: "MDC",
    transferAgreementsUrl:
      "https://www.mdc.edu/transfer-information/transfer-agreements/",
    accessibilityUrl: "https://www.mdc.edu/access/",
    resources: [
      { label: "Miami Dade College", url: "https://www.mdc.edu/" },
      { label: "Academic Advising", url: "https://www.mdc.edu/advisement/" },
      { label: "Degree Programs", url: "https://www.mdc.edu/academics/programs/" },
    ],
    contacts: [{ label: "Advising", email: "advisement@mdc.edu" }],
  },
  fiu: {
    shortName: "FIU",
    transferAgreementsUrl: "https://www.fiu.edu/academics/degrees-and-programs/index.html",
    accessibilityUrl: "https://accessibility.fiu.edu/",
    resources: [
      { label: "Florida International University", url: "https://www.fiu.edu/" },
      { label: "Academic Advising", url: "https://case.fiu.edu/advising/" },
      {
        label: "Degree Programs",
        url: "https://www.fiu.edu/academics/degrees-and-programs/index.html",
      },
    ],
    contacts: [{ label: "Advising", email: "fiuadvising@fiu.edu" }],
  },
  broward: {
    shortName: "Broward",
    transferAgreementsUrl:
      "https://www.broward.edu/students/transfer-services/transfer-agreements.html",
    accessibilityUrl: "https://www.broward.edu/accessibility/resources.html",
    resources: [
      { label: "Broward College", url: "https://www.broward.edu/" },
      { label: "Academic Advising", url: "https://www.broward.edu/students/advising/" },
      {
        label: "Degree Programs",
        url: "https://www.broward.edu/academics/degrees-certificates.html",
      },
    ],
    // Broward advises by campus rather than through one central office, unlike
    // MDC and FIU, so this is the one school with more than one contact.
    contacts: [
      { label: "North Campus", email: "nadvise@broward.edu" },
      { label: "Central Campus", email: "cadvise1@broward.edu" },
      { label: "South Campus", email: "sadvise@broward.edu" },
      { label: "Broward College Online", email: "bconline@broward.edu" },
    ],
  },
};

export function getSchoolInfo(schoolId: string): SchoolInfo {
  return SCHOOL_INFO[schoolId] ?? SCHOOL_INFO.mdc;
}

/** School ids with their own curated footer/contact info (not a fallback). */
export function hasSchoolInfo(schoolId: string): boolean {
  return schoolId in SCHOOL_INFO;
}
