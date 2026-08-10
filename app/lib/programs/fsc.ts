// Florida Southern College degree catalog: program name -> official
// per-program page.
//
// HAND-VERIFIED, not scraped — no committed scraper exists for this school.
// HANDOFF.md had flagged FSC's `*.smartcatalogiq.com` subdomain as
// reserved-but-empty (true — 404/"Layout Not Found" on every path tried).
// FSC's own "Academic Catalog" page (flsouthern.edu/academic-life/
// academic-catalog) is also a dead end: it's a bare bullet list of section
// names with no real links behind them, evidently a stub for a
// SmartCatalogIQ instance that was never finished. The real source is a
// different page entirely: flsouthern.edu/academic-life/all-academic-
// programs lists every major, grouped by school, each with a real
// marketing-style per-program page (no WAF, curl works) — the same
// "the catalog page is a dead end, but a different page has the real
// per-program links" shape FMU's undergraduate-degree-programs page had.
//
// Every program page states its credential(s) on its own "PROGRAM DETAILS"
// section under a literal "AVAILABLE IN:" heading (e.g. Communication:
// "AVAILABLE IN: BA, BS, Minor") — read directly off each of the ~100
// program pages (fetched locally, not guessed) rather than assumed from a
// department-level pattern. Many majors offer two credentials (most often
// BA+BS, a few BA+BFA) and are listed here as two separate entries sharing
// one URL, the same "one real page, two real credentials" shape Ave
// Maria's Biology and Exercise Physiology needed. A few single-credential
// programs (Architecture, several Theatre Arts and Music tracks, the adult/
// graduate/doctoral programs) have no "AVAILABLE IN" widget at all — for
// those, the one real credential is stated in the page's own prose instead
// (e.g. Architecture: "The BArch program..."), confirmed by reading the
// actual text rather than inferring it from the program's name.
//
// One judgment call: "Secondary Education (6-12)" is excluded. Unlike
// Elementary Education, it names no credential of its own anywhere on its
// page — it's a hub page describing a certification track layered onto
// OTHER majors' own credentials (Biology's own page separately states
// "Secondary Education Certification available for this major"), not a
// standalone major with a degree of its own. Also excluded, the same
// "the other half of this program lives somewhere we don't have" shape
// that excluded STU's joint JD programs and Eckerd's Musical Theatre:
// "4+1 MBA Florida Polytechnic Agreement" (a dual-institution program with
// Florida Polytechnic) and "Early or 4+1 MAcc" (a redundant accelerated
// track built on the already-separately-listed standalone Master of
// Accountancy).
//
// `area` is the school the program's own listing page groups it under
// (School of Architecture / Arts and Sciences / Business and Free
// Enterprise / Education / Nursing and Health Sciences) — read directly off
// that page's own section headings, not guessed from subject matter.
//
// Programs: 106 (91 bachelor's [87 traditional + 4 adult-online], 11
// master's, 4 doctoral)
//
// FSC is a four-year college (like UM/Stetson/ERAU/UT/Barry/Lynn/Rollins/
// Flagler/PBA/FIT/Saint Leo/STU/Ave Maria/Bethune-Cookman/Eckerd/FMU/JU/
// Keiser), so pathways start at the bachelor's rather than an associate
// degree.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

const SITE = "https://www.flsouthern.edu/academic-life/all-academic-programs";
const ARCH = "School of Architecture";
const ARTS_SCI = "School of Arts and Sciences";
const BUSINESS = "School of Business and Free Enterprise";
const EDUCATION = "School of Education";
const NURSING = "School of Nursing and Health Sciences";

