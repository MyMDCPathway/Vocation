// Flagler College degree catalog: program name -> official program page.
//
// HAND-VERIFIED, not scraped — no committed scraper exists for this school.
// catalog.flagler.edu is Acalog behind AWS WAF Bot Control: both fetch() and
// curl are blocked on content.php AND preview_program.php (HTTP 202 with
// x-amzn-waf-action: challenge), the same platform and symptom as FAMU,
// FlPoly, USF, and Rollins (see HANDOFF.md §13). index.php loads fine either
// way. Per the FlPoly/USF/Rollins technique, a real browser doing top-level
// navigation gets through where curl/fetch cannot; this file was built the
// same way (2026-07-28).
//
// Flagler has its own "Programs of Study (A-Z)" Acalog widget, the same
// built-in shape Barry's catalog used:
//   content.php?catoid=13&navoid=355  Programs of Study (A-Z) — every Major/
//     Minor/Certificate/Graduate program on one page, 98 entries total.
// Cross-checked against Flagler's own marketing site
// (www.flagler.edu/academics/degrees-programs, a Drupal Views table with the
// same Major/Minor/Graduate/Certificate flags) which states "42 majors
// leading to a bachelor's degree, two master's degree programs" — matching
// this file's count exactly, a strong independent confirmation.
//
// Minors, certificates (French/Spanish), and two teaching "Endorsement"
// entries were excluded — none are a standalone degree, and the university
// prompt template only ever renders bachelor's/graduate programs anyway.
//
// Flagler's own Acalog "Degree Requirements" page states: "The College
// offers four degrees: Bachelor of Arts, Bachelor of Fine Arts, Bachelor of
// Science, Master of Arts, and a Master of Public Administration" — credit
// hours differ by major, so (unlike Rollins/NCF's one-degree-many-majors
// shape) EVERY one of the 42 majors below had its own credential
// hand-verified from its own program page (most state it as "will earn a
// Bachelor of Science degree" in prose; a few, e.g. History, state it
// in-line as "(BA)" instead — both forms were checked for every entry, none
// guessed). Two subjects (Fine Arts, Graphic Design) offer both a standard
// major AND a separate, more intensive BFA track as two distinct real
// programs with their own pages — kept as two distinct catalog entries
// ("Fine Arts" / "Fine Arts, BFA") since collapsing them would either lose
// a real option or collide two same-named bachelor's entries in one lookup
// bucket. The two graduate programs' names already state their own
// credential in full ("Master of Arts in Education of the Deaf and Hard of
// Hearing", "Master of Public Administration") and are stored that way
// rather than with a separate credential field, the same "name already
// carries the code" shape pathwayPrompts.ts documents for FIU. Flagler's own
// site abbreviates the latter as "MPA" (undotted), already covered by
// GRADUATE_HINT's existing bare `mpa` code — no new matcher code needed.
//
// Programs: 44 (42 bachelor, 2 graduate)
//
// Flagler is a four-year university (like UM/Stetson/ERAU/UT/Barry/Lynn/
// Rollins), so pathways start at the bachelor's rather than an associate
// degree.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const FLAGLER_PROGRAMS: SchoolProgram[] = [
  { name: "Accounting", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1572", level: "bachelor", credential: "B.S." },
  { name: "Anthropology", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1659", level: "bachelor", credential: "B.A." },
  { name: "Art History", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1574", level: "bachelor", credential: "B.A." },
  { name: "Biology", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1670", level: "bachelor", credential: "B.S." },
  { name: "Business Administration", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1575", level: "bachelor", credential: "B.A." },
  { name: "Cinematic Arts", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1664", level: "bachelor", credential: "B.A." },
  { name: "Coastal Environmental Science", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1624", level: "bachelor", credential: "B.S." },
  { name: "Computer Information Systems", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1654", level: "bachelor", credential: "B.S." },
  { name: "Criminology", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1601", level: "bachelor", credential: "B.A." },
  { name: "Data Science", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1667", level: "bachelor", credential: "B.S." },
  { name: "Digital Media Production and Journalism", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1598", level: "bachelor", credential: "B.A." },
  { name: "Economics", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1603", level: "bachelor", credential: "B.A." },
  { name: "Education of the Deaf and Hard of Hearing (K-12), Elementary Education (K-6)", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1605", level: "bachelor", credential: "B.A." },
  { name: "Elementary Education", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1583", level: "bachelor", credential: "B.A." },
  { name: "Elementary Education/Exceptional Student Education", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1606", level: "bachelor", credential: "B.A." },
  { name: "English", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1608", level: "bachelor", credential: "B.A." },
  { name: "Finance", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1594", level: "bachelor", credential: "B.S." },
  { name: "Fine Arts", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1588", level: "bachelor", credential: "B.A." },
  { name: "Fine Arts, BFA", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1589", level: "bachelor" },
  { name: "Graphic Design", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1582", level: "bachelor", credential: "B.A." },
  { name: "Graphic Design, BFA", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1657", level: "bachelor" },
  { name: "History", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1612", level: "bachelor", credential: "B.A." },
  { name: "Hospitality and Tourism Management", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1616", level: "bachelor", credential: "B.A." },
  { name: "International Business", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1652", level: "bachelor", credential: "B.A." },
  { name: "International Studies", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1617", level: "bachelor", credential: "B.A." },
  { name: "Liberal Arts", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1621", level: "bachelor", credential: "B.A." },
  { name: "Marketing", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1650", level: "bachelor", credential: "B.A." },
  { name: "Mathematics", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1658", level: "bachelor", credential: "B.S." },
  { name: "Media Studies", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1578", level: "bachelor", credential: "B.A." },
  { name: "Philosophy and Religion", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1627", level: "bachelor", credential: "B.A." },
  { name: "Political Science", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1630", level: "bachelor", credential: "B.A." },
  { name: "Psychology", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1632", level: "bachelor", credential: "B.A." },
  { name: "Public Administration", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1645", level: "bachelor", credential: "B.S." },
  { name: "Public History", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1614", level: "bachelor", credential: "B.A." },
  { name: "Public Relations", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1597", level: "bachelor", credential: "B.A." },
  { name: "Secondary Education (English)", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1579", level: "bachelor", credential: "B.A." },
  { name: "Secondary Education (Mathematics)", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1607", level: "bachelor", credential: "B.A." },
  { name: "Social Entrepreneurship", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1653", level: "bachelor", credential: "B.A." },
  { name: "Sociology", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1634", level: "bachelor", credential: "B.A." },
  { name: "Spanish", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1580", level: "bachelor", credential: "B.A." },
  { name: "Sport Management", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1639", level: "bachelor", credential: "B.A." },
  { name: "Theatre Arts", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1640", level: "bachelor", credential: "B.A." },

  { name: "Master of Arts in Education of the Deaf and Hard of Hearing", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1581", level: "graduate" },
  { name: "Master of Public Administration", url: "https://catalog.flagler.edu/preview_program.php?catoid=13&poid=1700", level: "graduate" },
];

// Flagler is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const flaglerCatalog = createProgramCatalog(FLAGLER_PROGRAMS, { preferred: "bachelor" });
