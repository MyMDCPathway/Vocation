// Eckerd College degree catalog: program name -> official department page.
//
// HAND-VERIFIED, not scraped — no committed scraper exists for this school.
// This closes out a real dead end HANDOFF.md flagged: eckerd.edu/academics/
// majors/ lists ~41 majors with real per-major links (e.g. eckerd.edu/
// biology/, plain HTTP, no WAF — every URL below returns a 200 under curl),
// but neither that page nor any individual major page states a credential
// anywhere — confirmed by a text search across several. The credential data
// lives in a different document entirely: the school's own PDF course
// catalog (eckerd.edu/catalog/ -> a Google Drive-hosted PDF, 176 pages),
// extracted locally with the `pdf-parse` npm package (installed in a
// scratch directory, never added to this project's package.json, per the
// "don't add a dependency for something small" rule) — the same technique
// St. Thomas's and Bethune-Cookman's files needed for a different reason
// (WAF/no-HTML-catalog there; here it's "the real pages exist but omit the
// one fact this project needs").
//
// Eckerd's own "Bachelor of Arts Degree" section states the college
// approves "a list of 42 majors" — matched by literally counting the
// catalog's own official major/minor legend (each major/minor marked "M"/
// "m"). The credential rule, read from that same section: EVERY major
// confers a Bachelor of Arts by default. A named subset — the ones the
// catalog calls "natural sciences or mathematics" — can ALSO earn a
// Bachelor of Science by taking 16+ (rather than 12-15) courses in the
// Natural Sciences Collegium; this is genuinely a per-department policy,
// not a fixed list, so every one of the 42 majors' own department sections
// was individually checked for a stated B.S./B.F.A. option rather than
// assumed from the Collegium blurb alone — which is exactly what caught two
// majors (Environmental Studies, Psychology) offering a B.S. despite not
// being in that blurb's own named list (biology, chemistry, biochemistry,
// computer science, physics, math, geosciences, marine science).
//
// One real judgment call, the same "the other half of this program lives
// somewhere we don't have" shape that excluded STU's joint JD programs: a
// B.F.A. in Theatre OR Musical Theatre is offered ONLY as a 2+2 program
// requiring separate admission to Circle in the Square Theatre School in
// New York City — confirmed by reading that program's own catalog section,
// which states the degree is conferred jointly and 63 of the required
// credits come from the partner school, not Eckerd. Musical Theatre has no
// other version — its only major/degree IS that partnership — so it's
// excluded entirely; Theatre itself is real and stays, but only as its
// standalone on-campus B.A. Creative Writing's B.F.A. is NOT the same
// shape — it's an ordinary on-campus add-on (an extra Publishing & Editing
// course sequence) — so both its B.A. and B.F.A. are included.
//
// Two majors are B.S.-ONLY, not B.A.-or-B.S. like the rest of the science
// list: Biochemistry (the catalog never mentions a B.A. in Biochemistry at
// all) and Marine Science (whose own section states outright "The B.A.
// degree is not offered").
//
// "Comparative Literature" and "Literature" are two separate, real, legally
// distinct majors (own course requirements, own comprehensive-exam course
// code, LC498 vs LI498) that happen to share one department web page
// (eckerd.edu/literature/) — confirmed by reading both catalog sections in
// full; Comparative Literature's is not a "See Literature" stub. "English"
// is genuinely just an alternate search name for the Literature major (no
// separate ENGLISH section exists anywhere in the catalog), and "Art"/
// "Visual Arts" are the same single major under two names (the catalog's
// own "VISUAL ARTS" section literally reads "See Art.") — both merges
// confirmed by reading the catalog rather than assumed from a shared URL.
//
// Chemistry's ACS-certified B.S. track is a certification layered onto the
// same B.S., not a separate credential, so it isn't a third entry.
//
// Eckerd is undergraduate-only — no graduate programs exist anywhere in the
// catalog.
//
// Programs: 50 (all bachelor's: 30 B.A.-only majors, 8 majors offering both
// B.A. and B.S., 2 B.S.-only majors, 1 major offering both B.A. and B.F.A.)
//
// Eckerd is a four-year college (like UM/Stetson/ERAU/UT/Barry/Lynn/
// Rollins/Flagler/PBA/FIT/Saint Leo/STU/Ave Maria/Bethune-Cookman), so
// pathways start at the bachelor's rather than an associate degree.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

const SITE = "https://www.eckerd.edu";

