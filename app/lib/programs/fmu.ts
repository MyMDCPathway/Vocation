// Florida Memorial University degree catalog: program name -> official
// per-program page.
//
// HAND-VERIFIED, not scraped — no committed scraper exists for this school.
// HANDOFF.md had flagged FMU as "PDF-only, same obstacle St. Thomas had" on
// the assumption that fmu.edu/academics/catalogs-courses/ (which links only
// to full 200+ page PDF catalogs) was the only source. That assumption was
// wrong: fmu.edu/academics/undergraduate-degree-programs/ and .../academics/
// graduate-programs/list-of-graduate-programs/ are real HTML pages, no WAF,
// listing every program grouped by school/department, each with its own
// real link and its credential already in the name (e.g. "Bachelor of
// Science Aviation Management") — the same best-case shape UM's and Saint
// Leo's catalogs had. No PDF extraction was needed after all.
//
// Undergraduate programs mostly link to a one-page PDF "degree checklist"
// per program; graduate programs link to a real HTML page per program.
//
// One dead link found and fixed by verification, not assumption: the
// undergraduate page's own link for "Bachelor of Science Aviation
// Management" 404s (`.../wp-content/uploads/2022/08/BS-Aviation-
// Management.pdf`) — the file was evidently moved/renamed on FMU's own
// server. The Department of Aviation and Safety's own "Degree Programs"
// page (fmu.edu/academics/school-of-business/department-of-aviation-
// safety/degree-programs/) links the same program at a different, live URL
// (`.../wp-content/uploads/BS-Aviation-Management.pdf`, no `/2022/08/`
// path segment) — confirmed with a real 200 before using it here.
//
// One exclusion, the same "the other half of this program lives in an
// institution we don't have" shape that excluded STU's joint JD programs
// and Eckerd's Musical Theatre: "Bachelor of Science Biology + Nursing Dual
// Degree Program" awards a B.S. in Biology from FMU and a SEPARATE B.S. in
// Nursing from a partner institution (University of Miami or FIU) —
// confirmed by reading its own program sheet PDF, which states this
// outright and requires separate admission/transfer to the partner school.
// The FMU-side credential is already covered by the standalone "Bachelor of
// Science Biology" entry below, so this isn't a missing major, just a
// pre-professional advising track built on top of it. "Bachelor of Science
// Biology with a Concentration in Radiobiology" is NOT the same shape — its
// own program sheet describes an entirely on-campus specialization, no
// partner institution — so it stays as its own entry. Also excluded: "Minor
// in Education" (a minor, not a major).
//
// `area` is the school-level grouping the undergraduate page's own H2
// headings state (School of Arts and Sciences / School of Business /
// School of Education [and Social Sciences] — the page's heading text
// truncates the school's full name, matching the fuller name the site nav
// uses for its Criminal Justice/Social Work/Psychology programs, which sit
// under the same heading as Education without their own subheading).
//
// Programs: 30 (23 bachelor's, 7 graduate)
//
// FMU is a four-year university (like UM/Stetson/ERAU/UT/Barry/Lynn/
// Rollins/Flagler/PBA/FIT/Saint Leo/STU/Ave Maria/Bethune-Cookman/Eckerd),
// so pathways start at the bachelor's rather than an associate degree.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

const UPLOADS = "https://www.fmu.edu/wp-content/uploads";
const ARTS_SCI = "School of Arts and Sciences";
const BUSINESS = "School of Business";
const EDU_SOC = "School of Education and Social Sciences";

