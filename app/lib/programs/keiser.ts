// Keiser University degree catalog: program name -> official per-program
// page.
//
// HAND-VERIFIED, not scraped — no committed scraper exists for this school.
// HANDOFF.md had flagged Keiser's `*.smartcatalogiq.com` subdomain as
// reserved-but-empty (404/"Layout Not Found" on every path tried). The real
// catalog lives on Keiser's own site: keiseruniversity.edu/catalog/ links
// only PDF/text catalogs (the same PDF-only shape STU/FMU/Eckerd needed
// pdf-parse for), but the site's own top nav also links a
// "Program Directory" page (keiseruniversity.edu/program-directory/) that
// turned out to be the best source in this whole project — a single plain
// HTML page (no WAF, curl works) listing literally every program Keiser
// offers, grouped by degree level, each with its own real per-program link
// and its credential + CIP code already in the name (e.g. "Accounting,
// AA 52.0301").
//
// Keiser is genuinely different from every other private school in this
// batch: it's the one that actually grants Associate degrees as a normal,
// heavily-used credential (career/health programs especially), not a rare
// exception — so its catalog includes real `level: "associate"` entries
// too, unlike Barry/Lynn/Rollins/etc. It's still wired into
// `UNIVERSITY_PROGRAMS` / `universitySystemPrompt` like every other private
// school in this batch (matching HANDOFF's own "21 SACSCOC-accredited
// private schools" grouping), so a generated pathway still starts at the
// bachelor's — the associate entries exist for completeness and for any
// query that explicitly asks for one, not because the template routes
// students through them.
//
// Every program name below has its trailing CIP code (e.g. "52.0301")
// stripped — that's a classification code for institutional reporting, not
// part of the credential a student would ever type or a pathway would ever
// name.
//
// Excluded throughout:
// - Every Spanish-language program name (identified by "en Español" in the
//   source or by the program's own name being in Spanish — e.g.
//   "Administración de Empresas, AA", "Contabilidad, BA", "Psicología,
//   MS") — each is the exact same credential as an English-named sibling
//   already in this catalog (same CIP code, same level), just delivered in
//   Spanish for a different student cohort. This app only ever generates
//   English pathways, so keeping the Spanish name alongside its English
//   twin would be pure catalog bloat with no query that could ever match
//   it, not a "never invent" concern (nothing English-nameable is missing).
// - Graduate Certificates and the one undergraduate Certificate
//   ("Automotive Dealership Fundamentals") — the same "Minors and
//   Certificates" exclusion this whole private-university batch has made
//   from Saint Leo onward.
// - "Psychology, MS (Mandarin)" — unlike every other Mandarin-track entry
//   (which each have their own distinct page), this one links to the exact
//   same URL as the plain "Psychology, MS" entry, confirmed directly — not
//   a separately catalogued program, just a mislabeled duplicate link.
//
// NOT excluded despite looking redundant: Mandarin-delivery-mode variants
// with their own distinct page (Business Administration BA/MBA, Education-
// Leadership MSEd, Industrial & Organizational Psychology MS) are kept —
// each is a real, separately-linked catalog entry, the same "different
// delivery mode, not a duplicate" call made for FMU's online/on-campus
// pairs and JU's Online Master of Medical Sciences. The four "Nursing,
// BSN (...)" admission-track variants (Accelerated, FastTrack, RN to BSN,
// Traditional) are all real, separately-linked programs too, even though
// their parenthetical suffixes collapse to the same normalized match key —
// the same "same bucket, multiple real entries" shape already accepted
// elsewhere in this project when the underlying offerings are genuinely
// separate admission tracks toward one credential.
//
// Programs: 149 (39 associate, 53 bachelor's, 57 graduate)
//
// Keiser is a four-year university (like UM/Stetson/ERAU/UT/Barry/Lynn/
// Rollins/Flagler/PBA/FIT/Saint Leo/STU/Ave Maria/Bethune-Cookman/Eckerd/
// FMU/JU), so a generated pathway starts at the bachelor's rather than an
// associate degree.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

