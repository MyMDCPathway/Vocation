// Florida Polytechnic University degree catalog: program name -> official
// program page.
//
// HAND-VERIFIED, not scraped — no committed scraper exists for this school.
// catalog.floridapoly.edu is Acalog, and (like FAMU and USF) its content.php
// and preview_program.php pages are blocked by AWS WAF Bot Control for BOTH
// fetch() and curl — see HANDOFF.md §13. Real Program entities do exist here,
// unlike FAMU, so the data itself is good; only automation is blocked. This
// file was built the same way the other 25 hand-scraped FCS catalogs were
// (see HANDOFF.md §9): a real browser navigated to each of FlPoly's 9
// undergraduate department pages plus its "Degrees & Pathways" graduate page,
// and every "(Program Description)" program link was read from the rendered
// DOM (2026-07-26).
//
// Source (undergraduate, catoid=39, one page per department):
//   content.php?catoid=39&navoid=3758  Applied Mathematics
//   content.php?catoid=39&navoid=4020  Biomedical Sciences
//   content.php?catoid=39&navoid=3754  Civil Engineering and Environmental Engineering
//   content.php?catoid=39&navoid=3797  Computer Science and Cybersecurity
//   content.php?catoid=39&navoid=3804  Data Science and Business Analytics
//   content.php?catoid=39&navoid=3803  Electrical and Computer Engineering
//   content.php?catoid=39&navoid=3756  Engineering Physics & Physics
//   content.php?catoid=39&navoid=3839  Mechanical, Industrial, and Aerospace Engineering
//   (Arts, Humanities, and Social Sciences, navoid=3757, has no standalone majors)
// Source (graduate, catoid=38):
//   content.php?catoid=38&navoid=3668  Degrees & Pathways
//
// If FlPoly changes its catalog, re-verify by hand — a plain scraper cannot
// reach this site. Programs: 20 (15 bachelor, 5 graduate).
//
// FlPoly is a four-year university (like FIU/UCF/UF/FGCU/UWF/NCF/UNF), so
// pathways start at the bachelor's rather than an associate degree. Every
// undergraduate program here is a Bachelor of Science; every graduate program
// is a Master of Science — FlPoly's own site states no other credential type
// at either level.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const FLPOLY_PROGRAMS: SchoolProgram[] = [
  { name: "Aerospace Engineering", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=39&poid=1966", level: "bachelor", credential: "B.S.", area: "Mechanical, Industrial, and Aerospace Engineering" },
  { name: "Applied Mathematics", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=39&poid=1832", level: "bachelor", credential: "B.S.", area: "Applied Mathematics" },
  { name: "Biomedical Sciences", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=39&poid=1964", level: "bachelor", credential: "B.S.", area: "Biomedical Sciences" },
  { name: "Business Analytics", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=39&poid=1817", level: "bachelor", credential: "B.S.", area: "Data Science and Business Analytics" },
  { name: "Civil Engineering", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=39&poid=1850", level: "bachelor", credential: "B.S.", area: "Civil Engineering and Environmental Engineering" },
  { name: "Computer Engineering", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=39&poid=1809", level: "bachelor", credential: "B.S.", area: "Electrical and Computer Engineering" },
  { name: "Computer Science", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=39&poid=1816", level: "bachelor", credential: "B.S.", area: "Computer Science and Cybersecurity" },
  { name: "Computer Science", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=38&poid=1776", level: "graduate", credential: "M.S.", area: "Graduate Studies" },
  { name: "Cybersecurity", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=39&poid=1949", level: "bachelor", credential: "B.S.", area: "Computer Science and Cybersecurity" },
  { name: "Data Science", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=39&poid=1815", level: "bachelor", credential: "B.S.", area: "Data Science and Business Analytics" },
  { name: "Data Science", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=38&poid=1777", level: "graduate", credential: "M.S.", area: "Graduate Studies" },
  { name: "Electrical Engineering", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=39&poid=1812", level: "bachelor", credential: "B.S.", area: "Electrical and Computer Engineering" },
  { name: "Electrical Engineering", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=38&poid=1771", level: "graduate", credential: "M.S.", area: "Graduate Studies" },
  { name: "Engineering Management", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=38&poid=1780", level: "graduate", credential: "M.S.", area: "Graduate Studies" },
  { name: "Engineering Physics", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=39&poid=1830", level: "bachelor", credential: "B.S.", area: "Engineering Physics & Physics" },
  { name: "Environmental Engineering", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=39&poid=1828", level: "bachelor", credential: "B.S.", area: "Civil Engineering and Environmental Engineering" },
  { name: "Industrial Engineering", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=39&poid=1852", level: "bachelor", credential: "B.S.", area: "Mechanical, Industrial, and Aerospace Engineering" },
  { name: "Mechanical Engineering", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=39&poid=1814", level: "bachelor", credential: "B.S.", area: "Mechanical, Industrial, and Aerospace Engineering" },
  { name: "Mechanical Engineering", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=38&poid=1774", level: "graduate", credential: "M.S.", area: "Graduate Studies" },
  { name: "Physics", url: "https://catalog.floridapoly.edu/preview_program.php?catoid=39&poid=1855", level: "bachelor", credential: "B.S.", area: "Engineering Physics & Physics" },
];

// FlPoly is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const flpolyCatalog = createProgramCatalog(FLPOLY_PROGRAMS, { preferred: "bachelor" });
