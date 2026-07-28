// St. Thomas University degree catalog: program name -> official catalog page.
//
// HAND-VERIFIED, not scraped — no committed scraper exists for this school,
// and this is a genuinely different shape than every other school in this
// project. St. Thomas has NO HTML catalog at all — stu.edu/academics/
// course-catalogs/ links straight to two PDFs (undergraduate, graduate), a
// dead end HANDOFF.md flagged as needing "a different extraction approach
// (PDF text extraction) than every other school so far" (§13). This is the
// first school in the whole project built that way.
//
// Source PDFs (no WAF, plain WordPress-hosted, curl works fine):
//   Undergraduate: https://www.stu.edu/wp-content/uploads/2025/09/Final-UG-Catalog-2025-2026-09-02-25.pdf (313 pages)
//   Graduate:      https://www.stu.edu/wp-content/uploads/2025/08/Final-GR-Catalog-2025-2026-08-27-25.pdf (256 pages)
// Text was extracted locally with the `pdf-parse` npm package (installed in
// a scratch directory, never added to this project's package.json — see
// HANDOFF.md rule "don't add a dependency for something small"). Every
// program below was found via its own real section heading in the extracted
// text (e.g. "BACHELOR OF ARTS (BA) IN ENGLISH", "MASTER OF ACCOUNTING
// (MAC)"), cross-checked against the PDF's own table of contents, which
// states the same page number for every entry checked (one single
// exception, noted below).
//
// URLs point at the PDF's own page via the standard #page=N fragment
// (honored by Chrome/Firefox/Safari/Edge's native PDF viewers and Adobe
// Reader) rather than a single shared link to page 1 — confirmed accurate
// by cross-referencing pdf-parse's own page array against the "-- N of TOTAL
// --" separators it inserts between extracted pages, which line up exactly
// with the PDF's own printed page numbers with zero offset.
//
// Excluded throughout: Minors, Certificates (including the standalone
// "Center for Professional and Continuing Studies" certificate-only
// section), and generic add-on "Specialization in X" tracks with no
// independent credential that any business major can pair with (Business
// Management, Economics, Finance, International Business, Marketing
// Management, Sports Administration) — these are advising add-ons, not
// standalone majors, confirmed by reading their own pages (no admission
// requirements, no independent credential, just an elective course list).
// Also excluded: three joint JD/graduate-degree programs (Joint JD/MA in
// Criminology, Joint JD/MBA in Sports Administration, Joint JD/MS in Sports
// Administration) — each requires separate admission to the STU School of
// Law, a professional program with its own catalog this project doesn't
// cover, the same "the other half of this combined program lives in a
// catalog we don't have" reasoning that kept a bare JD out of every other
// school's catalog in this project.
//
// Two real judgment calls, not straight transcription:
// - The undergraduate "Doctor of Education (Ed.D.) in Leadership" section
//   names three specialization tracks (Administration, Digital Instruction &
//   Distance, Sports Administration) in the table of contents, but unlike
//   the Ethical Leadership PhD/MA (which has three fully separate section
//   headings, each with its own program page) these three are described
//   entirely within ONE section under one heading — kept as a single
//   catalog entry rather than three, since inventing three separate program
//   pages the source itself doesn't have would be worse than one accurate
//   one. Same call for the MBA's ~13 TOC-listed "specializations" — one
//   MBA section, one catalog entry.
// - "Master of Accounting (MAC)" is the one page-number mismatch against the
//   TOC (which says 104; the page markers say 106) — the TOC's own stated
//   range for this section ("GUS MACHADO COLLEGE OF BUSINESS ... 105-130")
//   already contradicts its own "104" for MAC, confirming this is a TOC typo
//   in the source document, not a computation error; used the page-marker-
//   derived value.
//
// Programs: 73 (39 bachelor, 34 graduate)
//
// St. Thomas is a four-year university (like UM/Stetson/ERAU/UT/Barry/Lynn/
// Rollins/Flagler/PBA/FIT/Saint Leo), so pathways start at the bachelor's
// rather than an associate degree.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

const UG_PDF = "https://www.stu.edu/wp-content/uploads/2025/09/Final-UG-Catalog-2025-2026-09-02-25.pdf";
const GR_PDF = "https://www.stu.edu/wp-content/uploads/2025/08/Final-GR-Catalog-2025-2026-08-27-25.pdf";