const SITE = "https://www.keiseruniversity.edu";

export const KEISER_PROGRAMS: SchoolProgram[] = [
  // Associate degrees
  { name: "Accounting, AA", url: `${SITE}/accounting-aa/`, level: "associate" },
  { name: "Applied Engineering, AS", url: `${SITE}/applied-engineering-as/`, level: "associate" },
  { name: "Artificial Intelligence, AS", url: `${SITE}/artificial-intelligence-as/`, level: "associate" },
  { name: "Baking and Pastry Arts, AS", url: `${SITE}/baking-pastry-arts/`, level: "associate" },
  { name: "Biotechnology, AS", url: `${SITE}/biotechnology-as/`, level: "associate" },
  { name: "Business Administration, AA", url: `${SITE}/business-administration-aa/`, level: "associate" },
  { name: "Business Analytics, AA", url: `${SITE}/business-analytics-aa/`, level: "associate" },
  { name: "Cinematic Arts, AA", url: `${SITE}/cinematic-arts-aa/`, level: "associate" },
  { name: "Cloud and Computing Technology, AS", url: `${SITE}/cloud-and-computing-technology-as/`, level: "associate" },
  { name: "Crime Scene Technology, AS", url: `${SITE}/crime-scene-technology-as/`, level: "associate" },
  { name: "Criminal Justice, AA", url: `${SITE}/criminal-justice-aa/`, level: "associate" },
  { name: "Criminal Justice, AS", url: `${SITE}/as-criminal-justice/`, level: "associate" },
  { name: "Culinary Arts, AS", url: `${SITE}/culinary-arts-as/`, level: "associate" },
  { name: "Diagnostic Medical Sonography (Ultrasound), AS", url: `${SITE}/diagnostic-medical-sonography-as/`, level: "associate" },
  { name: "Exercise and Sport Science, AS", url: `${SITE}/exercise-sport-science-as/`, level: "associate" },
  { name: "Fire Science, AS", url: `${SITE}/fire-science-as/`, level: "associate" },
  { name: "General Studies, AA", url: `${SITE}/general-studies-aa/`, level: "associate" },
  { name: "Golf Management, AS", url: `${SITE}/golf-management-as/`, level: "associate" },
  { name: "Graphic Arts and Design, AS", url: `${SITE}/graphic-arts-and-design-as/`, level: "associate" },
  { name: "Health Services Administration, AA", url: `${SITE}/health-services-administration-aa/`, level: "associate" },
  { name: "Histotechnology, AS", url: `${SITE}/histotechnology-as/`, level: "associate" },
  { name: "Homeland Security, AA", url: `${SITE}/homeland-security-aa/`, level: "associate" },
  { name: "Hospitality, AA", url: `${SITE}/associate-arts-hotel-resort-operations/`, level: "associate" },
  { name: "Information Technology, AS", url: `${SITE}/information-technology-as-it/`, level: "associate" },
  { name: "Medical Administrative Billing & Coding, AS", url: `${SITE}/medical-administrative-billing-coding/`, level: "associate" },
  { name: "Medical Assisting Science, AS", url: `${SITE}/medical-assisting-science-online/`, level: "associate" },
  { name: "Medical Assisting, AS", url: `${SITE}/medical-assisting-as/`, level: "associate" },
  { name: "Medical Laboratory Technician (MLT), AS", url: `${SITE}/medical-laboratory-technician-as/`, level: "associate" },
  { name: "Nuclear Medicine Technology (NMT), AS", url: `${SITE}/nuclear-medicine-technology-as/`, level: "associate" },
  { name: "Nursing, AS", url: `${SITE}/programs/nursing/associates/`, level: "associate" },
  { name: "Occupational Therapy Assistant (OTA), AS", url: `${SITE}/occupational-therapy-assistant-as/`, level: "associate" },
  { name: "Paralegal Studies, AA", url: `${SITE}/paralegal-studies-aa/`, level: "associate" },
  { name: "Physical Therapist Assistant (PTA), AS", url: `${SITE}/physical-therapist-assistant-as/`, level: "associate" },
  { name: "Radiation Therapy, AS", url: `${SITE}/radiation-therapy-as/`, level: "associate" },
  { name: "Radiologic Technology, AS", url: `${SITE}/radiologic-technology-as/`, level: "associate" },
  { name: "Respiratory Therapy, AS", url: `${SITE}/respiratory-therapy-as/`, level: "associate" },
  { name: "Surgical Technology, AS", url: `${SITE}/surgical-technology-as/`, level: "associate" },
  { name: "Turfgrass Management, AS", url: `${SITE}/turfgrass-management-as/`, level: "associate" },
  { name: "Video Game Design, AS", url: `${SITE}/video-game-design-as/`, level: "associate" },

  // Bachelor's degrees
  { name: "Accounting, BA", url: `${SITE}/accounting-ba/`, level: "bachelor" },
  { name: "Animation and Game Design, BS", url: `${SITE}/animation-game-design-bs/`, level: "bachelor" },
  { name: "Applied Construction Management, BS", url: `${SITE}/programs/engineering/bachelors-construction-management/`, level: "bachelor" },
  { name: "Applied Engineering, BS", url: `${SITE}/applied-engineering-bs/`, level: "bachelor" },
  { name: "Artificial Intelligence, BS", url: `${SITE}/artificial-intelligence-bs/`, level: "bachelor" },
  { name: "Biomedical Sciences (BMT, Pre-Med), BS", url: `${SITE}/biomedical-sciences-bs/`, level: "bachelor" },
  { name: "Biomedical Sciences (Equine Studies), BS", url: `${SITE}/biomedical-sciences-bs-equine-studies/`, level: "bachelor" },
  { name: "Biomedical Sciences (Pre-Physician Assistant), BS", url: `${SITE}/biomedical-sciences-bs-pre-pa/`, level: "bachelor" },
  { name: "Business Administration, BA", url: `${SITE}/business-administration-ba/`, level: "bachelor" },
  { name: "Business Administration, BA (Accelerated)", url: `${SITE}/business-administration-ba-accelerated/`, level: "bachelor" },
  { name: "Business Administration, BA (Mandarin)", url: `${SITE}/business-administration-ba-mandarin/`, level: "bachelor" },
  { name: "Business Analytics, BA", url: `${SITE}/bachelor-arts-degree-business-analytics/`, level: "bachelor" },
  { name: "Cinematic Arts, BA", url: `${SITE}/cinematic-arts-ba/`, level: "bachelor" },
  { name: "Civil Engineering, BS", url: `${SITE}/programs/engineering/bachelors-civil-engineering/`, level: "bachelor" },
  { name: "Cloud Engineering, BS", url: `${SITE}/cloud-engineering-bs/`, level: "bachelor" },
  { name: "Computer Information Systems, BS", url: `${SITE}/computer-information-systems-bs/`, level: "bachelor" },
  { name: "Criminal Justice (Forensics Concentration), BA", url: `${SITE}/criminal-justice-forensics-concentration-ba-track/`, level: "bachelor" },
  { name: "Criminal Justice, BA", url: `${SITE}/criminal-justice-ba/`, level: "bachelor" },
  { name: "Cybersecurity, BS", url: `${SITE}/cyber-security-bs/`, level: "bachelor" },
  { name: "Digital Forensics and Incident Response, BS", url: `${SITE}/digital-forensics-and-incident-response-bs/`, level: "bachelor" },
  { name: "Exercise and Sport Science, BS", url: `${SITE}/exercise-sport-science-bs/`, level: "bachelor" },
  { name: "Forensics Investigations (Investigations Concentration), BS", url: `${SITE}/forensic-investigations-bs/`, level: "bachelor" },
  { name: "Forensics Investigations (Science Concentration), BS", url: `${SITE}/forensic-investigations-science-concentration-bs/`, level: "bachelor" },
  { name: "Global Affairs and International Relations, BA", url: `${SITE}/global-affairs-and-international-relations-ba/`, level: "bachelor" },
  { name: "Golf Management, BS", url: `${SITE}/golf-management-bs/`, level: "bachelor" },
  { name: "Health Information Management, BS", url: `${SITE}/health-information-management-bs/`, level: "bachelor" },
  { name: "Health Science, BS", url: `${SITE}/health-science-bs/`, level: "bachelor" },
  { name: "Health Services Administration, BA", url: `${SITE}/health-services-administration-ba/`, level: "bachelor" },
  { name: "Homeland Security, BA", url: `${SITE}/homeland-security-ba/`, level: "bachelor" },
  { name: "Imaging Sciences, BS", url: `${SITE}/imaging-sciences-bs/`, level: "bachelor" },
  { name: "Information Systems, BS", url: `${SITE}/information-systems/`, level: "bachelor" },
  { name: "Information Technology, BS", url: `${SITE}/information-technology-bs/`, level: "bachelor" },
  { name: "Information Technology Management, BS", url: `${SITE}/information-technology-management-bs/`, level: "bachelor" },
  { name: "Integrated Marketing Communications, BS", url: `${SITE}/social-media-communications-bs/`, level: "bachelor" },
  { name: "Interdisciplinary Studies, BS", url: `${SITE}/interdisciplinary-studies-bs/`, level: "bachelor" },
  { name: "Interdisciplinary Studies (Military Science Concentration), BS", url: `${SITE}/interdisciplinary-studies-military-science-concentration-bs/`, level: "bachelor" },
  { name: "Interdisciplinary Studies, Pre-DPT Bridge, BS", url: `${SITE}/interdisciplinary-studies-pre-dpt-bridge-bs/`, level: "bachelor" },
  { name: "Law Enforcement Operations, BS", url: `${SITE}/law-enforcement-operations-bs/`, level: "bachelor" },
  { name: "Legal Studies, BA", url: `${SITE}/legal-studies-ba/`, level: "bachelor" },
  { name: "Management Information Systems, BS", url: `${SITE}/management-information-systems-bs/`, level: "bachelor" },
  { name: "Medical Laboratory Science, BS", url: `${SITE}/medical-laboratory-science-bs/`, level: "bachelor" },
  { name: "Network Systems and Data Communications, BS", url: `${SITE}/information-technology-bs/`, level: "bachelor" },
  { name: "Nursing, BSN (Accelerated)", url: `${SITE}/nursing-bs-accelerated/`, level: "bachelor" },
  { name: "Nursing, BSN (FastTrack)", url: `${SITE}/nursing-bsn-fasttrack/`, level: "bachelor" },
  { name: "Nursing, BSN (RN to BSN)", url: `${SITE}/nursing-bs/`, level: "bachelor" },
  { name: "Nursing, BSN (Traditional)", url: `${SITE}/nursing-bsn-traditional/`, level: "bachelor" },
  { name: "Political Science, BA", url: `${SITE}/political-science-ba/`, level: "bachelor" },
  { name: "Political Science (International Relations Concentration), BA", url: `${SITE}/poly-sci-int-rel/`, level: "bachelor" },
  { name: "Psychology, BA", url: `${SITE}/psychology-ba/`, level: "bachelor" },
  { name: "Public Administration, BA", url: `${SITE}/public-administration-ba/`, level: "bachelor" },
  { name: "Software Engineering, BS", url: `${SITE}/software-engineering-bs/`, level: "bachelor" },
  { name: "Sports Management (Leadership), BS", url: `${SITE}/sport-management-leadership-bs/`, level: "bachelor" },
  { name: "Sports Management, BS", url: `${SITE}/sport-management-bs/`, level: "bachelor" },

  // Master's degrees
  { name: "Accountancy, MAcc", url: `${SITE}/master-accountancy-macc/`, level: "graduate" },
  { name: "Accounting, MBA", url: `${SITE}/master-business-administration-mba-accounting/`, level: "graduate" },
  { name: "Applied Psychology, MS (Mandarin)", url: `${SITE}/master-of-science-in-applied-psychology-mandarin/`, level: "graduate" },
  { name: "Behavioral Health, MS", url: `${SITE}/behavioral-health-ms/`, level: "graduate" },
  { name: "Biomedical Sciences, MS", url: `${SITE}/biomedical-sciences-ms/`, level: "graduate" },
  { name: "Business Administration, MBA", url: `${SITE}/master-business-administration-mba/`, level: "graduate" },
  { name: "Business Administration (Accelerated Track), MBA", url: `${SITE}/business-administration-mba-accelerated/`, level: "graduate" },
  { name: "Business Administration, MBA (Mandarin)", url: `${SITE}/master-business-administration-mba-mandarin/`, level: "graduate" },
  { name: "Clinical Mental Health Counseling, MS", url: `${SITE}/clinical-mental-health-counseling/`, level: "graduate" },
  { name: "Clinical Nutrition, MS Coordinated Program", url: `${SITE}/clinical-nutrition-ms/`, level: "graduate" },
  { name: "Criminal Justice, MACJ", url: `${SITE}/master-of-arts-in-criminal-justice-macj/`, level: "graduate" },
  { name: "Criminal Justice, Interdisciplinary Studies, MACJ", url: `${SITE}/criminal-justice-macj-interdisciplinary-studies/`, level: "graduate" },
  { name: "Education-Leadership, MSEd L", url: `${SITE}/master-of-science-in-education-leadership-msed-l/`, level: "graduate" },
  { name: "Education-Leadership, MSEd L (Mandarin)", url: `${SITE}/education-leadership-msedl-mandarin/`, level: "graduate" },
  { name: "Education-Teaching and Learning, MSEd", url: `${SITE}/master-of-science-in-education-teaching-and-learning-msed-tl/`, level: "graduate" },
  { name: "Exercise and Sport Science, MS", url: `${SITE}/exercise-science-ms/`, level: "graduate" },
  { name: "Family Nurse Practitioner, MSN", url: `${SITE}/master-science-nursing-family-nurse-practitioner/`, level: "graduate" },
  { name: "Financial Technology, MS", url: `${SITE}/financial-technology-ms/`, level: "graduate" },
  { name: "Global MBA", url: `${SITE}/global-mba/`, level: "graduate" },
  { name: "Golf Teaching and Learning, MS", url: `${SITE}/golf-teaching-and-learning-ms/`, level: "graduate" },
  { name: "Health Care Leadership, MS", url: `${SITE}/programs/health-care/healthcare-leadership-masters/`, level: "graduate" },
  { name: "Health Services Administration, MBA", url: `${SITE}/master-business-administration-mba-health-services-administration/`, level: "graduate" },
  { name: "Homeland Security and Emergency Management, MA", url: `${SITE}/master-arts-criminal-justice-homeland-security-macjhs/`, level: "graduate" },
  { name: "Industrial and Organizational Psychology, MS", url: `${SITE}/master-science-organizational-psychology/`, level: "graduate" },
  { name: "Industrial and Organizational Psychology (Mandarin), MS", url: `${SITE}/ms-organizational-psychology-mandarin/`, level: "graduate" },
  { name: "Information Security, MS", url: `${SITE}/information-security-ms/`, level: "graduate" },
  { name: "Information Technology Leadership, MS", url: `${SITE}/information-technology-leadership-ms/`, level: "graduate" },
  { name: "Interdisciplinary Studies, MA", url: `${SITE}/interdisciplinary-studies-ma/`, level: "graduate" },
  { name: "Management, MBA", url: `${SITE}/mba-management/`, level: "graduate" },
  { name: "Management, MBA (Mandarin)", url: `${SITE}/master-business-administration-mba-management-mandarin/`, level: "graduate" },
  { name: "Marketing, MBA", url: `${SITE}/mba-marketing/`, level: "graduate" },
  { name: "Nursing, MSN", url: `${SITE}/master-of-science-in-nursing-msn/`, level: "graduate" },
  { name: "Nutrition Innovation Leadership, MS", url: `${SITE}/nutrition-innovative-leadership-ms/`, level: "graduate" },
  { name: "Occupational Therapy – Bridge Program, MS", url: `${SITE}/occupational-therapy-ms/`, level: "graduate" },
  { name: "Organizational Leadership, MSOL", url: `${SITE}/master-science-organizational-leadership-msol/`, level: "graduate" },
  { name: "Psychology, MS", url: `${SITE}/master-of-science-in-psychology-ms/`, level: "graduate" },
  { name: "Sport Management and Operations, MS", url: `${SITE}/sport-management-and-operations-ms/`, level: "graduate" },
  { name: "Technology Management, MBA", url: `${SITE}/technology-management-mba/`, level: "graduate" },
  { name: "Women's Health Nurse Practitioner, MSN", url: `${SITE}/womens-health-nurse-practitioner-msn/`, level: "graduate" },

  // Education Specialist degrees
  { name: "Educational Leadership, EdS", url: `${SITE}/education-specialist-in-educational-leadership-eds/`, level: "graduate" },
  { name: "Instructional Design and Technology, EdS", url: `${SITE}/educational-specialist-in-instructional-design-and-technology-eds/`, level: "graduate" },

  // Doctoral degrees
  { name: "Business Administration, DBA", url: `${SITE}/doctor-of-business-administration-dba/`, level: "graduate" },
  { name: "Chiropractic, DC", url: `${SITE}/doctor-chiropractic-dc/`, level: "graduate" },
  { name: "Criminal Justice and Criminology, PhD", url: `${SITE}/criminal-justice-and-criminology-phd/`, level: "graduate" },
  { name: "Curriculum and Instruction, PhD", url: `${SITE}/curriculum-instruction/`, level: "graduate" },
  { name: "Doctor of Criminal Justice, DCJ", url: `${SITE}/doctor-of-criminal-justice-dcj/`, level: "graduate" },
  { name: "Doctor of Education Curriculum Leadership, EdD", url: `${SITE}/education-curriculum-leadership-edd/`, level: "graduate" },
  { name: "Doctor of Education in Education Leadership, EdD", url: `${SITE}/education-leadership-edd/`, level: "graduate" },
  { name: "Doctor of Nurse Anesthesia Practice (Completion), DNAP", url: `${SITE}/nurse-anesthesia-practice-dnap/`, level: "graduate" },
  { name: "Doctor of Nurse Anesthesia Practice (Entry-Into-Practice), DNAP", url: `${SITE}/nurse-anesthesia-practice-dnap-entry-into-practice/`, level: "graduate" },
  { name: "Educational Leadership, PhD", url: `${SITE}/doctor-of-philosophy-in-educational-leadership-phd/`, level: "graduate" },
  { name: "Health Science, DHSc", url: `${SITE}/doctor-health-science-dhsc/`, level: "graduate" },
  { name: "Industrial and Organizational Psychology, PhD", url: `${SITE}/ph-d-in-industrial-and-organizational-psychology/`, level: "graduate" },
  { name: "Instructional Design and Technology, PhD", url: `${SITE}/doctor-of-philosophy-in-instructional-design-and-technology-phd/`, level: "graduate" },
  { name: "Nursing Practice, DNP", url: `${SITE}/doctor-nursing-practice/`, level: "graduate" },
  { name: "Psychology, PhD", url: `${SITE}/doctor-of-philosophy-in-psychology/`, level: "graduate" },
  { name: "Public Administration, DPA", url: `${SITE}/doctor-of-public-administration-dpa/`, level: "graduate" },
];

export const keiserCatalog = createProgramCatalog(KEISER_PROGRAMS);