export const FMU_PROGRAMS: SchoolProgram[] = [
  { name: "Bachelor of Science Aviation Management", url: `${UPLOADS}/BS-Aviation-Management.pdf`, level: "bachelor", area: ARTS_SCI },
  { name: "Bachelor of Science Aeronautical Science with a Concentration in Flight Education", url: `${UPLOADS}/2022/08/BS-Aeronautical-Science-Flight-Education.pdf`, level: "bachelor", area: ARTS_SCI },
  { name: "Bachelor of Science Aeronautical Science with a Concentration in Air Traffic Control", url: `${UPLOADS}/2022/08/BS-Aeronautical-Science-Air-Traffic-Control.pdf`, level: "bachelor", area: ARTS_SCI },
  { name: "Bachelor of Science Computer Science", url: `${UPLOADS}/2022/08/BS-Computer-Science.pdf`, level: "bachelor", area: ARTS_SCI },
  { name: "Bachelor of Science Cybersecurity", url: `${UPLOADS}/2022/08/BS-Cybersecurity.pdf`, level: "bachelor", area: ARTS_SCI },
  { name: "Bachelor of Science Information Systems", url: `${UPLOADS}/2022/08/BS-Information-Systems.pdf`, level: "bachelor", area: ARTS_SCI },
  { name: "Bachelor of Science Biology", url: `${UPLOADS}/2022/08/BS-Biology.pdf`, level: "bachelor", area: ARTS_SCI },
  { name: "Bachelor of Science Chemistry", url: `${UPLOADS}/2022/08/BS-Chemistry.pdf`, level: "bachelor", area: ARTS_SCI },
  { name: "Bachelor of Science Healthcare with a Concentration in Administration", url: `${UPLOADS}/2022/08/BS-Healthcare-Administration.pdf`, level: "bachelor", area: ARTS_SCI },
  { name: "Bachelor of Science Healthcare with a Concentration in Community Health", url: `${UPLOADS}/2022/08/BS-Healthcare-Community-Health.pdf`, level: "bachelor", area: ARTS_SCI },
  { name: "Bachelor of Science Biology with a Concentration in Radiobiology", url: `${UPLOADS}/2022/08/BS-Biology-Radiobiology.pdf`, level: "bachelor", area: ARTS_SCI },
  { name: "Bachelor of Arts Music Production", url: `${UPLOADS}/2025/04/BA-Music-Production.pdf`, level: "bachelor", area: ARTS_SCI },
  { name: "Bachelor of Arts Religion & Philosophy", url: `${UPLOADS}/2022/08/BA-Religion-and-Philosophy.pdf`, level: "bachelor", area: ARTS_SCI },
  { name: "Bachelor of Science Communications with a concentration in Public Relations", url: `${UPLOADS}/2022/08/BS-Communications-Public-Relations.pdf`, level: "bachelor", area: ARTS_SCI },
  { name: "Bachelor of Science Communications with a concentration in TV Broadcast", url: `${UPLOADS}/2022/08/BS-Communications-TV-Broadcast.pdf`, level: "bachelor", area: ARTS_SCI },
  { name: "Bachelor of Science Business Administration", url: `${UPLOADS}/2022/08/BS-Business-Administration2.pdf`, level: "bachelor", area: BUSINESS },
  { name: "Bachelor of Science Finance", url: `${UPLOADS}/2022/08/BS-Finance2.pdf`, level: "bachelor", area: BUSINESS },
  { name: "Bachelor of Science Elementary Education/ESOL K-6/Reading", url: `${UPLOADS}/2022/08/BS-Elementary-Education-ESOL-K-6-Reading.pdf`, level: "bachelor", area: EDU_SOC },
  { name: "Bachelor of Arts Law & Government", url: `${UPLOADS}/2022/08/BA-Law-and-Government.pdf`, level: "bachelor", area: EDU_SOC },
  { name: "Bachelor of Arts Criminal Justice", url: `${UPLOADS}/2022/08/BA-Criminal-Justice.pdf`, level: "bachelor", area: EDU_SOC },
  { name: "Bachelor of Arts Criminal Justice with a concentration in Criminology", url: `${UPLOADS}/2022/08/BA-Criminal-Justice-Criminology.pdf`, level: "bachelor", area: EDU_SOC },
  { name: "Bachelor of Arts Social Work", url: `${UPLOADS}/2022/08/BA-Social-Work.pdf`, level: "bachelor", area: EDU_SOC },
  { name: "Bachelor of Science Psychology", url: `${UPLOADS}/2022/08/BS-Psychology.pdf`, level: "bachelor", area: EDU_SOC },

  { name: "Education Specialist (Ed.S.) in Educational Leadership", url: "https://www.fmu.edu/academics/school-of-education/graduate-programs/education-specialist-educational-leadership/", level: "graduate", area: EDU_SOC },
  { name: "Education Specialist (Ed.S.) in Exceptional Student Education", url: "https://www.fmu.edu/academics/education-specialist-graduate-degree/", level: "graduate", area: EDU_SOC },
  { name: "Master of Business Administration", url: "https://www.fmu.edu/academics/school-of-business/school-of-business-graduate-degree-programs/", level: "graduate", area: BUSINESS },
  { name: "Master of Science in Criminology", url: "https://www.fmu.edu/academics/master-of-science-in-criminology-graduate-degree/", level: "graduate", area: EDU_SOC },
  { name: "Master of Science in Exceptional Student Education", url: "https://www.fmu.edu/academics/master-of-science-in-exceptional-student-education-graduate-degree/", level: "graduate", area: EDU_SOC },
  { name: "Master of Science in Reading", url: "https://www.fmu.edu/academics/master-of-science-in-reading-graduate-degree/", level: "graduate", area: EDU_SOC },
  { name: "Master of Social Work, M.S.W.", url: "https://www.fmu.edu/academics/school-of-education/master-of-social-work-graduate-degree/", level: "graduate", area: EDU_SOC },
];

export const fmuCatalog = createProgramCatalog(FMU_PROGRAMS);
