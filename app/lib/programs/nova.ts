// Nova Southeastern University degree catalog: program name -> official
// per-program page.
//
// HAND-VERIFIED, not scraped — no committed scraper exists for this school.
// HANDOFF.md had flagged `catalog.nova.edu` as a CourseLeaf placeholder
// ("A New Courseleaf Site Coming Soon!") — confirmed still true. The real
// source is a completely different page: nova.edu/degrees.html, a "Degree
// Finder" listing all 297 raw entries on one page (no WAF, curl works),
// each with a real per-program link and its credential already in the name
// (e.g. "Biology (B.S.)").
//
// NSU is the largest and most complex catalog in this whole project — a
// research university with 12 colleges including seven healthcare-related
// professional schools (Medicine, Osteopathic Medicine, Dental Medicine,
// Pharmacy, Optometry, Nursing, Law) — and its own Degree Finder has real
// data-quality problems that needed individual verification, not just
// pattern-matching:
// - Two internal CMS-training links ("Accounting (B.S.B.A.)" once pointed
//   to `nova.edu/prmc/secure/cms-training/...`, and a bare "Training
//   Program" entry pointed to the same place) — confirmed to be internal
//   documentation, not real academic pages, and excluded.
// - Five links under an `_archive` path segment: four "B.S. Secondary ___
//   Education" programs, confirmed 404 by visiting the actual URL (these
//   are discontinued programs no longer offered), and a second "MBA in
//   Finance" entry whose `_archive/accounting.html` page is real but titled
//   "M.B.A. in Accounting" — a stale/mislabeled duplicate of the correctly-
//   linked "MBA in Finance" entry that stays, excluded rather than
//   corrected.
// - A duplicate "MBA in Marketing" entry linking to
//   `sport-revenue-generation.html`, confirmed by visiting the page to
//   redirect to the generic Business Master's landing page rather than any
//   specific concentration — excluded as broken, keeping the correctly-
//   linked "MBA in Marketing" entry.
// - A "Ph.D. in Criminal Justice" entry linking to a generic Master's
//   landing page (`degrees/masters/index.html`) rather than any doctoral
//   page — excluded as a mislabeled duplicate of the already-correct
//   "Criminal Justice (Ph.D.)" entry.
//
// Excluded throughout, the same shapes established across this whole
// batch: all Minors (~67) and Certificates (~4); "3+1 Computing Pathway
// Programs" and "3+1 Pathway Programs" (accelerated-track hub pages, not
// standalone majors); every "Dual Admission" entry (~38) — a high-school-
// direct admission guarantee into a graduate/professional program that is
// ALREADY separately, standalone listed elsewhere in this same catalog,
// the same "redundant admission-pathway advising track" shape that
// excluded FMU's, JU's, Keiser's, and FSC's accelerated/dual-admission
// programs; and "Educational Leadership (B.S. to Ed.D.)," a redundant
// accelerated bridge built on the already-separately-listed standalone
// "Educational Leadership (Ed.D.)."
//
// NOT excluded despite looking similar at first glance: "Nursing (B.S.N. to
// D.N.P.)" and "Nursing (D.N.P. to Ph.D.)" are real bridge programs whose
// own pages are distinct from the standalone D.N.P./Ph.D. pages (the same
// "real bridge program, not a duplicate" shape JU's BSN-to-DNP tracks and
// Keiser's RN-to-BSN/RN-to-MSN entries needed); "Dental Science (M.D.S.)"
// is kept despite its URL living under a `/certificate/` path — its own
// page confirms the real terminal credential is a Master of Dental
// Science, the same "trust the real credential, not the URL segment" call
// JU's Dentistry Certificate/M.S. entries needed; and the two "Health
// Science (M.H.Sc./Ph.D. ...)" dual-degree entries are genuinely distinct
// pages (`health-science-dhs.html` vs `health-science-phd.html`), not a
// duplicate.
//
// Programs: 176 (48 bachelor's, 128 graduate)
//
// NSU is a four-year university (like UM/Stetson/ERAU/UT/Barry/Lynn/
// Rollins/Flagler/PBA/FIT/Saint Leo/STU/Ave Maria/Bethune-Cookman/Eckerd/
// FMU/JU/Keiser/FSC), so pathways start at the bachelor's rather than an
// associate degree.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const NOVA_PROGRAMS: SchoolProgram[] = [
  { name: "Accounting (B.S.B.A.)", url: "https://business.nova.edu/degrees/bachelors/accounting/index.html", level: "bachelor" },
  { name: "Accounting (M.Acc.)", url: "https://business.nova.edu/degrees/masters/accounting/index.html", level: "graduate" },
  { name: "Accounting Analytics (M.Acc.)", url: "https://business.nova.edu/degrees/masters/accounting/accounting-analytics.html", level: "graduate" },
  { name: "Adult-Gerontology Acute Care Nurse Practitioner", url: "https://nursing.nova.edu/degrees/masters/msn/aprn/adult-gerontology-acute-care-nurse-practitioner.html", level: "graduate" },
  { name: "Allopathic Medicine (M.D.)", url: "https://md.nova.edu/academics/index.html", level: "graduate" },
  { name: "Anesthesiologist Assistant (M.S.)", url: "https://md.nova.edu/degrees/masters/anesthesiologist-assistant/index.html", level: "graduate" },
  { name: "Applied Behavior Analysis (M.S.)", url: "https://education.nova.edu/degrees/masters/education/applied-behavior-analysis.html", level: "graduate" },
  { name: "Applied Professional Studies (B.S.)", url: "https://hcas.nova.edu/degrees/bachelors/applied-professional-studies/index.html", level: "bachelor" },
  { name: "Art + Design (B.A.)", url: "https://hcas.nova.edu/degrees/bachelors/art-design/index.html", level: "bachelor" },
  { name: "Artificial Intelligence (M.S.)", url: "https://computing.nova.edu/degrees/masters/artificial-intelligence.html", level: "graduate" },
  { name: "Artificial Intelligence Cybersecurity (M.S.)", url: "https://computing.nova.edu/degrees/masters/artificial-intelligence-cybersecurity.html", level: "graduate" },
  { name: "Biological Sciences (M.S.)", url: "https://hcas.nova.edu/degrees/masters/biological-sciences/index.html", level: "graduate" },
  { name: "Biology (B.S.)", url: "https://hcas.nova.edu/degrees/bachelors/biology/index.html", level: "bachelor" },
  { name: "Biomedical Sciences (M.B.S.)", url: "https://md.nova.edu/degrees/masters/biomedical-sciences/index.html", level: "graduate" },
  { name: "Biomedical Sciences (Ph.D.)", url: "https://md.nova.edu/degrees/doctoral/biomedical-sciences/phd/index.html", level: "graduate" },
  { name: "Business Administration (MBA)", url: "https://business.nova.edu/degrees/masters/business-administration-mba/index.html", level: "graduate" },
  { name: "Business Administration (MBA) - One Year", url: "https://business.nova.edu/degrees/masters/business-administration-mba/one-year-mba.html", level: "graduate" },
  { name: "Business Flex MBA", url: "https://business.nova.edu/degrees/masters/business-administration-mba/business-flex.html", level: "graduate" },
  { name: "Cardiovascular Sonography (B.S.)", url: "https://md.nova.edu/degrees/bachelors/cardiovascular-sonography/index.html", level: "bachelor" },
  { name: "Chemistry (B.S.)", url: "https://hcas.nova.edu/degrees/bachelors/chemistry/index.html", level: "bachelor" },
  { name: "Child Development (B.S.)", url: "https://education.nova.edu/degrees/bachelors/child-development/index.html", level: "bachelor" },
  { name: "Child Protection (M.H.S.)", url: "https://education.nova.edu/degrees/masters/human-services/child-protection.html", level: "graduate" },
  { name: "Clinical Psychology (Ph.D.)", url: "https://psychology.nova.edu/degrees/doctoral/clinical-psychology/phd/index.html", level: "graduate" },
  { name: "Clinical Psychology (Psy.D.)", url: "https://psychology.nova.edu/degrees/doctoral/clinical-psychology/psyd/index.html", level: "graduate" },
  { name: "Clinical Vision Research (M.S.)", url: "https://optometry.nova.edu/degrees/clinical-vision-research.html", level: "graduate" },
  { name: "Commercial Music (B.A.)", url: "https://hcas.nova.edu/degrees/bachelors/commercial-music/index.html", level: "bachelor" },
  { name: "Communication (B.A.)", url: "https://hcas.nova.edu/degrees/bachelors/communication/index.html", level: "bachelor" },
  { name: "Complex Health Systems MBA", url: "https://business.nova.edu/degrees/masters/business-administration-mba/management.html", level: "graduate" },
  { name: "Composition, Rhetoric, and Digital Media (M.A.)", url: "https://hcas.nova.edu/degrees/masters/composition-rhetoric-digital-media/index.html", level: "graduate" },
  { name: "Composition, Rhetoric, and Digital Media (Ph.D.)", url: "https://hcas.nova.edu/degrees/doctoral/composition-rhetoric-digital-media/index.html", level: "graduate" },
  { name: "Computer Science (B.S.)", url: "https://computing.nova.edu/degrees/bachelors/computer-science/index.html", level: "bachelor" },
  { name: "Computer Science (M.S.)", url: "https://computing.nova.edu/degrees/masters/computer-science.html", level: "graduate" },
  { name: "Computer Science (Ph.D.)", url: "https://computing.nova.edu/degrees/doctoral/computer-science.html", level: "graduate" },
  { name: "Computer Science Education (M.S.)", url: "https://computing.nova.edu/degrees/masters/computer-science-education.html", level: "graduate" },
  { name: "Conflict Analysis and Resolution (Ph.D.)", url: "https://hcas.nova.edu/degrees/doctoral/conflict-analysis/index.html", level: "graduate" },
  { name: "Counseling  (M.S.)", url: "https://psychology.nova.edu/degrees/masters/counseling/index.html", level: "graduate" },
  { name: "Couple and Family Therapy (M.S.)", url: "https://osteopathic.nova.edu/degrees/masters/couple-family-therapy/index.html", level: "graduate" },
  { name: "Couple and Family Therapy (Ph.D.)", url: "https://osteopathic.nova.edu/degrees/doctoral/couple-family-therapy/index.html", level: "graduate" },
  { name: "Criminal Justice (B.S.)", url: "https://education.nova.edu/degrees/bachelors/criminal-justice/index.html", level: "bachelor" },
  { name: "Criminal Justice (M.S.)", url: "https://education.nova.edu/degrees/masters/criminal-justice/index.html", level: "graduate" },
  { name: "Criminal Justice (Ph.D.)", url: "https://education.nova.edu/degrees/doctoral/criminal-justice/index.html", level: "graduate" },
  { name: "Curriculum, Instruction and Technology (M.S.)", url: "https://education.nova.edu/degrees/masters/education/curriculum-instruction-technology.html", level: "graduate" },
  { name: "Curriculum, Instruction Management, and Administration (Ed.S.)", url: "https://education.nova.edu/degrees/educational-specialist/curriculum-instruction.html", level: "graduate" },
  { name: "Curriculum, Instruction, and Technology (Ed.D.)", url: "https://education.nova.edu/degrees/doctoral/education/curriculum-instruction-technology.html", level: "graduate" },
  { name: "Cyber Defense (M.S.)", url: "https://computing.nova.edu/degrees/masters/cyber-defense.html", level: "graduate" },
  { name: "Cybersecurity Management (B.S.)", url: "https://computing.nova.edu/degrees/bachelors/cybersecurity-management/index.html", level: "bachelor" },
  { name: "Cybersecurity Management (M.S.)", url: "https://computing.nova.edu/degrees/masters/cybersecurity-management.html", level: "graduate" },
  { name: "Cybersecurity Management (Ph.D.)", url: "https://computing.nova.edu/degrees/doctoral/cybersecurity-management.html", level: "graduate" },
  { name: "Data Analytics and Artificial Intelligence (M.S.)", url: "https://computing.nova.edu/degrees/masters/data-analytics.html", level: "graduate" },
  { name: "Dental Medicine - International Program", url: "https://dental.nova.edu/degrees/international/index.html", level: "graduate" },
  { name: "Dental Medicine (D.M.D.)", url: "https://dental.nova.edu/degrees/dmd/index.html", level: "graduate" },
  { name: "Dental Medicine (MS)", url: "https://dental.nova.edu/degrees/postdoctoral-programs/master-science/index.html", level: "graduate" },
  { name: "Dental Science (M.D.S.)", url: "https://dental.nova.edu/degrees/certificate/index.html", level: "graduate" },
  { name: "Developmental Disabilities (M.S.)", url: "https://education.nova.edu/degrees/masters/developmental-disabilities/index.html", level: "graduate" },
  { name: "Digital Marketing (M.S.)", url: "https://business.nova.edu/degrees/masters/digital-marketing/index.html", level: "graduate" },
  { name: "Disaster and Emergency Management (M.S.)", url: "https://osteopathic.nova.edu/degrees/masters/disaster-emergency-management/index.html", level: "graduate" },
  { name: "Doctor of Audiology (Au.D.)", url: "https://osteopathic.nova.edu/degrees/doctoral/audiology/index.html", level: "graduate" },
  { name: "Doctor of Occupational Therapy (O.T.D.) - Blended Program", url: "https://osteopathic.nova.edu/degrees/doctoral/occupational-therapy/tampa/index.html", level: "graduate" },
  { name: "Education (B.S.)", url: "https://education.nova.edu/degrees/bachelors/education/index.html", level: "bachelor" },
  { name: "Education (Ed.D.)", url: "https://education.nova.edu/degrees/doctoral/education/index.html", level: "graduate" },
  { name: "Education (Ed.S.)", url: "https://education.nova.edu/degrees/educational-specialist/index.html", level: "graduate" },
  { name: "Education (M.S.)", url: "https://education.nova.edu/degrees/masters/education/index.html", level: "graduate" },
  { name: "Educational Leadership (Ed.D.)", url: "https://education.nova.edu/degrees/doctoral/education/educational-leadership.html", level: "graduate" },
  { name: "Educational Leadership (Ed.S.)", url: "https://education.nova.edu/degrees/educational-specialist/educational-leadership.html", level: "graduate" },
  { name: "Educational Leadership (M.S.)", url: "https://education.nova.edu/degrees/masters/leadership/educational-leadership.html", level: "graduate" },
  { name: "Elementary Education - ESOL/Reading (B.S.)", url: "https://education.nova.edu/degrees/bachelors/elementary-education/index.html", level: "bachelor" },
  { name: "Elementary Education (M.S.)", url: "https://education.nova.edu/degrees/masters/education/elementary-education.html", level: "graduate" },
  { name: "Engineering (B.S.)", url: "https://hcas.nova.edu/degrees/bachelors/engineering/index.html", level: "bachelor" },
  { name: "English (B.A.)", url: "https://hcas.nova.edu/degrees/bachelors/english/index.html", level: "bachelor" },
  { name: "Entrepreneurship (B.S.B.A.)", url: "https://business.nova.edu/degrees/bachelors/entrepreneurship/index.html", level: "bachelor" },
  { name: "Environmental Science (B.S.)", url: "https://hcas.nova.edu/degrees/bachelors/environmental-science/index.html", level: "bachelor" },
  { name: "Environmental Science (M.P.S.)", url: "https://hcas.nova.edu/degrees/masters/environmental-science/index.html", level: "graduate" },
  { name: "Exceptional Student Education - ESOL (B.S.)", url: "https://education.nova.edu/degrees/bachelors/exceptional-student-education/index.html", level: "bachelor" },
  { name: "Exceptional Student Education (M.S.)", url: "https://education.nova.edu/degrees/masters/education/exceptional-student-education.html", level: "graduate" },
  { name: "Exercise and Sport Science (B.S.)", url: "https://osteopathic.nova.edu/degrees/bachelors/exercise-sport-science/index.html", level: "bachelor" },
  { name: "Experimental Psychology (M.S.)", url: "https://psychology.nova.edu/degrees/masters/experimental-psychology/index.html", level: "graduate" },
  { name: "Family Nurse Practitioner (M.S.N.—A.P.R.N.)", url: "https://nursing.nova.edu/degrees/masters/msn/aprn/family-nurse-practitioner.html", level: "graduate" },
  { name: "Finance (B.S.B.A.)", url: "https://business.nova.edu/degrees/bachelors/finance/index.html", level: "bachelor" },
  { name: "Finance (M.S.)", url: "https://business.nova.edu/degrees/masters/finance/index.html", level: "graduate" },
  { name: "Forensic Psychology (M.S.)", url: "https://psychology.nova.edu/degrees/masters/forensic-psychology/index.html", level: "graduate" },
  { name: "Foundational and Integrated Medical Sciences (M.S.)", url: "https://osteopathic.nova.edu/degrees/masters/foundational-integrated-medical-sciences/index.html", level: "graduate" },
  { name: "General Psychology (M.S.)", url: "https://psychology.nova.edu/degrees/masters/general-psychology/index.html", level: "graduate" },
  { name: "Global Health (M.S.)", url: "https://md.nova.edu/degrees/masters/global-health/index.html", level: "graduate" },
  { name: "Health Informatics (B.S.)", url: "https://osteopathic.nova.edu/degrees/bachelors/health-informatics/index.html", level: "bachelor" },
  { name: "Health Informatics (M.S.)", url: "https://osteopathic.nova.edu/degrees/masters/health-informatics/index.html", level: "graduate" },
  { name: "Health Science (D.H.Sc.)", url: "https://md.nova.edu/degrees/doctoral/health-science/dhs/index.html", level: "graduate" },
  { name: "Health Science (M.H.Sc./Ph.D. - Dual Degree)", url: "https://md.nova.edu/degrees/dual/health-science-dhs.html", level: "graduate" },
  { name: "Health Science (M.H.Sc./Ph.D. in Dual Degree)", url: "https://md.nova.edu/degrees/dual/health-science-phd.html", level: "graduate" },
  { name: "Health Science (Ph.D.)", url: "https://md.nova.edu/degrees/doctoral/health-science/phd/index.html", level: "graduate" },
  { name: "Health Sciences (M.H.Sc.)", url: "https://md.nova.edu/degrees/masters/health-science/index.html", level: "graduate" },
  { name: "Healthcare Management (B.S.B.A.)", url: "https://business.nova.edu/degrees/bachelors/healthcare-management/index.html", level: "bachelor" },
  { name: "Higher Education Leadership (Ed.D.)", url: "https://education.nova.edu/degrees/doctoral/education/higher-education-leadership.html", level: "graduate" },
  { name: "Human Resource Management (M.S.)", url: "https://business.nova.edu/degrees/masters/human-resource-management/index.html", level: "graduate" },
  { name: "Human Services Administration (B.S.)", url: "https://education.nova.edu/degrees/bachelors/human-services-administration/index.html", level: "bachelor" },
  { name: "Information Systems (M.S.)", url: "https://computing.nova.edu/degrees/masters/information-systems.html", level: "graduate" },
  { name: "Information Systems (Ph.D.)", url: "https://computing.nova.edu/degrees/doctoral/information-systems.html", level: "graduate" },
  { name: "Information Technology (B.S.)", url: "https://computing.nova.edu/degrees/bachelors/information-technology/index.html", level: "bachelor" },
  { name: "Information Technology (M.S.)", url: "https://computing.nova.edu/degrees/masters/information-technology.html", level: "graduate" },
  { name: "Interdisciplinary Studies (B.S.)", url: "https://hcas.nova.edu/degrees/bachelors/interdisciplinary-studies/index.html", level: "bachelor" },
  { name: "International Studies (B.A.)", url: "https://hcas.nova.edu/degrees/bachelors/international-studies/index.html", level: "bachelor" },
  { name: "Law (B.S.)", url: "https://law.nova.edu/degrees/bachelors/law.html", level: "bachelor" },
  { name: "Law (J.D.)", url: "https://law.nova.edu/degrees/jd-program/index.html", level: "graduate" },
  { name: "Leadership (M.S.)", url: "https://education.nova.edu/degrees/masters/leadership/index.html", level: "graduate" },
  { name: "Legal Studies (Pre-Law) (B.S.)", url: "https://hcas.nova.edu/degrees/bachelors/legal-studies/index.html", level: "bachelor" },
  { name: "Management (B.S.B.A.)", url: "https://business.nova.edu/degrees/bachelors/management/index.html", level: "bachelor" },
  { name: "Marine Biology (B.S.)", url: "https://hcas.nova.edu/degrees/bachelors/marine-biology/index.html", level: "bachelor" },
  { name: "Marine Science (M.S.)", url: "https://hcas.nova.edu/degrees/masters/marine-science/index.html", level: "graduate" },
  { name: "Marketing (B.S.B.A.)", url: "https://business.nova.edu/degrees/bachelors/marketing/index.html", level: "bachelor" },
  { name: "Marriage and Family Therapy (D.M.F.T.)", url: "https://osteopathic.nova.edu/degrees/doctoral/marriage-family-therapy-dmft/index.html", level: "graduate" },
  { name: "Master of Legal Studies (MLS) in Education Law", url: "https://law.nova.edu/degrees/masters/education-law/index.html", level: "graduate" },
  { name: "Master of Legal Studies (MLS) in Employment Law", url: "https://law.nova.edu/degrees/masters/employment-law/index.html", level: "graduate" },
  { name: "Master of Legal Studies (MLS) in Health Law", url: "https://law.nova.edu/degrees/masters/health-law/index.html", level: "graduate" },
  { name: "Master of Legal Studies (MLS) in Law and Policy", url: "https://law.nova.edu/degrees/masters/law-and-policy/index.html", level: "graduate" },
  { name: "Mathematics (B.S.)", url: "https://hcas.nova.edu/degrees/bachelors/mathematics/index.html", level: "bachelor" },
  { name: "MBA in Business Intelligence", url: "https://business.nova.edu/degrees/masters/business-administration-mba/business-intelligence-analytics.html", level: "graduate" },
  { name: "MBA in Entrepreneurship", url: "https://business.nova.edu/degrees/masters/business-administration-mba/entrepreneurship/index.html", level: "graduate" },
  { name: "MBA in Finance", url: "https://business.nova.edu/degrees/masters/business-administration-mba/finance.html", level: "graduate" },
  { name: "MBA in Healthcare Management", url: "https://business.nova.edu/degrees/masters/business-administration-mba/healthcare-management/index.html", level: "graduate" },
  { name: "MBA in Human Resource Management", url: "https://business.nova.edu/degrees/masters/business-administration-mba/human-resource-management.html", level: "graduate" },
  { name: "MBA in Marketing", url: "https://business.nova.edu/degrees/masters/business-administration-mba/marketing.html", level: "graduate" },
  { name: "MBA in Supply Chain Management and Operational Systems", url: "https://business.nova.edu/degrees/masters/business-administration-mba/supply-chain-management.html", level: "graduate" },
  { name: "Medical Education (M.S.)", url: "https://osteopathic.nova.edu/degrees/masters/medical-education/index.html", level: "graduate" },
  { name: "Medical Humanities (B.A.)", url: "https://hcas.nova.edu/degrees/bachelors/medical-humanities/index.html", level: "bachelor" },
  { name: "Medical Sonography (B.S.)", url: "https://md.nova.edu/degrees/bachelors/medical-sonography/index.html", level: "bachelor" },
  { name: "Medicinal Chemistry (M.S.)", url: "https://hcas.nova.edu/degrees/masters/medicinal-chemistry/index.html", level: "graduate" },
  { name: "National Security Affairs and International Relations (M.S.)", url: "https://hcas.nova.edu/degrees/masters/national-security-affairs-international-relations/index.html", level: "graduate" },
  { name: "Neuroscience (B.S.)", url: "https://psychology.nova.edu/degrees/bachelors/behavioral-neuroscience/index.html", level: "bachelor" },
  { name: "Nursing (Accelerated B.S.)", url: "https://nursing.nova.edu/degrees/bachelors/nursing-accelerated.html", level: "bachelor" },
  { name: "Nursing (B.S.N. to D.N.P.)", url: "https://nursing.nova.edu/degrees/doctoral/bsn-to-dnp.html", level: "graduate" },
  { name: "Nursing (D.N.P. to Ph.D.)", url: "https://nursing.nova.edu/degrees/doctoral/dnp-phd.html", level: "graduate" },
  { name: "Nursing (D.N.P.)", url: "https://nursing.nova.edu/degrees/doctoral/dnp.html", level: "graduate" },
  { name: "Nursing (Entry B.S.)", url: "https://nursing.nova.edu/degrees/bachelors/nursing-entry.html", level: "bachelor" },
  { name: "Nursing (Ph.D.)", url: "https://nursing.nova.edu/degrees/doctoral/phd-nursing.html", level: "graduate" },
  { name: "Nutrition (B.S.)", url: "https://osteopathic.nova.edu/degrees/bachelors/nutrition/index.html", level: "bachelor" },
  { name: "Nutrition (M.S.)", url: "https://osteopathic.nova.edu/degrees/masters/nutrition/index.html", level: "graduate" },
  { name: "Occupational Therapy (Dr.OT)", url: "https://osteopathic.nova.edu/degrees/doctoral/occupational-therapy/drot/index.html", level: "graduate" },
  { name: "Occupational Therapy (Ph.D.)", url: "https://osteopathic.nova.edu/degrees/doctoral/occupational-therapy/phd/index.html", level: "graduate" },
  { name: "Oceanography/Marine Biology (Ph.D.)", url: "https://hcas.nova.edu/degrees/doctoral/oceanography-marine-biology/index.html", level: "graduate" },
  { name: "Optometry (O.D.)", url: "https://optometry.nova.edu/degrees/od.html", level: "graduate" },
  { name: "Organizational Leadership (Ed.D.)", url: "https://education.nova.edu/degrees/doctoral/education/organizational-leadership.html", level: "graduate" },
  { name: "Osteopathic Medicine (D.O.)", url: "https://osteopathic.nova.edu/degrees/doctoral/osteopathic-medicine-do/index.html", level: "graduate" },
  { name: "Pharmaceutical Affairs (M.S.)", url: "https://pharmacy.nova.edu/degrees/masters/pharmaceutical-affairs.html", level: "graduate" },
  { name: "Pharmaceutical Sciences (M.S.)", url: "https://pharmacy.nova.edu/degrees/masters/pharmaceutical-sciences.html", level: "graduate" },
  { name: "Pharmaceutical Sciences (Ph.D.)", url: "https://pharmacy.nova.edu/degrees/doctoral/pharmaceutical-sciences.html", level: "graduate" },
  { name: "Pharmacy (Pharm.D.) - Advanced Standing", url: "https://pharmacy.nova.edu/degrees/doctoral/pharmd-advanced-standing.html", level: "graduate" },
  { name: "Pharmacy (Pharm.D.) - Entry-Level Program", url: "https://pharmacy.nova.edu/degrees/doctoral/pharmd-entry-level.html", level: "graduate" },
  { name: "Physical Therapy (D.P.T.)", url: "https://osteopathic.nova.edu/degrees/doctoral/physical-therapy/index.html", level: "graduate" },
  { name: "Physical Therapy (D.P.T.) - Hybrid Program", url: "https://osteopathic.nova.edu/degrees/doctoral/physical-therapy/tampa/index.html", level: "graduate" },
  { name: "Physical Therapy (Ph.D.)", url: "https://osteopathic.nova.edu/degrees/doctoral/physical-therapy/phd/index.html", level: "graduate" },
  { name: "Physician Assistant (M.M.S.)", url: "https://md.nova.edu/degrees/masters/physician-assistant/index.html", level: "graduate" },
  { name: "Political Science (B.A.)", url: "https://hcas.nova.edu/degrees/bachelors/political-science/index.html", level: "bachelor" },
  { name: "Process Improvement MBA", url: "https://business.nova.edu/degrees/masters/business-administration-mba/process-improvement.html", level: "graduate" },
  { name: "Psychiatric-Mental Health Nurse Practitioner (M.S.N.—A.P.R.N.)", url: "https://nursing.nova.edu/degrees/masters/msn/aprn/psychiatric-mental-health-nurse-practitioner.html", level: "graduate" },
  { name: "Psychology (B.S.)", url: "https://psychology.nova.edu/degrees/bachelors/psychology/index.html", level: "bachelor" },
  { name: "Public Accounting (M.Acc.)", url: "https://business.nova.edu/degrees/masters/accounting/public-accounting.html", level: "graduate" },
  { name: "Public Administration (D.P.A.)", url: "https://business.nova.edu/degrees/doctoral/public-administration/index.html", level: "graduate" },
  { name: "Public Administration (MPA)", url: "https://business.nova.edu/degrees/masters/public-administration/index.html", level: "graduate" },
  { name: "Public Health (B.S.)", url: "https://osteopathic.nova.edu/degrees/bachelors/public-health/index.html", level: "bachelor" },
  { name: "Public Health (M.P.H.)", url: "https://osteopathic.nova.edu/degrees/masters/public-health-mph/index.html", level: "graduate" },
  { name: "Reading Education (M.S.)", url: "https://education.nova.edu/degrees/masters/education/reading-education.html", level: "graduate" },
  { name: "Real Estate Development (M.S.)", url: "https://business.nova.edu/degrees/masters/real-estate-development/index.html", level: "graduate" },
  { name: "Real Estate Management (B.S.)", url: "https://business.nova.edu/degrees/bachelors/real-estate-management/index.html", level: "bachelor" },
  { name: "Respiratory Therapy First-Professional (B.S.R.T.)", url: "https://md.nova.edu/degrees/bachelors/respiratory-therapy-first-professional/index.html", level: "bachelor" },
  { name: "Respiratory Therapy Post-Professional (B.S.R.T.)", url: "https://md.nova.edu/degrees/bachelors/respiratory-therapy-post-professional/index.html", level: "bachelor" },
  { name: "School Psychology (Psy.D.)", url: "https://psychology.nova.edu/degrees/doctoral/school-psychology/psyd/index.html", level: "graduate" },
  { name: "School Psychology (Psy.S.)", url: "https://psychology.nova.edu/degrees/specialist/school-psychology/index.html", level: "graduate" },
  { name: "Special Education (Ed.D.)", url: "https://education.nova.edu/degrees/doctoral/education/special-education.html", level: "graduate" },
  { name: "Speech-Language and Communication Disorders (B.S.)", url: "https://osteopathic.nova.edu/degrees/bachelors/speech-language/index.html", level: "bachelor" },
  { name: "Speech-Language Pathology (M.S.)", url: "https://osteopathic.nova.edu/degrees/masters/speech-language-pathology/index.html", level: "graduate" },
  { name: "Speech-Language Pathology (SLP.D.)", url: "https://osteopathic.nova.edu/degrees/doctoral/speech-language-pathology/index.html", level: "graduate" },
  { name: "Sport and Recreation Management (B.S.B.A.)", url: "https://business.nova.edu/degrees/bachelors/sport-recreation-management/index.html", level: "bachelor" },
  { name: "Sports Science (M.S.)", url: "https://osteopathic.nova.edu/degrees/masters/sports-science/index.html", level: "graduate" },
  { name: "Tax (M.Acc.)", url: "https://business.nova.edu/degrees/masters/accounting/taxation-accounting.html", level: "graduate" },
  { name: "Teaching English To Speakers Of Other Languages (M.S.)", url: "https://education.nova.edu/degrees/masters/education/tesol.html", level: "graduate" },
  { name: "Technology Management (M.S.)", url: "https://computing.nova.edu/degrees/masters/technology-management.html", level: "graduate" },
  { name: "Theatre (B.A.)", url: "https://hcas.nova.edu/degrees/bachelors/theatre/index.html", level: "bachelor" },
];

export const novaCatalog = createProgramCatalog(NOVA_PROGRAMS);
