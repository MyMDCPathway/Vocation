// Rollins College degree catalog: program name -> official program page.
//
// HAND-VERIFIED, not scraped — no committed scraper exists for this school.
// catalog.rollins.edu is Acalog behind AWS WAF Bot Control: both fetch() and
// curl are blocked on content.php AND preview_program.php (HTTP 202 with
// x-amzn-waf-action: challenge), the same platform and symptom as FAMU,
// FlPoly, and USF (see HANDOFF.md §13). index.php (the catalog picker) loads
// fine either way — it's the program content specifically that's gated. Per
// the FlPoly/USF technique, a real browser doing top-level navigation gets
// through where curl/fetch cannot; this file was built the same way, reading
// the rendered DOM after navigating to each catalog's own single-page
// "Departments and Programs" listing (2026-07-28).
//
// Rollins publishes FOUR separate catalogs, not the usual undergrad+grad
// pair:
//   catoid=35  2026-27 College of Liberal Arts        (traditional day undergrad)
//   catoid=36  2026-27 Hamilton Holt Undergraduate     (adult/evening undergrad)
//   catoid=37  2026-27 Hamilton Holt Graduate
//   catoid=38  2026-27 Crummer Graduate School of Business
//
// Hamilton Holt Undergraduate is DELIBERATELY EXCLUDED. It's a second,
// smaller (13-major) undergraduate catalog for working-adult/evening
// students, and 7 of its 13 majors (Business Management, Communication
// Studies, Economics, Education - Elementary Education, Self-Designed,
// Music, Psychology) share an exact subject name with a College of Liberal
// Arts major but a DIFFERENT poid/URL and a different stated credential
// (Holt states a generic "Bachelor of Arts"; CLA states its own "Artium
// Baccalaureus (A.B.)"). Folding both in would put two same-named bachelor's
// entries in one flat list with no way for a query to disambiguate which
// physical page it means — createProgramCatalog's `find()` would silently
// pick whichever happened to be pushed first. College of Liberal Arts is
// kept as the one bachelor's catalog (larger, and the flagship day program a
// prospective undergraduate would actually enroll in), matching how ERAU's
// catalog picked its Daytona Beach campus among several rather than merging
// campuses with overlapping program names.
//
// Bachelor's source (College of Liberal Arts, catoid=35):
//   content.php?catoid=35&navoid=1363  Departments and Programs (one page, all majors + minors)
// Every College of Liberal Arts major confers the same credential regardless
// of subject — content.php?catoid=35&navoid=1362 (Degree Requirements)
// states "All College of Liberal Arts students pursue either a Bachelor of
// Arts (Artium Baccalaureus) or Honors Bachelor of Arts... degree" — so
// credential is uniformly "A.B." here, the same one-degree-many-subjects
// shape as NCF's B.A., not a per-major lookup.
//
// Excluded from the 88 links on that page: every "...Minor" entry (not a
// standalone degree), "Artificial Intelligence Certificate" (a certificate,
// not a major), and "Social Innovation" (its own page states the major "will
// be discontinued effective Fall 2024... New declarations of the SI major
// will cease effective Fall 2023" — a real, site-stated dead program, same
// "exclude rather than recommend a suspended program" call as UF's Religion
// and FAU's suspended majors). "Engineering Studies (Dual Degree)" and
// "Self-designed" are kept — both are real, currently-declarable majors (the
// former a 3+2/3+3 cooperative program with Case Western Reserve/Washington
// University in St. Louis that still confers Rollins' own A.B.; the latter
// a real, named "Self-Designed Major" option per the Degree Requirements
// page) confirmed by reading each one's own program page.
//
// Graduate source (Hamilton Holt Graduate, catoid=37):
//   content.php?catoid=37&navoid=1448  Departments and Programs (flat list, no headings)
// Excluded: "Professional Training Option" (its own page states it is "a
// state-approved non-degree program"), and the Elementary/Secondary Teacher
// Certification Sequences plus the Reading Endorsement Sequence (each one's
// own page describes it as a certification track alongside the M.A.T.
// degrees already listed separately, not a standalone degree).
//
// Graduate source (Crummer Graduate School of Business, catoid=38):
//   content.php?catoid=38&navoid=1476  MBA Degree Programs
// Four real, separately-named MBA delivery tracks (Early Advantage,able
// Executive, Professional, Accelerated/STEM) — all confer the same M.B.A.,
// same shape as a school offering several formats of the same credential.
// "Certificate Programs" (navoid=1483) was not used — certificates only.
//
// Programs: 49 (37 bachelor, 12 graduate)
//
// Rollins is a four-year university (like UM/Stetson/ERAU/UT/Barry/Lynn), so
// pathways start at the bachelor's rather than an associate degree.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const ROLLINS_PROGRAMS: SchoolProgram[] = [
  { name: "American Studies", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1785", level: "bachelor", credential: "A.B.", area: "American Studies" },
  { name: "Anthropology", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1816", level: "bachelor", credential: "A.B.", area: "Anthropology" },
  { name: "Art History", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1786", level: "bachelor", credential: "A.B.", area: "Art and Art History" },
  { name: "Studio Art", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1863", level: "bachelor", credential: "A.B.", area: "Art and Art History" },
  { name: "Asian Studies", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1789", level: "bachelor", credential: "A.B.", area: "Asian Studies" },
  { name: "Biochemistry/Molecular Biology", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1791", level: "bachelor", credential: "A.B.", area: "Biochemistry/Molecular Biology" },
  { name: "Biology", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1783", level: "bachelor", credential: "A.B.", area: "Biology" },
  { name: "Marine Biology", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1827", level: "bachelor", credential: "A.B.", area: "Biology" },
  { name: "Business Management", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1793", level: "bachelor", credential: "A.B.", area: "Business" },
  { name: "Social Entrepreneurship", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1797", level: "bachelor", credential: "A.B.", area: "Business" },
  { name: "International Business", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1795", level: "bachelor", credential: "A.B.", area: "Business" },
  { name: "Chemistry", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1799", level: "bachelor", credential: "A.B.", area: "Chemistry" },
  { name: "Classical Studies", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1801", level: "bachelor", credential: "A.B.", area: "Classical Studies" },
  { name: "Communication Studies", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1803", level: "bachelor", credential: "A.B.", area: "Communication Studies" },
  { name: "Computer Science", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1805", level: "bachelor", credential: "A.B.", area: "Computer Science" },
  { name: "Critical Media and Cultural Studies", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1809", level: "bachelor", credential: "A.B.", area: "Critical Media and Cultural Studies" },
  { name: "Economics", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1811", level: "bachelor", credential: "A.B.", area: "Economics" },
  { name: "Education - Elementary Education", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1865", level: "bachelor", credential: "A.B.", area: "Education" },
  { name: "Engineering Studies (Dual Degree)", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1849", level: "bachelor", credential: "A.B.", area: "Engineering Studies" },
  { name: "English", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1813", level: "bachelor", credential: "A.B.", area: "English" },
  { name: "Environmental Studies", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1817", level: "bachelor", credential: "A.B.", area: "Environmental Studies" },
  { name: "History", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1821", level: "bachelor", credential: "A.B.", area: "History" },
  { name: "Self-Designed Major", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1852", level: "bachelor", credential: "A.B.", area: "Interdisciplinary" },
  { name: "International Relations", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1823", level: "bachelor", credential: "A.B.", area: "International Relations" },
  { name: "Latin American and Caribbean Studies", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1825", level: "bachelor", credential: "A.B.", area: "Latin American/Caribbean Studies" },
  { name: "Mathematics", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1828", level: "bachelor", credential: "A.B.", area: "Mathematics" },
  { name: "Music", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1831", level: "bachelor", credential: "A.B.", area: "Music" },
  { name: "Philosophy", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1862", level: "bachelor", credential: "A.B.", area: "Philosophy" },
  { name: "Physics", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1835", level: "bachelor", credential: "A.B.", area: "Physics" },
  { name: "Political Science", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1837", level: "bachelor", credential: "A.B.", area: "Political Science" },
  { name: "Psychology", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1839", level: "bachelor", credential: "A.B.", area: "Psychology" },
  { name: "Public Policy and Political Economy", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1841", level: "bachelor", credential: "A.B.", area: "Public Policy and Economics" },
  { name: "Religious Studies", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1864", level: "bachelor", credential: "A.B.", area: "Religion" },
  { name: "Sociology", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1843", level: "bachelor", credential: "A.B.", area: "Sociology" },
  { name: "Spanish (native speakers)", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1854", level: "bachelor", credential: "A.B.", area: "Spanish" },
  { name: "Spanish (non-native speakers)", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1855", level: "bachelor", credential: "A.B.", area: "Spanish" },
  { name: "Theatre Arts and Dance", url: "https://catalog.rollins.edu/preview_program.php?catoid=35&poid=1846", level: "bachelor", credential: "A.B.", area: "Theatre Arts and Dance" },

  { name: "Applied Behavior Analysis and Clinical Science", url: "https://catalog.rollins.edu/preview_program.php?catoid=37&poid=1944", level: "graduate", credential: "M.A.", area: "Hamilton Holt Graduate" },
  { name: "Clinical Mental Health Counseling", url: "https://catalog.rollins.edu/preview_program.php?catoid=37&poid=1945", level: "graduate", credential: "M.A.", area: "Hamilton Holt Graduate" },
  { name: "Education (Elementary)", url: "https://catalog.rollins.edu/preview_program.php?catoid=37&poid=1947", level: "graduate", credential: "M.A.T.", area: "Hamilton Holt Graduate" },
  { name: "Education (Secondary)", url: "https://catalog.rollins.edu/preview_program.php?catoid=37&poid=1942", level: "graduate", credential: "M.A.T.", area: "Hamilton Holt Graduate" },
  { name: "Human Resources", url: "https://catalog.rollins.edu/preview_program.php?catoid=37&poid=1950", level: "graduate", credential: "M.H.R.", area: "Hamilton Holt Graduate" },
  { name: "Liberal Studies", url: "https://catalog.rollins.edu/preview_program.php?catoid=37&poid=1943", level: "graduate", credential: "M.L.S.", area: "Hamilton Holt Graduate" },
  { name: "Public Health", url: "https://catalog.rollins.edu/preview_program.php?catoid=37&poid=1951", level: "graduate", credential: "M.P.H.", area: "Hamilton Holt Graduate" },
  { name: "Strategic Communication", url: "https://catalog.rollins.edu/preview_program.php?catoid=37&poid=1954", level: "graduate", credential: "M.A.", area: "Hamilton Holt Graduate" },

  { name: "Early Advantage MBA", url: "https://catalog.rollins.edu/preview_program.php?catoid=38&poid=1972", level: "graduate", credential: "M.B.A.", area: "Crummer Graduate School of Business" },
  { name: "Executive MBA", url: "https://catalog.rollins.edu/preview_program.php?catoid=38&poid=1973", level: "graduate", credential: "M.B.A.", area: "Crummer Graduate School of Business" },
  { name: "Professional MBA", url: "https://catalog.rollins.edu/preview_program.php?catoid=38&poid=1974", level: "graduate", credential: "M.B.A.", area: "Crummer Graduate School of Business" },
  { name: "Accelerated MBA (STEM)", url: "https://catalog.rollins.edu/preview_program.php?catoid=38&poid=1978", level: "graduate", credential: "M.B.A.", area: "Crummer Graduate School of Business" },
];

// Rollins is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const rollinsCatalog = createProgramCatalog(ROLLINS_PROGRAMS, { preferred: "bachelor" });
