// FAMU degree catalog: program name -> its official program (graduate) or
// college (undergraduate) page.
//
// GENERATED FILE — do not edit by hand. Regenerate with:
//   npm run scrape:famu
//
// Source (undergraduate): https://www.famu.edu/academics/undergraduate-academics/index.php
// Source (graduate):      https://graduateschool.famu.edu/graduate-programs/graduate-programs-<slug>.php
//                          (cafs, coe, pharmacy, csat, cssah, engineering, ahealth, saet, sbi, son, soe)
// Scraped:    2026-07-27
// Programs:   103 (53 bachelor, 50 graduate)
//
// catalog.famu.edu (Acalog) is a dead end for this school — it's WAF-blocked
// AND has no Program entities at all. The real catalog lives on famu.edu's
// own pages instead. Undergraduate has no per-major page, so every major
// links to its college's page instead (same pattern as FAU); graduate has a
// real per-program page for every entry.
//
// FAMU is a four-year university (like FIU/UCF/UF/FGCU/UWF/NCF/UNF/FlPoly/
// USF/FAU), so pathways start at the bachelor's rather than an associate
// degree.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const FAMU_PROGRAMS: SchoolProgram[] = [
  { name: "Accounting", url: "http://sbi.famu.edu", level: "bachelor", credential: "B.S.", area: "School of Business and Industry" },
  { name: "African-American Studies", url: "http://cssah.famu.edu", level: "bachelor", credential: "B.S./B.A.", area: "College of Social Sciences, Arts and Humanities" },
  { name: "Agribusiness", url: "http://cafs.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Agriculture and Food Sciences" },
  { name: "Agronomy", url: "http://cafs.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Agriculture and Food Sciences" },
  { name: "Animal Science", url: "http://cafs.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Agriculture and Food Sciences" },
  { name: "Architectural Studies", url: "http://saet.famu.edu", level: "bachelor", credential: "B.S.", area: "School of Architecture and Engineering Technology" },
  { name: "Architecture", url: "http://saet.famu.edu", level: "bachelor", credential: "B.Arch.", area: "School of Architecture and Engineering Technology" },
  { name: "Biological and Agricultural System Engineering", url: "http://cafs.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Agriculture and Food Sciences" },
  { name: "Biology (Pre-Professional/Molecular-Cell)", url: "http://cst.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Science and Technology" },
  { name: "Business Administration", url: "http://sbi.famu.edu", level: "bachelor", credential: "B.S.", area: "School of Business and Industry" },
  { name: "Business Administration with a Program Major in Facilities Management", url: "http://sbi.famu.edu", level: "bachelor", credential: "B.S.", area: "School of Business and Industry" },
  { name: "Cardiopulmonary Sciences", url: "http://ahealth.famu.edu", level: "bachelor", credential: "B.S.", area: "School of Allied Health Sciences" },
  { name: "Chemical and Biomedical Engineering", url: "https://www.famu.edu/academics/colleges-and-schools/engineering/", level: "bachelor", credential: "B.S.", area: "College of Engineering (famu-fsu)" },
  { name: "Chemistry (ACS/Biochemistry/Pre-Medicine/Dentistry)", url: "http://cst.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Science and Technology" },
  { name: "Civil and Environmental Engineering", url: "https://www.famu.edu/academics/colleges-and-schools/engineering/", level: "bachelor", credential: "B.S.", area: "College of Engineering (famu-fsu)" },
  { name: "Computer and Electrical Engineering", url: "https://www.famu.edu/academics/colleges-and-schools/engineering/", level: "bachelor", credential: "B.S.", area: "College of Engineering (famu-fsu)" },
  { name: "Computer Information Systems", url: "http://cst.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Science and Technology" },
  { name: "Computer Science", url: "http://cst.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Science and Technology" },
  { name: "Construction Engineering Technology", url: "http://saet.famu.edu", level: "bachelor", credential: "B.S.", area: "School of Architecture and Engineering Technology" },
  { name: "Criminal Justice", url: "http://cssah.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Social Sciences, Arts and Humanities" },
  { name: "Economics with Minor in Business", url: "http://sbi.famu.edu", level: "bachelor", credential: "B.S.", area: "School of Business and Industry" },
  { name: "Electronic Engineering Technology", url: "http://saet.famu.edu", level: "bachelor", credential: "B.S.", area: "School of Architecture and Engineering Technology" },
  { name: "English", url: "http://cssah.famu.edu", level: "bachelor", credential: "B.A.", area: "College of Social Sciences, Arts and Humanities" },
  { name: "Entomology", url: "http://cafs.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Agriculture and Food Sciences" },
  { name: "Environmental Sciences", url: "http://soe.famu.edu", level: "bachelor", credential: "B.S.", area: "School of the Environment" },
  { name: "Fine Arts", url: "http://cssah.famu.edu", level: "bachelor", credential: "B.S./B.A.", area: "College of Social Sciences, Arts and Humanities" },
  { name: "Food Science", url: "http://cafs.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Agriculture and Food Sciences" },
  { name: "Forestry and Natural Resources Conservation", url: "http://cafs.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Agriculture and Food Sciences" },
  { name: "Graphic Design", url: "http://sjgc.famu.edu", level: "bachelor", credential: "B.S.", area: "School of Journalism and Graphic Communication" },
  { name: "Health Care Management", url: "http://ahealth.famu.edu", level: "bachelor", credential: "B.S.", area: "School of Allied Health Sciences" },
  { name: "Health Information Management", url: "http://ahealth.famu.edu", level: "bachelor", credential: "B.S.", area: "School of Allied Health Sciences" },
  { name: "Health Sciences", url: "http://ahealth.famu.edu", level: "bachelor", credential: "B.S.", area: "School of Allied Health Sciences" },
  { name: "Health, Physical Education and Fitness", url: "http://coe.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Education" },
  { name: "History", url: "http://cssah.famu.edu", level: "bachelor", credential: "B.S./B.A.", area: "College of Social Sciences, Arts and Humanities" },
  { name: "Industrial and Manufacturing Engineering", url: "https://www.famu.edu/academics/colleges-and-schools/engineering/", level: "bachelor", credential: "B.S.", area: "College of Engineering (famu-fsu)" },
  { name: "Journalism", url: "http://sjgc.famu.edu", level: "bachelor", credential: "B.S.", area: "School of Journalism and Graphic Communication" },
  { name: "Mathematics (Mathematical Sciences/Traditional/Actuarial Sciences)", url: "http://cst.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Science and Technology" },
  { name: "Mechanical Engineering", url: "https://www.famu.edu/academics/colleges-and-schools/engineering/", level: "bachelor", credential: "B.S.", area: "College of Engineering (famu-fsu)" },
  { name: "Music", url: "http://cssah.famu.edu", level: "bachelor", credential: "B.A./B.S.", area: "College of Social Sciences, Arts and Humanities" },
  { name: "Music Education", url: "http://coe.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Education" },
  { name: "Nursing", url: "http://nursing.famu.edu", level: "bachelor", credential: "B.S.", area: "School of Nursing" },
  { name: "Pharmaceutical Sciences", url: "http://pharmacy.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Pharmacy and Pharmaceutical Sciences" },
  { name: "Philosophy & Religion", url: "http://cssah.famu.edu", level: "bachelor", credential: "B.S./B.A.", area: "College of Social Sciences, Arts and Humanities" },
  { name: "Physics (General/Applied)", url: "http://cst.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Science and Technology" },
  { name: "Political Science", url: "http://cssah.famu.edu", level: "bachelor", credential: "B.S./B.A.", area: "College of Social Sciences, Arts and Humanities" },
  { name: "PreK/Elementary Education", url: "http://coe.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Education" },
  { name: "Psychology", url: "http://cssah.famu.edu", level: "bachelor", credential: "B.S./B.A.", area: "College of Social Sciences, Arts and Humanities" },
  { name: "Public Relations", url: "http://sjgc.famu.edu", level: "bachelor", credential: "B.S.", area: "School of Journalism and Graphic Communication" },
  { name: "Secondary Education and Teaching", url: "http://coe.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Education" },
  { name: "Social Work", url: "http://cssah.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Social Sciences, Arts and Humanities" },
  { name: "Sociology", url: "http://cssah.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Social Sciences, Arts and Humanities" },
  { name: "Theatre", url: "http://cssah.famu.edu", level: "bachelor", credential: "B.S./B.A.", area: "College of Social Sciences, Arts and Humanities" },
  { name: "Veterinary Technology", url: "http://cafs.famu.edu", level: "bachelor", credential: "B.S.", area: "College of Agriculture and Food Sciences" },
  { name: "Agribusiness", url: "https://www.famu.edu/academics/all-programs/cafs/agribusiness-ms.php", level: "graduate", credential: "MS", area: "College of Agriculture and Food Sciences" },
  { name: "Architecture", url: "https://www.famu.edu/academics/all-programs/saet/master-of-architecture-ms.php", level: "graduate", credential: "MS", area: "School of Architecture and Engineering Technology" },
  { name: "Biology (Molecular & Cellular), Master of Science", url: "https://cst.famu.edu/departments-and-centers/department-of-biology/ms-biology-molecular-cellular-a4181.php", level: "graduate", credential: "MS", area: "College of Science & Technology" },
  { name: "Biomedical Engineering", url: "https://www.eng.famu.fsu.edu/cbe/graduate-admissions#msbe", level: "graduate", credential: "MS", area: "FAMU-FSU College of Engineering" },
  { name: "Biomedical Engineering", url: "https://www.eng.famu.fsu.edu/cbe/graduate/phd-programs", level: "graduate", credential: "PhD", area: "FAMU-FSU College of Engineering" },
  { name: "Business Administration", url: "https://sbi.famu.edu/students/majors-and-programs/professional-mba.php", level: "graduate", credential: "MS", area: "School of Business & Industry" },
  { name: "Business Administration (Online)", url: "https://www.famu.edu/academics/famu-online/master-of-business-administration-online.php", level: "graduate", credential: "MS", area: "School of Business & Industry" },
  { name: "Chemical Engineering", url: "https://www.eng.famu.fsu.edu/cbe/graduate-admissions#msce", level: "graduate", credential: "MS", area: "FAMU-FSU College of Engineering" },
  { name: "Chemical Engineering", url: "https://www.eng.famu.fsu.edu/cbe/graduate/phd-programs", level: "graduate", credential: "PhD", area: "FAMU-FSU College of Engineering" },
  { name: "Chemistry, Master of Science", url: "https://cst.famu.edu/departments-and-centers/department-of-chemistry/ms-chemistry.php", level: "graduate", credential: "MS", area: "College of Science & Technology" },
  { name: "Civil Engineering", url: "https://www.eng.famu.fsu.edu/cee/graduate/programs#masters", level: "graduate", credential: "MS", area: "FAMU-FSU College of Engineering" },
  { name: "Civil Engineering", url: "https://www.eng.famu.fsu.edu/cee/graduate/programs#masters", level: "graduate", credential: "PhD", area: "FAMU-FSU College of Engineering" },
  { name: "Civil Engineering (M.Eng)", url: "https://www.eng.famu.fsu.edu/cee/graduate/programs#meng", level: "graduate", credential: "MS", area: "FAMU-FSU College of Engineering" },
  { name: "Computer Science, Master of Science", url: "https://cst.famu.edu/departments-and-centers/department-of-computer-and-information-sciences/ms-computer-science.php", level: "graduate", credential: "MS", area: "College of Science & Technology" },
  { name: "Curriculum and Instruction", url: "https://www.famu.edu/academics/all-programs/coe/curriculum-and-instruction-ms.php", level: "graduate", credential: "MS", area: "College of Education" },
  { name: "Education Leadership", url: "https://www.famu.edu/academics/all-programs/coe/educational-leadership-ms.php", level: "graduate", credential: "PhD", area: "College of Education" },
  { name: "Electrical Engineering", url: "https://www.eng.famu.fsu.edu/ece/graduate/ms-electrical-engineering-thesis-option", level: "graduate", credential: "MS", area: "FAMU-FSU College of Engineering" },
  { name: "Electrical Engineering", url: "https://www.eng.famu.fsu.edu/ece/graduate/phd-electrical-engineering", level: "graduate", credential: "PhD", area: "FAMU-FSU College of Engineering" },
  { name: "Entomology", url: "https://www.famu.edu/academics/all-programs/cafs/entomology-ms.php", level: "graduate", credential: "MS", area: "College of Agriculture and Food Sciences" },
  { name: "Entomology (Cooperation with UF)", url: "https://www.famu.edu/academics/all-programs/cafs/entomology-phd.php", level: "graduate", credential: "PhD", area: "College of Agriculture and Food Sciences" },
  { name: "Environmental Science", url: "https://www.famu.edu/academics/all-programs/soe/environmental-science-ms.php", level: "graduate", credential: "MS", area: "School of the Environment" },
  { name: "Environmental Science", url: "https://www.famu.edu/academics/all-programs/soe/environmental-science-phd.php", level: "graduate", credential: "PhD", area: "School of the Environment" },
  { name: "Facilities Management", url: "https://saet.famu.edu/architecture/facilities-management.php", level: "graduate", credential: "MS", area: "School of Architecture and Engineering Technology" },
  { name: "Health Administration", url: "https://www.famu.edu/academics/all-programs/ahealth/health-administration-ms.php", level: "graduate", credential: "MS", area: "School of Allied Health Sciences" },
  { name: "Industrial Engineering", url: "https://www.eng.famu.fsu.edu/ime/graduate/msie-programs", level: "graduate", credential: "MS", area: "FAMU-FSU College of Engineering" },
  { name: "Industrial Engineering", url: "https://www.eng.famu.fsu.edu/ime/graduate/phd", level: "graduate", credential: "PhD", area: "FAMU-FSU College of Engineering" },
  { name: "Master of Applied Social Sciences", url: "https://cssah.famu.edu/master-of-applied-social-science-mass/index.php", level: "graduate", credential: "MASS", area: "College of Social Sciences, Arts & Humanities" },
  { name: "Materials Science & Engineering", url: "https://materials.fsu.edu/ms-mse", level: "graduate", credential: "MS", area: "FAMU-FSU College of Engineering" },
  { name: "Materials Science & Engineering", url: "https://materials.fsu.edu/phd-mse", level: "graduate", credential: "PhD", area: "FAMU-FSU College of Engineering" },
  { name: "Mechanical Engineering", url: "https://www.eng.famu.fsu.edu/me/graduate", level: "graduate", credential: "MS", area: "FAMU-FSU College of Engineering" },
  { name: "MSN (Online)", url: "https://www.famu.edu/academics/famu-online/master-of-science-in-nursing.php", level: "graduate", credential: "MS", area: "School of Nursing" },
  { name: "MSN, Adult Gerontology Primary Care Nurse Practitioner (AGPCNP)", url: "https://nursing.famu.edu/graduate-programs/msn-adult-gerontology.php", level: "graduate", credential: "MS", area: "School of Nursing" },
  { name: "MSN, Adult Gerontology Primary Care Nurse Practitioner (AGPCNP) (Online)", url: "https://onlinenursing.famu.edu/programs/msn-adult-gerontology/", level: "graduate", credential: "MS", area: "School of Nursing" },
  { name: "MSN, Women's Health Nurse Practitioner (WHNP)", url: "https://nursing.famu.edu/graduate-programs/msn-womens-health.php", level: "graduate", credential: "MS", area: "School of Nursing" },
  { name: "MSN, Women's Health Nurse Practitioner (WHNP) (Online)", url: "https://onlinenursing.famu.edu/programs/msn-womens-health/", level: "graduate", credential: "MS", area: "School of Nursing" },
  { name: "Nursing Informatics (Online)", url: "https://onlinenursing.famu.edu/programs/msn-nursing-informatics/", level: "graduate", credential: "MS", area: "School of Nursing" },
  { name: "Occupational Therapy", url: "https://www.famu.edu/academics/all-programs/ahealth/occupational-therapy-ms.php", level: "graduate", credential: "MS", area: "School of Allied Health Sciences" },
  { name: "Pharm-D/MBA", url: "https://www.famu.edu/academics/all-programs/pharmacy/doctor-of-pharmacy-pharmd.php", level: "graduate", credential: "PhD", area: "College of Pharmacy & Pharmaceutical Sciences" },
  { name: "Pharmaceutical Sciences", url: "https://pharmacy.famu.edu/admissions2/pharmaceutical_sciences_graduate_degree_admissions.php", level: "graduate", credential: "PhD", area: "College of Pharmacy & Pharmaceutical Sciences" },
  { name: "Physical Therapy", url: "https://www.famu.edu/academics/all-programs/ahealth/physical-therapy-dpt.php", level: "graduate", credential: "DPT", area: "School of Allied Health Sciences" },
  { name: "Physics, Doctor of Philosophy", url: "https://cst.famu.edu/departments-and-centers/department-of-physics/phd-physics.php", level: "graduate", credential: "PhD", area: "College of Science & Technology" },
  { name: "Physics, Master of Science", url: "https://cst.famu.edu/departments-and-centers/department-of-physics/ms-physics.php", level: "graduate", credential: "MS", area: "College of Science & Technology" },
  { name: "Plant Science", url: "https://www.famu.edu/academics/all-programs/cafs/plant-science-ms.php", level: "graduate", credential: "MS", area: "College of Agriculture and Food Sciences" },
  { name: "Post-Master’s Certificate, Non-Nurse Practitioner Applicant", url: "http://catalog.famu.edu/preview_program.php?catoid=12&amp;poid=4084", level: "graduate", credential: "MS", area: "School of Nursing" },
  { name: "Public Health", url: "https://pharmacy.famu.edu/admissions2/index.php", level: "graduate", credential: "PhD", area: "College of Pharmacy & Pharmaceutical Sciences" },
  { name: "Public Health (Online)", url: "https://www.famu.edu/academics/famu-online/master-of-public-health-online.php", level: "graduate", credential: "MS", area: "College of Pharmacy & Pharmaceutical Sciences" },
  { name: "Social Work", url: "https://www.famu.edu/academics/all-programs/cssah/social-work-msw.php", level: "graduate", credential: "MSW", area: "College of Social Sciences, Arts & Humanities" },
  { name: "Soil and Water", url: "https://www.famu.edu/academics/all-programs/cafs/soil-and-water-science-ms.php", level: "graduate", credential: "MS", area: "College of Agriculture and Food Sciences" },
  { name: "Specialization in Health Outcomes Research and Pharmaeconomics", url: "https://pharmacy.famu.edu/admissions2/index.php", level: "graduate", credential: "MS", area: "College of Pharmacy & Pharmaceutical Sciences" },
  { name: "Sports Management", url: "https://www.famu.edu/academics/all-programs/coe/sport-management-ms.php", level: "graduate", credential: "MS", area: "College of Education" },
];

// FAMU is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const famuCatalog = createProgramCatalog(FAMU_PROGRAMS, { preferred: "bachelor" });
