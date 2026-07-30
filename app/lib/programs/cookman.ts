// Bethune-Cookman University degree catalog: program name -> official
// program page.
//
// HAND-VERIFIED, not scraped — no committed scraper exists for this school.
// catalog.cookman.edu is Acalog behind AWS WAF Bot Control, the same
// platform and symptom as Rollins/Flagler/PBA/FIT/Saint Leo: `content.php`
// and `preview_program.php` both return HTTP 202 with
// `x-amzn-waf-action: challenge` under curl/fetch, confirmed directly
// (`index.php` alone returns a plain 200, which is why HANDOFF.md's earlier
// survey — which only tried `index.php` — mistakenly logged this school as
// "not WAF-blocked"). Per the established technique, a real browser doing
// top-level navigation gets through where curl/fetch cannot; this file was
// built that way (2026-07-29).
//
// Two catalogs, not the usual single undergrad+grad pair split by catoid
// alone — both selected from the same `index.php` dropdown:
//   catoid=51  2025-2026 Undergraduate Catalog
//   catoid=55  2025-2026 Graduate Catalog
// Both have one comprehensive "Academic Programs" page listing every major,
// minor, certificate, and non-degree program in one place, each a real
// `preview_program.php?catoid=<id>&poid=<id>` link:
//   content.php?catoid=51&navoid=3481  Academic Programs (undergraduate)
//   content.php?catoid=55&navoid=3862  Academic Programs (graduate)
// (The older "Degree Offerings" page, content.php?catoid=51&navoid=3488, is
// stale — it's missing several newer majors, like Actuarial Science and
// Cybersecurity, that the current Academic Programs page has. Used the
// current page, not the stale one.)
//
// Every undergraduate entry already states its own credential in the title
// (e.g. "Accounting, B.S.", "Nursing B.S.N.") — no separate `credential`
// field needed, the same "name already carries the code" shape used for
// Saint Leo and St. Thomas. Graduate program titles are inconsistent about
// this (some state a code inline, like "Master of Business Administration
// (MBA)"; others, like "Master in Health Equity" and "Master of Athletic
// Training", state none at all), so graduate entries use a `credential`
// field instead, reading the real abbreviation off each program's own page
// where the listing didn't have one (Health Equity's own page states
// "Master of Public Health in Health Equity (MPH)"; Athletic Training's
// states none anywhere, so it's spelled out as "Master's", the same call
// FSU/NCF made for their own unlabeled graduate programs).
//
// `area` is omitted throughout. The catalog's four colleges (Arts and
// Humanities, Business & Entrepreneurship, Nursing and Health Sciences,
// Science/Engineering/Mathematics) each have their own content.php page,
// but none of them enumerate their majors in any structured, scrapable
// form — just mission/vision prose that names a handful of majors in a
// sentence, not a complete list. Guessing the rest from subject-matter
// alone would be inventing an administrative grouping this project never
// verified, not just reading a real one back.
//
// Excluded: all 30 Minors; all 3 undergraduate Certifications (Paralegal
// Certificate, Practical Nursing, Teacher Certification) and both graduate
// Certificates (Christian Ministry, Organizational Leadership) — the same
// "Minors and Certificates" exclusion Saint Leo's and St. Thomas's files
// made; the two Air Force ROTC entries under "Other Programs" (not
// degrees); and "Integrated Environmental Science 3+2 (B.S./M.S.)" — an
// accelerated 5-year track combining the standalone "Integrated
// Environmental Science, B.S." (already its own entry below) with the
// standalone graduate M.S. of the same name, named with both levels at
// once and no way to assign it a single ProgramLevel without guessing.
//
// Programs: 61 (52 bachelor, 9 graduate)
//
// Bethune-Cookman is a four-year university (like UM/Stetson/ERAU/UT/Barry/
// Lynn/Rollins/Flagler/PBA/FIT/Saint Leo/STU/Ave Maria), so pathways start
// at the bachelor's rather than an associate degree.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

const UG = "https://catalog.cookman.edu/preview_program.php?catoid=51";
const GR = "https://catalog.cookman.edu/preview_program.php?catoid=55";