export const STU_PROGRAMS: SchoolProgram[] = [
  { name: "Bachelor of Arts (BA) in English", url: `${UG_PDF}#page=85`, level: "bachelor", area: "Biscayne College" },
  { name: "Bachelor of Arts (BA) in Ethical Leadership", url: `${UG_PDF}#page=87`, level: "bachelor", area: "Biscayne College" },
  { name: "Bachelor of Arts (BA) in Criminal Justice", url: `${UG_PDF}#page=91`, level: "bachelor", area: "Biscayne College" },
  { name: "Bachelor of Arts (BA) in Political Science", url: `${UG_PDF}#page=92`, level: "bachelor", area: "Biscayne College" },
  { name: "BA-JD in Political Science", url: `${UG_PDF}#page=98`, level: "bachelor", area: "Biscayne College" },
  { name: "BA-JD in Criminal Justice", url: `${UG_PDF}#page=100`, level: "bachelor", area: "Biscayne College" },
  { name: "BA-JD in English", url: `${UG_PDF}#page=102`, level: "bachelor", area: "Biscayne College" },
  { name: "BA-JD in Psychology", url: `${UG_PDF}#page=103`, level: "bachelor", area: "Biscayne College" },
  { name: "Bachelor of Arts (BA) in Psychology", url: `${UG_PDF}#page=105`, level: "bachelor", area: "Biscayne College" },
  { name: "Bachelor of Arts (BA) in Psychology with Specialization in Health", url: `${UG_PDF}#page=107`, level: "bachelor", area: "Biscayne College" },
  { name: "Bachelor of Arts (BA) in Communication & Media Studies", url: `${UG_PDF}#page=110`, level: "bachelor", area: "Biscayne College" },
  { name: "Bachelor of Arts (BA) in Elementary Education", url: `${UG_PDF}#page=115`, level: "bachelor", area: "Biscayne College" },
  { name: "Bachelor of Arts (BA) in Catholic Education", url: `${UG_PDF}#page=118`, level: "bachelor", area: "Biscayne College" },
  { name: "Bachelor of Arts (BA) in Organizational Leadership", url: `${UG_PDF}#page=119`, level: "bachelor", area: "Biscayne College" },
  { name: "Bachelor of Arts (BA) in Theology", url: `${UG_PDF}#page=126`, level: "bachelor", area: "Biscayne College" },
  { name: "Bachelor of Business Administration (BBA) in Accounting", url: `${UG_PDF}#page=130`, level: "bachelor", area: "Gus Machado College of Business" },
  { name: "Bachelor of Business Administration (BBA) in Finance", url: `${UG_PDF}#page=132`, level: "bachelor", area: "Gus Machado College of Business" },
  { name: "Bachelor of Business Administration (BBA) in International Business", url: `${UG_PDF}#page=133`, level: "bachelor", area: "Gus Machado College of Business" },
  { name: "Bachelor of Business Administration (BBA) in Management", url: `${UG_PDF}#page=135`, level: "bachelor", area: "Gus Machado College of Business" },
  { name: "Bachelor of Business Administration (BBA) in Sports Administration", url: `${UG_PDF}#page=138`, level: "bachelor", area: "Gus Machado College of Business" },
  { name: "Bachelor of Science (BS) in Culinary Arts, Tourism & Hospitality Management: Specialization in Culinary Arts", url: `${UG_PDF}#page=140`, level: "bachelor", area: "Gus Machado College of Business" },
  { name: "Bachelor of Science (BS) in Culinary Arts, Tourism & Hospitality Management: Specialization in Tourism & Hospitality Management", url: `${UG_PDF}#page=141`, level: "bachelor", area: "Gus Machado College of Business" },
  { name: "Bachelor of Arts (BA) in Business: Business Studies Specialization", url: `${UG_PDF}#page=145`, level: "bachelor", area: "Gus Machado College of Business" },
  { name: "Bachelor of Arts (BA) in Business: General Business Specialization", url: `${UG_PDF}#page=147`, level: "bachelor", area: "Gus Machado College of Business" },
  { name: "Bachelor of Arts (BA) in Fashion Merchandising and Design: Specialization in Fashion Merchandising", url: `${UG_PDF}#page=149`, level: "bachelor", area: "Gus Machado College of Business" },
  { name: "Bachelor of Arts (BA) in Fashion Merchandising and Design: Specialization in Fashion Design", url: `${UG_PDF}#page=153`, level: "bachelor", area: "Gus Machado College of Business" },
  { name: "Bachelor of Arts (BA) in Sports Administration", url: `${UG_PDF}#page=158`, level: "bachelor", area: "Gus Machado College of Business" },
  { name: "Bachelor of Science (BS) in Biology", url: `${UG_PDF}#page=167`, level: "bachelor", area: "College of Health Sciences and Technology" },
  { name: "Bachelor of Science (BS) in Chemistry (Pre-Pharmacy)", url: `${UG_PDF}#page=170`, level: "bachelor", area: "College of Health Sciences and Technology" },
  { name: "Bachelor of Science (BS) in Computer Science", url: `${UG_PDF}#page=174`, level: "bachelor", area: "College of Health Sciences and Technology" },
  { name: "Bachelor of Science (BS) in Applied Mathematics and Data Science", url: `${UG_PDF}#page=177`, level: "bachelor", area: "College of Health Sciences and Technology" },
  { name: "Bachelor of Arts (BA) in Natural Sciences", url: `${UG_PDF}#page=180`, level: "bachelor", area: "College of Health Sciences and Technology" },
  { name: "Bachelor of Science (BS) in Health Sciences: Pre-Professional", url: `${UG_PDF}#page=182`, level: "bachelor", area: "College of Health Sciences and Technology" },
  { name: "Bachelor of Science (BS) in Health Sciences: Allied Health & Sports Medicine", url: `${UG_PDF}#page=184`, level: "bachelor", area: "College of Health Sciences and Technology" },
  { name: "Bachelor of Science (BS) in Health Sciences: Exercise Science & Human Performance", url: `${UG_PDF}#page=186`, level: "bachelor", area: "College of Health Sciences and Technology" },
  { name: "Bachelor of Science (BS) in Applied Mathematics and Data Sciences: Engineering Pathway (STU and UND Dual Degree)", url: `${UG_PDF}#page=188`, level: "bachelor", area: "College of Health Sciences and Technology" },
  { name: "Bachelor of Arts (BA) in Natural Sciences: Nursing Pathway", url: `${UG_PDF}#page=192`, level: "bachelor", area: "College of Nursing" },
  { name: "Bachelor of Science (BS) in Nursing", url: `${UG_PDF}#page=194`, level: "bachelor", area: "College of Nursing" },
  { name: "Nursing (RN to BSN)", url: `${UG_PDF}#page=198`, level: "bachelor", area: "College of Nursing" },

  { name: "Master of Arts (MA) in Criminology", url: `${GR_PDF}#page=54`, level: "graduate", area: "Biscayne College" },
  { name: "Joint BA/MA Expedited Degree in Criminology", url: `${GR_PDF}#page=56`, level: "graduate", area: "Biscayne College" },
  { name: "Master of Science (MS) in Elementary Education", url: `${GR_PDF}#page=62`, level: "graduate", area: "Biscayne College" },
  { name: "Master of Science in Reading", url: `${GR_PDF}#page=64`, level: "graduate", area: "Biscayne College" },
  { name: "Master of Science (MS) in Instructional Design & Technology", url: `${GR_PDF}#page=67`, level: "graduate", area: "Biscayne College" },
  { name: "Master of Science (MS) in Educational Leadership", url: `${GR_PDF}#page=69`, level: "graduate", area: "Biscayne College" },
  { name: "Master of Arts (MA) in Ethical Leadership", url: `${GR_PDF}#page=71`, level: "graduate", area: "Biscayne College" },
  { name: "Master of Arts (MA) in Ethical Leadership, Specialization in Higher Education", url: `${GR_PDF}#page=73`, level: "graduate", area: "Biscayne College" },
  { name: "Master of Arts (MA) in Ethical Leadership, Specialization in Sports Administration", url: `${GR_PDF}#page=74`, level: "graduate", area: "Biscayne College" },
  { name: "Doctor of Philosophy (PhD) in Ethical Leadership", url: `${GR_PDF}#page=76`, level: "graduate", area: "Biscayne College" },
  { name: "Doctor of Philosophy (PhD) in Ethical Leadership, Specialization in Higher Education", url: `${GR_PDF}#page=79`, level: "graduate", area: "Biscayne College" },
  { name: "Doctor of Philosophy (PhD) in Ethical Leadership, Criminal Justice Specialization", url: `${GR_PDF}#page=83`, level: "graduate", area: "Biscayne College" },
  { name: "Doctor of Education (Ed.D.) in Leadership", url: `${GR_PDF}#page=87`, level: "graduate", area: "Biscayne College" },
  { name: "Educational Specialist (Ed.S.) in Administration", url: `${GR_PDF}#page=94`, level: "graduate", area: "Biscayne College" },
  { name: "Master of Arts in Theology", url: `${GR_PDF}#page=98`, level: "graduate", area: "Biscayne College" },
  { name: "Master of Accounting (MAC)", url: `${GR_PDF}#page=106`, level: "graduate", area: "Gus Machado College of Business" },
  { name: "Master of Accounting - Public Accounting Specialization", url: `${GR_PDF}#page=108`, level: "graduate", area: "Gus Machado College of Business" },
  { name: "Master of Business Administration (MBA)", url: `${GR_PDF}#page=110`, level: "graduate", area: "Gus Machado College of Business" },
  { name: "Master of International Business (MIB)", url: `${GR_PDF}#page=116`, level: "graduate", area: "Gus Machado College of Business" },
  { name: "Master of Science (MS) in Sports Administration", url: `${GR_PDF}#page=119`, level: "graduate", area: "Gus Machado College of Business" },
  { name: "Doctor of Business Administration (DBA) in Management", url: `${GR_PDF}#page=125`, level: "graduate", area: "Gus Machado College of Business" },
  { name: "Doctor of Business Administration (DBA) in Cyber Security Management", url: `${GR_PDF}#page=127`, level: "graduate", area: "Gus Machado College of Business" },
  { name: "Doctor of Business Administration (DBA) in Sports Administration", url: `${GR_PDF}#page=129`, level: "graduate", area: "Gus Machado College of Business" },
  { name: "Master of Science (MS) in Biology for STEM Educators", url: `${GR_PDF}#page=132`, level: "graduate", area: "College of Health Sciences and Technology" },
  { name: "Master of Science (MS) in Data Science", url: `${GR_PDF}#page=134`, level: "graduate", area: "College of Health Sciences and Technology" },
  { name: "Master of Science in Cyber Security & Analytics (MSCSA)", url: `${GR_PDF}#page=136`, level: "graduate", area: "College of Health Sciences and Technology" },
  { name: "Master of Science in Applied Kinesiology", url: `${GR_PDF}#page=138`, level: "graduate", area: "College of Health Sciences and Technology" },
  { name: "Master of Science in Nursing (MSN): Family Nurse Practitioner", url: `${GR_PDF}#page=142`, level: "graduate", area: "College of Nursing" },
  { name: "Master of Science in Nursing (MSN): Accelerated MSN Program", url: `${GR_PDF}#page=144`, level: "graduate", area: "College of Nursing" },
  { name: "Master of Science in Nursing (MSN): Adult-Gerontology Nurse Practitioner", url: `${GR_PDF}#page=146`, level: "graduate", area: "College of Nursing" },
  { name: "Master of Science in Nursing Informatics", url: `${GR_PDF}#page=152`, level: "graduate", area: "College of Nursing" },
  { name: "Master of Science in Nursing (MSN): Psychiatric Mental Health Nurse Practitioner", url: `${GR_PDF}#page=160`, level: "graduate", area: "College of Nursing" },
  { name: "Bachelor of Science in Nursing to Doctor of Nursing Practice (BSN-DNP Program)", url: `${GR_PDF}#page=167`, level: "graduate", area: "College of Nursing" },
  { name: "Doctor in Nursing Practice (DNP)", url: `${GR_PDF}#page=170`, level: "graduate", area: "College of Nursing" },
];

// St. Thomas is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const stuCatalog = createProgramCatalog(STU_PROGRAMS, { preferred: "bachelor" });
