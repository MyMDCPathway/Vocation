// Each state college's flagship transfer agreement.
//
// A Florida College System pathway almost always ends with "transfer to a
// four-year university", and until now the prompt said exactly that — generic,
// unhelpful, and the one step a student actually has to plan for. Every FCS
// school has a named articulation agreement with a specific university, so
// naming it turns a vague instruction into the advice a real advisor gives.
//
// Only the school's FLAGSHIP agreement is recorded. Most schools hold several
// (FGC lists nine); the point is a sensible default destination, not a complete
// index. `summary` is written per school rather than generated from a template
// because the schools promise materially different things — CF and EFSC promise
// guaranteed admission to UCF, while FGC's Going Gator covers one UF college's
// majors. Flattening those into one sentence would misstate the weaker ones.
//
// Florida's statewide 2+2 articulation independently guarantees A.A. graduates
// admission to one of the twelve State University System universities, so these
// agreements are an added benefit on top of that floor, never a replacement for
// it. The prompt says so, to keep the model from implying the named partner is
// a student's only option.

export interface TransferAgreement {
  /**
   * The partner's own id in `schoolCatalogs.ts`, when we hold its catalog.
   *
   * This is what turns "transfer to a four-year university" into a named real
   * degree: the prompt embeds this university's actual bachelor's list, and
   * ProgramLink resolves the post-transfer step against it so the student gets
   * a link to the real program page. Left undefined when the partner is not a
   * school we hold a catalog for — see `gcsc` below, the one such case.
   */
  universityId?: string;
  /** Full name of the university the agreement transfers into. */
  university: string;
  /** How the university is referred to in prose. */
  universityShortName: string;
  /** The agreement's own branded name, as the school markets it. */
  programName: string;
  /** Page describing the agreement — the school's own where it publishes one. */
  url: string;
  /** One sentence stating what this specific school actually promises. */
  summary: string;
  /** Other universities the school holds agreements with, when notable. */
  alsoPartnersWith?: string[];
}

