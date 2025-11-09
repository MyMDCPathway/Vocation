"use client";

import { useState, useRef, useEffect } from "react";

// SVG Icons
const icons = {
  degree: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.747 0-3.332.477-4.5 1.253"
      />
    </svg>
  ),
  transfer: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
      />
    </svg>
  ),
  internship: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
  exam: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

interface PathwayStep {
  type: "degree" | "transfer" | "internship" | "exam";
  level: string;
  name: string;
  description: string;
}

interface PathwayData {
  title: string;
  steps: PathwayStep[];
}

// Mapping of MDC bachelor's programs to their exact URLs
// Key: program name (normalized for matching), Value: exact URL
const MDC_BACHELORS_URL_MAPPING: Record<string, string> = {
  // Benjamin León School of Nursing
  "bachelor of science in nursing": "https://www.mdc.edu/bsn/",
  "bachelor of science in nursing (rn to bsn)": "https://www.mdc.edu/bsn/",
  "rn to bsn": "https://www.mdc.edu/bsn/",

  // Miguel B. Fernandez Family School of Global Business, Trade and Transportation
  "bachelor of applied sciences in leadership and management innovation":
    "https://www.mdc.edu/leadershipandmanagementinnovation/",
  "leadership and management innovation - accounting":
    "https://www.mdc.edu/accountingmanagement/",
  "leadership and management innovation - hospitality management":
    "https://www.mdc.edu/hospitalitymanagement/",
  "leadership and management innovation - human resource management":
    "https://www.mdc.edu/humanresourcemanagement/",
  "leadership and management innovation - digital marketing concentration":
    "https://www.mdc.edu/digitalmarketingbas/",
  "bachelor of applied sciences in supply chain management":
    "https://www.mdc.edu/supplychainmanagement/",
  "supply chain management – procurement management":
    "https://www.mdc.edu/procurement-management/",
  "supply chain management – project management":
    "https://www.mdc.edu/project-management/",
  "supply chain management – supply chain analytics":
    "https://www.mdc.edu/supplychainanalytics/",

  // School of Education
  "bachelor of science in early childhood education":
    "https://www.mdc.edu/earlychildhood/",
  "bachelor of science in exceptional student education":
    "https://www.mdc.edu/ese/",
  "bachelor of science in exceptional student education (k-12)":
    "https://www.mdc.edu/ese/",
  "bachelor of science in secondary mathematics education":
    "https://www.mdc.edu/secondarymath/",
  "bachelor of science in secondary science education - biology":
    "https://www.mdc.edu/secondarybiology/",

  // School of Engineering, Technology, and Design
  "bachelor of science in applied artificial intelligence":
    "https://www.mdc.edu/appliedaibs/",
  "bachelor of science in cybersecurity": "https://www.mdc.edu/cybersecuritybs/",
  "bachelor of science in data analytics": "https://www.mdc.edu/dataanalytics/",
  "bachelor of science in electrical and computer engineering technology":
    "https://www.mdc.edu/electronicsengineeringbs/",
  "bachelor of applied science in film, television & digital production":
    "https://www.mdc.edu/filmtvproduction/",
  "bachelor of science in information systems technology – networking":
    "https://www.mdc.edu/informationsystemsnetworking/",
  "bachelor of science in information systems technology – software engineering":
    "https://www.mdc.edu/softwareengineering/",

  // School of Health Sciences
  "bachelor of applied sciences in health sciences – clinical laboratory science":
    "https://www.mdc.edu/medicallaboratorysciences/",
  "bachelor of applied sciences in health sciences – histotechnology":
    "https://www.mdc.edu/histotechnologybas/",
  "bachelor of applied sciences in health sciences – physician assistant studies":
    "https://www.mdc.edu/physicianassistant/",

  // School of Justice, Public Safety, and Law Studies
  "bachelor of applied sciences in public safety management – crime scene investigation":
    "https://www.mdc.edu/csi/",
  "bachelor of applied sciences in public safety management – emergency management":
    "https://www.mdc.edu/emergencymanagement/",
  "bachelor of applied sciences in criminal justice":
    "https://www.mdc.edu/criminaljusticebas/",

  // School of Science
  "bachelor of science in biological sciences – biopharmaceutical sciences":
    "https://www.mdc.edu/biopharmaceutical/",
  "bachelor of science in biological sciences – biotechnology":
    "https://www.mdc.edu/biotechnology/",
  "bachelor of science in biological sciences – science education":
    "https://www.mdc.edu/scienceeducation/",
};