export const FSC_PROGRAMS: SchoolProgram[] = [
  // School of Architecture
  { name: "Architecture", url: `${SITE}/rug/architecture`, level: "bachelor", credential: "BArch", area: ARCH },

  // School of Arts and Sciences
  { name: "Applied Mathematics and Statistics", url: `${SITE}/rug/applied-mathematics-and-statistics`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Applied Mathematics and Statistics", url: `${SITE}/rug/applied-mathematics-and-statistics`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Art Education", url: `${SITE}/rug/art-education`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Art Education", url: `${SITE}/rug/art-education`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Art History and Museum Studies", url: `${SITE}/rug/art-history-and-museum-studies`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Biochemistry and Molecular Biology", url: `${SITE}/rug/biochemistry-and-molecular-biology`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Biology", url: `${SITE}/rug/biology`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Biotechnology", url: `${SITE}/rug/biotechnology`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Chemistry", url: `${SITE}/rug/chemistry`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Chemistry", url: `${SITE}/rug/chemistry`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Communication: Advertising and Public Relations", url: `${SITE}/rug/communication-advertising-and-public-relations`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Communication: Advertising and Public Relations", url: `${SITE}/rug/communication-advertising-and-public-relations`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Communication: Interpersonal and Organizational Communication", url: `${SITE}/rug/communication-interpersonal-and-organizational-com`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Communication: Interpersonal and Organizational Communication", url: `${SITE}/rug/communication-interpersonal-and-organizational-com`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Communication: Media Strategies and Production", url: `${SITE}/rug/communication-media-strategies-and-production`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Communication: Media Strategies and Production", url: `${SITE}/rug/communication-media-strategies-and-production`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Communication: Multimedia Journalism", url: `${SITE}/rug/communication-multimedia-journalism`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Communication: Multimedia Journalism", url: `${SITE}/rug/communication-multimedia-journalism`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Communication", url: `${SITE}/rug/communications`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Communication", url: `${SITE}/rug/communications`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Computer Science", url: `${SITE}/rug/computer-science`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Computer Science", url: `${SITE}/rug/computer-science`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Computer Science: Artificial Intelligence and Machine Learning", url: `${SITE}/rug/computer-science-artificial-intelligence-and-machi`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Computer Science: Artificial Intelligence and Machine Learning", url: `${SITE}/rug/computer-science-artificial-intelligence-and-machi`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Computer Science: Cybersecurity", url: `${SITE}/rug/computer-science-cybersecurity`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Computer Science: Cybersecurity", url: `${SITE}/rug/computer-science-cybersecurity`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Computer Science: Full-Stack Web Development", url: `${SITE}/rug/computer-science-full-stack-development`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Computer Science: Full-Stack Web Development", url: `${SITE}/rug/computer-science-full-stack-development`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Criminology", url: `${SITE}/rug/criminology`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Criminology", url: `${SITE}/rug/criminology`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Dance Performance and Choreography", url: `${SITE}/rug/dance-performance-and-choreography`, level: "bachelor", credential: "BFA", area: ARTS_SCI },
  { name: "Dance Studies", url: `${SITE}/rug/dance-studies`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Data Analytics", url: `${SITE}/rug/data-analytics`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Data Analytics", url: `${SITE}/rug/data-analytics`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "English", url: `${SITE}/rug/english`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Environmental Studies", url: `${SITE}/rug/environmental-studies`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Environmental Studies", url: `${SITE}/rug/environmental-studies`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Film", url: `${SITE}/rug/film`, level: "bachelor", credential: "BFA", area: ARTS_SCI },
  { name: "Graphic Design", url: `${SITE}/rug/graphic-design`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Graphic Design", url: `${SITE}/rug/graphic-design`, level: "bachelor", credential: "BFA", area: ARTS_SCI },
  { name: "History", url: `${SITE}/rug/history`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "History", url: `${SITE}/rug/history`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Humanities", url: `${SITE}/rug/humanities`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Integrative Biology", url: `${SITE}/rug/integrative-biology`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Interactive and Game Design", url: `${SITE}/rug/interactive-and-game-design`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Interactive and Game Design", url: `${SITE}/rug/interactive-and-game-design`, level: "bachelor", credential: "BFA", area: ARTS_SCI },
  { name: "Marine Biology", url: `${SITE}/rug/marine-biology`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Mathematics", url: `${SITE}/rug/mathematics`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Mathematics", url: `${SITE}/rug/mathematics`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Medical Laboratory Sciences", url: `${SITE}/rug/medical-laboratory-sciences`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Music", url: `${SITE}/rug/music`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Music Education", url: `${SITE}/rug/music-education`, level: "bachelor", credential: "BM", area: ARTS_SCI },
  { name: "Music: Music Business", url: `${SITE}/rug/music-music-business`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Music Performance", url: `${SITE}/rug/music-performance`, level: "bachelor", credential: "BM", area: ARTS_SCI },
  { name: "Philosophy", url: `${SITE}/rug/philosophy`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Political Communication", url: `${SITE}/rug/political-communication`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Political Communication", url: `${SITE}/rug/political-communication`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Political Science Major", url: `${SITE}/rug/political-science-major`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Political Science Major", url: `${SITE}/rug/political-science-major`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Psychology", url: `${SITE}/rug/psychology`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Psychology", url: `${SITE}/rug/psychology`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Religion", url: `${SITE}/rug/religion`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Religion: Youth Ministry", url: `${SITE}/rug/religion-youth-ministry`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Social Sciences", url: `${SITE}/rug/social-sciences`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Social Sciences", url: `${SITE}/rug/social-sciences`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Spanish", url: `${SITE}/rug/spanish`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Sports Communication and Marketing", url: `${SITE}/rug/sports-communication-and-marketing`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Studio Art", url: `${SITE}/rug/studio-art`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Studio Art", url: `${SITE}/rug/studio-art`, level: "bachelor", credential: "BFA", area: ARTS_SCI },
  { name: "Theatre Arts", url: `${SITE}/rug/theatre-arts`, level: "bachelor", credential: "BA", area: ARTS_SCI },
  { name: "Theatre Arts: Musical Theatre", url: `${SITE}/rug/theatre-arts-musical-theatre`, level: "bachelor", credential: "BFA", area: ARTS_SCI },
  { name: "Theatre Arts: Technical Theatre and Design", url: `${SITE}/rug/theatre-arts-technical-theatre-and-design`, level: "bachelor", credential: "BFA", area: ARTS_SCI },
  { name: "Theatre Arts: Theatre Performance", url: `${SITE}/rug/theatre-arts-theatre-performance`, level: "bachelor", credential: "BFA", area: ARTS_SCI },
  { name: "Adult Undergraduate Communication", url: `${SITE}/adult/adult-bachelors/adult-undergraduate-communication`, level: "bachelor", credential: "BS", area: ARTS_SCI },
  { name: "Master of Public Administration", url: `${SITE}/adult/graduate/master-of-public-administration`, level: "graduate", credential: "MPA", area: ARTS_SCI },
  { name: "Master of Science in Industrial and Organizational Psychology", url: `${SITE}/adult/graduate/master-of-science-in-industrial-and-organizational`, level: "graduate", credential: "MS", area: ARTS_SCI },

  // School of Business and Free Enterprise
  { name: "Accounting", url: `${SITE}/rug/accounting`, level: "bachelor", credential: "BA", area: BUSINESS },
  { name: "Accounting", url: `${SITE}/rug/accounting`, level: "bachelor", credential: "BS", area: BUSINESS },
  { name: "Business Administration", url: `${SITE}/rug/business-administration`, level: "bachelor", credential: "BS", area: BUSINESS },
  { name: "Business Analytics", url: `${SITE}/rug/business-analytics`, level: "bachelor", credential: "BS", area: BUSINESS },
  { name: "Economics", url: `${SITE}/rug/economics`, level: "bachelor", credential: "BS", area: BUSINESS },
  { name: "Finance", url: `${SITE}/rug/finance`, level: "bachelor", credential: "BS", area: BUSINESS },
  { name: "Horticulture, Land, and Resource Management", url: `${SITE}/rug/horticulture-land-and-resource-management`, level: "bachelor", credential: "BA", area: BUSINESS },
  { name: "Marketing", url: `${SITE}/rug/marketing`, level: "bachelor", credential: "BS", area: BUSINESS },
  { name: "Sport Business Management", url: `${SITE}/rug/sport-business-management`, level: "bachelor", credential: "BS", area: BUSINESS },
  { name: "Online Accounting", url: `${SITE}/adult/adult-bachelors/adult-undergraduate-accounting`, level: "bachelor", credential: "BS", area: BUSINESS },
  { name: "Online Business Administration", url: `${SITE}/adult/adult-bachelors/adult-undergraduate-business-administration`, level: "bachelor", credential: "BS", area: BUSINESS },
  { name: "Master of Accountancy", url: `${SITE}/adult/graduate/master-of-accountancy`, level: "graduate", credential: "MAcc", area: BUSINESS },
  { name: "Master of Business Administration", url: `${SITE}/adult/graduate/master-of-business-administration`, level: "graduate", credential: "MBA", area: BUSINESS },
  { name: "Master of Science in Analytics", url: `${SITE}/adult/graduate/master-of-science-in-analytics`, level: "graduate", credential: "MS", area: BUSINESS },

  // School of Education
  { name: "Elementary Education", url: `${SITE}/rug/elementary-education`, level: "bachelor", credential: "BA", area: EDUCATION },
  { name: "Elementary Education", url: `${SITE}/rug/elementary-education`, level: "bachelor", credential: "BS", area: EDUCATION },
  { name: "Adult Undergraduate Elementary Education", url: `${SITE}/adult/adult-bachelors/adult-undergraduate-elementary-education`, level: "bachelor", credential: "BS", area: EDUCATION },
  { name: "Master of Arts in Transformational Curriculum and Instruction", url: `${SITE}/adult/graduate/master-of-arts-in-transformational-curriculum-and`, level: "graduate", credential: "MAT", area: EDUCATION },
  { name: "Master of Education in Educational Leadership", url: `${SITE}/adult/graduate/master-of-education-in-educational-leadership`, level: "graduate", credential: "MEd", area: EDUCATION },
  { name: "Master of Education in Transformational Curriculum and Instruction", url: `${SITE}/adult/graduate/master-of-education-in-transformational-curriculum`, level: "graduate", credential: "MEd", area: EDUCATION },
  { name: "Doctor of Education", url: `${SITE}/adult/doctoral/doctor-of-education`, level: "graduate", credential: "EdD", area: EDUCATION },
  { name: "Doctor of Education in Educational Leadership", url: `${SITE}/adult/doctoral/doctor-of-education-in-educational-leadership`, level: "graduate", credential: "EdD", area: EDUCATION },

  // School of Nursing and Health Sciences
  { name: "Nursing", url: `${SITE}/rug/nursing`, level: "bachelor", credential: "BS", area: NURSING },
  { name: "Exercise Science", url: `${SITE}/rug/exercise-science`, level: "bachelor", credential: "BS", area: NURSING },
  { name: "MSN: Adult-Gerontology", url: `${SITE}/adult/graduate/master-of-science-in-nursing-adult-gerontology`, level: "graduate", credential: "MSN", area: NURSING },
  { name: "MSN: Family Nurse Practitioner", url: `${SITE}/adult/graduate/master-of-science-in-nursing-family-nurse-practiti`, level: "graduate", credential: "MSN", area: NURSING },
  { name: "MSN: Psychiatric-Mental Health Nurse Practitioner", url: `${SITE}/adult/graduate/master-of-science-in-nursing-psychiatric-mental-health-nurse-practitioner`, level: "graduate", credential: "MSN", area: NURSING },
  { name: "Doctor of Nursing Practice", url: `${SITE}/adult/doctoral/doctor-of-nursing-practice`, level: "graduate", credential: "DNP", area: NURSING },
  { name: "Doctor of Physical Therapy", url: `${SITE}/adult/doctoral/doctor-of-physical-therapy`, level: "graduate", credential: "DPT", area: NURSING },
];

export const fscCatalog = createProgramCatalog(FSC_PROGRAMS);