export const COOKMAN_PROGRAMS: SchoolProgram[] = [
  { name: "Accounting, B.S.", url: `${UG}&poid=4972`, level: "bachelor" },
  { name: "Actuarial Science, B.S.", url: `${UG}&poid=5283`, level: "bachelor" },
  { name: "Applied Artificial Intelligence, B.S.", url: `${UG}&poid=5284`, level: "bachelor" },
  { name: "Biology Education 6-12, B.S.", url: `${UG}&poid=4979`, level: "bachelor" },
  { name: "Biology, B.S.", url: `${UG}&poid=5013`, level: "bachelor" },
  { name: "Business Administration with a Concentration in Hospitality & Management Systems, B.S.", url: `${UG}&poid=5229`, level: "bachelor" },
  { name: "Business Administration with a Concentration in Management, B.S.", url: `${UG}&poid=5228`, level: "bachelor" },
  { name: "Business Administration with a Concentration in Marketing, B.S.", url: `${UG}&poid=5227`, level: "bachelor" },
  { name: "Business Administration, B.S.", url: `${UG}&poid=4970`, level: "bachelor" },
  { name: "Chemistry, B.S.", url: `${UG}&poid=5015`, level: "bachelor" },
  { name: "Chemistry, Biochemistry, B.S.", url: `${UG}&poid=5033`, level: "bachelor" },
  { name: "Communication Studies - Interdisciplinary, B.A.", url: `${UG}&poid=5282`, level: "bachelor" },
  { name: "Communication Studies - Theatre-Arts Performance, B.A.", url: `${UG}&poid=5235`, level: "bachelor" },
  { name: "Communication Studies -General, B.A.", url: `${UG}&poid=5281`, level: "bachelor" },
  { name: "Computer Engineering, B.S.", url: `${UG}&poid=5019`, level: "bachelor" },
  { name: "Computer Information Systems, B.S.", url: `${UG}&poid=5020`, level: "bachelor" },
  { name: "Computer Science, B.S.", url: `${UG}&poid=5017`, level: "bachelor" },
  { name: "Criminal Justice, B.S.", url: `${UG}&poid=4990`, level: "bachelor" },
  { name: "Cybersecurity, B.S.", url: `${UG}&poid=5288`, level: "bachelor" },
  { name: "Digital Marketing, B.S.", url: `${UG}&poid=5286`, level: "bachelor" },
  { name: "Elementary Education K-6/ESOL/Reading, B.S.", url: `${UG}&poid=4978`, level: "bachelor" },
  { name: "English Education 6 - 12/ESOL Endorsement, B.A.", url: `${UG}&poid=4981`, level: "bachelor" },
  { name: "English, B.A. - Africana Studies Concentration", url: `${UG}&poid=5226`, level: "bachelor" },
  { name: "English, B.A. - Professional Writing Concentration", url: `${UG}&poid=5225`, level: "bachelor" },
  { name: "English, B.A. - Texts and Technology", url: `${UG}&poid=5291`, level: "bachelor" },
  { name: "English, B.A. - Traditional Concentration", url: `${UG}&poid=4994`, level: "bachelor" },
  { name: "Esports and Gaming Administration, B.S.", url: `${UG}&poid=5285`, level: "bachelor" },
  { name: "Finance, B.S.", url: `${UG}&poid=4974`, level: "bachelor" },
  { name: "Gerontology, B.S.", url: `${UG}&poid=4985`, level: "bachelor" },
  { name: "Health & Exercise Science, B.S.", url: `${UG}&poid=5040`, level: "bachelor" },
  { name: "Healthcare Administration, B.S.", url: `${UG}&poid=5289`, level: "bachelor" },
  { name: "History, B.A. - Public History Concentration", url: `${UG}&poid=4996`, level: "bachelor" },
  { name: "Information Systems Management, B.S.", url: `${UG}&poid=4976`, level: "bachelor" },
  { name: "Integrated Environmental Science, B.S.", url: `${UG}&poid=5035`, level: "bachelor" },
  { name: "Interdisciplinary Studies, B.A. (Lifelong Learner)", url: `${UG}&poid=5046`, level: "bachelor" },
  { name: "Mass Communications-Digital Broadcast Production Concentration, B.A.", url: `${UG}&poid=5043`, level: "bachelor" },
  { name: "Mass Communications-Multimedia Journalism Concentration, B.A.", url: `${UG}&poid=5042`, level: "bachelor" },
  { name: "Mass Communications-Public Relations/Advertising Concentration, B.A.", url: `${UG}&poid=5041`, level: "bachelor" },
  { name: "Mathematics Education (Grades 5-9), B.S.", url: `${UG}&poid=5057`, level: "bachelor" },
  { name: "Mathematics, B.S.", url: `${UG}&poid=5022`, level: "bachelor" },
  { name: "Music Education K-12, B.A.", url: `${UG}&poid=4982`, level: "bachelor" },
  { name: "Music Recording Technology, B.A.", url: `${UG}&poid=5026`, level: "bachelor" },
  { name: "Music, B.A.", url: `${UG}&poid=5025`, level: "bachelor" },
  { name: "National Security & Global Affairs, B.A.", url: `${UG}&poid=5230`, level: "bachelor" },
  { name: "Nursing B.S.N.", url: `${UG}&poid=4987`, level: "bachelor" },
  { name: "Physical Education K-12, B.S.", url: `${UG}&poid=4983`, level: "bachelor" },
  { name: "Political Science, B.A.", url: `${UG}&poid=5000`, level: "bachelor" },
  { name: "Psychology, B.S.", url: `${UG}&poid=4988`, level: "bachelor" },
  { name: "Religion, B.A.", url: `${UG}&poid=5063`, level: "bachelor" },
  { name: "Sociology, B.A.", url: `${UG}&poid=5007`, level: "bachelor" },
  { name: "Supply Chain Management, B.S.", url: `${UG}&poid=5287`, level: "bachelor" },
  { name: "Theatre Arts Performance, B.A.", url: `${UG}&poid=5231`, level: "bachelor" },

  { name: "Master in Health Equity", url: `${GR}&poid=5256`, level: "graduate", credential: "MPH" },
  { name: "Master of Arts in Christian Ministry", url: `${GR}&poid=5260`, level: "graduate", credential: "MA" },
  { name: "Master of Athletic Training", url: `${GR}&poid=5259`, level: "graduate", credential: "Master's" },
  { name: "Master of Business Administration", url: `${GR}&poid=5262`, level: "graduate", credential: "MBA" },
  { name: "Master of Education Exceptional Student Education K-12", url: `${GR}&poid=5257`, level: "graduate", credential: "M.Ed." },
  { name: "Master of Science in Counseling", url: `${GR}&poid=5254`, level: "graduate", credential: "MS" },
  { name: "Master of Science in Criminal Justice Administration", url: `${GR}&poid=5258`, level: "graduate", credential: "MS" },
  { name: "Master of Science in Integrated Environmental Science", url: `${GR}&poid=5251`, level: "graduate", credential: "MS" },
  { name: "Master of Science in Organizational Leadership", url: `${GR}&poid=5253`, level: "graduate", credential: "MS" },
];

export const cookmanCatalog = createProgramCatalog(COOKMAN_PROGRAMS);