// Helper function to check if a program is an MDC bachelor's program
function isMDCBachelorsProgram(programName: string): boolean {
  const normalizedName = programName.toLowerCase().trim();
  // Check if any key in the mapping matches the program name
  return Object.keys(MDC_BACHELORS_URL_MAPPING).some((key) =>
    normalizedName.includes(key)
  );
}

// Helper function to get the exact URL for an MDC bachelor's program
function getMDCBachelorsProgramUrl(programName: string): string | null {
  const normalizedName = programName.toLowerCase().trim();

  // Try to find an exact or partial match
  for (const [key, url] of Object.entries(MDC_BACHELORS_URL_MAPPING)) {
    if (normalizedName.includes(key)) {
      return url;
    }
  }

  return null;
}

// Helper function to extract the first program option when multiple are listed
// Handles patterns like: "Engineering - Mechanical or Civil" or "Biology or Chemistry"
function extractFirstProgramOption(programName: string): string {
  // Check for common separators: " or ", " and ", ", "
  const separators = [/\s+or\s+/i, /\s+and\s+/i, /,\s+/];

  for (const separator of separators) {
    if (separator.test(programName)) {
      // Split and take the first option
      const parts = programName.split(separator);
      if (parts.length > 1) {
        // Return the first part, which should be the first program option
        return parts[0].trim();
      }
    }
  }

  // If no separator found, return the original name
  return programName.trim();
}

