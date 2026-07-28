// Saint Leo University degree catalog: program name -> official program page.
//
// HAND-VERIFIED, not scraped — no committed scraper exists for this school.
// academiccatalog.saintleo.edu is Acalog behind AWS WAF Bot Control: both
// fetch() and curl are blocked on content.php AND preview_program.php
// (HTTP 202 with x-amzn-waf-action: challenge), the same platform and
// symptom as FAMU, FlPoly, USF, Rollins, Flagler, PBA, and Florida Tech (see
// HANDOFF.md §13). index.php loads fine either way. Per that technique, a
// real browser doing top-level navigation gets through where curl/fetch
// cannot; this file was built the same way (2026-07-28).
//
// Saint Leo splits into two catalogs like PBA/Rollins:
//   catoid=77  2026-2027 Undergraduate Catalog
//   catoid=76  2026-2027 Graduate Catalog
// Both have a single comprehensive page listing every program, grouped by
// college/department and then by degree type:
//   content.php?catoid=77&navoid=8140  Campuses, Centers, and Degree Programs
//     (the "Majors/Minors/Specializations" section is what's used here)
//   content.php?catoid=76&navoid=8005  Graduate Degree Programs
// Every entry already states its own credential in the title (e.g.
// "Criminal Justice, B.A.", "Master of Science in Psychology") — no
// separate `credential` field needed anywhere in this file, the same "name
// already carries the code" shape pathwayPrompts.ts documents for FIU.
//
// Excluded: Minors, Certificates (including "Graduate Certificate"-grouped
// entries), Associate-level entries (A.A.), and "University Explorations" —
// confirmed on its own page to be the general-education core curriculum,
// not a major. "Command Officer Management School (COMS)" is grouped under
// its own non-degree heading in the Criminal Justice department and was
// excluded the same way.
//
// One real duplicate needed resolving: "Business Administration, B.A." is
// listed TWICE — once "(Offered only at University Campus)", once
// "(Offered only through Worldwide)" — two different poids/URLs for two
// delivery modes of the literal same major name. Since normalizeProgramName
// strips parenthetical text entirely, both would collide on the same
// lookup key; kept only the University Campus version (the flagship
// on-campus program), the same "pick the one division/campus that matches
// the school's normal meaning" call Rollins's (College of Liberal Arts over
// Hamilton Holt) and ERAU's (single campus) batches made.
//
// One entry needed its name corrected, not just transcribed: the graduate
// catalog's own anchor text for poid 11088 reads only "Educational
// Leadership Concentration", inconsistent with its two sibling entries in
// the same list ("Master of Education: Exceptional Student Education and
// ...") which do state the parent degree. That program's own page confirms
// it in prose — "The Master of Education with a concentration in
// Educational Leadership" — so this file uses "Master of Education:
// Educational Leadership Concentration" to match its siblings, the same
// "trust the page's own fuller text over an inconsistent anchor" call
// Stetson's scraper made.
//
// Several graduate specializations (e.g. "Accounting Specialization
// (Online Only)", "Behavioral Studies Specialization (Online Only)") are
// real, separately-paged concentrations within the MBA/DBA and Master of
// Science in Criminal Justice programs, kept as their own catalog entries
// with their literal scraped names — the same "a concentration can be a
// real, individually admitted program without also restating its parent
// degree in its own title" shape as PBA's "Crisis and Trauma Counseling
// Concentration".
//
// Programs: 83 (39 bachelor, 44 graduate)
//
// Saint Leo is a four-year university (like UM/Stetson/ERAU/UT/Barry/Lynn/
// Rollins/Flagler/PBA/Florida Tech), so pathways start at the bachelor's
// rather than an associate degree.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const SAINTLEO_PROGRAMS: SchoolProgram[] = [
  { name: "Criminal Justice, B.A.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11213", level: "bachelor", area: "Criminal Justice" },
  { name: "Emergency Management, B.A. (Offered only online through WorldWide)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11307", level: "bachelor", area: "Criminal Justice" },
  { name: "Educational Studies, B.A.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11277", level: "bachelor", area: "Education" },
  { name: "Elementary Education, B.A.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11218", level: "bachelor", area: "Education" },
  { name: "Middle Grades Education, B.A.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11254", level: "bachelor", area: "Education" },
  { name: "Secondary Education, B.A.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11276", level: "bachelor", area: "Education" },
  { name: "English, B.A.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11220", level: "bachelor", area: "English, Music and the Arts" },
  { name: "Music, B.A.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11332", level: "bachelor", area: "English, Music and the Arts" },
  { name: "Contemporary Studies, B.A.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11243", level: "bachelor", area: "Interdisciplinary Studies" },
  { name: "Medical Humanities, B.A.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11305", level: "bachelor", area: "Interdisciplinary Studies" },
  { name: "Veteran Studies, B.A. (Offered only through WorldWide)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11327", level: "bachelor", area: "Interdisciplinary Studies" },
  { name: "Computational Mathematics, B.S. (University Campus Only)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11336", level: "bachelor", area: "Mathematics" },
  { name: "Biology, B.S.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11202", level: "bachelor", area: "Natural and Applied Sciences" },
  { name: "Religion, B.A. (Offered only through Worldwide)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11264", level: "bachelor", area: "Philosophy and Religion" },
  { name: "Religious Studies, B.A. (University Campus Only)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11330", level: "bachelor", area: "Philosophy and Religion" },
  { name: "History, B.A.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11227", level: "bachelor", area: "Social Sciences" },
  { name: "International Studies, B.A.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11331", level: "bachelor", area: "Social Sciences" },
  { name: "Political Science, B.A.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11259", level: "bachelor", area: "Social Sciences" },
  { name: "Psychology, B.A", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11261", level: "bachelor", area: "Social Sciences" },
  { name: "Sociology, B.A. (Offered only through Worldwide)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11268", level: "bachelor", area: "Social Sciences" },
  { name: "Accounting, B.S.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11197", level: "bachelor", area: "Accounting, Economics and Finance" },
  { name: "Economics, B.S. STEM (Offered only at University Campus)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11279", level: "bachelor", area: "Accounting, Economics and Finance" },
  { name: "Finance, B.S. (University Campus Only)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11447", level: "bachelor", area: "Accounting, Economics and Finance" },
  { name: "Communication, B.A.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11317", level: "bachelor", area: "Communication and Marketing" },
  { name: "Marketing, B.A. (Offered only at University Campus)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11247", level: "bachelor", area: "Communication and Marketing" },
  { name: "Business Administration, B.A. (Offered only at University Campus)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11340", level: "bachelor", area: "Management and Business Administration" },
  { name: "Human Resource Management, B.A. (Offered only through WorldWide)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11230", level: "bachelor", area: "Management and Business Administration" },
  { name: "Management, B.A. (Offered only at University Campus)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11244", level: "bachelor", area: "Management and Business Administration" },
  { name: "Business Analytics, B.S. STEM (Offered only at University Campus)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11455", level: "bachelor", area: "Management and Business Administration" },
  { name: "Sport Business, B.A.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11270", level: "bachelor", area: "Sport Business" },
  { name: "Robotics and Artificial Intelligence, B.S.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11326", level: "bachelor", area: "Artificial Intelligence, Robotics and Data Science" },
  { name: "Computer Information Systems, B.S.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11210", level: "bachelor", area: "Computer Science and Project Management" },
  { name: "Computer Science, B.S.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11212", level: "bachelor", area: "Computer Science and Project Management" },
  { name: "Cybersecurity, B.S.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11298", level: "bachelor", area: "Computer Science and Project Management" },
  { name: "Software Engineering, B.S.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11302", level: "bachelor", area: "Computer Science and Project Management" },
  { name: "Exercise and Sport Science, B.S.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11453", level: "bachelor", area: "Exercise and Sport Science" },
  { name: "Health Care Administration, B.S.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11192", level: "bachelor", area: "Health Care Administration" },
  { name: "Nursing, B.S.N.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11319", level: "bachelor", area: "Nursing" },
  { name: "Social Work, B.S.W.", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=77&poid=11267", level: "bachelor", area: "Social Work" },

  { name: "Master of Arts in Creative Writing", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11111", level: "graduate", area: "Graduate Studies in Creative Writing" },
  { name: "Doctor of Education Ed.D. - Higher Education Concentration", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11138", level: "graduate", area: "Graduate Studies in Education" },
  { name: "Doctor of Education Ed.D. - School and Organizational Leadership", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11122", level: "graduate", area: "Graduate Studies in Education" },
  { name: "Master of Education: Educational Leadership Concentration", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11088", level: "graduate", area: "Graduate Studies in Education" },
  { name: "Master of Education: Exceptional Student Education and Autism Spectrum Disorder Practices and Intervention", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11450", level: "graduate", area: "Graduate Studies in Education" },
  { name: "Master of Education: Exceptional Student Education and Reading", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11132", level: "graduate", area: "Graduate Studies in Education" },
  { name: "Education Specialist: Educational Leadership Specialization", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11096", level: "graduate", area: "Graduate Studies in Education" },
  { name: "Doctor of Criminal Justice", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11121", level: "graduate", area: "Graduate Studies in Public Safety Administration" },
  { name: "Behavioral Studies Specialization (Online Only)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11114", level: "graduate", area: "Graduate Studies in Public Safety Administration" },
  { name: "Business Administration Specialization (Online Only)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11133", level: "graduate", area: "Graduate Studies in Public Safety Administration" },
  { name: "Corrections Specialization (Online Only)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11081", level: "graduate", area: "Graduate Studies in Public Safety Administration" },
  { name: "Criminal Investigations Specialization (Online Only)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11110", level: "graduate", area: "Graduate Studies in Public Safety Administration" },
  { name: "Critical Incident Management (Online Only)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11082", level: "graduate", area: "Graduate Studies in Public Safety Administration" },
  { name: "Forensic Science Specialization (Online Only)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11084", level: "graduate", area: "Graduate Studies in Public Safety Administration" },
  { name: "Legal Studies Specialization", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11085", level: "graduate", area: "Graduate Studies in Public Safety Administration" },
  { name: "Master of Science in Criminal Justice Program (Blended/Web-Enhanced/Online Curriculum)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11080", level: "graduate", area: "Graduate Studies in Public Safety Administration" },
  { name: "Health Psychology Specialization", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11126", level: "graduate", area: "Graduate Studies in Psychology" },
  { name: "Industrial /Organizational Specialization", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11127", level: "graduate", area: "Graduate Studies in Psychology" },
  { name: "Master of Science in Psychology", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11118", level: "graduate", area: "Graduate Studies in Psychology" },
  { name: "Doctor of Theology in Applied Theology", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11129", level: "graduate", area: "Graduate Studies in Theology" },
  { name: "Master of Arts in Theology", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11098", level: "graduate", area: "Graduate Studies in Theology" },
  { name: "Doctor of Business Administration in Management (DBA)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11102", level: "graduate", area: "Graduate Studies in Business" },
  { name: "Accounting Specialization (Online Only)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11069", level: "graduate", area: "Graduate Studies in Business" },
  { name: "Cybersecurity Management Specialization (Online Only)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11075", level: "graduate", area: "Graduate Studies in Business" },
  { name: "Data Analytics Specialization (Online Only)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11117", level: "graduate", area: "Graduate Studies in Business" },
  { name: "Finance Specialization (Online Only)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11136", level: "graduate", area: "Graduate Studies in Business" },
  { name: "Health Care Management Specialization (Online Only)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11071", level: "graduate", area: "Graduate Studies in Business" },
  { name: "Human Resource Management Specialization (Online Only)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11073", level: "graduate", area: "Graduate Studies in Business" },
  { name: "Management Specialization (On Ground and Online)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11137", level: "graduate", area: "Graduate Studies in Business" },
  { name: "Marketing Specialization (Online Only)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11077", level: "graduate", area: "Graduate Studies in Business" },
  { name: "Master of Business (MBA) On Ground and Online", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11068", level: "graduate", area: "Graduate Studies in Business" },
  { name: "Master of Business Administration One-Year International & Experiential", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11101", level: "graduate", area: "Graduate Studies in Business" },
  { name: "Master of Science in Accounting", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11130", level: "graduate", area: "Graduate Studies in Business" },
  { name: "Master of Science in Applied Business & Leadership", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11456", level: "graduate", area: "Graduate Studies in Business" },
  { name: "Project Management Specialization (Online Only)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11104", level: "graduate", area: "Graduate Studies in Business" },
  { name: "Supply Chain Global Integration Management Specialization (Online Only)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11112", level: "graduate", area: "Graduate Studies in Business" },
  { name: "Master of Science in Artificial Intelligence", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11131", level: "graduate", area: "Graduate Studies in Computer Science" },
  { name: "Master of Science in Computer Science", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11125", level: "graduate", area: "Graduate Studies in Computer Science" },
  { name: "Master of Science in Cybersecurity", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11106", level: "graduate", area: "Graduate Studies in Computer Science" },
  { name: "Master of Science in Nursing (Direct Entry)", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11451", level: "graduate", area: "Graduate Studies in Nursing" },
  { name: "Master of Science in Nursing - Family Nurse Practitioner", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11454", level: "graduate", area: "Graduate Studies in Nursing" },
  { name: "Master of Social Work Three-Year Program", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11065", level: "graduate", area: "Graduate Studies in Social Work" },
  { name: "Master of Social Work Two-Year Program", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11066", level: "graduate", area: "Graduate Studies in Social Work" },
  { name: "Master of Social Work: Advanced Clinical Practice", url: "https://academiccatalog.saintleo.edu/preview_program.php?catoid=76&poid=11067", level: "graduate", area: "Graduate Studies in Social Work" },
];

// Saint Leo is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const saintleoCatalog = createProgramCatalog(SAINTLEO_PROGRAMS, { preferred: "bachelor" });