const AGREEMENTS: Record<string, TransferAgreement> = {
  // MDC predates this table (see the "older pattern" note in
  // programCatalogs.ts) and its own prompt/link code used to hardcode FIU as
  // the transfer destination directly. This entry migrates that assumption
  // into the same table every other college uses, rather than a special case.
  // MDC's own transfer page names three guaranteed-admission programs (FIU
  // Connect4Success, FAU LINK, UCF Transfer Connect) with no explicit
  // "flagship" label, but FIU's is the one that singles MDC out by name —
  // FIU's own C4S blurb on MDC's site calls MDC a "longtime partner," and
  // FIU's Bridge Advisors are housed at only three colleges statewide, MDC
  // listed first — the same evidence that made FIU the pick for Broward.
  mdc: {
    universityId: "fiu",
    university: "Florida International University",
    universityShortName: "FIU",
    programName: "Connect4Success",
    url: "https://www.mdc.edu/transfer-information/transfer-agreements/institution/?id=42",
    summary:
      "Connect4Success guarantees FIU admission to MDC Associate in Arts graduates who finish within three years (limited-access programs excepted), with a dedicated FIU Bridge Advisor, a pre-issued FIU student ID, and C4S scholarship funding — FIU's own materials describe MDC as one of its longtime partner colleges.",
    alsoPartnersWith: ["Florida Atlantic University", "University of Central Florida"],
  },
  broward: {
    universityId: "fiu",
    university: "Florida International University",
    universityShortName: "FIU",
    programName: "Connect4Success",
    url: "https://www.broward.edu/students/transfer-services/priority-admissions.html",
    summary:
      "Connect4Success guarantees Broward College Associate in Arts graduates admission to most FIU programs (specialized-admission majors excepted) provided they finish within three years, and FIU staffs a dedicated Bridge Advisor on Broward's own campus — one of only three colleges statewide where FIU does so, alongside Miami Dade and Palm Beach State.",
    alsoPartnersWith: [
      "Florida Atlantic University",
      "Florida A&M University",
      "University of Florida",
    ],
  },
  cf: {
    universityId: "ucf",
    university: "University of Central Florida",
    universityShortName: "UCF",
    programName: "DirectConnect to UCF",
    url: "https://www.cf.edu/academics/degrees-and-certificates/bachelor-bound/directconnect-to-ucf/",
    summary:
      "Completing a CF Associate in Arts guarantees admission to UCF, with a DirectConnect success team advising the student through the transition.",
  },
  efsc: {
    universityId: "ucf",
    university: "University of Central Florida",
    universityShortName: "UCF",
    programName: "DirectConnect to UCF",
    url: "https://www.easternflorida.edu/academics/articulation/index.php",
    summary:
      "Completing an EFSC Associate in Arts guarantees admission to UCF, and UCF teaches upper-division courses on EFSC campuses so students can finish the bachelor's locally.",
  },
  fgc: {
    universityId: "uf",
    university: "University of Florida",
    universityShortName: "UF",
    programName: "Going Gator",
    url: "https://www.fgc.edu/academics/transfer-partnerships.html",
    summary:
      "FGC's Going Gator agreement routes Associate in Arts graduates who meet the academic requirements into UF College of Liberal Arts and Sciences majors; it is a defined pathway rather than blanket guaranteed admission.",
    alsoPartnersWith: [
      "University of North Florida",
      "University of Central Florida",
      "Florida A&M University",
      "Santa Fe College",
      "Bethune-Cookman University",
      "Valdosta State University",
      "Western Governors University",
    ],
  },
  fsw: {
    universityId: "fgcu",
    university: "Florida Gulf Coast University",
    universityShortName: "FGCU",
    programName: "Destination FGCU",
    url: "https://www.fsw.edu/twoplustwo",
    summary:
      "An FSW Associate in Arts guarantees admission to a FGCU bachelor's program, with an application fee waiver and transfer scholarships for eligible students; majors with specialized admission still impose their own criteria.",
  },
  fscj: {
    universityId: "unf",
    university: "University of North Florida",
    universityShortName: "UNF",
    programName: "FSCJ/UNF Connect",
    url: "https://www.fscj.edu/academics/areas-of-study/aa/aainfo/unf-connect",
    summary:
      "FSCJ/UNF Connect guarantees general admission to UNF for students who complete an FSCJ Associate in Arts, with FSCJ advisors on each campus supporting the transition.",
  },
  nwfsc: {
    universityId: "uwf",
    university: "University of West Florida",
    universityShortName: "UWF",
    programName: "NWF2UWF",
    url: "https://www.nwfsc.edu/academics/university-partnerships/",
    summary:
      "NWF2UWF moves NWFSC associate graduates into UWF bachelor's programs, with UWF courses offered at Fort Walton Beach, Eglin AFB, and Hurlburt Field as well as Pensacola, plus Specialized Associate in Arts Transfer tracks for the engineering disciplines.",
  },
  psc: {
    universityId: "uwf",
    university: "University of West Florida",
    universityShortName: "UWF",
    programName: "PSC2UWF",
    url: "https://pensacolastate.edu/current-students/psc2uwf/",
    summary:
      "Completing a PSC Associate in Arts guarantees admission to UWF, with a UWF program coordinator based on the PSC campus and PSC students gaining UWF library access, email, and a student ID before they even transfer.",
  },
  polk: {
    universityId: "usf",
    university: "University of South Florida",
    universityShortName: "USF",
    programName: "USF FUSE",
    url: "https://www.polk.edu/admission-aid/fuse/",
    summary:
      "USF FUSE guarantees Polk State Associate in Arts graduates admission into a specific USF program, not just the university broadly; it is limited to first-time-in-college students who enrolled at Polk State directly out of high school.",
    alsoPartnersWith: ["Florida Polytechnic University"],
  },
  sjr: {
    universityId: "unf",
    university: "University of North Florida",
    universityShortName: "UNF",
    programName: "UNF Gateway",
    url: "https://www.sjrstate.edu/advising-unf",
    summary:
      "The UNF Gateway program guarantees admission to UNF for students who complete an SJR State Associate in Arts, with a joint degree plan and SJR State advisors managing the transfer.",
  },
  sf: {
    universityId: "uf",
    university: "University of Florida",
    universityShortName: "UF",
    programName: "Going Gator",
    url: "https://www.sfcollege.edu/transfer/guaranteed/",
    summary:
      "Santa Fe College sends more students to UF than any other Florida college, and its own Going Gator agreement guarantees admission for Associate in Arts graduates who meet the requirements; Santa Fe also holds direct guaranteed-admission agreements with several other universities.",
    alsoPartnersWith: [
      "University of North Florida",
      "Florida A&M University",
      "Florida International University",
      "New College of Florida",
      "University of South Florida",
      "University of the Virgin Islands",
    ],
  },
  sfsc: {
    universityId: "usf",
    university: "University of South Florida",
    universityShortName: "USF",
    programName: "USF FUSE",
    url: "https://www.southflorida.edu/current-students/degrees-programs/academics/associate-arts-aa/usf-fuse",
    summary:
      "USF FUSE guarantees SFSC Associate in Arts graduates admission into a limited-access USF major, provided they maintain a 2.0 GPA and complete the associate degree within three years.",
  },
  scf: {
    universityId: "ncf",
    university: "New College of Florida",
    universityShortName: "New College",
    programName: "Guaranteed Admissions Program (GAP)",
    url: "https://www.scf.edu/news/2026/04/07/scf-and-new-college-create-direct-path-to-high-demand-degrees/",
    summary:
      "SCF's GAP agreement guarantees admission to New College — Florida's public honors college — for Associate in Arts graduates who finish within two and a half years at a 3.0 GPA; New College is a small liberal-arts school, so this fits transfer-oriented majors like the sciences and humanities far better than a professional or technical career.",
  },
  tsc: {
    universityId: "fsu",
    university: "Florida State University",
    universityShortName: "FSU",
    programName: "Aspire",
    url: "https://www.tsc.fl.edu/academics/transfer-services/aspire/",
    summary:
      "TSC is FSU's #1 transfer feeder school, and its Aspire program (four tracks: Traditional, Elite, Honors, and Online) gives students an FSU-adjacent experience — FSU housing, activities, and a personal academic map to their FSU major — while completing an Associate in Arts at half the cost.",
    alsoPartnersWith: ["Florida A&M University"],
  },
  valencia: {
    universityId: "ucf",
    university: "University of Central Florida",
    universityShortName: "UCF",
    programName: "DirectConnect to UCF",
    url: "https://valenciacollege.edu/future-students/directconnect-to-ucf.php",
    summary:
      "Valencia is UCF's largest DirectConnect partner — about a quarter of UCF's upper-division students transferred in from Valencia — and an Associate in Arts or articulated Associate in Science guarantees admission, with UCF advising and services offered directly on Valencia's campuses.",
  },
  cfk: {
    universityId: "fiu",
    university: "Florida International University",
    universityShortName: "FIU",
    programName: "Connect4Success",
    url: "https://admissions.fiu.edu/how-to-apply/connect4success/",
    summary:
      "CFK has been part of FIU's Connect4Success program since it launched in 2006 (back when CFK was Florida Keys Community College), guaranteeing FIU admission to students who finish their Associate in Arts within three years; a dedicated agreement also routes CFK students into FIU's Chaplin School of Hospitality & Tourism Management.",
  },
  // The one agreement with no `universityId`. FSU Panama City is a branch
  // campus with its own, much narrower degree list; the catalog we hold under
  // `fsu` is main-campus Tallahassee. Pointing this at `fsu` would offer a
  // student programs Panama City does not teach, so the transfer step here
  // stays prose-only rather than naming a degree we can't stand behind.
  gcsc: {
    university: "Florida State University Panama City",
    universityShortName: "FSU Panama City",
    programName: "Connect to FSU Panama City",
    url: "https://pc.fsu.edu/admissions/connect",
    summary:
      "GCSC is the primary partner in Connect to FSU Panama City — FSU PC even staffs an admissions counselor on GCSC's campus — and any GCSC Associate in Arts student is guaranteed admission to FSU Panama City's programs; this is the smaller Panama City branch campus, not FSU's main Tallahassee campus, so its bachelor's catalog is narrower.",
  },
  irsc: {
    universityId: "fau",
    university: "Florida Atlantic University",
    universityShortName: "FAU",
    programName: "Link2FAU",
    url: "https://www.fau.edu/admissions/transfer/link2fau/",
    summary:
      "IRSC calls Link2FAU its newest and most powerful transfer partnership, guaranteeing FAU admission for Associate in Arts or Associate in Science graduates who complete the requirements; IRSC also holds DirectConnect to UCF and offers eight of its own bachelor's degrees, so transfer is often unnecessary in the first place.",
    alsoPartnersWith: ["University of Central Florida"],
  },
  // Keyed "daytona", not "dsc" — Daytona State's program-catalog file is
  // dsc.ts, but floridaSchools.ts (the source of truth this lookup joins
  // against) uses id "daytona". Same story below for Seminole State: its
  // catalog file is ssc.ts, but its floridaSchools.ts id is "seminole".
  daytona: {
    universityId: "ucf",
    university: "University of Central Florida",
    universityShortName: "UCF",
    programName: "DirectConnect to UCF",
    url: "https://www.daytonastate.edu/advising/university-partnerships.html",
    summary:
      "Completing a Daytona State Associate in Arts (or an articulated Associate in Science) guarantees admission to UCF, with UCF staff available on-site at the Daytona Beach campus for advising and admissions support.",
    alsoPartnersWith: ["New College of Florida", "University of Florida"],
  },
  hcc: {
    universityId: "usf",
    university: "University of South Florida",
    universityShortName: "USF",
    programName: "FUSE",
    url: "https://www.hcfl.edu/academics/fuse-hcc",
    summary:
      "FUSE guarantees HCC Associate in Arts or Associate in Science graduates admission into a specific USF major, provided they complete the degree within three years at a 2.0 GPA; the program has run since 2016 with a 97% participant retention rate.",
  },
  lssc: {
    universityId: "ucf",
    university: "University of Central Florida",
    universityShortName: "UCF",
    programName: "DirectConnect to UCF",
    url: "https://www.lssc.edu/direct-connect-to-ucf/",
    summary:
      "Completing an LSSC Associate in Arts (or an articulated Associate in Science) guarantees admission to UCF, with joint LSSC/UCF advising through the transition; LSSC is one of only seven DirectConnect to UCF partner colleges statewide.",
  },
  nfc: {
    universityId: "ucf",
    university: "University of Central Florida",
    universityShortName: "UCF",
    programName: "UCF Online transfer pathway",
    url: "https://www.ucf.edu/online/bachelors/north-florida-community-college/",
    summary:
      "NFC's partnership with UCF is narrower than the DirectConnect agreements other colleges hold: it is a coaching and support pathway into UCF's fully online bachelor's programs (over 30 majors), not a blanket guaranteed-admission promise, so frame it as a strong default rather than a certainty.",
  },
  pbsc: {
    universityId: "fau",
    university: "Florida Atlantic University",
    universityShortName: "FAU",
    programName: "Link2FAU",
    url: "https://www.fau.edu/admissions/link2fau-pbsc/",
    summary:
      "Link2FAU guarantees FAU admission for PBSC students who earn an Associate in Arts and meet FAU's transfer requirements, with a $2,000/year scholarship opportunity and access to FAU's career center, library, and recreation center while still at PBSC.",
  },
  phsc: {
    universityId: "usf",
    university: "University of South Florida",
    universityShortName: "USF",
    programName: "FUSE",
    url: "https://advising.phsc.edu/students/fuse",
    summary:
      "FUSE guarantees PHSC Associate in Arts graduates admission into one of 13 eligible USF majors, provided they finish within three years at a 2.0 GPA, with dedicated advisors from both PHSC and USF throughout.",
  },
  spc: {
    universityId: "usf",
    university: "University of South Florida",
    universityShortName: "USF",
    programName: "FUSE",
    url: "https://www.spcollege.edu/future-students/degree-options/associate-in-arts-degrees-and-transfer-plans/guaranteed-transfer-programs/fuse",
    summary:
      "FUSE guarantees SPC Associate in Arts graduates admission into more than 30 USF majors; SPC also offers 22 of its own bachelor's degrees (most fully online), so an SPC bachelor's is frequently the more direct route than transferring at all.",
  },
  seminole: {
    universityId: "ucf",
    university: "University of Central Florida",
    universityShortName: "UCF",
    programName: "DirectConnect to UCF",
    url: "https://www.seminolestate.edu/become-a-student/why/direct-connect",
    summary:
      "Completing a Seminole State Associate in Arts (or an articulated Associate in Science) guarantees admission to UCF — Seminole State sits immediately adjacent to UCF's main campus — and is one of only seven DirectConnect to UCF partner colleges statewide.",
  },
};

/** The school's flagship transfer agreement, or null if none is recorded. */
export function transferAgreementFor(schoolId: string): TransferAgreement | null {
  return AGREEMENTS[schoolId] ?? null;
}

/** School ids with a recorded transfer agreement. */
export function schoolsWithTransferAgreement(): string[] {
  return Object.keys(AGREEMENTS).sort();
}