// Mapping of MDC Associate in Arts (A.A.) programs to their exact URLs
const MDC_ASSOCIATE_ARTS_URL_MAPPING: Record<string, string> = {
  accounting: "https://www.mdc.edu/accounting/",
  agriculture: "https://www.mdc.edu/agriculture",
  anthropology: "https://www.mdc.edu/anthropology",
  architecture: "https://www.mdc.edu/architectureaa/",
  "area & ethnic studies": "https://www.mdc.edu/ethnicstudies",
  "ethnic studies": "https://www.mdc.edu/ethnicstudies",
  art: "https://www.mdc.edu/art",
  "art education": "https://www.mdc.edu/art",
  "atmospheric science & meteorology": "https://www.mdc.edu/meteorology",
  meteorology: "https://www.mdc.edu/meteorology",
  biology: "https://www.mdc.edu/biology/",
  biotechnology: "https://www.mdc.edu/biotechnologyaa/",
  "building construction": "https://www.mdc.edu/buildingconstruction",
  "business administration": "https://www.mdc.edu/businessadministration/",
  chemistry: "https://www.mdc.edu/chemistry",
  "computer arts animation": "https://www.mdc.edu/animation/",
  animation: "https://www.mdc.edu/animation/",
  "computer information systems": "https://www.mdc.edu/cis",
  "computer science": "https://www.mdc.edu/computerscience",
  "criminal justice administration": "https://www.mdc.edu/criminaljustice/",
  "criminal justice": "https://www.mdc.edu/criminaljustice/",
  dance: "https://www.mdc.edu/dance",
  dietetics: "https://www.mdc.edu/dietetics",
  drama: "https://www.mdc.edu/drama",
  "drama education": "https://www.mdc.edu/drama",
  economics: "https://www.mdc.edu/economics/",
  "engineering - architectural": "https://www.mdc.edu/architecturalengineering",
  "architectural engineering": "https://www.mdc.edu/architecturalengineering",
  "engineering - biomedical": "https://www.mdc.edu/engineeringscience",
  "biomedical engineering": "https://www.mdc.edu/engineeringscience",
  "engineering - chemical": "https://www.mdc.edu/chemicalengineering",
  "chemical engineering": "https://www.mdc.edu/chemicalengineering",
  "engineering - civil": "https://www.mdc.edu/civilengineering",
  "civil engineering": "https://www.mdc.edu/civilengineering",
  "engineering - computer": "https://www.mdc.edu/computerengineering",
  "computer engineering": "https://www.mdc.edu/computerengineering",
  "engineering - electrical": "https://www.mdc.edu/electricalengineering",
  "electrical engineering": "https://www.mdc.edu/electricalengineering",
  "engineering - geomatics (surveying and mapping)":
    "https://www.mdc.edu/geomatics",
  "engineering - geomatics": "https://www.mdc.edu/geomatics",
  "surveying and mapping": "https://www.mdc.edu/geomatics",
  "engineering - industrial": "https://www.mdc.edu/industrialengineering",
  "industrial engineering": "https://www.mdc.edu/industrialengineering",
  "engineering - mechanical": "https://www.mdc.edu/mechanicalengineering",
  "mechanical engineering": "https://www.mdc.edu/mechanicalengineering",
  "engineering - ocean": "https://www.mdc.edu/oceanengineering",
  "ocean engineering": "https://www.mdc.edu/oceanengineering",
  "english/literature & english education":
    "https://www.mdc.edu/englishliterature",
  "english literature": "https://www.mdc.edu/englishliterature",
  "english education": "https://www.mdc.edu/englishliterature",
  "environmental sciences": "https://www.mdc.edu/environmentalsciences/",
  "exercise science": "https://www.mdc.edu/exercisescience",
  "foreign language": "https://www.mdc.edu/foreignlanguage",
  forestry: "https://www.mdc.edu/forestry",
  geology: "https://www.mdc.edu/geology",
  "graphic or commercial arts": "https://www.mdc.edu/graphiccommercialarts",
  "graphic arts": "https://www.mdc.edu/graphiccommercialarts",
  "commercial arts": "https://www.mdc.edu/graphiccommercialarts",
  "health services administration":
    "https://www.mdc.edu/healthservicesadministration",
  history: "https://www.mdc.edu/history",
  "hospitality administration/travel & tourism":
    "https://www.mdc.edu/hospitalityadministration/",
  "hospitality administration": "https://www.mdc.edu/hospitalityadministration/",
  "travel & tourism": "https://www.mdc.edu/hospitalityadministration/",
  "interior design": "https://www.mdc.edu/interiordesign/",
  "international relations": "https://www.mdc.edu/internationalrelations/",
  "landscape architecture": "https://www.mdc.edu/landscape",
  "mass communications/journalism": "https://www.mdc.edu/journalism/",
  "mass communications": "https://www.mdc.edu/journalism/",
  journalism: "https://www.mdc.edu/journalism/",
  mathematics: "https://www.mdc.edu/mathematics",
  music: "https://www.mdc.edu/music",
  "music education": "https://www.mdc.edu/music",
  philosophy: "https://www.mdc.edu/philosophy",
  "physical education teaching & coaching":
    "https://www.mdc.edu/physicaleducation",
  "physical education": "https://www.mdc.edu/physicaleducation",
  physics: "https://www.mdc.edu/physics",
  "political science": "https://www.mdc.edu/politicalscience",
  "pre-bachelor of arts": "https://www.mdc.edu/prebachelor",
  "pre-bachelor": "https://www.mdc.edu/prebachelor",
  "pre-law": "https://www.mdc.edu/prelaw",
  "pre-medical science/dentistry": "https://www.mdc.edu/predentistry",
  "pre-dentistry": "https://www.mdc.edu/predentistry",
  "pre-medical technology": "https://www.mdc.edu/premed",
  "pre-med": "https://www.mdc.edu/premed",
  "pre-nursing": "https://www.mdc.edu/prenursing",
  "pre-occupational therapy": "https://www.mdc.edu/preoccupationaltherapy",
  "pre-optometry": "https://www.mdc.edu/preoptometry",
  "pre-pharmacy": "https://www.mdc.edu/prepharmacy",
  "pre-physical therapy": "https://www.mdc.edu/prephysicaltherapy",
  "pre-veterinary medicine": "https://www.mdc.edu/prevet",
  "pre-vet": "https://www.mdc.edu/prevet",
  psychology: "https://www.mdc.edu/psychology/",
  "public administration": "https://www.mdc.edu/publicadministration",
  recreation: "https://www.mdc.edu/recreation",
  religion: "https://www.mdc.edu/religion",
  "social work": "https://www.mdc.edu/socialwork",
  sociology: "https://www.mdc.edu/sociology/",
  "speech pathology & audiology": "https://www.mdc.edu/speechpathology",
  "speech pathology": "https://www.mdc.edu/speechpathology",
  audiology: "https://www.mdc.edu/speechpathology",
  "teaching (elementary)": "https://www.mdc.edu/teachingelementary",
  "teaching elementary": "https://www.mdc.edu/teachingelementary",
  "teaching (exceptional student education)":
    "https://www.mdc.edu/teachingexceptionalstudent",
  "teaching exceptional student education":
    "https://www.mdc.edu/teachingexceptionalstudent",
  "teaching (pre-elementary/early childhood)":
    "https://www.mdc.edu/teachingearlychildhood",
  "teaching early childhood": "https://www.mdc.edu/teachingearlychildhood",
  "pre-elementary": "https://www.mdc.edu/teachingearlychildhood",
  "teaching (secondary)": "https://www.mdc.edu/teachingsecondary",
  "teaching secondary": "https://www.mdc.edu/teachingsecondary",
  "teaching secondary (biology)": "https://www.mdc.edu/teachingsecondarybiology",
  "teaching secondary biology": "https://www.mdc.edu/teachingsecondarybiology",
  "teaching secondary (chemistry)":
    "https://www.mdc.edu/teachingsecondarychemistry",
  "teaching secondary chemistry":
    "https://www.mdc.edu/teachingsecondarychemistry",
  "teaching secondary (earth/space)":
    "https://www.mdc.edu/teachingsecondaryearthspace",
  "teaching secondary earth space":
    "https://www.mdc.edu/teachingsecondaryearthspace",
  "teaching secondary (english/foreign languages)":
    "https://www.mdc.edu/teachingsecondaryenglish",
  "teaching secondary english": "https://www.mdc.edu/teachingsecondaryenglish",
  "teaching secondary (mathematics education)":
    "https://www.mdc.edu/teachingsecondarymath",
  "teaching secondary mathematics":
    "https://www.mdc.edu/teachingsecondarymath",
  "teaching secondary (physics)":
    "https://www.mdc.edu/teachingsecondaryphysics",
  "teaching secondary physics": "https://www.mdc.edu/teachingsecondaryphysics",
  "teaching secondary (social science)":
    "https://www.mdc.edu/teachingsecondarysocialscience",
  "teaching secondary social science":
    "https://www.mdc.edu/teachingsecondarysocialscience",
  "teaching secondary (vocational: business, technical, home)":
    "https://www.mdc.edu/teachingsecondaryvocational",
  "teaching secondary vocational":
    "https://www.mdc.edu/teachingsecondaryvocational",
};

