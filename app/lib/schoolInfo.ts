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

  // --- State University System (FIU is curated above) ---------------------
  // Researched 2026-07-25 from each university's own site. Universities push
  // advising down to the individual college, so most publish no central
  // advising address and `contacts` is empty for them — the footer drops the
  // heading rather than showing a guess.
  //
  // Watch the accessibility links here: several of these schools serve a
  // /accessibility/ page that is a WEB-accessibility policy, not the student
  // disability office (FAMU and UNF both do). These point at the office that
  // actually arranges student accommodations.

  famu: {
    shortName: "FAMU",
    transferAgreementsUrl: null,
    // CeDAR, not famu.edu/accessibility (that one is a web-accessibility policy).
    accessibilityUrl:
      "https://www.famu.edu/students/student-resources/center-for-disability-access-and-resources/index.php",
    resources: [
      { label: "Florida A&M University", url: "https://www.famu.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.famu.edu/students/student-resources/academic-support/academic-advising/index.php",
      },
      { label: "Degree Programs", url: "https://www.famu.edu/academics/index.php" },
    ],
    // FAMU assigns advisors per program via iRattler and publishes no
    // central advising address, so this is the admissions office.
    contacts: [
      { label: "Undergraduate Admissions", email: "ugrdadmissions@famu.edu" },
    ],
  },
  fau: {
    shortName: "FAU",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.fau.edu/sas/",
    resources: [
      { label: "Florida Atlantic University", url: "https://www.fau.edu/" },
      { label: "Academic Advising", url: "https://www.fau.edu/advising/" },
      { label: "Degree Programs", url: "https://www.fau.edu/programs/" },
    ],
    contacts: [{ label: "Advising", email: "advisingservices@fau.edu" }],
  },
  fgcu: {
    shortName: "FGCU",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.fgcu.edu/adaptive/",
    resources: [
      { label: "Florida Gulf Coast University", url: "https://www.fgcu.edu/" },
      { label: "Academic Advising", url: "https://www.fgcu.edu/academics/advising/" },
      { label: "Degree Programs", url: "https://www.fgcu.edu/degree/" },
    ],
    // FGCU advises by college; Exploratory is the office for students who
    // haven't declared, which is the closest thing to a general contact.
    contacts: [{ label: "Exploratory Advising", email: "explore@fgcu.edu" }],
  },
  flpoly: {
    shortName: "Florida Poly",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://floridapoly.edu/studentlife/disability-services/",
    resources: [
      { label: "Florida Polytechnic University", url: "https://floridapoly.edu/" },
      {
        label: "Academic Advising",
        url: "https://floridapoly.edu/academics/resources/student-success/",
      },
      { label: "Degree Programs", url: "https://floridapoly.edu/academics/programs/" },
    ],
    contacts: [{ label: "Student Success", email: "success@floridapoly.edu" }],
  },
  fsu: {
    shortName: "FSU",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://dsst.fsu.edu/oas",
    resources: [
      { label: "Florida State University", url: "https://www.fsu.edu/" },
      { label: "Academic Advising", url: "https://advising.fsu.edu/" },
      { label: "Degree Programs", url: "https://admissions.fsu.edu/majors" },
    ],
    // Advising is per college; this is the general admissions contact.
    contacts: [{ label: "Admissions", email: "admissions@fsu.edu" }],
  },
  ncf: {
    shortName: "New College",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.ncf.edu/departments/advocacy-accessibility/",
    resources: [
      { label: "New College of Florida", url: "https://www.ncf.edu/" },
      { label: "Academic Advising", url: "https://www.ncf.edu/advising/" },
      { label: "Degree Programs", url: "https://www.ncf.edu/academics/" },
    ],
    contacts: [{ label: "Admissions", email: "admissions@ncf.edu" }],
  },
  ucf: {
    shortName: "UCF",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://access.ucf.edu/student-accessibility-services/",
    resources: [
      { label: "University of Central Florida", url: "https://www.ucf.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.sswb.ucf.edu/faq/academic-advising/",
      },
      { label: "Degree Programs", url: "https://www.ucf.edu/degree-search/" },
    ],
    // UCF calls advising "Academic Success Coaching" and runs it per college;
    // students find their assigned coach through myUCF, so this is admissions.
    contacts: [{ label: "Admissions", email: "admission@ucf.edu" }],
  },
  uf: {
    shortName: "UF",
    transferAgreementsUrl: null,
    // The Disability Resource Center, not accessibility.ufl.edu (web policy).
    accessibilityUrl: "https://disability.ufl.edu/",
    resources: [
      { label: "University of Florida", url: "https://www.ufl.edu/" },
      { label: "Academic Advising", url: "https://www.advising.ufl.edu/" },
      {
        label: "Degree Programs",
        url: "https://www.ufl.edu/academics/programs-courses/",
      },
    ],
    // UF's public contacts page lists only phones and a Request Info form;
    // this address was supplied by the project owner.
    contacts: [{ label: "Admissions", email: "freshman@ufl.edu" }],
  },
  unf: {
    shortName: "UNF",
    transferAgreementsUrl: null,
    // The Student Accessibility Center, not unf.edu/accessibility (ADA/504
    // coordination policy).
    accessibilityUrl: "https://www.unf.edu/sac/index.html",
    resources: [
      { label: "University of North Florida", url: "https://www.unf.edu/" },
      { label: "Academic Advising", url: "https://www.unf.edu/advising/" },
      { label: "Degree Programs", url: "https://www.unf.edu/academics/" },
    ],
    contacts: [{ label: "Admissions", email: "admissions@unf.edu" }],
  },
  usf: {
    shortName: "USF",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.usf.edu/student-affairs/student-accessibility/",
    resources: [
      { label: "University of South Florida", url: "https://www.usf.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.usf.edu/undergrad/students/advising.aspx",
      },
      {
        label: "Degree Programs",
        url: "https://www.usf.edu/undergrad-catalog-programs-a-z",
      },
    ],
    // Advising is per college; Exploratory covers undeclared students.
    contacts: [{ label: "Exploratory Advising", email: "ecmadvise@usf.edu" }],
  },
  uwf: {
    shortName: "UWF",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://uwf.edu/student-affairs/departments/student-accessibility-resources/",
    resources: [
      { label: "University of West Florida", url: "https://uwf.edu/" },
      {
        label: "Academic Advising",
        url: "https://uwf.edu/academic-affairs/departments/persistence-and-academic-success-services/academic-advising/",
      },
      { label: "Degree Programs", url: "https://uwf.edu/programs/" },
    ],
    contacts: [{ label: "Admissions", email: "admissions@uwf.edu" }],
  },

  // --- Private institutions (SACSCOC-accredited, curated list) ------------
  // Researched 2026-07-25 from each school's own site. Four of these serve
  // pages only to real browsers (Cloudflare); those were verified in a browser
  // rather than by script.
  //
  // Some entries have no "Academic Advising" resource: Bethune-Cookman,
  // Edward Waters, Keiser and Palm Beach Atlantic publish no advising page we
  // could find. Others have accessibilityUrl null because the office page is
  // gone — Bethune-Cookman's Student Accessibility Services page 404s and only
  // a web-accessibility POLICY survives, which is not the same thing and must
  // not be linked in its place.

  avemaria: {
    shortName: "Ave Maria",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.avemaria.edu/resources/adaptive-services",
    resources: [
      { label: "Ave Maria University", url: "https://www.avemaria.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.avemaria.edu/resources/advising-services",
      },
      { label: "Degree Programs", url: "https://www.avemaria.edu/academics" },
    ],
    contacts: [{ label: "Admissions", email: "admissions@avemaria.edu" }],
  },
  barry: {
    shortName: "Barry",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.barry.edu/en/accessibility-services/",
    resources: [
      { label: "Barry University", url: "https://www.barry.edu/en" },
      {
        label: "Academic Advising",
        url: "https://www.barry.edu/en/academic-affairs/casa",
      },
      { label: "Degree Programs", url: "https://www.barry.edu/en/academics/" },
    ],
    contacts: [{ label: "Admissions", email: "admissions@barry.edu" }],
  },
  cookman: {
    shortName: "B-CU",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.cookman.edu/currentstudents/bhrs/accessibility-services.html",
    resources: [
      { label: "Bethune-Cookman University", url: "https://www.cookman.edu/" },
      // B-CU publishes no general advising page. This one is the veteran and
      // military services team, so it's labelled for what it actually is
      // rather than passed off as academic advising.
      {
        label: "Military & Veteran Services",
        url: "https://www.cookman.edu/currentstudents/military-services/meet-the-team.html",
      },
      { label: "Degree Programs", url: "https://www.cookman.edu/academics/" },
    ],
    contacts: [{ label: "Admissions", email: "admissions@cookman.edu" }],
  },
  eckerd: {
    shortName: "Eckerd",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.eckerd.edu/aes/",
    resources: [
      { label: "Eckerd College", url: "https://www.eckerd.edu/" },
      { label: "Academic Advising", url: "https://www.eckerd.edu/excellence/" },
      { label: "Degree Programs", url: "https://www.eckerd.edu/academics/majors/" },
    ],
    contacts: [
      { label: "Center for Academic Excellence", email: "excellence@eckerd.edu" },
    ],
  },
  ewu: {
    shortName: "EWU",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.ew.edu/accessibility-support/",
    resources: [
      // Edward Waters moved from ewc.edu to ew.edu.
      { label: "Edward Waters University", url: "https://www.ew.edu/" },
      { label: "Academic Advising", url: "https://www.ew.edu/sse/" },
      { label: "Degree Programs", url: "https://www.ew.edu/academics/" },
    ],
    contacts: [{ label: "Admissions", email: "admissions@ew.edu" }],
  },
  erau: {
    shortName: "Embry-Riddle",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://erau.edu/student-experience/student-services/student-accessibility-services",
    resources: [
      { label: "Embry-Riddle Aeronautical University", url: "https://erau.edu/" },
      {
        label: "Academic Advising",
        url: "https://erau.edu/student-experience/student-services/academic-advising",
      },
      { label: "Degree Programs", url: "https://erau.edu/degrees" },
    ],
    // Embry-Riddle advises per campus; Daytona Beach is the Florida one.
    contacts: [{ label: "Daytona Beach Advising", email: "dbadvise@erau.edu" }],
  },
  flagler: {
    shortName: "Flagler",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.flagler.edu/academics/academic-support/disability-resource-center",
    resources: [
      { label: "Flagler College", url: "https://www.flagler.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.flagler.edu/academics/academic-support/academic-access-and-success/center-advising-and-core-experience",
      },
      {
        label: "Degree Programs",
        url: "https://www.flagler.edu/academics/degrees-programs",
      },
    ],
    contacts: [{ label: "Advising", email: "cace@flagler.edu" }],
  },
  fit: {
    shortName: "Florida Tech",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.fit.edu/student-success-support-center/accessibility-resources/",
    resources: [
      { label: "Florida Institute of Technology", url: "https://www.fit.edu/" },
      { label: "Academic Advising", url: "https://www.fit.edu/advising/" },
      { label: "Degree Programs", url: "https://www.fit.edu/programs/" },
    ],
    contacts: [{ label: "Advising", email: "advising@fit.edu" }],
  },
  fmu: {
    shortName: "FMU",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.fmu.edu/about-fmu/administration/academic-affairs/office-of-the-provost/center-for-academic-resources-and-support/ada-accommodations/",
    resources: [
      { label: "Florida Memorial University", url: "https://www.fmu.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.fmu.edu/about-fmu/administration/academic-affairs/office-of-the-provost/center-for-academic-resources-and-support/academic-advising/",
      },
      { label: "Degree Programs", url: "https://www.fmu.edu/academics/" },
    ],
    // FMU's site is fmu.edu but its mail domain is fmuniv.edu.
    contacts: [{ label: "Advising", email: "Advising@fmuniv.edu" }],
  },
  fsc: {
    shortName: "Florida Southern",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.flsouthern.edu/campus-offices/offices-directory/office-of-student-disability-services",
    resources: [
      { label: "Florida Southern College", url: "https://www.flsouthern.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.flsouthern.edu/academic-life/engaged-learning-the-fsc-way/academic-support-services/academic-advising",
      },
      {
        label: "Degree Programs",
        url: "https://www.flsouthern.edu/academic-life/all-academic-programs",
      },
    ],
    contacts: [{ label: "Admissions", email: "fscadm@flsouthern.edu" }],
  },
  ju: {
    shortName: "JU",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.ju.edu/disabilityservices/",
    resources: [
      { label: "Jacksonville University", url: "https://www.ju.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.ju.edu/studentenrichmentcenter/index.php",
      },
      { label: "Degree Programs", url: "https://www.ju.edu/academics/" },
    ],
    contacts: [{ label: "Student Enrichment Center", email: "enrichment@ju.edu" }],
  },
  keiser: {
    shortName: "Keiser",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.keiseruniversity.edu/americans-with-disabilities-act/",
    resources: [
      { label: "Keiser University", url: "https://www.keiseruniversity.edu/" },
      {
        label: "Academic Advising",
        url: "https://residential.keiseruniversity.edu/students/academic-advising/",
      },
      {
        label: "Degree Programs",
        url: "https://www.keiseruniversity.edu/programs/all-programs/",
      },
    ],
    contacts: [{ label: "ADA Office", email: "ADA@keiseruniversity.edu" }],
  },
  lynn: {
    shortName: "Lynn",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.lynn.edu/campus-directory/departments/accessibility-services",
    resources: [
      { label: "Lynn University", url: "https://www.lynn.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.lynn.edu/campus-directory/departments/academic-advising",
      },
      { label: "Degree Programs", url: "https://www.lynn.edu/academics" },
    ],
    contacts: [{ label: "Advising", email: "myadvisor@lynn.edu" }],
  },
  nova: {
    shortName: "NSU",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.nova.edu/disability-services/index.html",
    resources: [
      { label: "Nova Southeastern University", url: "https://www.nova.edu/" },
      {
        label: "Academic Advising",
        url: "https://undergrad.nova.edu/academics/academic-advising.html",
      },
      { label: "Degree Programs", url: "https://www.nova.edu/degrees.html" },
    ],
    contacts: [{ label: "Admissions", email: "admissions@nova.edu" }],
  },
  pba: {
    shortName: "PBA",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.pba.edu/academics/disability-services-accommodations/",
    resources: [
      { label: "Palm Beach Atlantic University", url: "https://www.pba.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.pba.edu/academics/student-success/",
      },
      {
        label: "Degree Programs",
        url: "https://www.pba.edu/academics/undergraduate-programs/",
      },
    ],
    contacts: [{ label: "Admissions", email: "admit@pba.edu" }],
  },
  rollins: {
    shortName: "Rollins",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.rollins.edu/student-life/accessibility-services/",
    resources: [
      { label: "Rollins College", url: "https://www.rollins.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.rollins.edu/academic-advising/",
      },
      { label: "Degree Programs", url: "https://www.rollins.edu/academics/majors-minors/" },
    ],
    contacts: [{ label: "Advising", email: "advising@rollins.edu" }],
  },
  saintleo: {
    shortName: "Saint Leo",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.saintleo.edu/student-experience/support/accessibility",
    resources: [
      { label: "Saint Leo University", url: "https://www.saintleo.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.saintleo.edu/academics/success-resources/student-advising",
      },
      { label: "Degree Programs", url: "https://www.saintleo.edu/academics" },
    ],
    contacts: [{ label: "Admissions", email: "admissions@saintleo.edu" }],
  },
  stetson: {
    shortName: "Stetson",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.stetson.edu/administration/accessibility-services/",
    resources: [
      { label: "Stetson University", url: "https://www.stetson.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.stetson.edu/administration/academic-advising/",
      },
      { label: "Degree Programs", url: "https://www.stetson.edu/academics/" },
    ],
    // Stetson advises through assigned faculty; the accessibility centre is
    // the one published departmental address.
    contacts: [{ label: "Accessibility Services", email: "asc@stetson.edu" }],
  },
  stu: {
    shortName: "STU",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://www.stu.edu/student-accessibility-service/",
    resources: [
      { label: "St. Thomas University", url: "https://www.stu.edu/" },
      { label: "Academic Advising", url: "https://www.stu.edu/student-success/" },
      { label: "Degree Programs", url: "https://www.stu.edu/programs/" },
    ],
    contacts: [{ label: "Admissions", email: "admissions@stu.edu" }],
  },
  miami: {
    shortName: "UM",
    transferAgreementsUrl: null,
    accessibilityUrl: "https://camnercenter.miami.edu/disability-services/",
    resources: [
      { label: "University of Miami", url: "https://welcome.miami.edu/" },
      { label: "Academic Advising", url: "https://success.miami.edu/" },
      { label: "Degree Programs", url: "https://welcome.miami.edu/academics/" },
    ],
    contacts: [{ label: "Admission", email: "admission@miami.edu" }],
  },
  tampa: {
    shortName: "UTampa",
    transferAgreementsUrl: null,
    accessibilityUrl:
      "https://www.ut.edu/academics/academic-support/academic-success-center/student-accessibility-and-academic-support-/student-accessibility-services",
    resources: [
      { label: "University of Tampa", url: "https://www.ut.edu/" },
      {
        label: "Academic Advising",
        url: "https://www.ut.edu/academics/academic-support/academic-success-center",
      },
      {
        label: "Degree Programs",
        url: "https://www.ut.edu/academics/degree-programs",
      },
    ],
    contacts: [
      { label: "Academic Success Center", email: "academicsuccess@ut.edu" },
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
