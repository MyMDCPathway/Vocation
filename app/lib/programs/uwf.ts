// UWF degree catalog: program name -> official program page.
//
// GENERATED FILE — do not edit by hand. Regenerate with:
//   npm run scrape:uwf
//
// Source:     https://catalog.uwf.edu/undergraduate/azindex/
//             https://catalog.uwf.edu/graduate/azindex/
// Scraped:    2026-07-26
// Programs:   92 (53 bachelor, 39 graduate)
//
// UWF is a four-year university (like FIU/UCF/UF/FGCU), so pathways start at
// the bachelor's rather than an associate degree. Every entry's own
// credential (e.g. "B.S.B.A.", "M.Acc.") comes straight from UWF's A-Z
// directory pages, which list real degree programs as "Name, CREDENTIAL" —
// policy and topic entries on the same pages never have that suffix and are
// excluded.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const UWF_PROGRAMS: SchoolProgram[] = [
  { name: "Accountancy", url: "https://catalog.uwf.edu/graduate/accounting/", level: "graduate", credential: "M.Acc." },
  { name: "Accounting", url: "https://catalog.uwf.edu/undergraduate/accounting/", level: "bachelor", credential: "B.S.B.A." },
  { name: "Administration", url: "https://catalog.uwf.edu/graduate/administration/", level: "graduate", credential: "M.S.A." },
  { name: "Anthropology", url: "https://catalog.uwf.edu/undergraduate/anthropology/", level: "bachelor", credential: "B.A." },
  { name: "Anthropology", url: "https://catalog.uwf.edu/graduate/anthropology/", level: "graduate", credential: "M.A." },
  { name: "Art", url: "https://catalog.uwf.edu/undergraduate/art/", level: "bachelor", credential: "B.A." },
  { name: "Athletic Training", url: "https://catalog.uwf.edu/graduate/athletictraining/", level: "graduate", credential: "M.S." },
  { name: "Behavior Analysis", url: "https://catalog.uwf.edu/graduate/behavioranalysis/", level: "graduate", credential: "M.S." },
  { name: "Biology", url: "https://catalog.uwf.edu/undergraduate/biology/", level: "bachelor", credential: "B.S." },
  { name: "Biology", url: "https://catalog.uwf.edu/graduate/biology/", level: "graduate", credential: "M.S." },
  { name: "Biomedical Sciences", url: "https://catalog.uwf.edu/undergraduate/biomedicalsciences/", level: "bachelor", credential: "B.S." },
  { name: "Business Administration", url: "https://catalog.uwf.edu/graduate/business/", level: "graduate", credential: "M.B.A." },
  { name: "Business Economics", url: "https://catalog.uwf.edu/undergraduate/economicsbusiness/", level: "bachelor", credential: "B.S.B.A." },
  { name: "Chemistry", url: "https://catalog.uwf.edu/undergraduate/chemistrybachelorofscience/", level: "bachelor", credential: "B.S." },
  { name: "Civil Engineering", url: "https://catalog.uwf.edu/undergraduate/civilengineering/", level: "bachelor", credential: "B.S." },
  { name: "Clinical Laboratory Sciences", url: "https://catalog.uwf.edu/undergraduate/clinicallaboratorysciences/", level: "bachelor", credential: "B.S." },
  { name: "College Student Affairs Administration", url: "https://catalog.uwf.edu/graduate/collegestudentpersonneladministration/", level: "graduate", credential: "M.Ed." },
  { name: "Communication", url: "https://catalog.uwf.edu/undergraduate/communication/", level: "bachelor", credential: "B.A." },
  { name: "Computer Science", url: "https://catalog.uwf.edu/undergraduate/computerscience/", level: "bachelor", credential: "B.S." },
  { name: "Computer Science", url: "https://catalog.uwf.edu/graduate/computerscience/", level: "graduate", credential: "M.S." },
  { name: "Construction Management", url: "https://catalog.uwf.edu/undergraduate/constructionmanagement/", level: "bachelor", credential: "B.S." },
  { name: "Criminal Justice", url: "https://catalog.uwf.edu/undergraduate/criminaljustice/", level: "bachelor", credential: "B.A." },
  { name: "Criminal Justice", url: "https://catalog.uwf.edu/graduate/criminaljustice/", level: "graduate", credential: "M.S." },
  { name: "Curriculum and Instruction", url: "https://catalog.uwf.edu/graduate/edd/", level: "graduate", credential: "Ed.D." },
  { name: "Curriculum and Instruction", url: "https://catalog.uwf.edu/graduate/curriculumandinstruction/", level: "graduate", credential: "M.Ed." },
  { name: "Cybersecurity", url: "https://catalog.uwf.edu/undergraduate/cybersecurity/", level: "bachelor", credential: "B.S." },
  { name: "Cybersecurity", url: "https://catalog.uwf.edu/graduate/cybersecurity/", level: "graduate", credential: "M.S." },
  { name: "Data Science", url: "https://catalog.uwf.edu/graduate/datascience/", level: "graduate", credential: "M.S." },
  { name: "Education, Exceptional Student", url: "https://catalog.uwf.edu/graduate/exceptionalstudenteducation/", level: "graduate", credential: "M.A." },
  { name: "Educational Leadership Certification", url: "https://catalog.uwf.edu/graduate/educationalleadership/", level: "graduate", credential: "M.Ed." },
  { name: "Engineering", url: "https://catalog.uwf.edu/graduate/engineering/", level: "graduate", credential: "M.S." },
  { name: "Engineering Technology", url: "https://catalog.uwf.edu/undergraduate/engineeringtechnology/", level: "bachelor", credential: "B.S." },
  { name: "English", url: "https://catalog.uwf.edu/undergraduate/english/", level: "bachelor", credential: "B.A." },
  { name: "English", url: "https://catalog.uwf.edu/graduate/english/", level: "graduate", credential: "M.A." },
  { name: "Entry-Level Respiratory Therapy", url: "https://catalog.uwf.edu/undergraduate/respiratorytherapy/", level: "bachelor", credential: "B.S." },
  { name: "Environmental Science", url: "https://catalog.uwf.edu/graduate/environmentalscience/", level: "graduate", credential: "M.S." },
  { name: "Executive Business Administration: Leadership Practice and Purpose", url: "https://catalog.uwf.edu/graduate/executivemba/", level: "graduate", credential: "M.B.A." },
  { name: "Exercise Science", url: "https://catalog.uwf.edu/undergraduate/exercisescience/", level: "bachelor", credential: "B.S." },
  { name: "Family Nurse Practitioner", url: "https://catalog.uwf.edu/graduate/familynurse/", level: "graduate", credential: "M.S.N." },
  { name: "Finance", url: "https://catalog.uwf.edu/undergraduate/finance/", level: "bachelor", credential: "B.S.B.A." },
  { name: "Fine Art", url: "https://catalog.uwf.edu/undergraduate/finearts/", level: "bachelor", credential: "B.F.A." },
  { name: "General Business", url: "https://catalog.uwf.edu/undergraduate/businessgeneral/", level: "bachelor", credential: "B.S.B.A." },
  { name: "General Studies", url: "https://catalog.uwf.edu/undergraduate/bachelorgeneralstudies/", level: "bachelor", credential: "B.G.S." },
  { name: "Geographic Information Science (GIS) Administration", url: "https://catalog.uwf.edu/graduate/geographic/", level: "graduate", credential: "M.S." },
  { name: "Global Hospitality and Tourism: Julian & Kim MacQueen Guest Experience Management", url: "https://catalog.uwf.edu/undergraduate/globalhospitalityandtourismmanagement/", level: "bachelor", credential: "B.S." },
  { name: "Graphic Design and Digital Media", url: "https://catalog.uwf.edu/undergraduate/graphicdesign-digitalmedia/", level: "bachelor", credential: "B.F.A." },
  { name: "Health Promotion and Wellness", url: "https://catalog.uwf.edu/graduate/healthpromotion/", level: "graduate", credential: "M.S." },
  { name: "Health Sciences", url: "https://catalog.uwf.edu/undergraduate/healthsciences/", level: "bachelor", credential: "B.S." },
  { name: "Healthcare Administration", url: "https://catalog.uwf.edu/graduate/healthcareadministration/", level: "graduate", credential: "M.H.A." },
  { name: "History", url: "https://catalog.uwf.edu/undergraduate/history/", level: "bachelor", credential: "B.A." },
  { name: "History", url: "https://catalog.uwf.edu/graduate/history/", level: "graduate", credential: "M.A." },
  { name: "Human Resource Management", url: "https://catalog.uwf.edu/undergraduate/humanresourcemanagement/", level: "bachelor", credential: "B.S.B.A." },
  { name: "Humanities, Interdisciplinary", url: "https://catalog.uwf.edu/undergraduate/humanitiesinterdisciplinary/", level: "bachelor", credential: "B.A." },
  { name: "Information Technology", url: "https://catalog.uwf.edu/undergraduate/informationtechnologyinterdisciplinary/", level: "bachelor", credential: "B.S." },
  { name: "Information Technology", url: "https://catalog.uwf.edu/graduate/informationtechnology/", level: "graduate", credential: "M.S." },
  { name: "Instructional and Performance Technology", url: "https://catalog.uwf.edu/graduate/instructionaldesignandtechnology/", level: "graduate", credential: "Ed.D." },
  { name: "Instructional Design and Performance Technology", url: "https://catalog.uwf.edu/graduate/instructionaltechnology/", level: "graduate", credential: "M.Ed." },
  { name: "Instructional Design and Technology", url: "https://catalog.uwf.edu/undergraduate/instructionaldesign/", level: "bachelor", credential: "B.S." },
  { name: "Intelligent Systems & Robotics", url: "https://catalog.uwf.edu/graduate/phd/", level: "graduate", credential: "Ph.D." },
  { name: "Interdisciplinary Social Sciences", url: "https://catalog.uwf.edu/undergraduate/socialsciencesinterdisciplinary/", level: "bachelor", credential: "B.A." },
  { name: "International Affairs", url: "https://catalog.uwf.edu/graduate/internationalaffairs/", level: "graduate", credential: "M.A." },
  { name: "International Studies", url: "https://catalog.uwf.edu/undergraduate/internationalstudies/", level: "bachelor", credential: "B.A." },
  { name: "Legal Studies Pre-Law", url: "https://catalog.uwf.edu/undergraduate/legalstudies/", level: "bachelor", credential: "B.A." },
  { name: "Management", url: "https://catalog.uwf.edu/undergraduate/management/", level: "bachelor", credential: "B.S.B.A." },
  { name: "Management Information Systems", url: "https://catalog.uwf.edu/undergraduate/managementinformationsystems/", level: "bachelor", credential: "B.S.B.A." },
  { name: "Marine Biology", url: "https://catalog.uwf.edu/undergraduate/marinebiology/", level: "bachelor", credential: "B.S." },
  { name: "Maritime Studies", url: "https://catalog.uwf.edu/undergraduate/maritimestudies/", level: "bachelor", credential: "B.A." },
  { name: "Marketing", url: "https://catalog.uwf.edu/undergraduate/marketing/", level: "bachelor", credential: "B.S.B.A." },
  { name: "Mathematical Sciences", url: "https://catalog.uwf.edu/graduate/mathematics/", level: "graduate", credential: "M.S." },
  { name: "Mechanical Engineering", url: "https://catalog.uwf.edu/undergraduate/mechanicalengineering/", level: "bachelor", credential: "B.S.M.E." },
  { name: "Movement Sciences and Health", url: "https://catalog.uwf.edu/graduate/healthleisureandexercisescience/", level: "graduate", credential: "M.S." },
  { name: "Music Education", url: "https://catalog.uwf.edu/undergraduate/musiceducation/", level: "bachelor", credential: "B.M.E." },
  { name: "Nursing", url: "https://catalog.uwf.edu/undergraduate/nursingbsn/", level: "bachelor", credential: "B.S.N." },
  { name: "Nursing", url: "https://catalog.uwf.edu/graduate/nursing/", level: "graduate", credential: "M.S.N." },
  { name: "Philosophy", url: "https://catalog.uwf.edu/undergraduate/philosophy/", level: "bachelor", credential: "B.A." },
  { name: "Political Science", url: "https://catalog.uwf.edu/undergraduate/politicalscience/", level: "bachelor", credential: "B.A." },
  { name: "Political Science", url: "https://catalog.uwf.edu/graduate/politicalscience/", level: "graduate", credential: "M.A." },
  { name: "Psychology", url: "https://catalog.uwf.edu/undergraduate/psychologyba/", level: "bachelor", credential: "B.A." },
  { name: "Psychology", url: "https://catalog.uwf.edu/undergraduate/psychology/", level: "bachelor", credential: "B.S." },
  { name: "Psychology", url: "https://catalog.uwf.edu/graduate/psychology/", level: "graduate", credential: "M.A." },
  { name: "Public Health", url: "https://catalog.uwf.edu/undergraduate/publichealth/", level: "bachelor", credential: "B.S." },
  { name: "Public Health", url: "https://catalog.uwf.edu/graduate/publichealth/", level: "graduate", credential: "M.P.H." },
  { name: "Reading Education", url: "https://catalog.uwf.edu/graduate/reading/", level: "graduate", credential: "M.Ed." },
  { name: "Social Work", url: "https://catalog.uwf.edu/undergraduate/socialwork/", level: "bachelor", credential: "B.S.W." },
  { name: "Social Work", url: "https://catalog.uwf.edu/graduate/socialwork/", level: "graduate", credential: "M.S.W." },
  { name: "Software Development", url: "https://catalog.uwf.edu/undergraduate/softwaredesign/", level: "bachelor", credential: "B.S." },
  { name: "Sport Management", url: "https://catalog.uwf.edu/undergraduate/sportmanagement/", level: "bachelor", credential: "B.S." },
  { name: "Sports Coaching and Physical Education", url: "https://catalog.uwf.edu/undergraduate/healthleisureandexercisescience/", level: "bachelor", credential: "B.S." },
  { name: "Strategic Communication and Leadership", url: "https://catalog.uwf.edu/graduate/communication/", level: "graduate", credential: "M.A." },
  { name: "Supply Chain Logistics Management", url: "https://catalog.uwf.edu/undergraduate/supplychainlogistics/", level: "bachelor", credential: "B.S.B.A." },
  { name: "Theatre", url: "https://catalog.uwf.edu/undergraduate/theatre/", level: "bachelor", credential: "B.A." },
  { name: "Theatre, Fine Arts", url: "https://catalog.uwf.edu/undergraduate/theatrefinearts/", level: "bachelor", credential: "B.F.A." },
];

// UWF is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const uwfCatalog = createProgramCatalog(UWF_PROGRAMS, { preferred: "bachelor" });