// Helper function to get the exact URL for an MDC Associate in Arts program
function getMDCAssociateArtsProgramUrl(programName: string): string | null {
  const normalizedName = programName.toLowerCase().trim();

  // Extract the subject after "Associate in Arts in"
  let subject = normalizedName.replace(/^associate in arts in\s*/, "").trim();

  // Handle engineering programs with specializations
  if (subject.includes("engineering -")) {
    const specialization = subject.split("engineering -")[1]?.trim();
    if (specialization) {
      // Extract first option if multiple are listed
      const firstSpecialization = extractFirstProgramOption(specialization);
      subject = `engineering - ${firstSpecialization}`;
    }
  } else {
    // Extract first option if multiple are listed (e.g., "Art or Art Education")
    subject = extractFirstProgramOption(subject);
  }

  // Try to find an exact or partial match in the mapping
  for (const [key, url] of Object.entries(MDC_ASSOCIATE_ARTS_URL_MAPPING)) {
    if (subject.includes(key) || key.includes(subject)) {
      return url;
    }
  }

  return null;
}

// Helper function to check if a program is a valid MDC Associate in Arts (A.A.) program
// A.A. programs follow the pattern: "Associate in Arts in [Subject]" or "Associate in Arts in Engineering - [Specialization]"
function isMDCAssociateInArtsProgram(programName: string): boolean {
  const normalizedName = programName.toLowerCase().trim();

  // Must start with "Associate in Arts"
  if (!normalizedName.startsWith("associate in arts")) {
    return false;
  }

  // Must have a subject after "Associate in Arts in"
  // Valid patterns:
  // - "Associate in Arts in [Subject]"
  // - "Associate in Arts in Engineering - [Specialization]"
  if (normalizedName.includes("associate in arts in")) {
    // Extract the part after "Associate in Arts in"
    const afterPrefix = normalizedName.replace(/^associate in arts in\s*/, "");

    // Must have some content after the prefix
    if (afterPrefix.trim().length === 0) {
      return false;
    }

    // Check if we can find a matching URL (validates it's a real MDC program)
    const url = getMDCAssociateArtsProgramUrl(programName);
    return url !== null;
  }

  return false;
}