export const ECKERD_PROGRAMS: SchoolProgram[] = [
  { name: "American Studies", url: `${SITE}/american-studies/`, level: "bachelor", credential: "BA" },
  { name: "Ancient Studies", url: `${SITE}/ancient-studies/`, level: "bachelor", credential: "BA" },
  { name: "Animal Studies", url: `${SITE}/animal-studies/`, level: "bachelor", credential: "BA" },
  { name: "Anthropology", url: `${SITE}/anthropology/`, level: "bachelor", credential: "BA" },
  { name: "Biochemistry", url: `${SITE}/chemistry/`, level: "bachelor", credential: "BS" },
  { name: "Biology", url: `${SITE}/biology/`, level: "bachelor", credential: "BA" },
  { name: "Biology", url: `${SITE}/biology/`, level: "bachelor", credential: "BS" },
  { name: "Business Administration", url: `${SITE}/management/business-administration/`, level: "bachelor", credential: "BA" },
  { name: "Chemistry", url: `${SITE}/chemistry/`, level: "bachelor", credential: "BA" },
  { name: "Chemistry", url: `${SITE}/chemistry/`, level: "bachelor", credential: "BS" },
  { name: "Communication", url: `${SITE}/communication/`, level: "bachelor", credential: "BA" },
  { name: "Comparative Literature", url: `${SITE}/literature/`, level: "bachelor", credential: "BA" },
  { name: "Computer Science", url: `${SITE}/computer-science/`, level: "bachelor", credential: "BA" },
  { name: "Computer Science", url: `${SITE}/computer-science/`, level: "bachelor", credential: "BS" },
  { name: "Creative Writing", url: `${SITE}/creative-writing/`, level: "bachelor", credential: "BA" },
  { name: "Creative Writing", url: `${SITE}/creative-writing/`, level: "bachelor", credential: "BFA" },
  { name: "East Asian Studies", url: `${SITE}/east-asian-studies/`, level: "bachelor", credential: "BA" },
  { name: "Economics", url: `${SITE}/economics/`, level: "bachelor", credential: "BA" },
  { name: "Environmental Studies", url: `${SITE}/environmental-studies/`, level: "bachelor", credential: "BA" },
  { name: "Environmental Studies", url: `${SITE}/environmental-studies/`, level: "bachelor", credential: "BS" },
  { name: "Film Studies", url: `${SITE}/film-studies/`, level: "bachelor", credential: "BA" },
  { name: "French", url: `${SITE}/french/`, level: "bachelor", credential: "BA" },
  { name: "Geosciences", url: `${SITE}/geosciences/`, level: "bachelor", credential: "BA" },
  { name: "Geosciences", url: `${SITE}/geosciences/`, level: "bachelor", credential: "BS" },
  { name: "History", url: `${SITE}/history/`, level: "bachelor", credential: "BA" },
  { name: "Human Development", url: `${SITE}/human-development/`, level: "bachelor", credential: "BA" },
  { name: "Humanities", url: `${SITE}/humanities/`, level: "bachelor", credential: "BA" },
  { name: "Interdisciplinary Arts", url: `${SITE}/interdisciplinary-arts/`, level: "bachelor", credential: "BA" },
  { name: "International Business", url: `${SITE}/international-business/`, level: "bachelor", credential: "BA" },
  { name: "International Relations & Global Affairs", url: `${SITE}/irga/`, level: "bachelor", credential: "BA" },
  { name: "International Studies", url: `${SITE}/internationalstudies/`, level: "bachelor", credential: "BA" },
  { name: "Literature", url: `${SITE}/literature/`, level: "bachelor", credential: "BA" },
  { name: "Management", url: `${SITE}/management/`, level: "bachelor", credential: "BA" },
  { name: "Marine Science", url: `${SITE}/marinescience/`, level: "bachelor", credential: "BS" },
  { name: "Marketing", url: `${SITE}/marketing/`, level: "bachelor", credential: "BA" },
  { name: "Mathematics", url: `${SITE}/mathematics/`, level: "bachelor", credential: "BA" },
  { name: "Mathematics", url: `${SITE}/mathematics/`, level: "bachelor", credential: "BS" },
  { name: "Music", url: `${SITE}/music/`, level: "bachelor", credential: "BA" },
  { name: "Philosophy", url: `${SITE}/philosophy/`, level: "bachelor", credential: "BA" },
  { name: "Physics", url: `${SITE}/physics/`, level: "bachelor", credential: "BA" },
  { name: "Physics", url: `${SITE}/physics/`, level: "bachelor", credential: "BS" },
  { name: "Political Science", url: `${SITE}/political-science/`, level: "bachelor", credential: "BA" },
  { name: "Psychology", url: `${SITE}/psychology/`, level: "bachelor", credential: "BA" },
  { name: "Psychology", url: `${SITE}/psychology/`, level: "bachelor", credential: "BS" },
  { name: "Religious Studies", url: `${SITE}/religious-studies/`, level: "bachelor", credential: "BA" },
  { name: "Sociology", url: `${SITE}/sociology/`, level: "bachelor", credential: "BA" },
  { name: "Spanish", url: `${SITE}/spanish/`, level: "bachelor", credential: "BA" },
  { name: "Theatre", url: `${SITE}/theatre/`, level: "bachelor", credential: "BA" },
  { name: "Visual Arts", url: `${SITE}/visualarts/`, level: "bachelor", credential: "BA" },
  { name: "Women's and Gender Studies", url: `${SITE}/gender-studies/`, level: "bachelor", credential: "BA" },
];

export const eckerdCatalog = createProgramCatalog(ECKERD_PROGRAMS);
