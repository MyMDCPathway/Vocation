// Edward Waters University degree catalog: program name -> official
// per-program page.
//
// HAND-VERIFIED, not scraped — no committed scraper exists for this school.
// This was the last of the 21 private (SACSCOC) schools and HANDOFF.md had
// flagged it as a genuine trap, not just a miss: guessing `catalog.ewu.edu`
// (the pattern that worked for several other schools) returns a real,
// live, 200-OK CourseLeaf catalog — but for **Eastern Washington
// University**, an entirely different school on the other side of the
// country that happens to share the "EWU" short name. Confirmed by reading
// the page's own `<title>`, not just trusting the 200 status.
//
// Edward Waters's own domain is `ew.edu` (found via `ewc.edu`, its former
// abbreviation-based domain, which 301-redirects there). Its
// `<school>.smartcatalogiq.com` subdomain is reserved but returns "Layout
// Not Found" on every path tried — a dead end, matching the doc's existing
// note. The real source is `ew.edu/academic-programs/`, a small, current,
// actively-maintained (July 2026 image uploads) page listing every program
// with its own real per-program link, no WAF, curl works, every page's
// `<title>` confirmed to match its listed name exactly. EWU's own current-
// year PDF catalog link (linked from the same page, "2023-2024 Catalog
// (Current)") 404s — broken/stale, unlike the live program pages — so the
// web listing is the source of truth here, not the PDF.
//
// One exclusion: "General Studies" is listed in the site's own nav menu
// alongside the real majors, but its own page states it is "the core of
// the undergraduate curriculum for all students, regardless of their
// major" — a foundational first-two-years general-education program, not
// a credential of its own. Same "names no credential of its own" shape
// that excluded FSC's "Secondary Education (6-12)" hub page.
//
// "Business Administration" is offered with four internal concentrations
// (Business Management, Computer Information Systems, Healthcare
// Management, Organizational Management) stated on its own page — these
// are tracks within the one B.S. Business Administration degree, not
// separate majors, so they aren't split into separate entries (Computer
// Information Systems is ALSO its own genuinely separate, standalone
// major/degree elsewhere in this catalog — the concentration of the same
// name inside Business Administration is not that program).
//
// EWU spells out every credential in full ("Bachelor of Science in
// Accounting," "Master of Business Administration") rather than
// abbreviating — the one same-named collision this creates (Business
// Administration exists at both the bachelor's and master's) resolves
// correctly with no new matcher gap, since `requestedLevel()` already
// recognizes the bare spelled-out words "bachelor" and "master" before
// falling back to any abbreviation.
//
// Programs: 15 (11 bachelor's, 4 graduate)
//
// EWU is a four-year university (like UM/Stetson/ERAU/UT/Barry/Lynn/
// Rollins/Flagler/PBA/FIT/Saint Leo/STU/Ave Maria/Bethune-Cookman/Eckerd/
// FMU/JU/Keiser/FSC/NSU), so pathways start at the bachelor's rather than
// an associate degree.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

const SITE = "https://www.ew.edu";

export const EWU_PROGRAMS: SchoolProgram[] = [
  { name: "Bachelor of Arts in Criminal Justice", url: `${SITE}/academic-programs/bachelor-of-arts-in-criminal-justice/`, level: "bachelor" },
  { name: "Bachelor of Science in Social Work", url: `${SITE}/academic-programs/bsw/`, level: "bachelor" },
  { name: "Bachelor of Arts in Psychology", url: `${SITE}/academic-programs/psych/`, level: "bachelor" },
  { name: "Bachelor of Science in Forensic Science", url: `${SITE}/academic-programs/for-science/`, level: "bachelor" },
  { name: "Bachelor of Science in Public Health", url: `${SITE}/academic-programs/pub-health/`, level: "bachelor" },
  { name: "Bachelor of Science in Communications", url: `${SITE}/bachelor-of-science-in-communications/`, level: "bachelor" },
  { name: "Bachelor of Science in Biology", url: `${SITE}/academic-programs/biology/`, level: "bachelor" },
  { name: "Bachelor of Science in Business Administration", url: `${SITE}/academic-programs/bba/`, level: "bachelor" },
  { name: "Bachelor of Science in Accounting", url: `${SITE}/academic-programs/acc/`, level: "bachelor" },
  { name: "Bachelor of Science in Computer and Information Science", url: `${SITE}/academic-programs/cis/`, level: "bachelor" },
  { name: "Bachelor of Science in Sports Management", url: `${SITE}/academic-programs/sportsm/`, level: "bachelor" },
  { name: "Master of Arts in Education Policy and Advocacy", url: `${SITE}/academic-programs/mepa/`, level: "graduate" },
  { name: "Master of Business Administration", url: `${SITE}/academic-programs/mba/`, level: "graduate" },
  { name: "Master of Public Administration", url: `${SITE}/academic-programs/mpa/`, level: "graduate" },
  { name: "Master of Science in Cybersecurity", url: `${SITE}/academic-programs/mscy/`, level: "graduate" },
];

export const ewuCatalog = createProgramCatalog(EWU_PROGRAMS);