// Mapping of MDC Associate in Science (A.S.) programs to their exact URLs
const MDC_ASSOCIATE_SCIENCE_URL_MAPPING: Record<string, string> = {
  "accounting technology": "https://www.mdc.edu/accountingtechnology/",
  "animation & game art": "https://www.mdc.edu/animationgameart/",
  "animation and game art": "https://www.mdc.edu/animationgameart/",
  "applied artificial intelligence": "https://www.mdc.edu/appliedai/",
  "architectural design and construction technology":
    "https://www.mdc.edu/architecturaldesign/",
  "aviation administration": "https://www.mdc.edu/aviationadministration/",
  "aviation maintenance management":
    "https://www.mdc.edu/aviationmaintenance/",
  "biomedical engineering technology":
    "https://www.mdc.edu/biomedicalengineering",
  biotechnology: "https://www.mdc.edu/biotechnologyas",
  "biotechnology - bioinformatics": "https://www.mdc.edu/bioinformatics",
  "biotechnology - chemical technology":
    "https://www.mdc.edu/biochemicalengineering",
  "building construction technology":
    "https://www.mdc.edu/constructiontechnology/",
  "business administration": "https://www.mdc.edu/businessadministrationas/",
  "business intelligence specialist":
    "https://www.mdc.edu/businessintelligence/",
  "civil engineering technology": "https://www.mdc.edu/civilengineeringas",
  "clinical laboratory science": "https://www.mdc.edu/medicaltechnology/",
  "computer crime investigation":
    "https://www.mdc.edu/computercrimeinvestigation/",
  "computer engineering technology": "https://www.mdc.edu/computerengineeringas",
  "computer information technology":
    "https://www.mdc.edu/computerinformationtechnology/",
  "computer programming and analysis - business application programming":
    "https://www.mdc.edu/businessapplications",
  "computer programming and analysis - internet of things (iot) applications":
    "https://www.mdc.edu/internetofthings/",
  "computer programming and analysis - mobile applications development":
    "https://www.mdc.edu/mobileappdeveloper",
  "crime scene technology - crime scene investigation":
    "https://www.mdc.edu/crimescenetechnologycsi/",
  "crime scene technology - forensic science":
    "https://www.mdc.edu/crimescenetechnologyforensic/",
  "criminal justice technology":
    "https://www.mdc.edu/criminaljusticetechnology/",
  "culinary arts management": "https://www.mdc.edu/culinaryartsmanagement/",
  cybersecurity: "https://www.mdc.edu/cybersecurityas",
  "database technology - oracle database administration":
    "https://www.mdc.edu/oracledba",
  "dental hygiene": "https://www.mdc.edu/dentalhygiene/",
  "diagnostic medical sonography": "https://www.mdc.edu/sonography/",
  "early childhood education": "https://www.mdc.edu/earlychildhoodas/",
  "early childhood education - administrators":
    "https://www.mdc.edu/earlychildhoodadministrator/",
  "early childhood education - infant toddler":
    "https://www.mdc.edu/earlychildhoodinfant/",
  "early childhood education - preschool":
    "https://www.mdc.edu/earlychildhoodpreschool/",
  "electronics engineering technology":
    "https://www.mdc.edu/electronicsengineeringtechnology",
  "emergency medical services": "https://www.mdc.edu/ems/",
  entrepreneurship: "https://www.mdc.edu/entrepreneurship/",
  "fashion design": "https://www.mdc.edu/fashiondesign/",
  "fashion merchandising": "https://www.mdc.edu/fashionmerchandising/",
  "film production technology": "https://www.mdc.edu/filmproduction/",
  "financial services - banking": "https://www.mdc.edu/banking/",
  "financial services - wealth management":
    "https://www.mdc.edu/financialmanagement",
  "fire science technology": "https://www.mdc.edu/firescience/",
  "funeral service education": "https://www.mdc.edu/funeralservices/",
  "game development & design": "https://www.mdc.edu/gamedevelopment/",
  "game development and design": "https://www.mdc.edu/gamedevelopment/",
  "graphic design technology": "https://www.mdc.edu/graphicdesign/",
  "graphic internet technology": "https://www.mdc.edu/graphicinternet/",
  "health information technology": "https://www.mdc.edu/healthinformation/",
  "health science - health services management":
    "https://www.mdc.edu/healthservicesas",
  "health sciences": "https://www.mdc.edu/healthsciencesas",
  "histologic technology": "https://www.mdc.edu/histotechnology/",
  "hospitality & tourism management": "https://www.mdc.edu/tourismmanagement/",
  "hospitality and tourism management": "https://www.mdc.edu/tourismmanagement/",
  "interior design technology": "https://www.mdc.edu/interiordesigntechnology/",
  "landscape & horticulture technology": "https://www.mdc.edu/landscapeas",
  "landscape and horticulture technology": "https://www.mdc.edu/landscapeas",
  marketing: "https://www.mdc.edu/marketing/",
  "music business - management and marketing":
    "https://www.mdc.edu/musicbusinessmanagement/",
  "music business - performance and production":
    "https://www.mdc.edu/musicbusinessproduction/",
  "networking services technology - enterprise cloud computing":
    "https://www.mdc.edu/cloudcomputing/",
  "networking services technology - network infrastructure":
    "https://www.mdc.edu/networkinfrastructure/",
  "nuclear medicine technology": "https://www.mdc.edu/nuclearmedicine/",
  "nursing - r.n. (accelerated)": "https://www.mdc.edu/nursingrn/",
  "nursing - r.n. (generic full-time)": "https://www.mdc.edu/nursingrn/",
  "nursing - r.n. (generic part-time)": "https://www.mdc.edu/nursingrn/",
  "nursing - r.n. (transitional full-time)": "https://www.mdc.edu/nursingrn/",
  "nursing - r.n. (transitional part-time)": "https://www.mdc.edu/nursingrn/",
  nursing: "https://www.mdc.edu/nursingrn/",
  opticianry: "https://www.mdc.edu/opticianry/",
  "paralegal studies - aba approved": "https://www.mdc.edu/paralegal/",
  "paralegal studies": "https://www.mdc.edu/paralegal/",
  "photographic technology": "https://www.mdc.edu/photography/",
  "physical therapist assistant":
    "https://www.mdc.edu/physicaltherapistassistant/",
  "professional pilot technology": "https://www.mdc.edu/professionalpilot/",
  "radiation therapy": "https://www.mdc.edu/radiation",
  "radio & television broadcast programming": "https://www.mdc.edu/broadcast/",
  "radio and television broadcast programming": "https://www.mdc.edu/broadcast/",
  radiography: "https://www.mdc.edu/radiography/",
  "respiratory care": "https://www.mdc.edu/respiratorycare/",
  "respiratory care (accelerated) - crt to rrt":
    "https://www.mdc.edu/respiratorycare/",
  "sign language interpretation": "https://www.mdc.edu/signlanguage/",
  "social and human services - addictions studies":
    "https://www.mdc.edu/addictionstudies/",
  "social and human services - generalist": "https://www.mdc.edu/humanservices",
  "social and human services": "https://www.mdc.edu/humanservices",
  "sport management": "https://www.mdc.edu/sportmanagement",
  "surgical technology": "https://www.mdc.edu/surgicaltechnology/",
  "translation/interpretation studies":
    "https://www.mdc.edu/translationinterpretation/",
  "translation interpretation studies":
    "https://www.mdc.edu/translationinterpretation/",
  "transportation and logistics": "https://www.mdc.edu/transportationlogistics/",
  "veterinary technology": "https://www.mdc.edu/veterinarytechnology/",
};

