// Palm Beach Atlantic University degree catalog: program name -> official
// program page.
//
// HAND-VERIFIED, not scraped — no committed scraper exists for this school.
// catalog.pba.edu is Acalog behind AWS WAF Bot Control: both fetch() and
// curl are blocked on content.php AND preview_program.php (HTTP 202 with
// x-amzn-waf-action: challenge), the same platform and symptom as FAMU,
// FlPoly, USF, Rollins, and Flagler (see HANDOFF.md §13). index.php loads
// fine either way. Per the Rollins/Flagler technique, a real browser doing
// top-level navigation gets through where curl/fetch cannot; this file was
// built the same way (2026-07-28).
//
// PBA has its own built-in Acalog "Programs of Study" widget, the same
// shape Barry's and Flagler's catalogs used, split by tab into two catalogs:
//   catoid=55  Undergraduate Catalog 2026-2027 — content.php?catoid=55&navoid=4427
//   catoid=56  Graduate and Pharmacy Catalog 2026-2027 — content.php?catoid=56&navoid=4535
// Both list every Program entity grouped by degree type (Bachelor of Arts,
// Bachelor of Science, Master of Divinity, Doctor of Pharmacy, ...) with the
// credential already stated in the program's own title — no separate
// `credential` field needed anywhere in this file, the same "name already
// carries the code" shape pathwayPrompts.ts documents for FIU.
//
// Excluded: Minors, Certificates, and a "Discontinued Programs" group Acalog
// itself labels as such (this school's own site does the discontinued-vs-
// live split for us, rather than requiring a program-by-program check).
// "Business Administration, B.A." was excluded too — its own page states
// "The Bachelor of Arts, Business Administration major may only be taken as
// a student's second major," so it cannot be a pathway's first (and only)
// bachelor's step; "Business Administration, B.S." remains as the real,
// standalone way to study the subject.
//
// Three entries needed a genuine judgment call, not a straight scrape:
// "Master of Accountancy 3+2" and "Master of Business Administration 3+2"
// each appear as TWO separate real Program entities — one filed under the
// undergraduate catalog's "Bachelor of Science" heading, one filed under
// the graduate catalog's own degree-type heading — describing the same 3+2
// combined-degree pipeline from each audience's side. Kept only the
// graduate-catalog copy for each (matching how GRADUATE_HINT's bare
// "master" token reads the name anyway); the undergraduate-side duplicates
// were dropped rather than adding two same-named, same-level, different-URL
// entries that createProgramCatalog's find() could only resolve arbitrarily.
// "Business Data Analytics 3+2" is the same shape but its OWN description
// says its output is "an opportunity to earn a bachelor's degree in
// business," so the undergraduate-side copy was kept (its graduate-side
// duplicate, filed under "Master of Science," was dropped instead) — the
// standalone graduate destination for this pipeline is the separately
// listed "Master of Science in Business Data Analytics."
//
// Two graduate-catalog entries — "Master of Arts, Christian Studies (MACS)"
// and "Master of Divinity (M.Div.)" — are the base/unconcentrated version of
// each degree and link to a content.php overview page rather than a
// preview_program.php Program entity; each one's own page confirms the base
// degree is real and independently pursuable ("an opportunity to
// concentrate," not a requirement to), the same "real link, just not a
// Program-entity one" shape as ERAU's/NCF's/FAU's shared-link entries. Their
// own named concentrations and dual-degrees (e.g. "Master of Divinity,
// Concentration in Missiology") are separate, real Program entities with
// their own preview_program.php pages and are listed individually.
//
// Programs: 136 (91 bachelor, 45 graduate)
//
// PBA is a four-year university (like UM/Stetson/ERAU/UT/Barry/Lynn/
// Rollins/Flagler), so pathways start at the bachelor's rather than an
// associate degree.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const PBA_PROGRAMS: SchoolProgram[] = [
  { name: "Apologetics, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10701", level: "bachelor" },
  { name: "Art Education, Grades K-12, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10493", level: "bachelor" },
  { name: "Biblical Studies, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10659", level: "bachelor" },
  { name: "Biblical Studies: Concentration in Biblical Languages, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10656", level: "bachelor" },
  { name: "Cinema Arts, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10458", level: "bachelor" },
  { name: "Christian Community Development, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10700", level: "bachelor" },
  { name: "Christian Studies, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10684", level: "bachelor" },
  { name: "Communication, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10457", level: "bachelor" },
  { name: "Communication Studies, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10725", level: "bachelor" },
  { name: "Dance, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10664", level: "bachelor" },
  { name: "English, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10416", level: "bachelor" },
  { name: "English: Concentration in Professional Writing and Editing, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10715", level: "bachelor" },
  { name: "English and Secondary Education, Grades 6-12 with ESOL, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10417", level: "bachelor" },
  { name: "Gaming & Interactive Media Design, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10640", level: "bachelor" },
  { name: "Graphic Arts, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10492", level: "bachelor" },
  { name: "History, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10418", level: "bachelor" },
  { name: "Intercultural Studies, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10482", level: "bachelor" },
  { name: "Intercultural Studies: Concentration in Christian Community Development, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10662", level: "bachelor" },
  { name: "Journalism, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10459", level: "bachelor" },
  { name: "Ministry, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10688", level: "bachelor" },
  { name: "Ministry: Concentration in Pastoral Ministries, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10690", level: "bachelor" },
  { name: "Ministry: Concentration in Preaching and Teaching, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10691", level: "bachelor" },
  { name: "Ministry Leadership Studies, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10484", level: "bachelor" },
  { name: "Ministry Leadership Studies: Concentration in Pastoral Ministries, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10486", level: "bachelor" },
  { name: "Music, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10496", level: "bachelor" },
  { name: "Philosophy, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10420", level: "bachelor" },
  { name: "Philosophy, Politics, and Economics, B.A", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10599", level: "bachelor" },
  { name: "Politics, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10412", level: "bachelor" },
  { name: "Popular Music Industry, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10497", level: "bachelor" },
  { name: "Pre-Law, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10419", level: "bachelor" },
  { name: "Public Relations, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10555", level: "bachelor" },
  { name: "Sports Broadcasting, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10610", level: "bachelor" },
  { name: "Studio Art, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10491", level: "bachelor" },
  { name: "Theological Studies, B.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10720", level: "bachelor" },
  { name: "Cinema Arts, B.F.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10670", level: "bachelor" },
  { name: "Dance, B.F.A", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10666", level: "bachelor" },
  { name: "Graphic Design, B.F.A.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10652", level: "bachelor" },
  { name: "Instrument Performance, B.Mus.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10498", level: "bachelor" },
  { name: "Keyboard Performance, B.Mus.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10499", level: "bachelor" },
  { name: "Music Education, Grades K-12, B.Mus.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10501", level: "bachelor" },
  { name: "Music in Worship Leadership, B.Mus.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10647", level: "bachelor" },
  { name: "Voice Performance, B.Mus.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10502", level: "bachelor" },
  { name: "Accounting, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10450", level: "bachelor" },
  { name: "Applied Physiology and Kinesiology, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10474", level: "bachelor" },
  { name: "Applied Physiology and Kinesiology: Concentration in Pre-Athletic Training, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10626", level: "bachelor" },
  { name: "Applied Physiology and Kinesiology: Concentration in Pre-Occupational Therapy, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10619", level: "bachelor" },
  { name: "Applied Physiology and Kinesiology: Concentration in Pre-Physical Therapy, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10616", level: "bachelor" },
  { name: "Applied Sport Performance: Concentration in Coaching/Teaching, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10622", level: "bachelor" },
  { name: "Applied Sport Performance: Concentration in Strength and Conditioning, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10624", level: "bachelor" },
  { name: "Behavioral Neuroscience, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10601", level: "bachelor" },
  { name: "Biology, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10421", level: "bachelor" },
  { name: "Biology: Concentration in Botany, Environmental Science, and Field Biology, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10423", level: "bachelor" },
  { name: "Biology: Concentration in Graduate School Preparation, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10424", level: "bachelor" },
  { name: "Biology: Concentration in Marine Biology, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10425", level: "bachelor" },
  { name: "Biology: Concentration in Molecular Biology and Biotechnology, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10426", level: "bachelor" },
  { name: "Biology: Concentration in Pre-Health Professional Preparation, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10428", level: "bachelor" },
  { name: "Biology: Concentration in Pre-Vet, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10654", level: "bachelor" },
  { name: "Biology: Concentration in Zoology, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10427", level: "bachelor" },
  { name: "Business Administration, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10682", level: "bachelor" },
  { name: "Business Data Analytics 3+2", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10710", level: "bachelor" },
  { name: "Business Economics, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10707", level: "bachelor" },
  { name: "Business & Law, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10745", level: "bachelor" },
  { name: "Chemistry, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10677", level: "bachelor" },
  { name: "Chemistry: Concentration in Physics, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10678", level: "bachelor" },
  { name: "Community Psychology, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10692", level: "bachelor" },
  { name: "Computer Science, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10435", level: "bachelor" },
  { name: "Elementary Education K-6/ESOL/Reading, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10469", level: "bachelor" },
  { name: "Engineering: Concentration in Computer Engineering, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10726", level: "bachelor" },
  { name: "Engineering: Concentration in Electrical Engineering, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10727", level: "bachelor" },
  { name: "Engineering: Concentration in Engineering Physics, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10728", level: "bachelor" },
  { name: "Engineering: Concentration in General Engineering, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10729", level: "bachelor" },
  { name: "Entrepreneurship & Franchising, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10744", level: "bachelor" },
  { name: "Finance, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10451", level: "bachelor" },
  { name: "Forensic Science, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10431", level: "bachelor" },
  { name: "International Business, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10452", level: "bachelor" },
  { name: "Leadership and Organizational Behavior, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10693", level: "bachelor" },
  { name: "Management, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10453", level: "bachelor" },
  { name: "Marine Science with a Concentration in Biology, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10746", level: "bachelor" },
  { name: "Marine Science with a Concentration in Chemistry, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10747", level: "bachelor" },
  { name: "Marine Science with a Concentration in Physics, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10748", level: "bachelor" },
  { name: "Marketing, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10454", level: "bachelor" },
  { name: "Mathematical Economics, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10708", level: "bachelor" },
  { name: "Mathematics, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10433", level: "bachelor" },
  { name: "Mathematics: Concentration in Physics, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10674", level: "bachelor" },
  { name: "Mathematics/Secondary Education, Grades 6-12, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10434", level: "bachelor" },
  { name: "Medicinal and Biological Chemistry, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10432", level: "bachelor" },
  { name: "Medicinal and Biological Chemistry with a Biological Concentration, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10414", level: "bachelor" },
  { name: "Medicinal and Biological Chemistry with a Pharmaceutical Concentration, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10430", level: "bachelor" },
  { name: "Psychology, B.S.", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10478", level: "bachelor" },
  { name: "Baccalaureate of Science in Nursing (BSN)", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10508", level: "bachelor" },
  { name: "Bachelor of General Studies", url: "https://catalog.pba.edu/preview_program.php?catoid=55&poid=10569", level: "bachelor" },

  { name: "Master of Accountancy", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=10956", level: "graduate" },
  { name: "Master of Accountancy 3+2", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11027", level: "graduate" },
  { name: "Master of Accountancy and Analytics", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11047", level: "graduate" },
  { name: "Master of Arts, Christian Studies (MACS)", url: "https://catalog.pba.edu/content.php?catoid=56&navoid=4545", level: "graduate" },
  { name: "Master of Arts, Christian Studies + Master of Science, Clinical Mental Health Counseling Dual Degrees (MACS + MSCMHC)", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11022", level: "graduate" },
  { name: "Master of Arts, Community Transformation and Chaplaincy", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11038", level: "graduate" },
  { name: "Master of Arts, Intercultural Studies (MAIS)", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=10991", level: "graduate" },
  { name: "Master of Arts, Philosophy of Religion (MAPR)", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=10999", level: "graduate" },
  { name: "Master of Business Administration", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=10931", level: "graduate" },
  { name: "Master of Business Administration 3+2", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11025", level: "graduate" },
  { name: "Master of Business Administration in Business Analytics", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11048", level: "graduate" },
  { name: "Master of Divinity (M.Div.)", url: "https://catalog.pba.edu/content.php?catoid=56&navoid=4546", level: "graduate" },
  { name: "Master of Divinity + Master of Business Administration Dual Degree (M.Div. + MBA)", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=10954", level: "graduate" },
  { name: "Master of Divinity + Master of Arts, Intercultural Studies Dual Degree (M.Div + MAIS)", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11005", level: "graduate" },
  { name: "Master of Divinity + Master of Arts, Philosophy of Religion Dual Degree (M.Div + MAPR)", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11007", level: "graduate" },
  { name: "Master of Divinity + Master of Science, Clinical Mental Health Counseling Dual Degree (MDiv+MSCMHC)", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11020", level: "graduate" },
  { name: "Master of Divinity, Concentration in Bible Translation", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11009", level: "graduate" },
  { name: "Master of Divinity, Concentration in Black Church Studies", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11029", level: "graduate" },
  { name: "Master of Divinity, Concentration in Community Transformation and Chaplaincy", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11030", level: "graduate" },
  { name: "Maestría en Divinidad, Concentración en Estudios de la Iglesia Latina", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11050", level: "graduate" },
  { name: "Master of Divinity, Concentration in Missiology", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=10992", level: "graduate" },
  { name: "Master of Divinity, Concentration in Philosophy of Religion", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11011", level: "graduate" },
  { name: "Master of Medical Science in PA Medicine", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11044", level: "graduate" },
  { name: "Master of Science in Clinical Mental Health Counseling", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=10923", level: "graduate" },
  { name: "Crisis and Trauma Counseling Concentration", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=10980", level: "graduate" },
  { name: "Marriage and Family Therapy Studies (MFTS) Concentration", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=10994", level: "graduate" },
  { name: "Master of Science in Business Data Analytics", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11061", level: "graduate" },
  { name: "Master of Science in Computer Science", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=10995", level: "graduate" },
  { name: "Master of Science in Educational Leadership", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=10988", level: "graduate" },
  { name: "Master of Science in Ethics & Organizational Behavior", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11043", level: "graduate" },
  { name: "Master of Science in Health Science", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11000", level: "graduate" },
  { name: "Master of Science in Nursing - Adult Gerontology Primary Care Nurse Practitioner (AGPCNP) Track", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11053", level: "graduate" },
  { name: "Master of Science in Nursing - Family Nurse Practitioner Track", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11051", level: "graduate" },
  { name: "Master of Science in Nursing - Health Systems Leadership", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=10952", level: "graduate" },
  { name: "Master of Science in Nursing - Psychiatric Mental Health Nurse Practitioner Track", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11052", level: "graduate" },
  { name: "BSN-DNP Executive Leadership (DNP-EXL Track)", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=10961", level: "graduate" },
  { name: "BSN to DNP Family Nurse Practitioner (DNP-FNP Track)", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=10947", level: "graduate" },
  { name: "BSN to DNP Psychiatric Mental Health Nurse Practitioner (DNP-PMHNP Track)", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=10968", level: "graduate" },
  { name: "DNP Executive Nurse Leader", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11056", level: "graduate" },
  { name: "Post-Master's DNP Family Nurse Practitioner", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11057", level: "graduate" },
  { name: "Post-Master's DNP Psychiatric Mental Health Nurse Practitioner", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11058", level: "graduate" },
  { name: "Doctor of Pharmacy", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=10929", level: "graduate" },
  { name: "Doctor of Pharmacy - Concentration in Medical Spanish", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11031", level: "graduate" },
  { name: "Doctor of Pharmacy/Masters of Business Administration Dual Degree", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=10930", level: "graduate" },
  { name: "Ph.D. in Practical Theology", url: "https://catalog.pba.edu/preview_program.php?catoid=56&poid=11017", level: "graduate" },
];

// PBA is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const pbaCatalog = createProgramCatalog(PBA_PROGRAMS, { preferred: "bachelor" });
