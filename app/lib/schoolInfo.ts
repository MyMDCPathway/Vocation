// Per-school footer resources, advising contacts, and transfer-agreement link.
//
// Separate from app/lib/programCatalog.ts: that file is about resolving a
// generated pathway's degree steps to program pages. This is about the site
// chrome — the footer and the "View Transfer Agreements" button — which only
// needs a school's own links, not its program list.
//
// Only schools we've actually curated this for have an entry; anything without
// one falls back to MDC's, matching how the footer behaved before per-school
// data existed. That's a placeholder, not a claim that MDC's contacts are
// correct for that school — extend this as real info comes in, the same way
// SCHOOLS_WITH_CATALOG grows.
//
// Every url below was read off that school's own site. The advising addresses
// for the FCS schools that don't publish one on their public pages were
// supplied by the project owner; the rest came off the sites directly.
//
// `contacts` may legitimately be empty and the footer handles that by dropping
// the heading — an empty list beats guessing, since a wrong advising address
// sends a student nowhere. Same rule for the nullable URLs: no link beats a
// link to the wrong page.

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
  /** null when the school publishes no transfer-agreement page we could verify. */
  transferAgreementsUrl: string | null;
  /** null when there's no accessibility page to point at (or none verified). */
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

  // --- Remaining Florida College System schools --------------------------
  // Researched 2026-07-25 from each school's own site. transferAgreementsUrl is
  // null throughout: none of these publish a transfer-agreement page we could
  // verify, and none can generate pathways yet (see SCHOOLS_WITH_CATALOG), so
  // the button that uses it never renders for them.

  chipola: {
    shortName: "Chipola",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.chipola.edu/studentservices/student-disability-resource-office/",
    resources: [
      { label: "Chipola College", url: "https://www.chipola.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.chipola.edu/studentservices/advising/",
      },
      {
        label: "Degree Programs",
        url: "https://www.chipola.edu/catalog/programs-of-study/",
      },
    ],
    contacts: [{ label: "Advising", email: "hallk@chipola.edu" }],
  },
  cf: {
    shortName: "CF",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.cf.edu/student-life/student-services/accessibility-services/",
    resources: [
      { label: "College of Central Florida", url: "https://www.cf.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.cf.edu/academics/academic-services/academic-advising/",
      },
      {
        label: "Degree Programs",
        url: "https://www.cf.edu/academics/degrees-and-certificates/",
      },
    ],
    contacts: [{ label: "Advising", email: "advising@cf.edu" }],
  },
  cfk: {
    shortName: "CFK",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.cfk.edu/academics/accessibility-services/",
    resources: [
      { label: "College of the Florida Keys", url: "https://www.cfk.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.cfk.edu/admissions/academic-advising/",
      },
      {
        label: "Degree Programs",
        url: "https://www.cfk.edu/academics/academic-departments/",
      },
    ],
    contacts: [{ label: "Advising", email: "advising.services@cfk.edu" }],
  },
  daytona: {
    shortName: "Daytona State",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.daytonastate.edu/student-service-departments/counseling-accessibility/index.html",
    resources: [
      { label: "Daytona State College", url: "https://www.daytonastate.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.daytonastate.edu/advising/index.html",
      },
      {
        label: "Degree Programs",
        url: "https://www.daytonastate.edu/program-finder/index.html",
      },
    ],
    contacts: [{ label: "Advising", email: "advising@daytonastate.edu" }],
  },
  efsc: {
    shortName: "EFSC",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.easternflorida.edu/academics/academic-support/sail/index.php",
    resources: [
      {
        label: "Eastern Florida State College",
        url: "https://www.easternflorida.edu/",
      },
      {
        label: "Academic Advising",
        url: "https://www.easternflorida.edu/academics/advising/index.php",
      },
      {
        label: "Degree Programs",
        url: "https://www.easternflorida.edu/academics/programs/index.php",
      },
    ],
    contacts: [{ label: "Advising", email: "advising@easternflorida.edu" }],
  },
  fgc: {
    shortName: "FGC",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.fgc.edu/students/office-of-accessibility-services.html",
    resources: [
      { label: "Florida Gateway College", url: "https://www.fgc.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.fgc.edu/students/academic-advising/index.html",
      },
      { label: "Degree Programs", url: "https://www.fgc.edu/academics/index.html" },
    ],
    contacts: [{ label: "Advising", email: "advising@fgc.edu" }],
  },
  fsw: {
    shortName: "FSW",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.fsw.edu/adaptiveservices",
    resources: [
      {
        label: "Florida SouthWestern State College",
        url: "https://www.fsw.edu/",
      },
      { label: "Academic Advising", url: "https://www.fsw.edu/advising" },
      { label: "Degree Programs", url: "https://www.fsw.edu/academics/programs" },
    ],
    contacts: [{ label: "Advising", email: "advising@fsw.edu" }],
  },
  fscj: {
    shortName: "FSCJ",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.fscj.edu/saem/student-resources/student-support-services/access-disability-resources",
    resources: [
      {
        label: "Florida State College at Jacksonville",
        url: "https://www.fscj.edu/",
      },
      {
        label: "Academic Advising",
        url: "https://www.fscj.edu/saem/academic-advising",
      },
      { label: "Degree Programs", url: "https://www.fscj.edu/program-explorer" },
    ],
    contacts: [{ label: "Welcome Center", email: "welcome@fscj.edu" }],
  },
  gcsc: {
    shortName: "Gulf Coast",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.gulfcoast.edu/academics/academic-support-tutoring/student-accessibility-resources/index.html",
    resources: [
      { label: "Gulf Coast State College", url: "https://www.gulfcoast.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.gulfcoast.edu/admissions/advising/index.html",
      },
      {
        label: "Degree Programs",
        url: "https://www.gulfcoast.edu/academics/degrees-programs/index.html",
      },
    ],
    contacts: [{ label: "Advising", email: "advising@gulfcoast.edu" }],
  },
  hcc: {
    shortName: "Hillsborough",
    transferAgreementsUrl: null,
    // hccfl.edu now 301-redirects to hcfl.edu, so links use the new domain.
    // The published advising addresses still use @hccfl.edu.
    accessibilityUrl:
      "https://www.hcfl.edu/student-services/services-students-disabilities",
    resources: [
      { label: "Hillsborough Community College", url: "https://www.hcfl.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.hcfl.edu/student-services/academic-advising",
      },
      {
        label: "Degree Programs",
        url: "https://www.hcfl.edu/browse-all-degrees-certificates",
      },
    ],
    contacts: [
      { label: "Brandon", email: "bradvising@hccfl.edu" },
      { label: "Dale Mabry", email: "dmadvising@hccfl.edu" },
      { label: "MacDill", email: "macdilladvising@hccfl.edu" },
      { label: "Plant City", email: "plantcityadvising@hccfl.edu" },
      { label: "SouthShore", email: "southshoreadvising@hccfl.edu" },
      { label: "Ybor City", email: "ybadvising@hccfl.edu" },
    ],
  },
  irsc: {
    shortName: "IRSC",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://irsc.edu/student-life/student-accessibility-services/",
    resources: [
      { label: "Indian River State College", url: "https://irsc.edu/" },
      {
        label: "Academic Advising",
        url: "https://irsc.edu/advising-services/riverline/",
      },
      { label: "Degree Programs", url: "https://irsc.edu/search-programs/" },
    ],
    contacts: [{ label: "General", email: "info@irsc.edu" }],
  },
  lssc: {
    shortName: "LSSC",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.lssc.edu/sas/",
    resources: [
      { label: "Lake-Sumter State College", url: "https://www.lssc.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.lssc.edu/student-resources/academic-advising/",
      },
      {
        label: "Degree Programs",
        url: "https://www.lssc.edu/academic-programs/",
      },
    ],
    contacts: [{ label: "Enrollment Service Center", email: "ESC@lssc.edu" }],
  },
  nfc: {
    shortName: "NFC",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.nfc.edu/student-life/oas/",
    resources: [
      { label: "North Florida College", url: "https://www.nfc.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.nfc.edu/admissions/academic-advisor/",
      },
      { label: "Degree Programs", url: "https://www.nfc.edu/academics/" },
    ],
    contacts: [{ label: "Advising", email: "Advising@nfc.edu" }],
  },
  nwfsc: {
    shortName: "NWF",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.nwfsc.edu/accommodations/",
    resources: [
      {
        label: "Northwest Florida State College",
        url: "https://www.nwfsc.edu/",
      },
      { label: "Academic Advising", url: "https://www.nwfsc.edu/advising/" },
      { label: "Degree Programs", url: "https://www.nwfsc.edu/explore-programs/" },
    ],
    contacts: [{ label: "Student Success", email: "studentsuccess@nwfsc.edu" }],
  },
  pbsc: {
    shortName: "Palm Beach State",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.pbsc.edu/student-accessibility/index.php",
    resources: [
      { label: "Palm Beach State College", url: "https://www.pbsc.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.pbsc.edu/academics/academic-advising.php",
      },
      { label: "Degree Programs", url: "https://www.pbsc.edu/programs/index.php" },
    ],
    contacts: [{ label: "Advising", email: "advising@pbsc.edu" }],
  },
  phsc: {
    shortName: "PHSC",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://accessibility-services.phsc.edu/",
    resources: [
      { label: "Pasco-Hernando State College", url: "https://phsc.edu/" },
      { label: "Academic Advising", url: "https://advising.phsc.edu/" },
      { label: "Degree Programs", url: "https://phsc.edu/academics/programs" },
    ],
    contacts: [{ label: "Advising", email: "advising@phsc.edu" }],
  },
  psc: {
    shortName: "Pensacola State",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://pensacolastate.edu/current-students/student-services/student-resource-center-for-ada-services/",
    resources: [
      { label: "Pensacola State College", url: "https://pensacolastate.edu/" },
      { label: "Academic Advising", url: "https://advising.pensacolastate.edu/" },
      {
        label: "Degree Programs",
        url: "https://pensacolastate.edu/academics/programs/",
      },
    ],
    contacts: [
      { label: "Ask Us", email: "AskUs@pensacolastate.edu" },
      { label: "ADA Services", email: "ADA-Services@pensacolastate.edu" },
    ],
  },
  polk: {
    shortName: "Polk State",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.polk.edu/compliance-for-equal-opportunity-and-accessibility-services/",
    resources: [
      { label: "Polk State College", url: "https://www.polk.edu/" },
      { label: "Academic Advising", url: "https://www.polk.edu/advising/" },
      {
        label: "Degree Programs",
        url: "https://www.polk.edu/academics/degrees-and-certificates/",
      },
    ],
    // Polk splits online advising alphabetically by student last name.
    contacts: [
      { label: "Advising (last name A–M)", email: "OnlineAdvisingA@polk.edu" },
      { label: "Advising (last name N–Z)", email: "OnlineAdvisingZ@polk.edu" },
      { label: "Bachelor's programs", email: "bachelor@polk.edu" },
    ],
  },
  sjr: {
    shortName: "SJR State",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.sjrstate.edu/disabledstudents",
    resources: [
      { label: "St. Johns River State College", url: "https://www.sjrstate.edu/" },
      { label: "Academic Advising", url: "https://www.sjrstate.edu/advising" },
      {
        label: "Degree Programs",
        url: "https://sjrstate.catalog.acalog.com/content.php?catoid=4&navoid=213",
      },
    ],
    contacts: [{ label: "Advising", email: "Advising@sjrstate.edu" }],
  },
  spc: {
    shortName: "SPC",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.spcollege.edu/friends-partners/about/compliance-statements/accessibility-services",
    resources: [
      { label: "St. Petersburg College", url: "https://www.spcollege.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.spcollege.edu/current-students/student-affairs/student-support-resources/advising",
      },
      {
        label: "Degree Programs",
        url: "https://www.spcollege.edu/future-students/degrees-training",
      },
    ],
    contacts: [{ label: "Bachelor's Admissions", email: "4yrAdmissions@spcollege.edu" }],
  },
  sf: {
    shortName: "Santa Fe",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.sfcollege.edu/drc/",
    resources: [
      { label: "Santa Fe College", url: "https://www.sfcollege.edu/" },
      { label: "Academic Advising", url: "https://www.sfcollege.edu/advisement/" },
      {
        label: "Degree Programs",
        url: "https://www.sfcollege.edu/academics/programs/",
      },
    ],
    contacts: [
      {
        label: "Academic Advisement",
        email: "academicadvisingcenter@sfcollege.edu",
      },
      { label: "Disabilities Resource Center", email: "drc@sfcollege.edu" },
    ],
  },
  seminole: {
    shortName: "Seminole State",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.seminolestate.edu/dss",
    resources: [
      {
        label: "Seminole State College of Florida",
        url: "https://www.seminolestate.edu/",
      },
      { label: "Academic Advising", url: "https://www.seminolestate.edu/counseling" },
      {
        label: "Degree Programs",
        url: "https://www.seminolestate.edu/catalog/programs",
      },
    ],
    contacts: [{ label: "Student Services", email: "studentservices@seminolestate.edu" }],
  },
  sfsc: {
    shortName: "SFSC",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.southflorida.edu/current-students/advising-counseling-center/services-students-with-disabilities",
    resources: [
      { label: "South Florida State College", url: "https://www.southflorida.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.southflorida.edu/current-students/advising-counseling-center",
      },
      {
        label: "Degree Programs",
        url: "https://www.southflorida.edu/current-students/degrees-programs",
      },
    ],
    contacts: [{ label: "Advising", email: "advising@southflorida.edu" }],
  },
  scf: {
    shortName: "SCF",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.scf.edu/explore/student-services/disability-resource-center/",
    resources: [
      {
        label: "State College of Florida, Manatee-Sarasota",
        url: "https://www.scf.edu/",
      },
      { label: "Academic Advising", url: "https://www.scf.edu/explore/academic-support-and-opportunities/college-career-success/" },
      { label: "Degree Programs", url: "https://www.scf.edu/programs/" },
    ],
    contacts: [
      {
        label: "College & Career Success",
        email: "CollegeAndCareerSuccess@SCF.edu",
      },
    ],
  },
  tsc: {
    shortName: "TSC",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.tsc.fl.edu/student-life/student-accessibility-services-sas/",
    resources: [
      { label: "Tallahassee State College", url: "https://www.tsc.fl.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.tsc.fl.edu/academics/academic-advising/",
      },
      { label: "Degree Programs", url: "https://www.tsc.fl.edu/academics/programs/" },
    ],
    contacts: [{ label: "Advising Center", email: "advisingcenter@tsc.fl.edu" }],
  },
  valencia: {
    shortName: "Valencia",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://valenciacollege.edu/students/office-for-students-with-disabilities/",
    resources: [
      { label: "Valencia College", url: "https://valenciacollege.edu/" },
      {
        label: "Academic Advising",
        url: "https://valenciacollege.edu/students/advising/",
      },
      { label: "Degree Programs", url: "https://valenciacollege.edu/academics/" },
    ],
    contacts: [{ label: "Enrollment", email: "enrollment@valenciacollege.edu" }],
  },
};

export function getSchoolInfo(schoolId: string): SchoolInfo {
  return SCHOOL_INFO[schoolId] ?? SCHOOL_INFO.mdc;
}

/** School ids with their own curated footer/contact info (not a fallback). */
export function hasSchoolInfo(schoolId: string): boolean {
  return schoolId in SCHOOL_INFO;
}