// Helper function to get the exact URL for an MDC Associate in Science program
function getMDCAssociateScienceProgramUrl(programName: string): string | null {
  const normalizedName = programName.toLowerCase().trim();

  // Extract the subject after "Associate in Science in"
  let subject = normalizedName
    .replace(/^associate in science in\s*/, "")
    .trim();

  // Extract first option if multiple are listed
  subject = extractFirstProgramOption(subject);

  // Try to find an exact or partial match in the mapping
  for (const [key, url] of Object.entries(MDC_ASSOCIATE_SCIENCE_URL_MAPPING)) {
    if (subject.includes(key) || key.includes(subject)) {
      return url;
    }
  }

  return null;
}

// Helper function to check if a program is a valid MDC Associate in Science (A.S.) program
function isMDCAssociateInScienceProgram(programName: string): boolean {
  const normalizedName = programName.toLowerCase().trim();

  // Must start with "Associate in Science"
  if (!normalizedName.startsWith("associate in science")) {
    return false;
  }

  // Must have a subject after "Associate in Science in"
  if (normalizedName.includes("associate in science in")) {
    // Extract the part after "Associate in Science in"
    const afterPrefix = normalizedName.replace(
      /^associate in science in\s*/,
      ""
    );

    // Must have some content after the prefix
    if (afterPrefix.trim().length === 0) {
      return false;
    }

    // Check if we can find a matching URL (validates it's a real MDC program)
    const url = getMDCAssociateScienceProgramUrl(programName);
    return url !== null;
  }

  return false;
}

