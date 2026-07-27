// Stetson University degree catalog: program name -> official bulletin page.
//
// GENERATED FILE — do not edit by hand. Regenerate with:
//   npm run scrape:stetson
//
// Source: catalog.stetson.edu, scraped from 3 undergraduate college pages
// (Arts & Sciences, Business Administration, Music), 2 graduate college
// pages (Arts & Sciences, Business Administration), and 11 hand-identified
// College of Law pages (no listing page exists for Law — see the scraper's
// header comment).
// Scraped:    2026-07-27
// Programs:   95 (71 bachelor, 24 graduate)
//
// Stetson is a four-year private university (like UM/FIU/UCF/...), so
// pathways start at the bachelor's rather than an associate degree — see
// universitySystemPrompt in app/lib/pathwayPrompts.ts.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const STETSON_PROGRAMS: SchoolProgram[] = [
  { name: "Accounting (Bachelor of Business Administration)", url: "https://catalog.stetson.edu/undergraduate/business-administration/accounting/business-administration-accounting-bba/", level: "bachelor", area: "School of Business Administration" },
  { name: "American Studies (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/american-studies/american-studies-ba/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Applied Mathematics - Actuarial and Financial Mathematics (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/mathematics/applied-mathematics-actuarial-financial/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Applied Mathematics - Data Science (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/mathematics/applied-mathematics-data-science/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Applied Mathematics - Physics (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/mathematics/applied-mathematics-physics/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Applied Mathematics - Statistics (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/mathematics/applied-mathematics-statistics/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Aquatic and Marine Biology (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/biology/aquatic-marine-biology-bs/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Bachelor of Arts in Music", url: "https://catalog.stetson.edu/undergraduate/music/bachelor-arts-music/", level: "bachelor", area: "School of Music" },
  { name: "Bachelor of Music Education (Instrumental/General)", url: "https://catalog.stetson.edu/undergraduate/music/bachelor-music-education-instrumental-general/", level: "bachelor", area: "School of Music" },
  { name: "Bachelor of Music Education (Vocal/General)", url: "https://catalog.stetson.edu/undergraduate/music/bachelor-music-education-vocal-general/", level: "bachelor", area: "School of Music" },
  { name: "Bachelor Of Music in Composition", url: "https://catalog.stetson.edu/undergraduate/music/bachelor-music-composition/", level: "bachelor", area: "School of Music" },
  { name: "Bachelor Of Music in Music Theory", url: "https://catalog.stetson.edu/undergraduate/music/bachelor-music-music-theory/", level: "bachelor", area: "School of Music" },
  { name: "Bachelor Of Music in Performance (Guitar)", url: "https://catalog.stetson.edu/undergraduate/music/bachelor-music-guitar/", level: "bachelor", area: "School of Music" },
  { name: "Bachelor Of Music in Performance (Orchestral Instrument)", url: "https://catalog.stetson.edu/undergraduate/music/bachelor-music-orchestral-instrument/", level: "bachelor", area: "School of Music" },
  { name: "Bachelor Of Music in Performance (Organ)", url: "https://catalog.stetson.edu/undergraduate/music/bachelor-music-organ/", level: "bachelor", area: "School of Music" },
  { name: "Bachelor Of Music in Performance (Piano)", url: "https://catalog.stetson.edu/undergraduate/music/bachelor-music-piano/", level: "bachelor", area: "School of Music" },
  { name: "Bachelor Of Music in Performance (Voice)", url: "https://catalog.stetson.edu/undergraduate/music/bachelor-music-voice/", level: "bachelor", area: "School of Music" },
  { name: "Bachelor Of Music with Elective Studies in a Specific Outside Field", url: "https://catalog.stetson.edu/undergraduate/music/bachelor-music-elective-studies-specific-outside-field/", level: "bachelor", area: "School of Music" },
  { name: "Bachelor Of Music with Emphasis in Business", url: "https://catalog.stetson.edu/undergraduate/music/bachelor-music-elective-studies-specific-outside-field-business-mba/", level: "bachelor", area: "School of Music" },
  { name: "Biochemistry (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/chemistry/biochemistry-bs/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Biology (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/biology/biology-bs/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Business Administration - Flex (Bachelor of Business Administration)", url: "https://catalog.stetson.edu/undergraduate/business-administration/business-flex-major/", level: "bachelor", area: "School of Business Administration" },
  { name: "Business Administration (Bachelor of Business Administration)", url: "https://catalog.stetson.edu/undergraduate/business-administration/business-administration/business-administration-bba/", level: "bachelor", area: "School of Business Administration" },
  { name: "Business Systems, AI and Analytics (Bachelor of Business Administration)", url: "https://catalog.stetson.edu/undergraduate/business-administration/business-systems-analysis/", level: "bachelor", area: "School of Business Administration" },
  { name: "Cellular and Molecular Biomedical Sciences (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/biology/c-m-biomedical-sciences-bs/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Chemistry (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/chemistry/chemistry-bs/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Communication and Media Studies (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/communication-media/communication-media-ba/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Computer Information Systems (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/computer-science/computer-information-systems-bs/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Computer Science (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/computer-science/computer-science-bs/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Cybersecurity (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/computer-science/cyber-security-bs/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Digital Arts (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/digital-arts/digital-arts-ba/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Digital Arts (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/digital-arts/digital-arts-bs/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Economics (Bachelor of Business Administration)", url: "https://catalog.stetson.edu/undergraduate/business-administration/economics/economics-bba/", level: "bachelor", area: "School of Business Administration" },
  { name: "Economics (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/economics/economics-bs/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Elementary Education (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/education/education-ba/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "English (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/english/english-ba/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Entrepreneurship (Bachelor of Business Administration)", url: "https://catalog.stetson.edu/undergraduate/business-administration/entrepreneurship/entrepreneurship-bba/", level: "bachelor", area: "School of Business Administration" },
  { name: "Environmental Science (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/environmental-science-studies/environmental-science-bs", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Environmental Studies (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/environmental-science-studies/environmental-studies-ba", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Family Enterprise Management (Bachelor of Business Administration)", url: "https://catalog.stetson.edu/undergraduate/business-administration/family-enterprise/family-enterprise-bba/", level: "bachelor", area: "School of Business Administration" },
  { name: "Finance (Bachelor of Business Administration)", url: "https://catalog.stetson.edu/undergraduate/business-administration/finance/", level: "bachelor", area: "School of Business Administration" },
  { name: "General Studies in Education (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/education/general-studies-education/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Global Development (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/global-development/global-development-ba/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Health Sciences (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/health-sciences/health-sciences-bs/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "History (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/history/history-ba/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Human Resource Management (Bachelor of Business Administration)", url: "https://catalog.stetson.edu/undergraduate/business-administration/human-resource-management/business-administration-human-resource-management/", level: "bachelor", area: "School of Business Administration" },
  { name: "International Business (Bachelor of Business Administration)", url: "https://catalog.stetson.edu/undergraduate/business-administration/international-business/international-business-bba/", level: "bachelor", area: "School of Business Administration" },
  { name: "International Studies (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/international/international-studies-ba/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Management (Bachelor of Business Administration)", url: "https://catalog.stetson.edu/undergraduate/business-administration/management/management-bba/", level: "bachelor", area: "School of Business Administration" },
  { name: "Marketing (Bachelor of Business Administration)", url: "https://catalog.stetson.edu/undergraduate/business-administration/marketing/marketing-bba/", level: "bachelor", area: "School of Business Administration" },
  { name: "Mathematics (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/mathematics/mathematics-bs/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Museum and Curatorial Studies (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/museum-curatorial-studies-ba", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Philosophy (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/philosophy/philosophy-ba/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Physics - Applied Physics (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/physics/physics-applied-physics-bs/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Physics - Biophysics (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/physics/physics-biophysics-bs", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Physics (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/physics/physics-bs/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Political Science (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/political-science/political-science-ba/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Professional Sales (Bachelor of Business Administration)", url: "https://catalog.stetson.edu/undergraduate/business-administration/professional-sales/professional-sales-bba/", level: "bachelor", area: "School of Business Administration" },
  { name: "Psychology (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/psychology/psychology-bs/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Public Health (Bachelor of Science)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/public-health/public-health-bs/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Public Management (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/public-management/public-management-ba/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Religious Studies (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/religious/religious-studies-ba/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Russian, East European and Eurasian Studies (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/russian/russian-ba/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Social Science (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/social-science/social-science-ba/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Sociology (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/sociology-anthropology/sociology-ba/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Studio Art (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/art/studio-art-ba/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Theatre Arts (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/theatre-arts/theatre-arts-ba/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "World Languages and Cultures - French and Francophone Studies (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/world-languages-and-cultures/french-francophone-concentration/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "World Languages and Cultures - German Studies (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/world-languages-and-cultures/german-studies-concentration/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "World Languages and Cultures - Hispanic and Latinx Studies (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/world-languages-and-cultures/hispanic-studies-concentration/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "World Languages and Cultures - Translator (Bachelor of Arts)", url: "https://catalog.stetson.edu/undergraduate/arts-sciences/world-languages-and-cultures/translator-concentration/", level: "bachelor", area: "College of Arts and Sciences" },
  { name: "Educational Specialist (EdS) in Curriculum and Instruction", url: "https://catalog.stetson.edu/graduate/arts-sciences/graduate-education-education/", level: "graduate", area: "College of Arts and Sciences" },
  { name: "JD+LLM Joint Degree in Advocacy", url: "https://catalog.stetson.edu/law/jd-llm/", level: "graduate", area: "College of Law" },
  { name: "JD+LLM Joint Degree in Elder Law", url: "https://catalog.stetson.edu/law/jd-llm-elder/", level: "graduate", area: "College of Law" },
  { name: "Juris Doctor Degree", url: "https://catalog.stetson.edu/law/juris-doctor/", level: "graduate", area: "College of Law" },
  { name: "LLM in Elder Law", url: "https://catalog.stetson.edu/law/master-law/elder-law-llm/", level: "graduate", area: "College of Law" },
  { name: "M.Jur. in International and Comparative Business Law", url: "https://catalog.stetson.edu/law/mjur/intl-comp-bus/", level: "graduate", area: "College of Law" },
  { name: "Master of Accountancy", url: "https://catalog.stetson.edu/graduate/business-administration/master-accountancy/", level: "graduate", area: "School of Business Administration" },
  { name: "Master of Business Administration", url: "https://catalog.stetson.edu/graduate/business-administration/master-business-administration/", level: "graduate", area: "School of Business Administration" },
  { name: "Master of Education (MEd) in Educational Leadership", url: "https://catalog.stetson.edu/graduate/arts-sciences/graduate-education-education/", level: "graduate", area: "College of Arts and Sciences" },
  { name: "Master of Education (MEd) in Exceptional Student Education", url: "https://catalog.stetson.edu/graduate/arts-sciences/graduate-education-education/", level: "graduate", area: "College of Arts and Sciences" },
  { name: "Master of Fine Arts degree in Creative Writing", url: "https://catalog.stetson.edu/graduate/arts-sciences/graduate-education-english/", level: "graduate", area: "College of Arts and Sciences" },
  { name: "Master of Human Resource Management", url: "https://catalog.stetson.edu/graduate/business-administration/master-hr-mgmt/", level: "graduate", area: "School of Business Administration" },
  { name: "Master of Jurisprudence (M.Jur.)", url: "https://catalog.stetson.edu/law/mjur/", level: "graduate", area: "College of Law" },
  { name: "Master of Jurisprudence in Aging, Law and Policy", url: "https://catalog.stetson.edu/law/mjur/aging-law-policy/", level: "graduate", area: "College of Law" },
  { name: "Master of Jurisprudence in Healthcare Compliance", url: "https://catalog.stetson.edu/law/mjur/healthcarecomp/", level: "graduate", area: "College of Law" },
  { name: "Master of Laws", url: "https://catalog.stetson.edu/law/master-law/international-law-llm/", level: "graduate", area: "College of Law" },
  { name: "Master of Laws (LL.M.)", url: "https://catalog.stetson.edu/law/master-law/", level: "graduate", area: "College of Law" },
  { name: "Master of Science", url: "https://catalog.stetson.edu/graduate/arts-sciences/graduate-education-counselor-education/", level: "graduate", area: "College of Arts and Sciences" },
  { name: "Master of Science (MS) in Higher Education Administration and Supervision", url: "https://catalog.stetson.edu/graduate/arts-sciences/graduate-education-education/", level: "graduate", area: "College of Arts and Sciences" },
  { name: "Master of Science in Clinical Mental Health Counseling", url: "https://catalog.stetson.edu/graduate/arts-sciences/graduate-education-counselor-education/clinical-mental-health-counseling-ms/", level: "graduate", area: "College of Arts and Sciences" },
  { name: "Master of Science in Clinical Mental Health Counseling (With Advanced Studies)", url: "https://catalog.stetson.edu/graduate/arts-sciences/graduate-education-counselor-education/clinical-mental-health-counseling-ms-adv-studies/", level: "graduate", area: "College of Arts and Sciences" },
  { name: "Master of Science in Marriage, Couple, and Family Counseling", url: "https://catalog.stetson.edu/graduate/arts-sciences/graduate-education-counselor-education/marriage-couple-family-counseling-ms/", level: "graduate", area: "College of Arts and Sciences" },
  { name: "Master of Science in Marriage, Couple, and Family Counseling (With Advanced Studies)", url: "https://catalog.stetson.edu/graduate/arts-sciences/graduate-education-counselor-education/marriage-couple-family-counseling-ms-adv-studies/", level: "graduate", area: "College of Arts and Sciences" },
  { name: "Online LL.M. in Advocacy", url: "https://catalog.stetson.edu/law/master-law/online-advocacy-llm/", level: "graduate", area: "College of Law" },
];

// Stetson is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const stetsonCatalog = createProgramCatalog(STETSON_PROGRAMS, { preferred: "bachelor" });