// Helper function to convert program name to MDC URL slug
function getMDCProgramUrl(programName: string): string {
  // Extract the first program option if multiple are listed
  // This allows the title to show all options, but the link goes to one specific program
  const singleProgram = extractFirstProgramOption(programName);

  // Check if it's a bachelor's program first - use exact URL mapping
  const bachelorsUrl = getMDCBachelorsProgramUrl(singleProgram);
  if (bachelorsUrl) {
    return bachelorsUrl;
  }

  // Check if it's an Associate in Arts program - use exact URL mapping
  const associateArtsUrl = getMDCAssociateArtsProgramUrl(singleProgram);
  if (associateArtsUrl) {
    return associateArtsUrl;
  }

  // Check if it's an Associate in Science program - use exact URL mapping
  const associateScienceUrl = getMDCAssociateScienceProgramUrl(singleProgram);
  if (associateScienceUrl) {
    return associateScienceUrl;
  }

  // For other programs (Certificates), try to generate URL from name

  // Remove common prefixes
  let slug = singleProgram
    .replace(/^Associate in Arts in /i, "")
    .replace(/^Associate in Science in /i, "")
    .replace(/^Associate in /i, "")
    .replace(/^Bachelor of Science in /i, "")
    .replace(/^Bachelor of Arts in /i, "")
    .replace(/^Bachelor of Applied Sciences in /i, "")
    .replace(/^Bachelor of Applied Science in /i, "")
    .replace(/^Bachelor of /i, "")
    .replace(/^Certificate in /i, "")
    .replace(/^Certificate /i, "")
    .trim();

  // Handle special cases for engineering programs
  // Extract the engineering specialization (e.g., "Engineering - Mechanical" -> "Mechanical Engineering")
  if (slug.includes("Engineering - ")) {
    const specialization = slug.split("Engineering - ")[1]?.trim();
    if (specialization) {
      // Handle cases like "Mechanical or Civil" - take the first one
      const firstSpecialization = extractFirstProgramOption(specialization);
      slug = `${firstSpecialization} Engineering`;
    }
  }

  // Convert to URL-friendly format: lowercase, remove spaces and special characters
  slug = slug
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "") // Remove all spaces
    .replace(/-/g, ""); // Remove hyphens

  // Return the MDC program URL
  return `https://www.mdc.edu/${slug}/`;
}

export default function Home() {
  const [careerInput, setCareerInput] = useState("");
  const [showClearBtn, setShowClearBtn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("MDC Details");
  const [modalContent, setModalContent] = useState<string>("");
  const [pathwayData, setPathwayData] = useState<PathwayData | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setShowClearBtn(careerInput.length > 0);
  }, [careerInput]);

  useEffect(() => {
    if (modalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [modalOpen]);

  const showLoading = (message: string) => {
    setLoadingMessage(message || "Loading...");
    setLoading(true);
  };

  const hideLoading = () => {
    setLoading(false);
  };

  const showModal = (title: string, content: string) => {
    setModalTitle(title);
    setModalContent(content);
    setModalOpen(true);
  };

  const hideModal = () => {
    setModalOpen(false);
  };

  const callAPI = async (career: string, retries = 3, delay = 1000) => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch("/api/generate-pathway", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ career }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        const result = await response.json();
        return result;
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Fetch aborted by user.");
          throw error;
        }
        console.error(`API call attempt ${i + 1} failed:`, error);
        if (i === retries - 1) {
          throw error;
        }
        await new Promise((res) => setTimeout(res, delay * Math.pow(2, i)));
      } finally {
        if (i === retries - 1) {
          abortControllerRef.current = null;
        }
      }
    }
  };

  const handleGeneratePathway = async () => {
    const career = careerInput.trim();
    if (!career) {
      showModal(
        "Error",
        '<p class="text-red-600">Please enter a career title.</p>'
      );
      return;
    }

    showLoading(`Generating pathway for ${career}...`);

    try {
      const generatedData = await callAPI(career);
      setPathwayData(generatedData);
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error generating custom pathway:", error);
        showModal(
          "Generation Failed",
          `<p class="text-red-600">Sorry, I couldn't generate a pathway for that career. Please try a different prompt.<br><br><small>Error: ${error.message}</small></p>`
        );
      }
    } finally {
      hideLoading();
    }
  };

  const handleCancelLoad = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log("Fetch request cancelled.");
    }
    hideLoading();
  };

  const handleHelp = () => {
    showModal(
      "How to use MyMDC Pathway?",
      `
      <div class="space-y-4 text-gray-700">
        <p>1. Type your desired career (e.g., "Software Engineer" or "Nurse") into the text box.</p>
        <p>2. Press <kbd class="px-2 py-1 bg-gray-200 rounded-md text-sm">Enter</kbd> or click the blue arrow button to generate a personalized educational pathway.</p>
        <p>3. The pathway will show you recommended degrees from MDC, potential transfer steps to universities, and other milestones like internships and exams.</p>
      </div>
    `
    );
  };

  const handleClearInput = () => {
    setCareerInput("");
    setShowClearBtn(false);
  };

  const handleClearPathway = () => {
    setPathwayData(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleGeneratePathway();
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header Section */}
      <header className="p-6 md:p-8 text-center">
        <img
          src="https://mdcwap.mdc.edu/apply/assets/mdc-logo.png"
          alt="Miami Dade College Logo"
          className="h-16 w-auto mx-auto mb-4"
        />
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
          MyMDC Pathway
        </h1>
        <p className="text-gray-600 mt-2">
          Generate an educational pathway for your career.
        </p>
      </header>

      {/* Control Section */}
      <div className="px-6 pb-6 md:px-8 md:pb-8">
        <hr className="max-w-2xl mx-auto border-gray-200 mb-8" />

        <div className="max-w-2xl mx-auto">
          <label
            htmlFor="custom-career-input"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Specify your Career Choice:
            <i
              onClick={handleHelp}
              className="fas fa-question-circle text-blue-500 hover:text-blue-700 cursor-pointer ml-1"
            />
          </label>
          <div className="flex flex-col sm:flex-row items-center sm:space-x-2 space-y-2 sm:space-y-0">
            <div className="input-container">
              <input
                type="text"
                id="custom-career-input"
                value={careerInput}
                onChange={(e) => setCareerInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Mechanical Engineer"
                className="w-full py-3 pl-5 pr-10 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {showClearBtn && (
                <span
                  id="clear-input-btn"
                  onClick={handleClearInput}
                  title="Clear input"
                  style={{ display: "block" }}
                >
                  <i className="fas fa-times-circle" />
                </span>
              )}
            </div>
            <button
              id="generate-pathway-btn"
              onClick={handleGeneratePathway}
              className="flex-shrink-0 w-full sm:w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-md transition duration-200 flex items-center justify-center p-0"
            >
              <i className="fas fa-arrow-right" />
            </button>
          </div>
        </div>
      </div>

      {/* Infographic Display Area */}
      <div id="pathway-display" className="p-6 md:p-8">
        {pathwayData && (
          <>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {pathwayData.title}
              </h2>
              <button
                onClick={handleClearPathway}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg shadow w-full sm:w-auto flex-shrink-0"
              >
                <i className="fas fa-times mr-2" /> Clear Pathway
              </button>
            </div>

            <div className="flowchart-container">
              {pathwayData.steps.map((step, stepIndex) => {
                const stepTypeClass = `flowchart-step-${step.type}`;
                const IconComponent = icons[step.type];

                return (
                  <div key={stepIndex}>
                    {stepIndex > 0 && <div className="flowchart-connector" />}
                    <div className={`flowchart-step ${stepTypeClass}`}>
                      <div className="flowchart-step-header">
                        <div className="flowchart-step-header-icon">
                          {IconComponent}
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          {step.level || step.type}
                        </span>
                      </div>
                      <div className="flowchart-step-content">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {step.name}
                        </h3>
                        <p className="text-gray-600 mt-2">{step.description}</p>
                        {step.type === "transfer" && (
                          <a
                            href="https://www.mdc.edu/transfer-information/transfer-agreements/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150"
                          >
                            <i className="fas fa-external-link-alt mr-2" /> View
                            Transfer Agreements
                          </a>
                        )}
                        {step.type === "degree" &&
                          ((step.level.includes("MDC") &&
                            !step.name.toLowerCase().includes("bachelor") &&
                            (isMDCAssociateInScienceProgram(step.name) ||
                              isMDCAssociateInArtsProgram(step.name))) ||
                            step.name.toLowerCase().includes("certificate") ||
                            (step.name.toLowerCase().includes("bachelor") &&
                              isMDCBachelorsProgram(step.name))) && (
                            <a
                              href={getMDCProgramUrl(step.name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
                            >
                              <i className="fas fa-external-link-alt mr-2" />{" "}
                              View Program Page
                            </a>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-4">
              <div className="loader" />
              <span className="text-gray-700 font-medium">
                {loadingMessage}
              </span>
            </div>
            <button
              onClick={handleCancelLoad}
              className="mt-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Message Modal for AI Content */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              hideModal();
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <header className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{modalTitle}</h2>
              <button
                onClick={hideModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </header>
            <main
              className="p-6 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: modalContent }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
